from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langchain_openai import ChatOpenAI

from app.agent import AgentService
from app.config import Settings
from app.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = Settings()
    model = ChatOpenAI(
        api_key=settings.openai_api_key,
        model=settings.openai_model,
        timeout=30,
        max_retries=0,
        streaming=True,
    )
    app.state.agent = AgentService(model)
    try:
        yield
    finally:
        model.root_client.close()
        await model.root_async_client.close()


def create_app() -> FastAPI:
    application = FastAPI(title="API", lifespan=lifespan)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    application.include_router(router)
    return application


app = create_app()
