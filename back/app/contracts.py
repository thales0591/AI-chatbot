from collections.abc import AsyncIterator
from typing import Any, Protocol

AgentEvent = dict[str, Any]


class AgentExecutor(Protocol):
    def execute(self, message: str) -> AsyncIterator[AgentEvent]: ...
