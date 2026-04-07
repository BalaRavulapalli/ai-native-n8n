import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from services.context_loader import context_loader
from services.rag import rag_service

router = APIRouter(prefix="/onboard", tags=["onboarding"])

# Uploaded documents land here (ephemeral — cleared on re-onboard)
UPLOAD_DIR = Path(__file__).parent.parent / "data" / "uploads"


@router.get("/status")
async def onboard_status():
    """Check whether the company has completed onboarding."""
    identity = context_loader.get_dynamic_identity()
    return {
        "onboarded": identity is not None,
        "company_name": identity.split("\n")[0].replace("Company: ", "") if identity else None,
    }


@router.post("/profile")
async def submit_profile(
    company_name: str = Form(...),
    company_type: str = Form(...),
    services: str = Form(...),
    size: str = Form(...),
    regulatory_environment: str = Form(...),
    headquarters: str = Form(...),
):
    """Save the company profile from onboarding form."""
    identity = "\n".join([
        f"Company: {company_name}",
        f"Type: {company_type}",
        f"Services: {services}",
        f"Size: {size}",
        f"Regulatory environment: {regulatory_environment}",
        f"Headquarters: {headquarters}",
    ])
    context_loader.set_company_identity(identity)
    return {"success": True, "company_name": company_name}


@router.post("/documents")
async def upload_documents(files: list[UploadFile] = File(...)):
    """Upload company documents and ingest into RAG."""
    # Clear previous uploads
    if UPLOAD_DIR.exists():
        shutil.rmtree(UPLOAD_DIR)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    saved = []
    for f in files:
        dest = UPLOAD_DIR / f.filename
        content = await f.read()
        dest.write_bytes(content)
        saved.append(f.filename)

    # Ingest into Qdrant
    try:
        await rag_service.ingest_documents(documents_dir=UPLOAD_DIR)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document ingestion failed: {str(e)}")

    return {"success": True, "documents": saved, "count": len(saved)}


@router.post("/reset")
async def reset_onboarding():
    """Reset onboarding state (for re-doing setup)."""
    context_loader.clear_dynamic_identity()
    if UPLOAD_DIR.exists():
        shutil.rmtree(UPLOAD_DIR)
    return {"success": True}
