export default function Home() {
  const foundations = [
    "Typed domain schemas",
    "Action state machine",
    "Intervention state machine",
    "Structured agent contracts",
    "Deterministic mock provider",
  ];

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-3xl rounded-[2rem] border border-emerald-950/10 bg-white/90 p-8 shadow-[0_24px_80px_rgba(20,83,45,0.12)] sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          OpenAI Build Week 2026
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">
          Time Sovereignty
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
          The deterministic foundation for an adaptive AI Chief of Staff is now
          under construction.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {foundations.map((foundation) => (
            <div
              key={foundation}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800"
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-emerald-500"
              />
              {foundation}
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-zinc-500">
          Phase 1 · mock-first · live GPT-5.6 validation pending API quota
        </p>
      </section>
    </main>
  );
}
