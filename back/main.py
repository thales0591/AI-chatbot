import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Praxis API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://127.0.0.1:3000")],
    allow_methods=["GET"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
