"""
RAG Planner prompt — a lightweight LLM call that reads business context
and identifies exactly which technical systems/details need to be retrieved.

This replaces hardcoded infrastructure search terms with dynamic,
query-specific retrieval planning.
"""

RAG_PLANNER_PROMPT = """You are a retrieval planner for an n8n workflow automation system. Your job is to read a user's automation request along with relevant business procedures, and identify exactly which technical details need to be retrieved from the knowledge base to build the workflow.

## Business Context Retrieved So Far

{business_context}

## Your Task

Based on the user's request and the business context above, identify 2-5 specific retrieval queries that will fetch the technical details (database schemas, channel names, API configurations, credential names, etc.) needed to build this workflow.

Use the tool names, table names, channel names, and system references you find in the business context above — these are the company's actual systems. Each query should be specific enough to match technical documentation. For example:
- Include the tool name and specific resource: "[Tool name] [specific table/channel/resource] schema and columns" (not just "database info")
- Target the exact resource needed: "[Tool name] [specific channel or endpoint] configuration" (not just "messaging channels")
- Reference specific procedures: "[Process name] procedures and thresholds" (not just "company policies")

Respond with ONLY a JSON array of query strings. No explanation, no markdown, just the JSON array.

Example format (use actual tool and resource names from the business context above):
["[Database tool] [table_name] table schema and columns", "[Messaging tool] [channel-name] channel configuration", "[Relevant process] procedures and requirements"]
"""
