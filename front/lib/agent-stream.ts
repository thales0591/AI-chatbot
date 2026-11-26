import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { AgentEvent } from "./conversation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export function executeAgent(
  message: string,
  signal: AbortSignal,
  onEvent: (event: AgentEvent) => void,
) {
  return fetchEventSource(`${apiUrl}/agent/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
    signal,
    openWhenHidden: true,
    async onopen(response) {
      if (!response.ok) throw new Error("Request failed.");
    },
    onmessage(frame) {
      onEvent(JSON.parse(frame.data));
    },
    // Do not automatically retry the POST after an error.
    onerror(error) {
      throw error;
    },
  });
}
