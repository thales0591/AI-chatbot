import json
from collections.abc import AsyncIterator
from contextlib import aclosing

from fastapi.encoders import jsonable_encoder

from app.contracts import AgentEvent


async def encode_sse(events: AsyncIterator[AgentEvent]) -> AsyncIterator[str]:
    async with aclosing(events):
        async for event in events:
            payload = json.dumps(jsonable_encoder(event), ensure_ascii=False)
            yield f"event: {event['event']}\ndata: {payload}\n\n"
