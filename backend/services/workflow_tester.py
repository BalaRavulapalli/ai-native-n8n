"""
3-Layer Workflow Test Execution Engine.

Layer 1: Logical Audit — Claude reviews workflow against user request
Layer 2: Dry Run Trace — Claude simulates execution with synthetic data
Layer 3: Real Execution — Deploy to n8n, execute, review results
"""

import json
from typing import Optional

from services.llm import llm_service, OPUS_MODEL
from services.n8n_client import n8n_client
from services.context_loader import context_loader
from services.rag import rag_service
from prompts.audit_prompt import AUDIT_SYSTEM_PROMPT, build_audit_prompt
from prompts.test_data_prompt import (
    DRY_RUN_SYSTEM_PROMPT,
    build_dry_run_prompt,
    EXECUTION_REVIEW_SYSTEM_PROMPT,
    build_execution_review_prompt,
)


def _parse_json_response(text: str) -> Optional[dict]:
    """Extract JSON from Claude's response."""
    import re
    # Try to find JSON in code blocks
    json_blocks = re.findall(r'```(?:json)?\s*\n(.*?)\n\s*```', text, re.DOTALL)
    for block in json_blocks:
        try:
            return json.loads(block.strip())
        except json.JSONDecodeError:
            continue

    # Try parsing the whole response
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    return None


class WorkflowTester:
    async def run_audit(self, user_request: str, workflow_json: dict, rag_context: str = "") -> dict:
        """Layer 1: Logical audit via Claude."""
        try:
            company_context = context_loader.get_company_identity()
            if rag_context:
                company_context += "\n\n" + rag_context
            prompt = build_audit_prompt(user_request, workflow_json, company_context)
            response = await llm_service.chat_sync(
                user_message=prompt,
                system_prompt=AUDIT_SYSTEM_PROMPT,
                model=OPUS_MODEL,
            )

            result = _parse_json_response(response)
            if result:
                return {"layer": "audit", **result}

            return {
                "layer": "audit",
                "status": "warning",
                "summary": "Could not parse structured audit response",
                "raw_response": response,
            }
        except Exception as e:
            return {
                "layer": "audit",
                "status": "error",
                "summary": f"Audit failed: {str(e)}",
            }

    async def run_dry_run(self, user_request: str, workflow_json: dict, rag_context: str = "") -> dict:
        """Layer 2: Dry run trace with synthetic data via Claude."""
        try:
            company_context = context_loader.get_company_identity()
            if rag_context:
                company_context += "\n\n" + rag_context
            prompt = build_dry_run_prompt(user_request, workflow_json, company_context)
            response = await llm_service.chat_sync(
                user_message=prompt,
                system_prompt=DRY_RUN_SYSTEM_PROMPT,
            )

            result = _parse_json_response(response)
            if result:
                # Normalize: LLM may return overall_assessment instead of status/summary
                if "status" not in result:
                    result["status"] = "pass" if result.get("test_scenarios") else "warning"
                if "summary" not in result and "overall_assessment" in result:
                    result["summary"] = result.pop("overall_assessment")
                return {"layer": "dry_run", **result}

            return {
                "layer": "dry_run",
                "status": "warning",
                "summary": "Could not parse structured dry run response",
                "raw_response": response,
            }
        except Exception as e:
            return {
                "layer": "dry_run",
                "status": "error",
                "summary": f"Dry run failed: {str(e)}",
            }

    async def run_execution(
        self, user_request: str, workflow_json: dict, workflow_id: Optional[str] = None
    ) -> dict:
        """Layer 3: Real execution via webhook-triggered copy in n8n."""
        try:
            exec_result = await n8n_client.execute_workflow_via_webhook(workflow_json)

            # Always send to Claude for review — even failed executions have
            # per-node data showing which nodes succeeded and which errored.
            # That information is the most valuable feedback for fixing the workflow.
            prompt = build_execution_review_prompt(user_request, workflow_json, exec_result)
            review_response = await llm_service.chat_sync(
                user_message=prompt,
                system_prompt=EXECUTION_REVIEW_SYSTEM_PROMPT,
            )

            review = _parse_json_response(review_response)
            if review:
                # If execution didn't finish, force status to error/warning
                if not exec_result.get("finished") and review.get("status") == "pass":
                    review["status"] = "error"
                return {
                    "layer": "execution",
                    "execution_id": exec_result.get("execution_id"),
                    **review,
                    "raw_execution": exec_result,
                }

            return {
                "layer": "execution",
                "execution_id": exec_result.get("execution_id"),
                "status": "error" if not exec_result.get("finished") else "warning",
                "summary": f"Execution {'failed' if not exec_result.get('finished') else 'completed'} but could not parse review",
                "raw_execution": exec_result,
                "raw_review": review_response,
            }

        except Exception as e:
            return {
                "layer": "execution",
                "status": "error",
                "summary": f"Execution failed: {str(e)}",
            }

    async def run_full_test(
        self, user_request: str, workflow_json: dict, workflow_id: Optional[str] = None
    ) -> dict:
        """Run all 3 layers of testing."""
        import asyncio

        # Retrieve RAG context for audit & dry run (same context used for generation)
        rag_context = ""
        try:
            rag_context = await rag_service.retrieve_as_text(user_request, top_k=10)
        except Exception:
            pass

        audit_result, dry_run_result = await asyncio.gather(
            self.run_audit(user_request, workflow_json, rag_context=rag_context),
            self.run_dry_run(user_request, workflow_json, rag_context=rag_context),
        )
        results = {
            "audit": audit_result,
            "dry_run": dry_run_result,
        }

        # Only run real execution if n8n is available
        try:
            is_healthy = await n8n_client.health_check()
            if is_healthy:
                results["execution"] = await self.run_execution(
                    user_request, workflow_json, workflow_id
                )
            else:
                results["execution"] = {
                    "layer": "execution",
                    "status": "skipped",
                    "summary": "n8n is not available. Skipping real execution.",
                }
        except Exception as e:
            results["execution"] = {
                "layer": "execution",
                "status": "error",
                "summary": f"Could not connect to n8n: {str(e)}",
            }

        # Overall status — based on audit + dry_run (workflow logic).
        # Execution is informational; env/credential failures shouldn't
        # override the verdict when the workflow itself is correct.
        logic_statuses = [
            results.get(k, {}).get("status", "error")
            for k in ("audit", "dry_run")
        ]
        if "fail" in logic_statuses or "error" in logic_statuses:
            overall = "fail"
        elif "warning" in logic_statuses:
            overall = "warning"
        else:
            overall = "pass"

        return {
            "overall_status": overall,
            "results": results,
        }


# Singleton
workflow_tester = WorkflowTester()
