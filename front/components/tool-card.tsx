"use client";

import { useEffect, useState } from "react";
import type { ToolRun, ToolResult as Result } from "../lib/conversation";

export const toolNames: Record<string, string> = {
  find_similar_tickets: "Similar tickets",
  search_knowledge_base: "Knowledge base",
  suggest_ticket_category: "Suggested category",
  suggest_solution: "Next steps",
};

function Steps({ value }: { value: string[] }) {
  return (
    <ol>
      {value.map((step, index) => (
        <li key={index}>{step}</li>
      ))}
    </ol>
  );
}

function ToolResult({ output }: { output: Result }) {
  if ("tickets" in output)
    return output.tickets.length ? (
      <div className="result-list">
        {output.tickets.map((ticket) => (
          <section key={ticket.id}>
            <div className="result-meta">
              <span>{ticket.id}</span>
              <span className="badge">{ticket.status}</span>
            </div>
            <h3>{ticket.title}</h3>
            <p>{ticket.resolution ?? "No resolution recorded yet."}</p>
          </section>
        ))}
      </div>
    ) : (
      <p>No similar tickets found.</p>
    );
  if ("articles" in output)
    return output.articles.length ? (
      <div className="result-list">
        {output.articles.map((article) => (
          <section key={article.id}>
            <span className="result-meta">{article.id}</span>
            <h3>{article.title}</h3>
            <Steps value={article.steps} />
          </section>
        ))}
      </div>
    ) : (
      <p>No articles found for this topic.</p>
    );
  const suggestion = output.suggestion;
  if (!suggestion) return <p>No suggestion available for this topic.</p>;
  if ("category" in suggestion)
    return (
      <section>
        <span className="result-meta">{suggestion.id}</span>
        <h3>
          {suggestion.category} / {suggestion.subcategory}
        </h3>
        <p>{suggestion.reason}</p>
      </section>
    );
  return (
    <section>
      <span className="result-meta">Hypothesis to verify</span>
      <h3>{suggestion.hypothesis}</h3>
      <Steps value={suggestion.steps} />
      <p className="validation">
        <strong>How to verify</strong>
        <br />
        {suggestion.validation}
      </p>
    </section>
  );
}

export function ToolCard({ run }: { run: ToolRun }) {
  const [now, setNow] = useState(run.started);
  useEffect(() => {
    if (run.status !== "running") return;
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, [run.status]);
  const input = run.input.query ?? run.input.description;
  const duration = Math.max(
    0,
    ((run.finished ?? now) - run.started) / 1000,
  ).toFixed(1);
  return (
    <article
      className={`tool-card ${run.status}`}
      aria-label={toolNames[run.name] ?? run.name}
    >
      <header className="tool-heading">
        <span
          className={run.status === "running" ? "spinner" : "tool-symbol"}
          aria-hidden="true"
        >
          {run.status === "complete"
            ? "✓"
            : run.status === "incomplete"
              ? "!"
              : ""}
        </span>
        <strong>{toolNames[run.name] ?? run.name}</strong>
        <span className="tool-duration">
          {run.status === "running"
            ? "Running"
            : run.status === "complete"
              ? "Completed"
              : "Stopped"}{" "}
          · {duration}s
        </span>
      </header>
      <p className="tool-input">{input}</p>
      {run.output && (
        <div className="tool-result">
          <ToolResult output={run.output} />
          <details>
            <summary>View JSON result</summary>
            <pre>{JSON.stringify(run.output, null, 2)}</pre>
          </details>
        </div>
      )}
    </article>
  );
}
