"""
Analyzes workflow nodes to determine what credentials/configuration are needed.
Derives credential requirements dynamically from the n8n node definitions catalog
rather than hardcoded maps.

Returns two separate lists:
  1. credential_steps — services needing n8n credential setup
  2. config_notes — nodes needing workflow-level configuration (HTTP endpoints, custom auth, etc.)
"""

from services.node_registry import get_node_definition


def _get_credential_info(node_type: str) -> list[str]:
    """Look up which credentials a node type requires from the definitions catalog."""
    schema = get_node_definition(node_type)
    return schema.get("credentials", []) if schema else []


def _get_display_name(node_type: str) -> str:
    """Look up the human-readable display name for a node type."""
    schema = get_node_definition(node_type)
    return schema.get("displayName", node_type.split(".")[-1]) if schema else node_type.split(".")[-1]


def _icon_for_service(display_name: str) -> str:
    """Best-effort icon name from display name."""
    name_lower = display_name.lower()
    icon_map = {
        "slack": "slack", "salesforce": "salesforce", "postgres": "database",
        "mysql": "database", "sendgrid": "mail", "gmail": "mail",
        "email": "mail", "sharepoint": "share", "microsoft": "share",
        "github": "github", "jira": "ticket", "notion": "file-text",
        "google": "globe", "aws": "cloud", "http": "globe",
        "webhook": "globe", "mqtt": "radio", "whatsapp": "message-circle",
        "telegram": "message-circle", "discord": "message-circle",
        "stripe": "credit-card", "twilio": "phone",
    }
    for keyword, icon in icon_map.items():
        if keyword in name_lower:
            return icon
    return "settings"


def analyze_setup_requirements(workflow: dict) -> dict:
    """
    Analyze a workflow and return credential/config requirements.
    Derives everything dynamically from the node definitions catalog.
    """
    nodes = workflow.get("nodes", [])
    if not nodes:
        return {"credentials": [], "config_notes": []}

    seen_services: set[str] = set()
    credentials: list[dict] = []
    config_notes: list[dict] = []

    for node in nodes:
        node_type = node.get("type", "")
        node_name = node.get("name", "Unknown")

        # Look up what credentials this node type needs
        required_creds = _get_credential_info(node_type)
        display_name = _get_display_name(node_type)

        # HTTP Request nodes get config notes instead of credential entries
        if node_type == "n8n-nodes-base.httpRequest":
            config_notes.append({
                "node_name": node_name,
                "note": f'The "{node_name}" node uses an API endpoint. '
                        f"After deploying, open the workflow in n8n and verify "
                        f"the URL and authentication headers are correct.",
            })
            continue

        # Skip nodes that don't need any credentials
        if not required_creds:
            continue

        # Deduplicate by service display name
        if display_name in seen_services:
            continue
        seen_services.add(display_name)

        # Format credential type names for display
        cred_type_display = ", ".join(
            c.replace("Api", " API").replace("OAuth2", " OAuth2").replace("oauth2", " OAuth2")
            for c in required_creds[:2]
        )

        credentials.append({
            "node_name": node_name,
            "service": display_name,
            "icon": _icon_for_service(display_name),
            "credential_type": cred_type_display,
            "description": f"Connect {display_name} for this workflow",
            "status": "needs_setup",
        })

    return {"credentials": credentials, "config_notes": config_notes}
