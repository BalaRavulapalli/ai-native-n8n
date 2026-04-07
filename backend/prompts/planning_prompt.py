"""
Workflow planning prompt — Step 1 of two-step generation.
LLM picks which n8n nodes are needed, then we inject detailed schemas for those nodes.
"""

PLANNING_SYSTEM_PROMPT = """You are an n8n workflow planning assistant. Given a user's automation request, determine which n8n node types are needed to build the workflow.

You will be given a catalog of all available n8n node types. Select ONLY the nodes needed for this specific workflow.

Also briefly outline the data flow: which node feeds into which, and where data replacement (e.g., HTTP Request or Postgres INSERT replacing input) requires careful handling.

Respond with ONLY a JSON object — no explanation, no markdown:
{
  "nodes": ["n8n-nodes-base.type1", "n8n-nodes-base.type2", ...],
  "data_flow_notes": "Brief notes on data flow concerns (1-2 sentences)"
}"""


def build_planning_prompt(
    user_request: str,
    node_catalog: str,
    rag_context: str = "",
) -> str:
    rag_section = ""
    if rag_context:
        rag_section = f"""## Relevant Business Context (from internal documents)
Use this to understand what specific systems, tables, channels, and policies the workflow needs to interact with. Match the tools mentioned here to the appropriate n8n node types from the catalog below.

{rag_context}

"""

    return f"""{rag_section}## User's Request
"{user_request}"

## Available n8n Node Types (type|description)
{node_catalog}

Select the node types needed to implement this workflow. Include trigger, logic, and output nodes."""
