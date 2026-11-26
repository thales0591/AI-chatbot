from collections.abc import AsyncIterator
from contextlib import aclosing

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

from app.contracts import AgentEvent
from app.graph import build_graph


class AgentService:
    def __init__(self, model: ChatOpenAI):
        self.graph = build_graph(model)

    async def execute(self, message: str) -> AsyncIterator[AgentEvent]:
        events = self.graph.astream_events(
            {"messages": [HumanMessage(content=message)]},
            config={"recursion_limit": 12},
            version="v2",
            include_types=["chat_model", "tool"],
        )
        async with aclosing(events):
            async for event in events:
                yield event
