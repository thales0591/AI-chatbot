# Chatbot

An AI support assistant that retrieves related tickets, finds troubleshooting
procedures, and suggests ticket categories and next steps. Built with FastAPI,
LangGraph, and Next.js, it combines OpenAI tool calling with a streaming chat
interface that exposes both tool execution and structured results.

## Capabilities

- Search related tickets and knowledge articles.
- Suggest categories and troubleshooting steps with explicit verification criteria.
- Stream model responses and display tool execution status and duration.
- Inspect structured tool results through dedicated cards and expandable JSON.
- Cancel an active request or start a new conversation.
- Use a responsive interface with Markdown responses and keyboard shortcuts.

The current tool implementations use local fixtures for VPN access issues,
offline printers, and locked accounts. Model inference runs through the OpenAI
API. Tools retrieve information and suggest actions; they do not modify tickets.

## Architecture

The backend separates HTTP transport, agent execution, graph construction, and
tool implementations. Routes depend on an `AgentExecutor` protocol, keeping
LangGraph details outside the HTTP layer.

The agent follows an explicit graph:

```text
START → model → tools → model → END
```

The model selects relevant tools and can repeat the tool cycle before producing
a final response. Each API worker creates one model client, compiled graph, and
agent service during startup. Requests use independent execution state.

| Location | Responsibility |
| --- | --- |
| `back/app/main.py` | Application composition, CORS, startup, and resource cleanup |
| `back/app/config.py` | Typed environment settings |
| `back/app/contracts.py` | Agent execution protocol |
| `back/app/agent.py` | Request execution and event streaming |
| `back/app/graph.py` | Model instructions and graph construction |
| `back/app/tools.py` | Asynchronous tools and shared fixtures |
| `back/app/routes.py` | HTTP endpoints and request validation |
| `back/app/sse.py` | Server-Sent Events serialization |
| `front/lib/` | SSE client, event types, and conversation updates |
| `front/hooks/` | Request lifecycle and cancellation |
| `front/components/` | Conversation rendering and tool result cards |

Model calls have a 30-second timeout, a graph limit of 12 steps, and no automatic
model retries. Conversation history remains visible in the interface, but each
message is executed independently: previous turns are not sent to the model.

## Getting started

Requires Python 3.13, `uv`, Node.js 20.9+, and npm. The backend and frontend each
use their own `.env` file.

Start the backend from the repository root:

```sh
cd back
cp .env.example .env
# Set OPENAI_API_KEY in .env.
uv run uvicorn app.main:app --reload
```

`uv run` installs and synchronizes dependencies automatically. The API reads
`back/.env` and requires a nonempty API key at startup. The provider validates
authentication on the first model request.

Start the frontend in another terminal, from the repository root:

```sh
cd front
cp .env.example .env
npm ci
npm run dev
```

If a service already has a configured `.env`, skip the copy command. Environment
files are ignored by Git; API keys belong only in the backend configuration.

| Service | URL |
| --- | --- |
| Chat interface | <http://127.0.0.1:3000> |
| API health | <http://127.0.0.1:8000/health> |
| Interactive API documentation | <http://127.0.0.1:8000/docs> |

## Configuration

| File | Variable | Purpose |
| --- | --- | --- |
| `back/.env` | `OPENAI_API_KEY` | Required OpenAI API key |
| `back/.env` | `OPENAI_MODEL` | Model ID; defaults to `gpt-4.1-mini` |
| `front/.env` | `NEXT_PUBLIC_API_URL` | API URL; defaults to `http://127.0.0.1:8000` |

Restart the corresponding service after changing its `.env`. Public frontend
variables are embedded at build time, so production builds must be regenerated
after changes to `NEXT_PUBLIC_API_URL`.

Allowed CORS origins are configured in `back/app/main.py` and include
`http://localhost:3000` and `http://127.0.0.1:3000`.

## Tools

| Tool | Input | Output |
| --- | --- | --- |
| `find_similar_tickets` | `query` | Tickets with ID, title, status, and resolution |
| `search_knowledge_base` | `query` | Articles with ID, title, and procedure steps |
| `suggest_ticket_category` | `description` | Category, subcategory, ID, and reason |
| `suggest_solution` | `description` | Hypothesis, next steps, and verification criteria |

Tools match normalized English keywords against shared fixtures. Searches can
return multiple scenarios. Suggestions select the first match in the order VPN,
printer, then account. Searches without matches return empty lists; suggestions
return `null`. Each tool includes a five-second delay to make execution progress
observable in the interface.

## API and streaming

`GET /health` returns the API status. `POST /agent/execute` accepts a message that
must remain nonempty after trimming whitespace:

```sh
curl -N http://127.0.0.1:8000/agent/execute \
  -H 'Content-Type: application/json' \
  -d '{"message":"For a VPN issue, find tickets and articles and suggest a category and solution using all four tools."}'
```

The response uses `text/event-stream`. Each SSE frame contains the event name
and the complete LangChain event payload as JSON. The agent consumes
`astream_events(version="v2", include_types=["chat_model", "tool"])`.

The frontend identifies model passes and tool runs by `run_id`, appends incoming
text chunks, and replaces each draft with the corresponding `on_chat_model_end`
content. It consumes the API's expected event format directly. A normal stream
closure completes the turn; failures preserve received content and display a
generic error.

The SSE client disables automatic retries and keeps requests open when the tab
is hidden. **Stop** cancels the current request. **New chat** cancels and clears
the conversation. Enter sends a message; Shift+Enter inserts a new line.
Automatic scrolling follows the response while the user remains near the bottom.
Markdown rendering does not enable raw HTML.

## Verification

```sh
cd back
uv sync
cd ../front
npm ci
npx tsc --noEmit
npm run build
```

Behavior is verified manually; the repository does not include an automated test
suite. Checks cover request validation, all tool scenarios, empty results,
streaming payloads, simultaneous clients, cancellation, connection failures,
tab switching, and desktop and mobile layouts.

## Current scope

This personal project focuses on agent orchestration, tool calling, and streaming
interaction. It does not currently include external ticketing integrations,
authentication, persistence, conversation memory, RAG, checkpoints, deployment
configuration, or application observability.
