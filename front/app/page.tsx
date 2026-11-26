"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ConversationTurn } from "../components/conversation";
import { useConversation } from "../hooks/use-conversation";

const suggestions = [
  {
    icon: "⌕",
    label: "Find tickets and procedures for VPN issues.",
    prompt: "Find tickets and procedures for VPN issues.",
  },
  {
    icon: "▤",
    label: "Suggest a category for an offline printer.",
    prompt: "Suggest a category for an offline printer.",
  },
  {
    icon: "↗",
    label: "Suggest next steps for a locked account.",
    prompt: "Suggest next steps for a locked account.",
  },
];

export default function Home() {
  const { turns, running, send, stop, reset } = useConversation();
  const [draft, setDraft] = useState("");
  const scroll = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (nearBottom.current && scroll.current)
      scroll.current.scrollTop = turns.length ? scroll.current.scrollHeight : 0;
  }, [turns]);
  useEffect(() => {
    function resize() {
      const element = textarea.current;
      if (element) {
        element.style.height = "auto";
        element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
      }
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draft]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (running || !draft.trim()) return;
    nearBottom.current = true;
    void send(draft);
    setDraft("");
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <button
          className="new-chat"
          onClick={() => {
            reset();
            setDraft("");
            nearBottom.current = true;
            textarea.current?.focus();
          }}
        >
          <span aria-hidden="true">＋</span> New chat
        </button>
      </header>
      <div
        ref={scroll}
        className="conversation-scroll"
        onScroll={(event) => {
          const element = event.currentTarget;
          nearBottom.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <
            100;
        }}
      >
        {turns.length === 0 ? (
          <section className="welcome">
            <h1>
              How can I help
              <br />
              with this ticket?
            </h1>
            <p className="welcome-description">
              Find answers, explore related cases, and discover
              <br className="desktop-break" /> the next step to resolve each
              ticket.
            </p>
            <div className="suggestions">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.prompt}
                  onClick={() => {
                    nearBottom.current = true;
                    void send(suggestion.prompt);
                  }}
                >
                  <span className="suggestion-icon" aria-hidden="true">
                    {suggestion.icon}
                  </span>
                  <span>{suggestion.label}</span>
                  <span className="suggestion-arrow" aria-hidden="true">
                    ↗
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <div className="conversation-column">
            {turns.map((turn) => (
              <ConversationTurn key={turn.id} turn={turn} />
            ))}
          </div>
        )}
      </div>
      <footer className="composer-area">
        <form className="composer" onSubmit={submit}>
          <label htmlFor="message" className="sr-only">
            Message
          </label>
          <textarea
            ref={textarea}
            id="message"
            rows={1}
            placeholder="Describe the issue or ask a question…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                submit();
              }
            }}
          />
          {running ? (
            <button
              type="button"
              className="send-button stop-button"
              onClick={stop}
            >
              <span aria-hidden="true">■</span> Stop
            </button>
          ) : (
            <button
              className="send-button"
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send message"
            >
              <span aria-hidden="true">↑</span>
            </button>
          )}
        </form>
        <p className="composer-note">
          Demo support data. Verify suggestions before taking action.
        </p>
      </footer>
    </main>
  );
}
