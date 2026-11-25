"use client";

import { useEffect, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function Home() {
  const [status, setStatus] = useState("Verificando conexão com a API…");

  useEffect(() => {
    const controller = new AbortController();

    async function checkApi() {
      try {
        const response = await fetch(`${apiUrl}/health`, {
          signal: controller.signal,
        });
        setStatus(response.ok ? "API conectada." : "API indisponível.");
      } catch {
        if (!controller.signal.aborted) {
          setStatus("API indisponível.");
        }
      }
    }

    void checkApi();
    return () => controller.abort();
  }, []);

  return (
    <main>
      <h1>Praxis</h1>
      <p role="status">{status}</p>
    </main>
  );
}
