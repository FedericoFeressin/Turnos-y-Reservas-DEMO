import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { canManage } from "@/lib/admin/guard";
import { listServices } from "@/lib/admin/queries";
import { getBusinessContext } from "@/lib/business";
import { formatPrice } from "@/lib/date";
import { cn } from "@/lib/utils";

import { toggleServiceAction } from "./actions";
import { ServiceForm } from "./service-form";

export const metadata: Metadata = {
  title: "Servicios",
};

const okMessages: Record<string, string> = {
  creado: "Servicio creado.",
  actualizado: "Servicio actualizado.",
};

const errorMessages: Record<string, string> = {
  permiso: "Tu rol no permite modificar el catálogo.",
  "no-encontrado": "Ese servicio ya no existe.",
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string; ok?: string; error?: string }>;
}) {
  const { membership } = await getBusinessContext();

  if (!membership) return null;

  const { business } = membership;
  const { editar, ok, error } = await searchParams;

  const services = await listServices(business.id);
  const manageable = canManage(membership.role);

  const editing =
    editar && editar !== "nuevo"
      ? (services.find((service) => service.id === editar) ?? null)
      : null;
  const showForm = manageable && (editar === "nuevo" || Boolean(editing));

  const okMessage = ok ? okMessages[ok] : undefined;
  const errorMessage = error ? errorMessages[error] : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
            Catálogo
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
            Servicios
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Lo que el negocio ofrece al reservar, con precio, duración y margen
            entre turnos.
          </p>
        </div>

        {manageable && !showForm ? (
          <Link
            href="/admin/servicios?editar=nuevo"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Nuevo servicio
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

      {showForm ? (
        <section className="mt-6 rounded-lg border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-xl leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
            {editing ? "Editar servicio" : "Nuevo servicio"}
          </h2>
          <p className="mt-1 text-[12px] text-ink-muted">
            {editing
              ? "Los turnos ya agendados conservan el precio y la duración originales."
              : "El servicio queda disponible para asignarlo al equipo."}
          </p>
          <ServiceForm key={editing?.id ?? "nuevo"} service={editing} />
        </section>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
            Catálogo
          </h2>
          <span className="text-[12px] text-ink-muted">
            {services.length} {services.length === 1 ? "servicio" : "servicios"}
          </span>
        </div>

        {services.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-display text-xl font-semibold tracking-[var(--theme-tracking-display)]">
              Todavía no hay servicios
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
              Creá el primero para que el equipo pueda asignárselo y aparezca en
              la reserva pública.
            </p>
          </div>
        ) : (
          <ul>
            {services.map((service) => (
              <li
                key={service.id}
                className={cn(
                  "flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-5 py-4 last:border-b-0",
                  !service.isActive && "opacity-60",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                    {service.name}
                    {!service.isActive ? (
                      <Badge tone="neutral" size="sm">
                        Inactivo
                      </Badge>
                    ) : null}
                    {!service.isPublic ? (
                      <Badge tone="outline" size="sm">
                        Oculto
                      </Badge>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-muted">
                    {[
                      service.category,
                      `${service.durationMinutes} min`,
                      service.bufferAfterMinutes > 0
                        ? `+${service.bufferAfterMinutes} min de margen`
                        : null,
                      `${service._count.employees} ${
                        service._count.employees === 1 ? "profesional" : "profesionales"
                      }`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <p className="font-display text-base font-semibold tabular-nums">
                  {formatPrice(service.priceCents, business.currency, business.locale)}
                </p>

                <div className="flex items-center gap-1">
                  {manageable ? (
                    <>
                      <Link
                        href={`/admin/servicios?editar=${service.id}`}
                        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                      >
                        Editar
                      </Link>
                      <form action={toggleServiceAction}>
                        <input type="hidden" name="id" value={service.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-ink-muted"
                        >
                          {service.isActive ? "Desactivar" : "Activar"}
                        </Button>
                      </form>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
