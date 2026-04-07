"""
Node Registry — two-layer n8n node catalog.

Layer 1: Compact catalog (type|description) for the planning step.
Layer 2: Detailed property schemas for selected nodes, injected into generation.
"""

import json
from pathlib import Path
from typing import Optional

_DATA_DIR = Path(__file__).parent.parent / "data"

_catalog_text: Optional[str] = None
_definitions: Optional[dict] = None
_valid_types: Optional[set] = None


def _load_catalog() -> str:
    global _catalog_text
    if _catalog_text is None:
        path = _DATA_DIR / "n8n_node_catalog.txt"
        _catalog_text = path.read_text()
    return _catalog_text


def _load_definitions() -> dict:
    global _definitions
    if _definitions is None:
        path = _DATA_DIR / "n8n_node_definitions.json"
        _definitions = json.loads(path.read_text())
    return _definitions


def get_valid_node_types() -> set:
    """Return the set of all known n8n node type strings from the catalog."""
    global _valid_types
    if _valid_types is None:
        catalog = _load_catalog()
        _valid_types = set()
        for line in catalog.strip().split("\n"):
            if "|" in line:
                _valid_types.add(line.split("|")[0].strip())
    return _valid_types


def get_node_definition(node_type: str) -> Optional[dict]:
    """Return the full definition dict for a single node type, or None."""
    defs = _load_definitions()
    return defs.get(node_type)


def get_compact_catalog() -> str:
    """Layer 1: one line per node for the planning prompt."""
    return _load_catalog()


def _flatten_option(opt) -> str:
    """Extract just the value from an option, ignoring UI metadata."""
    if isinstance(opt, str):
        return opt
    if isinstance(opt, dict):
        return str(opt.get("value", opt.get("name", "")))
    return str(opt)


def _condense_property(prop: dict) -> Optional[str]:
    """Condense a single property to a compact one-line description."""
    name = prop.get("name", "")
    ptype = prop.get("type", "")

    # Skip UI-only fields
    if ptype in ("notice", "hidden"):
        return None

    parts = [f"  {name}"]

    # Show options as simple value list
    if prop.get("options"):
        opts = prop["options"]
        flat = [_flatten_option(o) for o in opts if _flatten_option(o)]
        if len(flat) <= 10:
            parts.append(f"({' | '.join(flat)})")
        else:
            parts.append(f"({' | '.join(flat[:10])} ... +{len(flat)-10} more)")
    else:
        parts.append(f"({ptype})")

    if "default" in prop:
        d = prop["default"]
        if d is not None and d != "" and d != {} and d != []:
            dstr = str(d)
            if len(dstr) <= 30:
                parts.append(f"default={dstr}")

    if prop.get("required"):
        parts.append("REQUIRED")

    # Show when (compact)
    if prop.get("showWhen"):
        conds = [f"{k}={v}" for k, v in prop["showWhen"].items()]
        parts.append(f"[when {', '.join(conds)}]")

    return " ".join(parts)


def get_node_schemas(node_types: list[str]) -> str:
    """
    Layer 2: return condensed schemas for the requested node types.
    Produces a compact text format suitable for prompt injection.
    """
    defs = _load_definitions()
    sections = []

    for node_type in node_types:
        full_type = node_type if node_type.startswith("n8n-nodes-base.") else f"n8n-nodes-base.{node_type}"

        schema = defs.get(full_type)
        if not schema:
            sections.append(f"### {full_type}\nNo detailed schema available.\n")
            continue

        lines = [f"### {full_type} v{schema['version']} — {schema['displayName']}"]

        if schema.get("credentials"):
            lines.append(f"Credentials: {', '.join(schema['credentials'])}")

        lines.append("Parameters:")
        for prop in schema["properties"]:
            line = _condense_property(prop)
            if line:
                lines.append(line)

        sections.append("\n".join(lines))

    return "\n\n".join(sections)
