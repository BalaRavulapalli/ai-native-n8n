import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.chat import WorkflowDeployRequest, WorkflowDeployResponse, WorkflowTestRequest
from services.n8n_client import n8n_client
from services.workflow_tester import workflow_tester
from services.workflow_validator import validate_workflow

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("/")
async def list_workflows():
    """List all workflows from n8n."""
    try:
        workflows = await n8n_client.list_workflows()
        return {"workflows": workflows}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"n8n error: {str(e)}")


@router.post("/deploy", response_model=WorkflowDeployResponse)
async def deploy_workflow(request: WorkflowDeployRequest):
    """Deploy a workflow to n8n."""
    try:
        # Validate first
        validation = validate_workflow(request.workflow_json)
        if not validation.valid:
            return WorkflowDeployResponse(
                success=False,
                error=f"Validation failed: {'; '.join(validation.errors)}",
            )

        workflow_data = request.workflow_json
        if request.name:
            workflow_data["name"] = request.name

        result = await n8n_client.create_workflow(workflow_data, activate=request.activate)

        n8n_url = f"{n8n_client.base_url}/workflow/{result['id']}"

        return WorkflowDeployResponse(
            success=True,
            workflow_id=str(result["id"]),
            n8n_url=n8n_url,
        )
    except Exception as e:
        return WorkflowDeployResponse(
            success=False,
            error=str(e),
        )


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str):
    """Get a specific workflow from n8n."""
    try:
        workflow = await n8n_client.get_workflow(workflow_id)
        return workflow
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"n8n error: {str(e)}")


@router.post("/{workflow_id}/test")
async def test_workflow(workflow_id: str, request: WorkflowTestRequest):
    """Run the 3-layer test execution on a workflow."""
    results = await workflow_tester.run_full_test(
        user_request=request.user_request,
        workflow_json=request.workflow_json,
        workflow_id=workflow_id,
    )
    return results


@router.post("/test")
async def test_workflow_no_id(request: WorkflowTestRequest):
    """Run tests on a workflow that hasn't been deployed yet."""
    results = await workflow_tester.run_full_test(
        user_request=request.user_request,
        workflow_json=request.workflow_json,
    )
    return results


@router.post("/test/stream")
async def test_workflow_stream(request: WorkflowTestRequest):
    """Run tests with SSE streaming — sends each layer result as it completes."""

    async def generate():
        import asyncio
        from services.n8n_client import n8n_client

        results = {}
        workflow_id = request.workflow_id

        # Signal all three layers as running
        for layer in ("audit", "dry_run", "execution"):
            yield f"data: {json.dumps({'layer': layer, 'status': 'running'})}\n\n"

        # Retrieve RAG context for audit & dry run
        rag_context = ""
        try:
            from services.rag import rag_service
            rag_context = await rag_service.retrieve_as_text(request.user_request, top_k=10)
        except Exception:
            pass

        # Start all three in parallel
        audit_task = asyncio.create_task(workflow_tester.run_audit(request.user_request, request.workflow_json, rag_context=rag_context))
        dry_run_task = asyncio.create_task(workflow_tester.run_dry_run(request.user_request, request.workflow_json, rag_context=rag_context))

        async def _run_execution():
            try:
                is_healthy = await n8n_client.health_check()
                if is_healthy:
                    return await workflow_tester.run_execution(
                        request.user_request, request.workflow_json, workflow_id
                    )
                return {"layer": "execution", "status": "skipped", "summary": "n8n is not available."}
            except Exception as e:
                return {"layer": "execution", "status": "error", "summary": f"Execution failed: {str(e)}"}

        exec_task = asyncio.create_task(_run_execution())

        # Yield results as each completes
        pending = {"audit": audit_task, "dry_run": dry_run_task, "execution": exec_task}
        while pending:
            done, _ = await asyncio.wait(pending.values(), return_when=asyncio.FIRST_COMPLETED)
            for task in done:
                layer = next(k for k, t in pending.items() if t is task)
                del pending[layer]
                result = task.result()
                results[layer] = result
                yield f"data: {json.dumps({'layer': layer, 'result': result})}\n\n"

        # Overall — based on audit + dry_run (workflow logic).
        # Execution is informational; credential/env failures shouldn't
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

        done_event = json.dumps({
            "done": True,
            "overall_status": overall,
            "results": results,
        })
        yield f"data: {done_event}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
