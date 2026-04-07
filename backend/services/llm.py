"""
Anthropic LLM service — handles streaming chat with context assembly.

Two-step generation:
  1. Planning: LLM picks which n8n nodes are needed from the full catalog
  2. Generation: LLM generates the workflow with detailed schemas for selected nodes
"""

import asyncio
import json
import anthropic
from typing import AsyncGenerator, Optional

from config import settings
from prompts.system_prompt import build_system_prompt
from prompts.planning_prompt import PLANNING_SYSTEM_PROMPT, build_planning_prompt
from services.rag import rag_service
from services.n8n_client import n8n_client
from services.node_registry import get_compact_catalog, get_node_schemas

MODEL = "claude-sonnet-4-6"
OPUS_MODEL = "claude-opus-4-6"
HAIKU_MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 8192


class LLMService:
    def __init__(self):
        self._client: Optional[anthropic.AsyncAnthropic] = None

    @property
    def client(self) -> anthropic.AsyncAnthropic:
        if self._client is None:
            self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        return self._client

    async def _get_n8n_context(self) -> tuple[str, str]:
        """Get existing workflows and credentials from n8n."""
        existing_workflows = ""
        available_credentials = ""

        try:
            workflows = await n8n_client.list_workflows()
            if workflows:
                workflow_summaries = []
                for w in workflows[:10]:
                    workflow_summaries.append(f"- {w.get('name', 'Unnamed')} (ID: {w.get('id', '?')}, Active: {w.get('active', False)})")
                existing_workflows = "Existing workflows:\n" + "\n".join(workflow_summaries)
        except Exception:
            pass

        try:
            credentials = await n8n_client.get_credential_types()
            if credentials:
                cred_summaries = [f"- {c.get('name', 'Unknown')} ({c.get('type', '?')})" for c in credentials[:20]]
                available_credentials = "Configured credentials:\n" + "\n".join(cred_summaries)
        except Exception:
            pass

        return existing_workflows, available_credentials

    async def _get_rag_context(self, query: str) -> str:
        """Retrieve relevant document chunks via RAG."""
        try:
            return await rag_service.retrieve_as_text(query, top_k=12)
        except Exception:
            return ""

    async def _plan_nodes(
        self, user_message: str, rag_context: str = "",
    ) -> tuple[list[str], str]:
        """Ask the LLM which n8n nodes are needed for this request."""
        catalog = get_compact_catalog()
        prompt = build_planning_prompt(user_message, catalog, rag_context=rag_context)

        response = await self.client.messages.create(
            model=OPUS_MODEL,
            max_tokens=1024,
            system=PLANNING_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response.content[0].text if response.content else "{}"

        # Parse JSON response
        try:
            # Handle markdown-wrapped JSON
            if "```" in raw:
                import re
                match = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', raw, re.DOTALL)
                if match:
                    raw = match.group(1)
            result = json.loads(raw.strip())
            nodes = result.get("nodes", [])
            data_flow_notes = result.get("data_flow_notes", "")
            return nodes, data_flow_notes
        except (json.JSONDecodeError, AttributeError):
            return [], ""

    async def build_context(self, user_message: str, node_schemas: str = "") -> str:
        """Assemble the full system prompt with all context layers."""
        rag_context = await self._get_rag_context(user_message)
        existing_workflows, available_credentials = await self._get_n8n_context()

        return build_system_prompt(
            rag_context=rag_context,
            existing_workflows=existing_workflows,
            available_credentials=available_credentials,
            node_schemas=node_schemas,
        )

    async def chat_stream(
        self,
        user_message: str,
        conversation_history: list[dict],
        workflow_context: Optional[dict] = None,
    ) -> AsyncGenerator[dict, None]:
        """Stream a chat response from Anthropic with two-step generation.

        Yields dicts: {"type": "status", "step": "..."} or {"type": "text", "content": "..."}

        Execution order:
          1. RAG retrieval + n8n context fetch (parallel)
          2. Node planning (now informed by RAG results)
          3. Assemble system prompt with all context + targeted node schemas
        """

        # Step 1: Fetch RAG context and n8n context in parallel
        yield {"type": "status", "step": "retrieving_context"}
        rag_context, (existing_workflows, available_credentials) = await asyncio.gather(
            self._get_rag_context(user_message),
            self._get_n8n_context(),
        )
        yield {"type": "status", "step": "retrieving_context_done"}

        # Step 2: Plan which nodes are needed (skip for follow-ups with existing workflow)
        node_schemas = ""
        data_flow_notes = ""
        if not workflow_context:
            yield {"type": "status", "step": "planning_nodes"}
            planned_nodes, data_flow_notes = await self._plan_nodes(
                user_message, rag_context=rag_context,
            )
            if planned_nodes:
                node_schemas = get_node_schemas(planned_nodes)
            yield {"type": "status", "step": "planning_nodes_done"}

        # Step 3: Build system prompt with pre-fetched contexts + targeted node schemas
        yield {"type": "status", "step": "generating"}
        system_prompt = build_system_prompt(
            rag_context=rag_context,
            existing_workflows=existing_workflows,
            available_credentials=available_credentials,
            node_schemas=node_schemas,
        )

        # Append data flow notes if the planner flagged concerns
        if data_flow_notes:
            system_prompt += f"\n\n## PLANNER DATA FLOW NOTES\n{data_flow_notes}"

        # Build messages array
        messages = []

        for msg in conversation_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        if workflow_context:
            context_note = f"\n\n[Previous workflow JSON for reference — modify this if the user asks for changes]\n```json\n{json.dumps(workflow_context, indent=2)}\n```"
            if messages and messages[-1]["role"] == "assistant":
                messages[-1]["content"] += context_note
            else:
                messages.append({"role": "assistant", "content": f"Here is the current workflow:{context_note}"})

        messages.append({"role": "user", "content": user_message})

        # Stream from Anthropic
        async with self.client.messages.stream(
            model=OPUS_MODEL,
            max_tokens=MAX_TOKENS,
            system=system_prompt,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield {"type": "text", "content": text}

    async def chat_sync(
        self,
        user_message: str,
        system_prompt: Optional[str] = None,
        conversation_history: Optional[list[dict]] = None,
        model: Optional[str] = None,
    ) -> str:
        """Non-streaming chat for audit/test prompts."""
        if system_prompt is None:
            system_prompt = await self.build_context(user_message)

        messages = []
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({"role": "user", "content": user_message})

        response = await self.client.messages.create(
            model=model or MODEL,
            max_tokens=MAX_TOKENS,
            system=system_prompt,
            messages=messages,
        )

        return response.content[0].text if response.content else ""


# Singleton
llm_service = LLMService()
