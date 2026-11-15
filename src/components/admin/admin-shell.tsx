"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  Scissors,
  UserRound,
  Users,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { business } from "@/lib/demo-data";
import type { Concept } from "@/lib/concepts";
import { cn } from "@/lib/utils";

const nav = [
  { key: "dashboard", label: "Panel", icon: LayoutDashboard, href: "" },
  { key: "turnos", label: "Turnos", icon: CalendarDays, href: "/calendario" },
  { key: "servicios", label: "Servicios", icon: Scissors, href: null },
  { key: "equipo", label: "Equipo", icon: Users, href: null },
  { key: "clientes", label: "Clientes", icon: UserRound, href: null },
  { key: "config", label: "Configuración", icon: Settings, href: null },
] as const;

export function AdminShell({
  concept,
  active,
  title,
  description,
  children,
  action,
}: {
  concept: Concept;
  active: "dashboard" | "turnos";
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = `/lab/${concept.id}/admin`;
  const pill = concept.layout.shape === "pill";

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-line bg-surface lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-line px-5">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-fg">
            N
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-[13px] leading-tight font-semibold">
              {business.name}
            </p>
            <p className="text-[10px] text-ink-muted">Panel de gestión</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-3" aria-label="Panel">
          {nav.map((item) => {
            const isActive = item.key === active;
            const href = item.href !== null ? `${base}${item.href}` : null;
            const className = cn(
              "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
              isActive
                ? "bg-primary/10 font-medium text-primary"
                : href
                  ? "text-ink-muted hover:bg-surface-2 hover:text-ink"
                  : "cursor-default text-ink-muted/60",
            );

            return href ? (
              <Link key={item.key} href={href} className={className}>
                <item.icon className="size-4" strokeWidth={1.9} />
                {item.label}
              </Link>
            ) : (
              <span key={item.key} className={className} title="Disponible en la Etapa 3">
                <item.icon className="size-4" strokeWidth={1.9} />
                {item.label}
              </span>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <span className="grid size-8 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold">
              TH
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium">Tomás Herrera</p>
              <p className="text-[10px] text-ink-muted">Propietario</p>
            </div>
            <ChevronDown className="size-3.5 text-ink-muted" />
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-background/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            aria-label="Abrir menú"
            className="grid size-9 place-items-center rounded-md border border-line text-ink-muted lg:hidden"
          >
            <Menu className="size-4" />
          </button>

          <div className="hidden flex-1 items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 sm:flex sm:max-w-xs">
            <Search className="size-3.5 text-ink-muted" />
            <span className="text-[12px] text-ink-muted">Buscar cliente o turno…</span>
            <span className="ml-auto rounded border border-line px-1 font-mono text-[9px] text-ink-muted">
              ⌘K
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[11px] text-ink-muted sm:block">
              {pathname.startsWith(`${base}/calendario`) ? "Agenda" : "Resumen del día"}
            </span>
            <button
              type="button"
              className={cn(buttonVariants({ size: "sm", shape: pill ? "pill" : "default" }))}
            >
              <Plus className="size-3.5" />
              Nuevo turno
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
                {title}
              </h1>
              {description ? (
                <p className="mt-1 text-[13px] text-ink-muted">{description}</p>
              ) : null}
            </div>
            {action}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
