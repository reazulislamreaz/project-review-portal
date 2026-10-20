"use client";

import { useEffect, useState } from "react";

type HealthResponse = {
  success: boolean;
  message: string;
};

type HealthState =
  | { status: "loading" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function Home() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/health`);
        const data = (await response.json()) as HealthResponse;

        if (cancelled) {
          return;
        }

        if (!response.ok || !data.success) {
          setHealth({
            status: "error",
            message: data.message || `Request failed with status ${response.status}`,
          });
          return;
        }

        setHealth({ status: "ok", message: data.message });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setHealth({
          status: "error",
          message: error instanceof Error ? error.message : "Unable to reach the API",
        });
      }
    }

    void checkHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Project Submission Dashboard
        </h1>
        <p className="text-zinc-600">
          Frontend and backend are running together in this monorepo.
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Backend health
        </h2>
        <p className="mt-2 text-sm text-zinc-500">API: {apiBaseUrl}</p>
        <p className="mt-4 text-base text-zinc-900">
          {health.status === "loading" && "Checking backend..."}
          {health.status === "ok" && `Connected: ${health.message}`}
          {health.status === "error" && `Unavailable: ${health.message}`}
        </p>
      </section>
    </main>
  );
}
