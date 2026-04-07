from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from routers import health, context, chat, workflows, onboard
from services.rag import rag_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Soren Workflow Automation backend...")
    print(f"n8n URL: {settings.n8n_base_url}")
    print(f"Qdrant URL: {settings.qdrant_url}")
    print(f"Postgres: {settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}")

    # Document ingestion is now handled by the onboarding flow.
    # The user uploads documents via POST /onboard/documents,
    # which triggers RAG ingestion into Qdrant.
    print("Waiting for onboarding — documents will be ingested when uploaded.")

    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="Soren Workflow Automation",
    description="Context-aware n8n workflow generation for financial services",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(context.router)
app.include_router(chat.router)
app.include_router(workflows.router)
app.include_router(onboard.router)


@app.get("/")
async def root():
    return {
        "name": "Soren Workflow Automation API",
        "version": "0.1.0",
        "docs": "/docs",
    }
