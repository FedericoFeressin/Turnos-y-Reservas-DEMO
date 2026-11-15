import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { canManage } from "@/lib/admin/guard";
import { listCustomers } from "@/lib/admin/queries";
import { getBusinessContext } from "@/lib/business";
import { formatShortDay } from "@/lib/date";
import { cn } from "@/lib/utils";

import { CustomerForm } from "./customer-form";

export const metadata: Metadata = {
  title: "Clientes",
};

const okMessages: Record<string, string> = {
  actualizado: "Cliente actualizado.",
};

const errorMessages: Record<string, string> = {
  permiso: "Tu rol no permite modificar clientes.",
};

function initials(firstName: string, lastName: string | null): string {
  return `${firstName.charAt(0)}${lastName?.charAt(0) ?? ""}`.toUpperCase();
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    editar?: string;
    ok?: string;
    error?: string;
  }>;
}) {
  const { membership } = await getBusinessContext();

  if (!membership) return null;

  const { business } = membership;
  const { q = "", editar, ok, error } = await searchParams;

  const search = q.trim();
  const customers = await listCustomers(business.id, search);
  const manageable = canManage(membership.role);

  const editing =
    editar && editar !== "nuevo"
      ? (customers.find((customer) => customer.id === editar) ?? null)
      : null;
  const showForm = manageable && (editar === "nuevo" || Boolean(editing));

  const suffix = search ? `&q=${encodeURIComponent(search)}` : "";
  const okMessage = ok ? okMessages[ok] : undefined;
  const errorMessage = error ? errorMessages[error] : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
            CRM
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
            Clientes
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Quiénes reservan, con su contacto, preferencias e historial de
            turnos.
          </p>
        </div>

        {manageable && !showForm ? (
          <Link
            href={`/admin/clientes?editar=nuevo${suffix}`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Nuevo cliente
          </Link>
        ) : null}
      </div>

      {okMessage ? (
        <p
          role="status"
          className="mt-6 rounded-md border border-success/30 bg-success/5 px-3 py-2 text-[13px] text-success"
        >
          {okMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger"
        >
          {errorMessage}
        </p>
      ) : null}

      <form
        action="/admin/clientes"
        method="get"
        role="search"
        className="mt-6 flex flex-wrap items-center gap-2"
      >
        <label htmlFor="customer-search" className="sr-only">
          Buscar clientes
        </label>
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            id="customer-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Nombre, email o teléfono"
            className={cn(controlClass, "h-10 pl-9")}
          />
        </div>
        <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
          Buscar
        </button>
        {search ? (
          <Link
            href="/admin/clientes"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Limpiar
          </Link>
        ) : null}
      </form>

      {showForm ? (
        <section className="mt-6 rounded-lg border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-xl leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
            {editing ? "Editar cliente" : "Nuevo cliente"}
          </h2>
          <p className="mt-1 text-[12px] text-ink-muted">
            {editing
              ? "Los turnos ya agendados conservan los datos con los que se crearon."
              : "El teléfono identifica al cliente: si ya existe, conviene editarlo en lugar de duplicarlo."}
          </p>
          <CustomerForm key={editing?.id ?? "nuevo"} customer={editing} />
        </section>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
            {search ? "Resultados" : "Directorio"}
          </h2>
          <span className="text-[12px] text-ink-muted">
            {customers.length}{" "}
            {customers.length === 1 ? "cliente" : "clientes"}
          </span>
        </div>

        {customers.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-display text-xl font-semibold tracking-[var(--theme-tracking-display)]">
              {search ? "Sin coincidencias" : "Todavía no hay clientes"}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
              {search
                ? `Ningún cliente coincide con “${search}”. Probá con otro nombre, email o teléfono.`
                : "Cargá al primer cliente o esperá la primera reserva pública: se crea automáticamente."}
            </p>
          </div>
        ) : (
          <ul>
            {customers.map((customer) => {
              const name =
                `${customer.firstName} ${customer.lastName ?? ""}`.trim();
              const lastVisit = customer.appointments[0];

              return (
                <li
                  key={customer.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-5 py-4 last:border-b-0"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-[12px] font-semibold text-ink-muted"
                  >
                    {initials(customer.firstName, customer.lastName)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                      <Link
                        href={`/admin/clientes/${customer.id}`}
                        className="hover:underline underline-offset-4"
                      >
                        {name}
                      </Link>
                      {customer.isBlocked ? (
                        <Badge tone="danger" size="sm">
                          Bloqueado
                        </Badge>
                      ) : null}
                      {customer.tags.map((tag) => (
                        <Badge key={tag} tone="outline" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      {[customer.phone, customer.email].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[12px] text-ink tabular-nums">
                      {customer._count.appointments}{" "}
                      {customer._count.appointments === 1 ? "turno" : "turnos"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      {lastVisit
                        ? `Último ${formatShortDay(lastVisit.startsAt, business.timezone)}`
                        : "Sin turnos"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/clientes/${customer.id}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                      )}
                    >
                      Ver ficha
                    </Link>
                    {manageable ? (
                      <Link
                        href={`/admin/clientes?editar=${customer.id}${suffix}`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                        )}
                      >
                        Editar
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
