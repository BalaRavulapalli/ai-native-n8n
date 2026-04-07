"""
Validate n8n workflow JSON structure before deploying to n8n.
Loads valid node types dynamically from the node catalog.
"""

from typing import Optional

from services.node_registry import get_valid_node_types


class ValidationResult:
    def __init__(self):
        self.valid = True
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def add_error(self, msg: str):
        self.valid = False
        self.errors.append(msg)

    def add_warning(self, msg: str):
        self.warnings.append(msg)

    def to_dict(self) -> dict:
        return {
            "valid": self.valid,
            "errors": self.errors,
            "warnings": self.warnings,
        }


def validate_workflow(workflow: dict) -> ValidationResult:
    """Validate an n8n workflow JSON structure."""
    result = ValidationResult()

    # Check required top-level fields
    if "nodes" not in workflow:
        result.add_error("Missing 'nodes' array")
        return result

    if "connections" not in workflow:
        result.add_error("Missing 'connections' object")
        return result

    if not isinstance(workflow["nodes"], list):
        result.add_error("'nodes' must be an array")
        return result

    if not isinstance(workflow["connections"], dict):
        result.add_error("'connections' must be an object")
        return result

    if len(workflow["nodes"]) == 0:
        result.add_error("Workflow has no nodes")
        return result

    valid_types = get_valid_node_types()

    # Validate each node
    node_names = set()
    has_trigger = False

    for i, node in enumerate(workflow["nodes"]):
        if not isinstance(node, dict):
            result.add_error(f"Node {i} is not an object")
            continue

        # Check required node fields
        if "name" not in node:
            result.add_error(f"Node {i} missing 'name'")
        else:
            if node["name"] in node_names:
                result.add_error(f"Duplicate node name: '{node['name']}'")
            node_names.add(node["name"])

        if "type" not in node:
            result.add_error(f"Node {i} missing 'type'")
        else:
            node_type = node["type"]
            if node_type not in valid_types:
                result.add_warning(f"Node '{node.get('name', i)}' uses type '{node_type}' which is not in the known catalog (may still work)")
            if "Trigger" in node_type or "trigger" in node_type or "webhook" in node_type.lower():
                has_trigger = True

        if "position" not in node:
            result.add_warning(f"Node '{node.get('name', i)}' missing 'position' — will use default")

    if not has_trigger:
        result.add_warning("Workflow has no trigger node — it can only be executed manually")

    # Validate connections reference valid node names
    for source_name, outputs in workflow["connections"].items():
        if source_name not in node_names:
            result.add_error(f"Connection from '{source_name}' references non-existent node")

        if isinstance(outputs, dict) and "main" in outputs:
            for output_index, targets in enumerate(outputs["main"]):
                if isinstance(targets, list):
                    for target in targets:
                        if isinstance(target, dict) and "node" in target:
                            if target["node"] not in node_names:
                                result.add_error(f"Connection from '{source_name}' targets non-existent node '{target['node']}'")

    # Add name if missing
    if "name" not in workflow:
        result.add_warning("Workflow has no name — will use default")

    return result
