import os
import json
from pathlib import Path
from typing import Optional
import anthropic
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid
import hashlib

from config import settings
from prompts.rag_planner_prompt import RAG_PLANNER_PROMPT

DOCUMENTS_DIR = Path(__file__).parent.parent / "data" / "context" / "documents"
EMBEDDING_MODEL = "text-embedding-3-large"
EMBEDDING_DIMENSION = 3072
CHUNK_SIZE = 800  # characters
CHUNK_OVERLAP = 200  # characters


class RAGService:
    def __init__(self):
        self.openai_client: Optional[OpenAI] = None  # embeddings only
        self.anthropic_client: Optional[anthropic.Anthropic] = None  # LLM calls
        self.qdrant_client: Optional[QdrantClient] = None
        self.collection_name = settings.qdrant_collection
        self._initialized = False

    def _ensure_clients(self):
        if self.openai_client is None:
            self.openai_client = OpenAI(api_key=settings.openai_api_key)
        if self.anthropic_client is None:
            self.anthropic_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        if self.qdrant_client is None:
            self.qdrant_client = QdrantClient(url=settings.qdrant_url)

    def _chunk_text(self, text: str, source: str) -> list[dict]:
        """Split text into overlapping chunks with metadata."""
        chunks = []
        # Split by sections first (## headers), then by size
        sections = text.split("\n## ")
        current_section = ""

        for i, section in enumerate(sections):
            if i > 0:
                section = "## " + section
            # Extract section header
            lines = section.strip().split("\n")
            header = lines[0].strip("#").strip() if lines else source

            # If section is small enough, keep as one chunk
            if len(section) <= CHUNK_SIZE:
                chunks.append({
                    "text": section.strip(),
                    "source": source,
                    "section": header,
                })
            else:
                # Split into overlapping chunks
                start = 0
                while start < len(section):
                    end = start + CHUNK_SIZE
                    chunk_text = section[start:end]

                    # Try to break at a sentence boundary
                    if end < len(section):
                        last_period = chunk_text.rfind(". ")
                        last_newline = chunk_text.rfind("\n")
                        break_point = max(last_period, last_newline)
                        if break_point > CHUNK_SIZE * 0.5:
                            chunk_text = chunk_text[:break_point + 1]
                            end = start + break_point + 1

                    chunks.append({
                        "text": chunk_text.strip(),
                        "source": source,
                        "section": header,
                    })
                    start = end - CHUNK_OVERLAP

        return [c for c in chunks if len(c["text"]) > 50]  # Filter out tiny fragments

    def _embed(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of texts using OpenAI."""
        self._ensure_clients()
        response = self.openai_client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=texts,
        )
        return [item.embedding for item in response.data]

    def _get_text_hash(self, text: str) -> str:
        return hashlib.md5(text.encode()).hexdigest()

    async def ensure_collection(self, recreate: bool = False):
        """Create the Qdrant collection, optionally recreating it to clear stale data."""
        self._ensure_clients()
        collections = self.qdrant_client.get_collections().collections
        exists = any(c.name == self.collection_name for c in collections)

        if exists and recreate:
            self.qdrant_client.delete_collection(self.collection_name)
            exists = False
            print(f"Deleted existing Qdrant collection: {self.collection_name}")

        if not exists:
            self.qdrant_client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=EMBEDDING_DIMENSION,
                    distance=Distance.COSINE,
                ),
            )
            print(f"Created Qdrant collection: {self.collection_name}")

    def _is_technical_chunk(self, chunk: dict) -> bool:
        """Heuristic: does this chunk contain technical infrastructure details?"""
        indicators = ["table:", "columns:", "column", "schema", "credential", "host:", "port:",
                       "n8n node:", "channel", "api", "endpoint", "url:", "database"]
        text_lower = chunk["text"].lower()
        return sum(1 for ind in indicators if ind in text_lower) >= 2

    def _enrich_chunks(self, chunks: list[dict]) -> list[dict]:
        """Use LLM to prepend business-context summaries to technical chunks.

        Technical chunks (schemas, configs) are semantically distant from
        business queries. Adding a one-line business summary bridges that gap
        so embeddings can find them from natural language searches.
        """
        self._ensure_clients()

        technical_chunks = [(i, c) for i, c in enumerate(chunks) if self._is_technical_chunk(c)]
        if not technical_chunks:
            return chunks

        # Batch all technical chunks into one LLM call for efficiency
        chunk_descriptions = []
        for idx, (i, chunk) in enumerate(technical_chunks):
            chunk_descriptions.append(f"Chunk {idx}:\n{chunk['text'][:500]}")

        prompt = (
            "For each technical chunk below, write a ONE-LINE business context prefix that describes "
            "what this system/table/tool is used for in plain business language. This helps search "
            "engines match business queries to technical documentation.\n\n"
            "Respond with a JSON array of strings, one per chunk, in the same order.\n"
            "Each string should be a short phrase like: "
            "'Used for logging sanctions screening results during client onboarding'\n\n"
            + "\n\n".join(chunk_descriptions)
        )

        try:
            response = self.anthropic_client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = response.content[0].text if response.content else "[]"
            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
                raw = raw.rsplit("```", 1)[0]
                raw = raw.strip()

            summaries = json.loads(raw)
            if isinstance(summaries, list):
                for (i, chunk), summary in zip(technical_chunks, summaries):
                    if isinstance(summary, str) and summary:
                        chunks[i]["text"] = f"[{summary}] {chunk['text']}"
                        print(f"    Enriched chunk: [{summary[:60]}...]")
        except Exception as e:
            print(f"  Warning: chunk enrichment failed ({e}), proceeding without enrichment")

        return chunks

    async def ingest_documents(self, documents_dir: Optional[Path] = None):
        """Ingest all markdown documents from the documents directory."""
        self._ensure_clients()
        doc_dir = documents_dir or DOCUMENTS_DIR

        await self.ensure_collection(recreate=True)

        all_chunks = []
        for filepath in doc_dir.glob("*.md"):
            text = filepath.read_text()
            source = filepath.name
            chunks = self._chunk_text(text, source)
            all_chunks.extend(chunks)
            print(f"  Chunked {source}: {len(chunks)} chunks")

        if not all_chunks:
            print("No documents found to ingest.")
            return

        # Contextual enrichment: add business-context summaries to technical chunks
        print(f"  Enriching technical chunks with business context...")
        all_chunks = self._enrich_chunks(all_chunks)

        # Embed all chunks (enriched text is what gets embedded)
        texts = [c["text"] for c in all_chunks]
        print(f"  Embedding {len(texts)} chunks...")
        embeddings = self._embed(texts)

        # Upsert to Qdrant
        points = []
        for i, (chunk, embedding) in enumerate(zip(all_chunks, embeddings)):
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, self._get_text_hash(chunk["text"])))
            points.append(PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "text": chunk["text"],
                    "source": chunk["source"],
                    "section": chunk["section"],
                },
            ))

        self.qdrant_client.upsert(
            collection_name=self.collection_name,
            points=points,
        )
        print(f"  Ingested {len(points)} chunks into Qdrant collection '{self.collection_name}'")
        self._initialized = True

    async def _search(self, query: str, top_k: int = 5) -> list[dict]:
        """Single-query vector search against Qdrant."""
        query_embedding = self._embed([query])[0]
        results = self.qdrant_client.query_points(
            collection_name=self.collection_name,
            query=query_embedding,
            limit=top_k,
        )
        chunks = []
        for result in results.points:
            chunks.append({
                "text": result.payload["text"],
                "source": result.payload["source"],
                "section": result.payload["section"],
                "score": result.score,
            })
        return chunks

    async def _plan_retrieval(self, query: str, business_context: list[dict]) -> list[str]:
        """Use an LLM to identify exactly which technical details to retrieve.

        Reads the user's request + business context (policies, procedures)
        and outputs specific search queries for technical documentation
        (schemas, channel names, credentials, configs).
        """
        self._ensure_clients()

        # Format business context chunks for the planner
        biz_text_parts = []
        for chunk in business_context:
            biz_text_parts.append(f"[{chunk['source']} — {chunk['section']}]\n{chunk['text']}")
        biz_text = "\n\n".join(biz_text_parts) if biz_text_parts else "No business context retrieved."

        planner_prompt = RAG_PLANNER_PROMPT.format(
            business_context=biz_text,
        )

        response = self.anthropic_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            system=planner_prompt,
            messages=[
                {"role": "user", "content": query},
            ],
        )

        raw = response.content[0].text if response.content else "[]"
        # Strip markdown fences if present
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            raw = raw.rsplit("```", 1)[0]
            raw = raw.strip()

        try:
            queries = json.loads(raw)
            if isinstance(queries, list):
                return [q for q in queries if isinstance(q, str)][:5]
        except json.JSONDecodeError:
            pass

        return []

    async def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        """Agentic 3-phase retrieval: Read → Plan → Retrieve.

        Phase 1 — Business context: semantic search on the user's query
                  to get policies, procedures, org context.
        Phase 2 — Plan: LLM reads Phase 1 results + tool inventory and
                  identifies exactly which technical details are needed.
        Phase 3 — Targeted retrieval: execute the planner's specific
                  queries to fetch schemas, channel names, configs.

        This replaces hardcoded infrastructure search terms with dynamic,
        query-aware retrieval planning.
        """
        self._ensure_clients()

        # Phase 1: business context search (policies, procedures, org)
        business_chunks = await self._search(query, top_k=max(top_k // 2, 5))

        # Phase 2: planner identifies what technical details we need
        planner_queries = await self._plan_retrieval(query, business_chunks)
        print(f"  RAG planner queries: {planner_queries}")

        # Phase 3: targeted technical retrieval
        tech_chunks = []
        for pq in planner_queries:
            results = await self._search(pq, top_k=3)
            tech_chunks.extend(results)

        # Merge: business context first, then technical details (deduped)
        seen_texts = set()
        merged = []

        for chunk in business_chunks:
            key = chunk["text"][:100]
            if key not in seen_texts:
                seen_texts.add(key)
                merged.append(chunk)

        for chunk in tech_chunks:
            key = chunk["text"][:100]
            if key not in seen_texts:
                seen_texts.add(key)
                merged.append(chunk)

        return merged[:top_k]

    async def retrieve_as_text(self, query: str, top_k: int = 10) -> str:
        """Retrieve relevant chunks and format as text for the system prompt."""
        chunks = await self.retrieve(query, top_k)
        if not chunks:
            return "No relevant internal documents found."

        parts = []
        for i, chunk in enumerate(chunks, 1):
            parts.append(f"[Document {i}: {chunk['source']} — {chunk['section']}]")
            parts.append(chunk["text"])
            parts.append("")

        return "\n".join(parts)


# Singleton instance
rag_service = RAGService()
