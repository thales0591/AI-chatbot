export type ToolInput = { query?: string; description?: string };
export type ToolResult =
  | {
      tickets: {
        id: string;
        title: string;
        status: string;
        resolution: string | null;
      }[];
    }
  | { articles: { id: string; title: string; steps: string[] }[] }
  | {
      suggestion:
        | { id: string; category: string; subcategory: string; reason: string }
        | { hypothesis: string; steps: string[]; validation: string }
        | null;
    };

export type AgentEvent = { run_id: string; name: string } & (
  | { event: "on_chat_model_start"; data: object }
  | { event: "on_chat_model_stream"; data: { chunk: { content: string } } }
  | { event: "on_chat_model_end"; data: { output: { content: string } } }
  | { event: "on_tool_start"; data: { input: ToolInput } }
  | { event: "on_tool_end"; data: { output: { content: string } } }
);

export type ToolRun = {
  kind: "tool";
  id: string;
  name: string;
  input: ToolInput;
  output?: ToolResult;
  started: number;
  finished?: number;
  status: "running" | "complete" | "incomplete";
};
type ModelPass = { kind: "model"; id: string; text: string };
export type Turn = {
  id: string;
  message: string;
  items: (ModelPass | ToolRun)[];
  status: "running" | "complete" | "incomplete";
  error?: string;
};

export function applyEvent(turn: Turn, event: AgentEvent): Turn {
  const items = turn.items;
  switch (event.event) {
    case "on_chat_model_start":
      return {
        ...turn,
        items: [...items, { kind: "model", id: event.run_id, text: "" }],
      };
    case "on_chat_model_stream":
      return {
        ...turn,
        items: items.map((item) =>
          item.kind === "model" && item.id === event.run_id
            ? { ...item, text: item.text + event.data.chunk.content }
            : item,
        ),
      };
    case "on_chat_model_end":
      return {
        ...turn,
        items: items.map((item) =>
          item.kind === "model" && item.id === event.run_id
            ? { ...item, text: event.data.output.content }
            : item,
        ),
      };
    case "on_tool_start":
      return {
        ...turn,
        items: [
          ...items,
          {
            kind: "tool",
            id: event.run_id,
            name: event.name,
            input: event.data.input,
            started: Date.now(),
            status: "running",
          },
        ],
      };
    case "on_tool_end": {
      const output: ToolResult = JSON.parse(event.data.output.content);
      return {
        ...turn,
        items: items.map((item) =>
          item.kind === "tool" && item.id === event.run_id
            ? { ...item, output, finished: Date.now(), status: "complete" }
            : item,
        ),
      };
    }
    default:
      return turn;
  }
}

export function finishTurn(turn: Turn, error?: string): Turn {
  return {
    ...turn,
    status: error ? "incomplete" : "complete",
    error,
    items: turn.items.map((item) =>
      item.kind === "tool" && item.status === "running"
        ? { ...item, status: "incomplete", finished: Date.now() }
        : item,
    ),
  };
}
