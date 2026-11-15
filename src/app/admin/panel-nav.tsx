"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Scissors,
  Settings,
  UserRound,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string | null;
  label: string;
  icon: typeof CalendarDays;
};

/**
 * Navegación del panel. Las secciones que todavía no existen se muestran
 * deshabilitadas para que el mapa del producto sea visible sin ofrecer enlaces
 * que terminen en 404.
 */
const items: NavItem[] = [
  { href: "/admin", label: "Agenda", icon: CalendarDays },
  { href: "/admin/servicios", label: "Servicios", icon: Scissors },
  { href: "/admin/equipo", label: "Equipo", icon: Users },
  { href: "/admin/clientes", label: "Clientes", icon: UserRound },
  { href: null, label: "Configuración", icon: Settings },
];

export function PanelNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Panel"
      className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-2"
    >
      {items.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : item.href !== null && pathname.startsWith(item.href);

        const className = cn(
          "inline-flex items-center gap-2 rounded-md px-3 py-2 text-[13px] whitespace-nowrap transition-colors",
          isActive
            ? "bg-primary/10 font-medium text-primary"
            : item.href
              ? "text-ink-muted hover:bg-surface-2 hover:text-ink"
              : "cursor-not-allowed text-ink-muted/50",
        );

        if (!item.href) {
          return (
            <span
              key={item.label}
              aria-disabled="true"
              title="Próximamente"
              className={className}
            >
              <item.icon className="size-4" strokeWidth={1.9} />
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={className}
          >
            <item.icon className="size-4" strokeWidth={1.9} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
