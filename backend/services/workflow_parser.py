"""
Extract n8n workflow JSON from Claude/GPT's markdown response.
Handles ```json code blocks and raw JSON detection.
"""

import json
import re
from typing import Optional


def extract_workflow_json(text: str) -> Optional[dict]:
    """Extract the first valid n8n workflow JSON from a text response."""

    # Strategy 1: Look for ```json code blocks (flexible whitespace)
    json_blocks = re.findall(r'```json\s*(.*?)\s*```', text, re.DOTALL)

    for block in json_blocks:
        try:
            parsed = json.loads(block.strip())
            if isinstance(parsed, dict) and "nodes" in parsed and "connections" in parsed:
                return parsed
        except json.JSONDecodeError:
            continue

    # Strategy 2: Look for ``` code blocks without language specifier
    code_blocks = re.findall(r'```\s*(.*?)\s*```', text, re.DOTALL)

    for block in code_blocks:
        try:
            parsed = json.loads(block.strip())
            if isinstance(parsed, dict) and "nodes" in parsed and "connections" in parsed:
                return parsed
        except json.JSONDecodeError:
            continue

    # Strategy 3: Find the largest {...} that contains "nodes" and "connections"
    # Use bracket counting to find valid JSON objects
    start_indices = [m.start() for m in re.finditer(r'\{', text)]
    for start in start_indices:
        depth = 0
        for i in range(start, len(text)):
            if text[i] == '{':
                depth += 1
            elif text[i] == '}':
                depth -= 1
                if depth == 0:
                    candidate = text[start:i+1]
                    if '"nodes"' in candidate and '"connections"' in candidate:
                        try:
                            parsed = json.loads(candidate)
                            if isinstance(parsed, dict) and "nodes" in parsed:
                                return parsed
                        except json.JSONDecodeError:
                            pass
                    break

    return None
