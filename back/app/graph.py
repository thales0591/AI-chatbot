import asyncio

from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.graph import START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from app.tools import TOOLS

PROMPT = """You assist support technicians. Respond clearly in English using Markdown.
Choose only the tools relevant to the question; use several when needed. Tool data
is fictional, local, and for demonstration purposes. Do not invent tickets,
articles, or identifiers. Acknowledge when there are no results. Distinguish
hypotheses and suggestions from confirmed resolutions recorded in tickets.
Never claim to have performed an action: your tools only retrieve information or
make suggestions. Recommend verification with the user and authorized staff."""


def build_graph(model: ChatOpenAI):
    bound_model = model.bind_tools(TOOLS)

    async def call_model(state: MessagesState, config: RunnableConfig):
        async with asyncio.timeout(30):
            response = await bound_model.ainvoke(
                [SystemMessage(content=PROMPT), *state["messages"]], config=config
            )
        return {"messages": [response]}

    graph = StateGraph(MessagesState)
    graph.add_node("model", call_model)
    graph.add_node("tools", ToolNode(TOOLS, handle_tool_errors=False))
    graph.add_edge(START, "model")
    graph.add_conditional_edges("model", tools_condition)
    graph.add_edge("tools", "model")
    return graph.compile()
