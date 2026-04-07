from fastapi import APIRouter
import httpx
import psycopg2
from config import settings

router = APIRouter(tags=["health"])


@router.get("/health/services")
async def service_health():
    results = {}

    # Check n8n
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.n8n_base_url}/healthz")
            results["n8n"] = {"status": "ok" if resp.status_code == 200 else "error"}
    except Exception as e:
        results["n8n"] = {"status": "error", "detail": str(e)}

    # Check Qdrant
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.qdrant_url}/healthz")
            results["qdrant"] = {"status": "ok" if resp.status_code == 200 else "error"}
    except Exception as e:
        results["qdrant"] = {"status": "error", "detail": str(e)}

    # Check Postgres
    try:
        conn = psycopg2.connect(
            host=settings.postgres_host,
            port=settings.postgres_port,
            dbname=settings.postgres_db,
            user=settings.postgres_user,
            password=settings.postgres_password,
            connect_timeout=5,
        )
        conn.close()
        results["postgres"] = {"status": "ok"}
    except Exception as e:
        results["postgres"] = {"status": "error", "detail": str(e)}

    all_ok = all(v["status"] == "ok" for v in results.values())
    return {"status": "ok" if all_ok else "degraded", "services": results}
