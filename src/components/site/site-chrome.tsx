"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { business } from "@/lib/demo-data";
import type { Concept } from "@/lib/concepts";
import { cn } from "@/lib/utils";

const links = [
  { href: "", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/equipo", label: "Equipo" },
];

export function SiteHeader({ concept }: { concept: Concept }) {
  const pathname = usePathname();
  const base = `/lab/${concept.id}`;
  const pill = concept.layout.shape === "pill";
  const floating = concept.layout.nav === "floating";

  return (
    <header
      className={cn(
        "sticky top-0 z-30",
        floating ? "px-3 pt-3 sm:px-5 sm:pt-5" : "border-b border-line",
      )}
    >
      <div
        className={cn(
          "bg-background/85 backdrop-blur-md",
          floating
            ? "mx-auto flex w-full max-w-6xl items-center justify-between gap-6 rounded-full border border-line px-4 py-2.5 shadow-card sm:px-6"
            : "mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-8",
        )}
      >
        <Link
          href={base}
          className="font-display text-[17px] leading-none font-semibold tracking-[var(--theme-tracking-display)]"
        >
          {business.shortName}
          <span className="ml-1.5 align-super text-[9px] font-normal tracking-[0.18em] text-ink-muted uppercase">
            bs as
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] sm:flex" aria-label="Principal">
          {links.map((link) => {
            const href = `${base}${link.href}`;
            const active = pathname === href;
            return (
              <Link
                key={link.href}
                href={href}
                className={cn(
                  "relative py-1 transition-colors",
                  active ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
                {active ? (
                  <span className="absolute inset-x-0 -bottom-0.5 h-px bg-primary" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={`${base}/reservar`}
            className={cn(buttonVariants({ size: "sm", shape: pill ? "pill" : "default" }))}
          >
            Reservar turno
          </Link>
          <button
            type="button"
            aria-label="Abrir menú"
            className="grid size-9 place-items-center rounded-md text-ink-muted hover:bg-surface-2 sm:hidden"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ concept }: { concept: Concept }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="font-display text-lg font-semibold tracking-[var(--theme-tracking-display)]">
            {business.name}
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
            {business.description}
          </p>
        </div>

        <div className="text-sm">
          <p className="mb-3 text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
            Dónde
          </p>
          <p>{business.address}</p>
          <p className="mt-1 text-ink-muted">{business.phone}</p>
          <p className="mt-1 text-ink-muted">{business.instagram}</p>
        </div>

        <div className="text-sm">
          <p className="mb-3 text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
            Horarios
          </p>
          {business.hours.map((h) => (
            <p key={h.label} className="mt-1 flex justify-between gap-4">
              <span className="text-ink-muted">{h.label}</span>
              <span>{h.value}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-4 text-[11px] text-ink-muted sm:px-8">
          <p>
            © {new Date().getFullYear()} {business.name} · Demo del concepto{" "}
            {concept.name}
          </p>
          <p className="font-mono tracking-[0.14em] uppercase">booking system</p>
        </div>
      </div>
    </footer>
  );
}
