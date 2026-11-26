from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, StringConstraints

from app.contracts import AgentExecutor
from app.sse import encode_sse

router = APIRouter()


def get_executor(request: Request) -> AgentExecutor:
    return request.app.state.agent


class ExecuteRequest(BaseModel):
    message: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/agent/execute")
async def execute(
    body: ExecuteRequest, executor: Annotated[AgentExecutor, Depends(get_executor)]
):
    return StreamingResponse(
        encode_sse(executor.execute(body.message)),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
