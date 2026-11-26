import Markdown from "react-markdown";
import type { Turn } from "../lib/conversation";
import { ToolCard } from "./tool-card";

export function ConversationTurn({ turn }: { turn: Turn }) {
  const hasContent = turn.items.some(
    (item) => item.kind === "tool" || item.text,
  );
  return (
    <section className="turn" aria-label="Conversation">
      <div className="user-message">{turn.message}</div>
      <div className="assistant-message">
        <div className="assistant-label">
          <span className="avatar" aria-hidden="true">
            ✳
          </span>
          Assistant
        </div>
        {turn.items.map((item) =>
          item.kind === "tool" ? (
            <ToolCard key={item.id} run={item} />
          ) : (
            <div key={item.id} className="markdown">
              <Markdown>{item.text}</Markdown>
            </div>
          ),
        )}
        {turn.status === "running" &&
          (hasContent ? (
            <span className="stream-status" role="status">
              Working…
            </span>
          ) : (
            <p className="thinking">
              <span className="spinner" />
              Thinking…
            </p>
          ))}
        {turn.error && (
          <p role="alert" className="turn-error">
            {turn.error}
          </p>
        )}
      </div>
    </section>
  );
}
