from pydantic import BaseModel
from typing import Optional


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    workflow_json: Optional[dict] = None


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[ChatMessage] = []
    workflow_context: Optional[dict] = None  # Last generated workflow for refinement


class WorkflowDeployRequest(BaseModel):
    workflow_json: dict
    name: Optional[str] = None
    activate: bool = False


class WorkflowDeployResponse(BaseModel):
    success: bool
    workflow_id: Optional[str] = None
    n8n_url: Optional[str] = None
    error: Optional[str] = None


class WorkflowTestRequest(BaseModel):
    workflow_json: dict
    workflow_id: Optional[str] = None  # If already deployed
    user_request: str  # Original user request for audit context


class TestResult(BaseModel):
    layer: str  # "audit", "dry_run", "execution"
    status: str  # "pass", "warning", "fail"
    summary: str
    details: Optional[dict] = None
