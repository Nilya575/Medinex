"""
Medinex FastAPI Backend
AI document extraction and health summary generation
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import documents, summaries

app = FastAPI(
    title="Medinex AI Backend",
    description="AI-powered medical document extraction and health summary generation",
    version="1.0.0",
)

# Allow requests from the Vite dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(summaries.router, prefix="/summaries", tags=["Summaries"])


@app.get("/")
async def root():
    return {
        "service": "Medinex AI Backend",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "extract": "POST /documents/extract",
            "summary": "POST /summaries/generate",
        }
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
