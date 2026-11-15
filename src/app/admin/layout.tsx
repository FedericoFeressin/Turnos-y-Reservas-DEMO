import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { getBusinessContext } from "@/lib/business";

import { signOutAction } from "./actions";
import { PanelNav } from "./panel-nav";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel" },
  robots: { index: false, follow: false },
};

const roleLabels = {
  OWNER: "Dueño",
  ADMIN: "Administrador",
  STAFF: "Personal",
} as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, membership } = await getBusinessContext();

  // Una cuenta autenticada sin membresía no puede operar ningún negocio.
  // Se resuelve acá y no en cada página del panel.
  if (!membership) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-5 py-12">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-2xl font-semibold tracking-[var(--theme-tracking-display)]">
            Tu cuenta no tiene un negocio asignado
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Pedile a un administrador que te invite o volvé a ingresar con otra
            cuenta.
          </p>
          <form action={signOutAction} className="mt-6">
            <Button type="submit" variant="outline">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </main>
    );
  }

  const { business } = membership;

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-[13px] focus:text-background"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-20 border-b border-line bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-[12px] font-bold text-primary-fg">
              {business.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] leading-tight font-semibold">
                {business.name}
              </p>
              <p className="text-[11px] text-ink-muted">Panel de gestión</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[13px] leading-tight font-medium text-ink">
                {session.user.name}
              </p>
              <p className="text-[11px] text-ink-muted">{roleLabels[membership.role]}</p>
            </div>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Salir
              </Button>
            </form>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <PanelNav />
        </div>
      </header>

      <main
        id="contenido"
        className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12"
      >
        {children}
      </main>
    </div>
  );
}
