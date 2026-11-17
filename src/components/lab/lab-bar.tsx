"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { conceptList, concepts, type ConceptId } from "@/lib/concepts";
import { cn } from "@/lib/utils";

const screens = [
  { key: "", label: "Inicio" },
  { key: "/servicios", label: "Servicios" },
  { key: "/equipo", label: "Equipo" },
  { key: "/reservar", label: "Reserva" },
  { key: "/confirmacion", label: "Confirmación" },
  { key: "/admin", label: "Panel" },
  { key: "/admin/calendario", label: "Calendario" },
];

export function LabBar({ current }: { current: ConceptId }) {
  const pathname = usePathname();
  const match = pathname.match(/^\/lab\/[^/]+(\/.*)?$/);
  const screen = match?.[1] ?? "";

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-neutral-950/95 text-neutral-200 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Link
            href="/"
            className="shrink-0 rounded-md border border-white/15 px-2 py-1 text-[11px] hover:bg-white/10"
          >
            Inicio
          </Link>
          <Link
            href="/lab"
            className="shrink-0 rounded-md border border-white/15 px-2 py-1 text-[11px] hover:bg-white/10"
          >
            ← Comparador
          </Link>
          <span className="hidden h-4 w-px shrink-0 bg-white/15 sm:block" />

          <div className="flex shrink-0 items-center gap-1">
            {conceptList.map((concept) => {
              const active = concept.id === current;
              return (
                <Link
                  key={concept.id}
                  href={`/lab/${concept.id}${screen}` as never}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-colors",
                    active
                      ? "bg-white text-neutral-900"
                      : "text-neutral-400 hover:bg-white/10 hover:text-white",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: concepts[concept.id].palette[2]?.hex }}
                  />
                  {concept.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto sm:ml-auto">
          {screens.map((item) => {
            const active = item.key === screen;
            return (
              <Link
                key={item.key}
                href={`/lab/${current}${item.key}` as never}
                className={cn(
                  "shrink-0 rounded px-2 py-1 text-[10.5px] transition-colors",
                  active
                    ? "bg-white/15 font-medium text-white"
                    : "text-neutral-400 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <span className="ml-1 hidden shrink-0 rounded border border-white/15 px-1.5 py-1 font-mono text-[9px] tracking-wider text-neutral-400 uppercase lg:block">
            L1 · demo
          </span>
        </div>
      </div>
    </div>
  );
}
