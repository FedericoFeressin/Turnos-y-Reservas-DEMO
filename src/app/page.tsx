const stages = [
  {
    id: "00",
    name: "Entorno",
    detail: "Node 24, pnpm, Next.js 16, Tailwind 4, TypeScript",
    state: "done",
  },
  {
    id: "01",
    name: "Análisis y planificación",
    detail: "Arquitectura, modelo de datos, MVP y roadmap",
    state: "done",
  },
  {
    id: "02",
    name: "Laboratorio visual",
    detail: "5 conceptos en baja fidelidad, comparador y tokens",
    state: "next",
  },
  {
    id: "03",
    name: "MVP",
    detail: "Base de datos, autenticación, panel y reservas",
    state: "pending",
  },
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-medium tracking-[0.2em] text-ink-muted uppercase">
        Booking System
      </p>

      <h1 className="mt-3 font-display text-4xl leading-tight font-semibold sm:text-5xl">
        Plataforma de turnos y reservas
      </h1>

      <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
        Plantilla comercializable para negocios de servicios. Este entorno está
        en la etapa de definición visual: todavía no hay producto funcional, a
        propósito.
      </p>

      <ol className="mt-10 space-y-1">
        {stages.map((stage) => (
          <li
            key={stage.id}
            className="flex items-start gap-4 rounded-lg border border-line bg-surface px-4 py-3"
          >
            <span className="mt-0.5 font-mono text-xs text-ink-muted">
              {stage.id}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{stage.name}</p>
              <p className="text-sm text-ink-muted">{stage.detail}</p>
            </div>
            <span
              className={
                stage.state === "done"
                  ? "rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
                  : stage.state === "next"
                    ? "rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    : "rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-muted"
              }
            >
              {stage.state === "done"
                ? "Completada"
                : stage.state === "next"
                  ? "Siguiente"
                  : "Pendiente"}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-sm text-ink-muted">
        Las decisiones técnicas y el plan completo están en{" "}
        <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">
          docs/README.md
        </code>
        .
      </p>
    </main>
  );
}
