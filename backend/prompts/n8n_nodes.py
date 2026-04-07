"""
n8n Workflow Reference — JSON structure, connection rules, data flow pitfalls,
and example patterns included in the system prompt so Claude generates valid JSON.

Node-type-specific details (parameters, credentials, options) come from the
dynamic catalog via node_registry, NOT from a hardcoded list here.
"""

N8N_WORKFLOW_REFERENCE = """
## n8n Workflow JSON Structure

A valid n8n workflow JSON must follow this structure:

```json
{
  "name": "Workflow Name",
  "nodes": [
    {
      "parameters": { ... },
      "id": "unique-uuid",
      "name": "Node Display Name",
      "type": "n8n-nodes-base.nodeType",
      "typeVersion": 1.1,
      "position": [x, y]
    }
  ],
  "connections": {
    "Source Node Name": {
      "main": [
        [
          {
            "node": "Target Node Name",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

### Connection Rules:
- Connections use node NAMES (the "name" field), not IDs
- Each source node has a "main" array of output arrays
- Index 0 = first output (or "true" branch for IF nodes)
- Index 1 = second output ("false" branch for IF nodes)
- Multiple nodes can be connected to the same output

### Position Guidelines:
- First node at [250, 300]
- Each subsequent node 250px to the right: [500, 300], [750, 300], etc.
- Branching nodes offset vertically: true branch at y=200, false at y=400

### Node IDs:
- Use UUID v4 format: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
- Each node must have a unique ID

### CRITICAL — n8n Data Flow Pitfalls:
Many n8n nodes REPLACE their input data with operation output. You MUST design around this:

1. **Postgres INSERT/UPDATE**: Replaces input with query metadata (e.g., `{"rowCount": 1}`). Downstream nodes lose the original fields. If you need to both write to the database AND continue processing the original data, connect both the write node and the next processing node in PARALLEL from the same source — do NOT chain through the write node.

2. **HTTP Request**: Replaces input with the API response body. If downstream nodes need both the original data and the API response, use a Code node afterward with `$('SourceNodeName').item.json` to recombine.

3. **Parallel fan-out pattern**: When a node's output is needed by multiple downstream paths (e.g., log to database AND check a condition), connect them as siblings in the same output array:
   ```json
   "SourceNode": { "main": [[ {"node": "WriteNode"}, {"node": "CheckNode"} ]] }
   ```
   Both WriteNode and CheckNode receive the SAME input from SourceNode independently.

4. **Referencing earlier nodes in Code**: Use `$('NodeName').item.json` to access output from any earlier node in the chain, not just the immediate parent. This is essential when intermediate nodes replace data.
"""

N8N_WORKFLOW_EXAMPLES = """
## Example Workflow Patterns

### Pattern 1: Schedule → Query → Notify
Daily check that queries a database and sends results to Slack. Note how credentials reference the names from the company context:
```json
{
  "name": "Daily Check Example",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{"field": "cronExpression", "expression": "0 8 * * 1-5"}]
        }
      },
      "id": "a1b2c3d4-0001-0001-0001-000000000001",
      "name": "Daily 8am Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [250, 300]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT * FROM your_table WHERE some_condition",
        "options": {}
      },
      "id": "a1b2c3d4-0001-0001-0001-000000000002",
      "name": "Query Database",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.5,
      "position": [500, 300],
      "credentials": {
        "postgres": {
          "id": "1",
          "name": "Your Postgres Credential Name"
        }
      }
    },
    {
      "parameters": {
        "resource": "message",
        "operation": "post",
        "channel": { "value": "#your-channel", "__rl": true, "mode": "name" },
        "text": "=Alert: Found {{ $json.length }} items requiring attention.",
        "otherOptions": {}
      },
      "id": "a1b2c3d4-0001-0001-0001-000000000003",
      "name": "Notify Team",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2.2,
      "position": [750, 300],
      "credentials": {
        "slackApi": {
          "id": "2",
          "name": "Your Slack Credential Name"
        }
      }
    }
  ],
  "connections": {
    "Daily 8am Trigger": {
      "main": [[{"node": "Query Database", "type": "main", "index": 0}]]
    },
    "Query Database": {
      "main": [[{"node": "Notify Team", "type": "main", "index": 0}]]
    }
  },
  "settings": {"executionOrder": "v1"}
}
```

### Pattern 2: Schedule → Query → Condition → Branch
Check a condition and route to different actions:
- IF node has two outputs: main[0] = true branch, main[1] = false branch
- Connection to true branch: source "IF Node" main[0][0] = {node: "True Action", ...}
- Connection to false branch: source "IF Node" main[0] is true, main[1] is false

```json
"connections": {
  "IF Check": {
    "main": [
      [{"node": "True Branch Action", "type": "main", "index": 0}],
      [{"node": "False Branch Action", "type": "main", "index": 0}]
    ]
  }
}
```
"""
