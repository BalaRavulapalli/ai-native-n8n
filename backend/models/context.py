from pydantic import BaseModel
from typing import Optional


class CompanyProfile(BaseModel):
    name: str
    type: str
    services: list[str]
    size: str
    regulatory_environment: list[str]
    headquarters: str
    founded: int
    description: str


class SlackChannel(BaseModel):
    name: str
    purpose: str


class ToolConfig(BaseModel):
    name: str
    n8n_node: str
    details: Optional[str] = None
    channels: Optional[list[SlackChannel]] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database: Optional[str] = None
    credential_name: Optional[str] = None
    tables: Optional[dict] = None
    instance_url: Optional[str] = None
    base_url: Optional[str] = None
    from_address: Optional[str] = None


class CompanyContext(BaseModel):
    company_profile: CompanyProfile
    tools: dict[str, ToolConfig]
    policies: dict
    org_structure: dict
