import json
from pathlib import Path
from typing import Optional

CONTEXT_DIR = Path(__file__).parent.parent / "data" / "context"


class ContextLoader:
    def __init__(self, context_dir: Optional[Path] = None):
        self.context_dir = context_dir or CONTEXT_DIR
        self._cache: dict = {}
        self._dynamic_identity: Optional[str] = None

    def _load_json(self, filename: str) -> dict:
        if filename not in self._cache:
            filepath = self.context_dir / filename
            if filepath.exists():
                with open(filepath) as f:
                    self._cache[filename] = json.load(f)
            else:
                self._cache[filename] = {}
        return self._cache[filename]

    def get_company_profile(self) -> dict:
        return self._load_json("company-profile.json")

    def get_tools_and_systems(self) -> dict:
        return self._load_json("tools-and-systems.json")

    def get_policies(self) -> dict:
        return self._load_json("policies.json")

    def get_org_structure(self) -> dict:
        return self._load_json("org-structure.json")

    def get_full_context(self) -> dict:
        return {
            "company_profile": self.get_company_profile(),
            "tools_and_systems": self.get_tools_and_systems(),
            "policies": self.get_policies(),
            "org_structure": self.get_org_structure(),
        }

    def get_tool_inventory_for_planner(self) -> str:
        """Return a concise tool inventory for the RAG planner.

        Lists each tool with its category and name so the planner knows
        what systems exist and can request specific technical details.
        """
        tools = self.get_tools_and_systems()
        lines = []
        for category, tool in tools.items():
            name = tool.get("name", category)
            lines.append(f"- {category}: {name}")
        return "\n".join(lines)

    def set_company_identity(self, identity: str):
        """Set dynamic company identity from onboarding form."""
        self._dynamic_identity = identity

    def get_dynamic_identity(self) -> Optional[str]:
        """Return the dynamic identity if set, else None."""
        return self._dynamic_identity

    def clear_dynamic_identity(self):
        """Clear dynamic identity (reset onboarding)."""
        self._dynamic_identity = None

    def get_company_identity(self) -> str:
        """Return company identity — dynamic (from onboarding) or default (from JSON)."""
        if self._dynamic_identity:
            return self._dynamic_identity
        profile = self.get_company_profile()
        return "\n".join([
            f"Company: {profile.get('name', 'Unknown')}",
            f"Type: {profile.get('type', '')}",
            f"Services: {', '.join(profile.get('services', []))}",
            f"Size: {profile.get('size', '')}",
            f"Regulatory environment: {', '.join(profile.get('regulatory_environment', []))}",
            f"Headquarters: {profile.get('headquarters', '')}",
        ])

    def get_tools_overview(self) -> str:
        """Minimal tool inventory for the system prompt.

        Lists only tool names, categories, and n8n node types.
        All details (channel names, table schemas, credentials, URLs)
        come from RAG retrieval based on the user's query.
        """
        tools = self.get_tools_and_systems()
        lines = []
        for category, tool in tools.items():
            name = tool.get("name", category)
            n8n_node = tool.get("n8n_node", "")
            lines.append(f"- **{name}** ({category}) — n8n node: `{n8n_node}`")
        return "\n".join(lines)


# Singleton instance
context_loader = ContextLoader()
