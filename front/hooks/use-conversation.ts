"use client";

import { useEffect, useRef, useState } from "react";
import { executeAgent } from "../lib/agent-stream";
import { applyEvent, finishTurn, type Turn } from "../lib/conversation";

export function useConversation() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const active = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      active.current?.abort();
    },
    [],
  );

  function stop() {
    active.current?.abort();
    active.current = null;
    setTurns((turns) =>
      turns.map((turn) =>
        turn.status === "running"
          ? finishTurn(turn, "Execution stopped.")
          : turn,
      ),
    );
  }

  function reset() {
    stop();
    setTurns([]);
  }

  async function send(value: string) {
    const message = value.trim();
    if (!message || active.current) return;
    const controller = new AbortController();
    active.current = controller;
    let turn: Turn = {
      id: crypto.randomUUID(),
      message,
      items: [],
      status: "running",
    };
    function update(updated: Turn) {
      turn = updated;
      setTurns((turns) =>
        turns.map((item) => (item.id === updated.id ? updated : item)),
      );
    }
    setTurns((turns) => [...turns, turn]);
    let error: string | undefined;
    try {
      await executeAgent(message, controller.signal, (event) => {
        if (active.current === controller) update(applyEvent(turn, event));
      });
    } catch {
      controller.abort();
      error = "Something went wrong. Please try again.";
    } finally {
      if (active.current === controller) {
        update(finishTurn(turn, error));
        active.current = null;
      }
    }
  }

  return {
    turns,
    send,
    stop,
    reset,
    running: turns.some((turn) => turn.status === "running"),
  };
}
