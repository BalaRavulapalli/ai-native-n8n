from pydantic import BaseModel
from typing import Optional, Any


class N8nNode(BaseModel):
    id: Optional[str] = None
    name: str
    type: str
    position: list[int]
    parameters: dict = {}
    typeVersion: Optional[float] = None


class N8nConnection(BaseModel):
    node: str
    type: str = "main"
    index: int = 0


class N8nWorkflow(BaseModel):
    name: str = "Generated Workflow"
    nodes: list[dict]
    connections: dict
    settings: Optional[dict] = None
    active: bool = False


class N8nExecution(BaseModel):
    id: str
    finished: bool
    mode: str
    status: Optional[str] = None
    data: Optional[dict] = None


class N8nWorkflowResponse(BaseModel):
    id: str
    name: str
    active: bool
    nodes: list[dict]
    connections: dict
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
