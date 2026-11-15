import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { canManage } from "@/lib/admin/guard";
import { getCustomer } from "@/lib/admin/queries";
import { appointmentStatusMeta } from "@/lib/appointments";
import { getBusinessContext } from "@/lib/business";
import {
  formatDateOnly,
  formatHistoryDate,
  formatPrice,
  formatTime,
} from "@/lib/date";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ficha de cliente",
};

const okMessages: Record<string, string> = {
  creado: "Cliente creado.",
  actualizado: "Cliente actualizado.",
};

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { membership } = await getBusinessContext();

  if (!membership) return null;

  const { business } = membership;
  const { id } = await params;
  const { ok } = await searchParams;

  const customer = await getCustomer(business.id, id);

  if (!customer) {
    notFound();
  }

  const manageable = canManage(membership.role);
  const now = new Date();

  const completed = customer.appointments.filter(
    (appointment) => appointment.status === "COMPLETED",
  );
  const cancelled = customer.appointments.filter(
    (appointment) => appointment.status === "CANCELLED",
  );
  const noShows = customer.appointments.filter(
    (appointment) => appointment.status === "NO_SHOW",
  );

  // El historial viene del más nuevo al más viejo: el próximo turno es el
  // último que todavía cae en el futuro.
  const nextAppointment = customer.appointments
    .filter(
      (appointment) =>
        appointment.startsAt >= now &&
        (appointment.status === "PENDING" ||
          appointment.status === "CONFIRMED"),
    )
    .at(-1);

  const spent = completed.reduce(
    (total, appointment) => total + appointment.priceCents,
    0,
  );

  const fullName =
    `${customer.firstName} ${customer.lastName ?? ""}`.trim();
  const okMessage = ok ? okMessages[ok] : undefined;

  return (
    <div>
      <Link
        href="/admin/clientes"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-3")}
      >
        <ArrowLeft className="size-4" />
        Clientes
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
            Ficha de cliente
          </p>
          <h1 className="mt-2 flex flex-wrap items-center gap-2 font-display text-3xl leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
            {fullName}
            {customer.isBlocked ? (
              <Badge tone="danger" size="sm">
                Bloqueado
              </Badge>
            ) : null}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Cliente desde{" "}
            {formatHistoryDate(customer.createdAt, business.timezone)} ·{" "}
            {customer.phone}
          </p>
        </div>

        {manageable ? (
          <Link
            href={`/admin/clientes?editar=${customer.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Editar cliente
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

      <section
        aria-label="Resumen del cliente"
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          {
            label: "Turnos",
            value: String(customer.appointments.length),
            hint: `${completed.length} completados`,
          },
          {
            label: "Cancelados",
            value: String(cancelled.length + noShows.length),
            hint: `${noShows.length} ausencias`,
          },
          {
            label: "Gastado",
            value: formatPrice(spent, business.currency, business.locale),
            hint: "Solo turnos completados",
          },
          {
            label: "Próximo turno",
            value: nextAppointment
              ? formatHistoryDate(nextAppointment.startsAt, business.timezone)
              : "—",
            hint: nextAppointment
              ? `${formatTime(nextAppointment.startsAt, business.timezone)} · ${nextAppointment.service.name}`
              : "Sin reservas futuras",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-line bg-surface p-5">
            <p className="text-[11px] font-medium tracking-[0.18em] text-ink-muted uppercase">
              {item.label}
            </p>
            <p className="mt-3 font-display text-2xl leading-none font-semibold tabular-nums">
              {item.value}
            </p>
            <p className="mt-2 text-[12px] text-ink-muted">{item.hint}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="order-2 overflow-hidden rounded-lg border border-line bg-surface lg:order-1">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-lg leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
              Historial de turnos
            </h2>
            <span className="text-[12px] text-ink-muted">
              {customer.appointments.length}{" "}
              {customer.appointments.length === 1 ? "turno" : "turnos"}
            </span>
          </div>

          {customer.appointments.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="font-display text-xl font-semibold tracking-[var(--theme-tracking-display)]">
                Todavía no tiene turnos
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
                Cuando reserve, el turno va a aparecer acá con su servicio,
                profesional y estado.
              </p>
            </div>
          ) : (
            <ol>
              {customer.appointments.map((appointment) => {
                const meta = appointmentStatusMeta[appointment.status];
                const isCancelled = appointment.status === "CANCELLED";
                const employee =
                  appointment.employee.displayName ??
                  `${appointment.employee.firstName} ${appointment.employee.lastName}`;

                return (
                  <li
                    key={appointment.id}
                    className={cn(
                      "flex flex-wrap items-start gap-x-4 gap-y-3 border-b border-line px-5 py-4 last:border-b-0",
                      isCancelled && "opacity-55",
                    )}
                  >
                    <div className="w-28 shrink-0">
                      <p className="text-[13px] font-medium text-ink">
                        {formatHistoryDate(
                          appointment.startsAt,
                          business.timezone,
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-muted tabular-nums">
                        {formatTime(appointment.startsAt, business.timezone)}–
                        {formatTime(appointment.endsAt, business.timezone)}
                      </p>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">
                        {appointment.service.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-muted">
                        <span
                          aria-hidden="true"
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: appointment.employee.color }}
                        />
                        {employee} · {appointment.durationMinutes} min
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-ink-muted tabular-nums">
                        {formatPrice(
                          appointment.priceCents,
                          appointment.currency,
                          business.locale,
                        )}
                      </span>
                      <Badge tone={meta.tone} size="sm">
                        {meta.label}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <aside className="order-1 space-y-4 lg:order-2">
          <section className="rounded-lg border border-line bg-surface p-5">
            <h2 className="font-display text-base leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
              Contacto
            </h2>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              <div>
                <dt className="text-[11px] text-ink-muted uppercase tracking-wide">
                  Teléfono
                </dt>
                <dd className="text-ink">{customer.phone}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-ink-muted uppercase tracking-wide">
                  Email
                </dt>
                <dd className="text-ink">{customer.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-ink-muted uppercase tracking-wide">
                  Nacimiento
                </dt>
                <dd className="text-ink">
                  {customer.birthDate
                    ? formatDateOnly(customer.birthDate)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-ink-muted uppercase tracking-wide">
                  Promociones
                </dt>
                <dd className="text-ink">
                  {customer.marketingOptIn ? "Acepta" : "No acepta"}
                </dd>
              </div>
            </dl>
          </section>

          {customer.tags.length > 0 ? (
            <section className="rounded-lg border border-line bg-surface p-5">
              <h2 className="font-display text-base leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
                Etiquetas
              </h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {customer.tags.map((tag) => (
                  <Badge key={tag} tone="outline" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}

          {customer.notes ? (
            <section className="rounded-lg border border-line bg-surface p-5">
              <h2 className="font-display text-base leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
                Notas
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line text-ink-muted">
                {customer.notes}
              </p>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
