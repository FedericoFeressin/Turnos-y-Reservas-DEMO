import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { canManage } from "@/lib/admin/guard";
import { listEmployees, listServices } from "@/lib/admin/queries";
import { getBusinessContext } from "@/lib/business";
import { cn } from "@/lib/utils";

import { toggleEmployeeAction } from "./actions";
import { EmployeeForm } from "./employee-form";

export const metadata: Metadata = {
  title: "Equipo",
};

const okMessages: Record<string, string> = {
  creado: "Profesional agregado.",
  actualizado: "Profesional actualizado.",
};

const errorMessages: Record<string, string> = {
  permiso: "Tu rol no permite modificar el equipo.",
  "no-encontrado": "Ese profesional ya no existe.",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string; ok?: string; error?: string }>;
}) {
  const { membership } = await getBusinessContext();

  if (!membership) return null;

  const { business } = membership;
  const { editar, ok, error } = await searchParams;

  const [employees, services] = await Promise.all([
    listEmployees(business.id),
    listServices(business.id),
  ]);

  const manageable = canManage(membership.role);

  const editing =
    editar && editar !== "nuevo"
      ? (employees.find((employee) => employee.id === editar) ?? null)
      : null;
  const showForm = manageable && (editar === "nuevo" || Boolean(editing));

  const serviceOptions = services.map((service) => ({
    id: service.id,
    name: service.name,
    isActive: service.isActive,
  }));

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
            Equipo
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Profesionales que reciben turnos y los servicios que puede realizar
            cada uno.
          </p>
        </div>

        {manageable && !showForm ? (
          <Link
            href="/admin/equipo?editar=nuevo"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Agregar profesional
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
            {editing ? "Editar profesional" : "Nuevo profesional"}
          </h2>
          <p className="mt-1 text-[12px] text-ink-muted">
            {editing
              ? "Los turnos ya agendados conservan los datos con los que se crearon."
              : "Después vas a poder cargar sus horarios de atención."}
          </p>
          <EmployeeForm
            key={editing?.id ?? "nuevo"}
            employee={editing}
            services={serviceOptions}
          />
        </section>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
            Profesionales
          </h2>
          <span className="text-[12px] text-ink-muted">
            {employees.length} {employees.length === 1 ? "persona" : "personas"}
          </span>
        </div>

        {employees.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-display text-xl font-semibold tracking-[var(--theme-tracking-display)]">
              Todavía no hay profesionales
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
              Agregá a la primera persona del equipo para que se le puedan
              asignar turnos.
            </p>
          </div>
        ) : (
          <ul>
            {employees.map((employee) => {
              const name =
                employee.displayName ?? `${employee.firstName} ${employee.lastName}`;
              const contact = employee.email ?? employee.phone;

              return (
                <li
                  key={employee.id}
                  className={cn(
                    "flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-5 py-4 last:border-b-0",
                    !employee.isActive && "opacity-60",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: employee.color }}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                      {name}
                      {!employee.isActive ? (
                        <Badge tone="neutral" size="sm">
                          Inactivo
                        </Badge>
                      ) : null}
                      {!employee.isBookable ? (
                        <Badge tone="outline" size="sm">
                          Sin turnos
                        </Badge>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      {[
                        employee.title,
                        contact,
                        `${employee.services.length} ${
                          employee.services.length === 1 ? "servicio" : "servicios"
                        }`,
                        `${employee._count.appointments} ${
                          employee._count.appointments === 1 ? "turno" : "turnos"
                        }`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {manageable ? (
                      <>
                        <Link
                          href={`/admin/equipo?editar=${employee.id}`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                          )}
                        >
                          Editar
                        </Link>
                        <form action={toggleEmployeeAction}>
                          <input type="hidden" name="id" value={employee.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-ink-muted"
                          >
                            {employee.isActive ? "Desactivar" : "Activar"}
                          </Button>
                        </form>
                      </>
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
