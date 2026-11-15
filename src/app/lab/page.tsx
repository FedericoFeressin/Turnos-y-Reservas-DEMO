import type { Metadata } from "next";
import Link from "next/link";

import { ConceptCard } from "@/components/lab/concept-card";
import { conceptList } from "@/lib/concepts";

export const metadata: Metadata = {
  title: "Laboratorio visual",
  robots: { index: false, follow: false },
};

const tasks = [
  "Reservá un corte para el jueves a la tarde con cualquier profesional.",
  "Cancelá el turno desde la pantalla de confirmación.",
  "Como dueño, mirá cuántos turnos hay mañana en el panel.",
];

export default function LabIndexPage() {
  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-200">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <header className="max-w-2xl">
          <p className="text-[11px] font-medium tracking-[0.24em] text-neutral-500 uppercase">
            Booking System · Etapa 2
          </p>
          <h1 className="mt-4 text-4xl leading-[1.05] font-semibold tracking-tight text-white sm:text-5xl">
            Cinco direcciones
            <br />
            visuales.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-neutral-400">
            Mismo producto, misma estructura, cinco identidades. Todos los
            conceptos usan los mismos componentes y cambian solo por tokens de
            diseño. Elegí uno y el resto queda como preset reutilizable para
            otros clientes.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-[11px] text-neutral-400">
            <span className="size-1.5 rounded-full bg-amber-400" />
            Fidelidad L1 · estructura real, interacción simulada, datos de demo
          </p>
        </header>

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          {conceptList.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} />
          ))}
        </section>

        <section className="mt-12 grid gap-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold text-white">Cómo mirarlo</h2>
            <ol className="mt-3 space-y-2 text-[13px] leading-relaxed text-neutral-400">
              {tasks.map((task, index) => (
                <li key={task} className="flex gap-2.5">
                  <span className="font-mono text-[11px] text-neutral-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {task}
                </li>
              ))}
            </ol>
          </div>
          <div className="text-[13px] leading-relaxed text-neutral-400">
            <h2 className="text-sm font-semibold text-white">Qué se evalúa</h2>
            <p className="mt-3">
              Primera impresión, claridad del horario elegido, sensación de
              confianza al confirmar y legibilidad del panel con datos densos.
              Probá cada concepto en 375 px: el flujo de reserva es móvil primero.
            </p>
            <p className="mt-3 text-neutral-500">
              Las imágenes son placeholders generados con los colores del tema.
              No condicionan el layout final.
            </p>
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 pt-5 text-[11px] text-neutral-500">
          <p>Laboratorio no indexable · no forma parte del producto final</p>
          <Link href="/" className="hover:text-neutral-300">
            Volver al estado del proyecto
          </Link>
        </footer>
      </div>
    </main>
  );
}
