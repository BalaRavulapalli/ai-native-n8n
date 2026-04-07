import asyncio
import copy
import uuid

import httpx
from typing import Optional
from config import settings


WEBHOOK_PATH_PREFIX = "__soren_test_"


class N8nClient:
    def __init__(self):
        self.base_url = settings.n8n_base_url.rstrip("/")
        self.api_key = settings.n8n_api_key
        self._headers = {}
        if self.api_key:
            self._headers["X-N8N-API-KEY"] = self.api_key

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            base_url=self.base_url,
            headers=self._headers,
            timeout=30.0,
        )

    async def health_check(self) -> bool:
        try:
            async with self._client() as client:
                resp = await client.get("/healthz")
                return resp.status_code == 200
        except Exception:
            return False

    async def list_workflows(self) -> list[dict]:
        async with self._client() as client:
            resp = await client.get("/api/v1/workflows")
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", [])

    async def get_workflow(self, workflow_id: str) -> dict:
        async with self._client() as client:
            resp = await client.get(f"/api/v1/workflows/{workflow_id}")
            resp.raise_for_status()
            return resp.json()

    async def create_workflow(self, workflow: dict, activate: bool = False) -> dict:
        async with self._client() as client:
            # Create the workflow
            resp = await client.post("/api/v1/workflows", json=workflow)
            resp.raise_for_status()
            created = resp.json()

            # Optionally activate
            if activate and created.get("id"):
                await self.activate_workflow(created["id"])
                created["active"] = True

            return created

    async def update_workflow(self, workflow_id: str, workflow: dict) -> dict:
        async with self._client() as client:
            resp = await client.put(f"/api/v1/workflows/{workflow_id}", json=workflow)
            resp.raise_for_status()
            return resp.json()

    async def activate_workflow(self, workflow_id: str) -> dict:
        async with self._client() as client:
            resp = await client.post(f"/api/v1/workflows/{workflow_id}/activate")
            resp.raise_for_status()
            return resp.json()

    async def deactivate_workflow(self, workflow_id: str) -> dict:
        async with self._client() as client:
            resp = await client.post(f"/api/v1/workflows/{workflow_id}/deactivate")
            resp.raise_for_status()
            return resp.json()

    async def execute_workflow_via_webhook(self, workflow_json: dict) -> dict:
        """Execute a workflow by deploying a webhook-triggered copy, firing it,
        and returning per-node execution results.

        Steps:
        1. Clone the workflow, replacing trigger with a Webhook node
        2. Deploy + activate
        3. POST to the webhook URL (synchronous — waits for completion)
        4. Fetch execution results with per-node data
        5. Clean up the temporary workflow
        """
        webhook_path = f"{WEBHOOK_PATH_PREFIX}{uuid.uuid4().hex[:12]}"
        test_wf = self._make_webhook_copy(workflow_json, webhook_path)
        test_wf = await self._patch_credentials(test_wf)
        created_id = None

        try:
            # Deploy and activate
            created = await self.create_workflow(test_wf)
            created_id = str(created["id"])

            try:
                await self.activate_workflow(created_id)
            except httpx.HTTPStatusError as e:
                # Activation can fail if the workflow uses node types not
                # installed in this n8n instance (e.g. SharePoint, Teams).
                return {
                    "status": "error",
                    "finished": False,
                    "execution_id": None,
                    "run_data": {},
                    "webhook_response": {},
                    "error": f"n8n could not activate the workflow: {e.response.status_code} — "
                             f"this usually means a node type is not installed in this n8n instance.",
                }

            # Small delay for n8n to register the webhook route
            await asyncio.sleep(0.5)

            # Fire the webhook — this triggers real execution
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.get(
                    f"{self.base_url}/webhook/{webhook_path}"
                )
                webhook_response = resp.json() if resp.status_code == 200 else {"error": resp.text}

            # Fetch full execution results with per-node data
            await asyncio.sleep(0.5)
            executions = await self.list_executions(workflow_id=created_id, limit=1)
            exec_data = {}
            if executions:
                exec_id = str(executions[0].get("id"))
                exec_data = await self.get_execution(exec_id, include_data=True)

            return {
                "status": exec_data.get("status", "unknown"),
                "finished": exec_data.get("finished", False),
                "execution_id": exec_data.get("id"),
                "run_data": exec_data.get("data", {}).get("resultData", {}).get("runData", {}),
                "webhook_response": webhook_response,
            }

        finally:
            # Always clean up
            if created_id:
                try:
                    await self.deactivate_workflow(created_id)
                except Exception:
                    pass
                try:
                    await self.delete_workflow(created_id)
                except Exception:
                    pass

    async def _patch_credentials(self, wf: dict) -> dict:
        """Replace placeholder credential IDs with real ones from n8n."""
        real_creds = await self.get_credential_types()
        # Build lookup: credential type -> {id, name}
        cred_lookup: dict[str, dict] = {}
        for cred in real_creds:
            cred_type = cred.get("type", "")
            cred_lookup[cred_type] = {"id": str(cred["id"]), "name": cred.get("name", "")}
            # Also index by name (lowercased) for fuzzy matching
            cred_lookup[cred.get("name", "").lower()] = {"id": str(cred["id"]), "name": cred.get("name", "")}

        for node in wf.get("nodes", []):
            node_creds = node.get("credentials", {})
            for cred_type, cred_ref in node_creds.items():
                # Try to find a real credential matching this type
                real = cred_lookup.get(cred_type)
                if not real:
                    # Try matching by name
                    real = cred_lookup.get(cred_ref.get("name", "").lower())
                if real:
                    cred_ref["id"] = real["id"]
                    cred_ref["name"] = real["name"]
        return wf

    def _make_webhook_copy(self, workflow_json: dict, webhook_path: str) -> dict:
        """Clone a workflow, replacing its trigger node with a Webhook node."""
        wf = copy.deepcopy(workflow_json)
        wf["name"] = f"__soren_test_{uuid.uuid4().hex[:8]}"

        nodes = wf.get("nodes", [])
        connections = wf.get("connections", {})

        # Find the trigger node (first node that has "trigger" in its type)
        trigger_idx = None
        trigger_name = None
        for i, node in enumerate(nodes):
            ntype = node.get("type", "").lower()
            if "trigger" in ntype or "webhook" in ntype:
                trigger_idx = i
                trigger_name = node["name"]
                break

        # If no trigger found, use the first node
        if trigger_idx is None and nodes:
            trigger_idx = 0
            trigger_name = nodes[0]["name"]

        if trigger_idx is not None:
            # Build webhook node at the same position
            webhook_node = {
                "parameters": {
                    "path": webhook_path,
                    "responseMode": "lastNode",
                    "options": {},
                },
                "id": str(uuid.uuid4()),
                "name": "__Webhook_Trigger",
                "type": "n8n-nodes-base.webhook",
                "typeVersion": 2,
                "position": nodes[trigger_idx].get("position", [250, 300]),
                "webhookId": webhook_path,
            }

            # Replace trigger node
            nodes[trigger_idx] = webhook_node

            # Update connections: replace old trigger name with new name
            if trigger_name and trigger_name in connections:
                connections["__Webhook_Trigger"] = connections.pop(trigger_name)

            # Also update any references TO the old trigger in other nodes' connections
            for src, conn_data in connections.items():
                for output_group in conn_data.get("main", []):
                    for conn in output_group:
                        if conn.get("node") == trigger_name:
                            conn["node"] = "__Webhook_Trigger"

        wf["nodes"] = nodes
        wf["connections"] = connections
        # Ensure settings exists (n8n requires it)
        if "settings" not in wf:
            wf["settings"] = {"executionOrder": "v1"}

        return wf

    async def get_execution(self, execution_id: str, include_data: bool = False) -> dict:
        async with self._client() as client:
            params = {"includeData": "true"} if include_data else {}
            resp = await client.get(f"/api/v1/executions/{execution_id}", params=params)
            resp.raise_for_status()
            return resp.json()

    async def delete_workflow(self, workflow_id: str) -> dict:
        async with self._client() as client:
            resp = await client.delete(f"/api/v1/workflows/{workflow_id}")
            resp.raise_for_status()
            return resp.json()

    async def list_executions(self, workflow_id: Optional[str] = None, limit: int = 10) -> list[dict]:
        params = {"limit": limit}
        if workflow_id:
            params["workflowId"] = workflow_id
        async with self._client() as client:
            resp = await client.get("/api/v1/executions", params=params)
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", [])

    async def get_credential_types(self) -> list[dict]:
        """Get available credential types from n8n."""
        async with self._client() as client:
            try:
                resp = await client.get("/api/v1/credentials")
                resp.raise_for_status()
                data = resp.json()
                return data.get("data", [])
            except Exception:
                return []


# Singleton instance
n8n_client = N8nClient()
