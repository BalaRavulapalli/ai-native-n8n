from fastapi import APIRouter
from services.context_loader import context_loader
from services.rag import rag_service

router = APIRouter(prefix="/context", tags=["context"])


@router.get("/")
async def get_full_context():
    """Return the full company context."""
    return context_loader.get_full_context()


@router.get("/profile")
async def get_company_profile():
    return context_loader.get_company_profile()


@router.get("/tools")
async def get_tools():
    return context_loader.get_tools_and_systems()


@router.get("/policies")
async def get_policies():
    return context_loader.get_policies()


@router.get("/org")
async def get_org_structure():
    return context_loader.get_org_structure()


@router.get("/text")
async def get_context_as_text():
    """Return the full context formatted as text (for debugging prompt assembly)."""
    return {"text": context_loader.get_company_identity() + "\n\n" + context_loader.get_tools_overview()}


@router.get("/rag-debug")
async def rag_debug(query: str, top_k: int = 10):
    """Debug endpoint: full 3-phase agentic retrieval with planner details."""
    # Phase 1: business context
    business_chunks = await rag_service._search(query, top_k=max(top_k // 2, 5))

    # Phase 2: planner
    planner_queries = await rag_service._plan_retrieval(query, business_chunks)

    # Phase 3: targeted retrieval
    tech_chunks = []
    for pq in planner_queries:
        results = await rag_service._search(pq, top_k=3)
        tech_chunks.extend(results)

    # Merge (same logic as retrieve())
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
    final = merged[:top_k]

    def fmt(chunks):
        return [
            {
                "rank": i + 1,
                "score": round(c["score"], 4),
                "source": c["source"],
                "section": c["section"],
                "text_preview": c["text"][:200],
            }
            for i, c in enumerate(chunks)
        ]

    return {
        "query": query,
        "phase_1_business": fmt(business_chunks),
        "phase_2_planner_queries": planner_queries,
        "phase_3_technical": fmt(tech_chunks),
        "final_merged": fmt(final),
        "num_results": len(final),
    }


@router.get("/rag-debug-single")
async def rag_debug_single(query: str, top_k: int = 10):
    """Debug: single-phase RAG (no planner, no targeted retrieval)."""
    chunks = await rag_service._search(query, top_k=top_k)
    return {
        "query": query,
        "num_results": len(chunks),
        "chunks": [
            {
                "rank": i + 1,
                "score": round(c["score"], 4),
                "source": c["source"],
                "section": c["section"],
                "text_preview": c["text"][:200],
            }
            for i, c in enumerate(chunks)
        ],
    }
