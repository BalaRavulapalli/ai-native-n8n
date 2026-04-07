"""
Test data and dry run prompts — Layers 2 and 3 of the test execution engine.
"""

DRY_RUN_SYSTEM_PROMPT = """You are a workflow testing assistant. Your job is to illustrate what the workflow does by tracing it with realistic synthetic data — showing the user concrete examples of data flowing through each node.

This is NOT a bug-finding exercise (a separate audit handles that). Your goal is to help the user understand the workflow's behavior with realistic examples.

However, if during your trace you notice a DEFINITE data flow issue that would cause wrong results on every run (e.g., a node referencing a field that doesn't exist in its input), set the status to "warning" and explain it in overall_assessment. Do NOT flag speculative or framework-uncertain concerns.

IMPORTANT FORMATTING RULES:
- The "overall_assessment" must be 2-3 SHORT bullet points (each under 20 words), not a paragraph
- The "output" field in each trace step must be a SHORT plain-text summary (1 sentence, under 30 words). NEVER include raw JSON, arrays, or data dumps. Describe the data conceptually, e.g. "Returns 6 open opportunities totaling $19.4M" not the actual records.
- The "expected_outcome" must be 1 sentence
- The "description" must be 1-2 sentences max
- The "status" should be "pass" unless you found a definite data flow issue during tracing

Respond with a JSON object:
```json
{
  "status": "pass" | "warning",
  "test_scenarios": [
    {
      "name": "Scenario name",
      "description": "What this tests (1-2 sentences)",
      "trace": [
        {
          "node": "Node Name",
          "action": "What this node does",
          "output": "Short plain-text summary of the result (NO JSON, NO data dumps)"
        }
      ],
      "expected_outcome": "One sentence summary"
    }
  ],
  "overall_assessment": "• Bullet 1\\n• Bullet 2\\n• Bullet 3"
}
```"""


def build_dry_run_prompt(user_request: str, workflow_json: dict, company_context: str) -> str:
    import json
    return f"""Trace through this n8n workflow with synthetic test data. Generate 3 test scenarios: one normal/expected case, one edge case, and one that should trigger alerts or special handling.

CRITICAL: Keep all output fields as SHORT plain-text descriptions. Never include raw JSON data, arrays, or object dumps in any field. Describe data conceptually (e.g. "Returns 3 high-risk clients from Panama and Cayman Islands" not the actual records).

## User's Original Request
"{user_request}"

## Company Context
{company_context}

## Workflow JSON
```json
{json.dumps(workflow_json, indent=2)}
```"""


EXECUTION_REVIEW_SYSTEM_PROMPT = """You are a workflow execution reviewer. You are given the results of an actual n8n workflow execution against a test database. Analyze the per-node execution results and provide an assessment.

Respond with a JSON object:
```json
{
  "status": "pass" | "warning" | "fail",
  "summary": "Brief overall assessment",
  "node_results": [
    {
      "node": "Node Name",
      "status": "success" | "error" | "skipped",
      "data_summary": "What data was produced",
      "notes": "Any observations"
    }
  ],
  "data_flow_valid": true | false,
  "recommendations": ["Suggestions for improvement"]
}
```"""


def build_execution_review_prompt(user_request: str, workflow_json: dict, execution_results: dict) -> str:
    import json
    return f"""Review the results of this n8n workflow execution. The workflow ran against a test database with mock data.

## User's Original Request
"{user_request}"

## Workflow JSON
```json
{json.dumps(workflow_json, indent=2)}
```

## Execution Results
```json
{json.dumps(execution_results, indent=2)}
```

Note: External service nodes (Slack, Salesforce, SendGrid) are expected to fail due to missing credentials in the test environment. Focus on whether the core logic (database queries, conditions, data transformations) executed correctly."""
