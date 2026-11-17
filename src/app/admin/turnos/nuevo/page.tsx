import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { manualBookingSettings } from "@/lib/admin/manual-booking";
import { getManualBookingCatalog } from "@/lib/admin/queries";
import { getBusinessContext } from "@/lib/business";
import { groupSlots, slotsForDate, type Slot } from "@/lib/booking/availability";
import { getAvailabilitySource } from "@/lib/booking/public";
import {
  formatPrice,
  isValidDateKey,
  todayKey,
} from "@/lib/date";
import { cn } from "@/lib/utils";

import { ManualBookingForm } from "./manual-booking-form";

export const metadata: Metadata = {
  title: "Nuevo turno",
};

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{
    servicio?: string;
    profesional?: string;
    fecha?: string;
  }>;
}) {
  const { membership } = await getBusinessContext();
  if (!membership) return null;

  const { business } = membership;
  const params = await searchParams;
  const catalog = await getManualBookingCatalog(business.id);
  const today = todayKey(business.timezone);

  const service =
    catalog.services.find((item) => item.id === params.servicio) ??
    catalog.services[0] ??
    null;

  const eligibleEmployees = service
    ? catalog.employees.filter((employee) =>
        employee.serviceIds.includes(service.id),
      )
    : [];
  const employee =
    eligibleEmployees.find((item) => item.id === params.profesional) ??
    eligibleEmployees[0] ??
    null;

  const dateKey =
    params.fecha && isValidDateKey(params.fecha) ? params.fecha : today;

  let slots: Slot[] = [];
  let note = "";

  if (!service) {
    note = "No hay servicios activos. Cargá uno en Servicios para crear turnos.";
  } else if (!employee) {
    note = "Ese servicio no tiene profesionales asignados. Revisá el equipo.";
  } else {
    const source = await getAvailabilitySource({
      businessId: business.id,
      employeeIds: [employee.id],
      fromKey: dateKey,
      days: 1,
      timezone: business.timezone,
      settings: manualBookingSettings(catalog.settings),
    });

    slots = slotsForDate(source, dateKey, service, employee.id);

    if (slots.length === 0) {
      if (source.holidays.some((holiday) => holiday.dateKey === dateKey && holiday.isClosed)) {
        note = "El negocio está cerrado por feriado ese día.";
      } else if (dateKey < source.todayKey) {
        note = "Esa fecha ya pasó. Elegí otro día.";
      } else {
        note = "No hay horarios libres para ese profesional en esa fecha. Probá con otro día o profesional.";
      }
    }
  }

  const slotGroups = groupSlots(slots);
  const clientRequestId = randomUUID();

  return (
    <div>
      <Link
        href="/admin/turnos"
        className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted hover:text-ink"
      >
        <ChevronLeft className="size-3.5" />
        Volver a la agenda
      </Link>

      <h1 className="mt-4 font-display text-3xl leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
        Nuevo turno
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Elegí servicio, profesional y horario; el alta confirma el turno y deja constancia en el historial.
      </p>

      <form
        method="get"
        className="mt-8 grid gap-4 rounded-lg border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <label htmlFor="filtro-servicio" className="mb-1.5 block text-[12px] font-medium">
            Servicio
          </label>
          <select
            id="filtro-servicio"
            name="servicio"
            defaultValue={service?.id ?? ""}
            className={cn(controlClass, "h-10")}
          >
            {catalog.services.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-profesional" className="mb-1.5 block text-[12px] font-medium">
            Profesional
          </label>
          <select
            id="filtro-profesional"
            name="profesional"
            defaultValue={employee?.id ?? ""}
            className={cn(controlClass, "h-10")}
          >
            {eligibleEmployees.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-fecha" className="mb-1.5 block text-[12px] font-medium">
            Fecha
          </label>
          <input
            id="filtro-fecha"
            type="date"
            name="fecha"
            min={today}
            defaultValue={dateKey}
            className={cn(controlClass, "h-10")}
          />
        </div>

        <div className="flex items-end">
          <Button type="submit" variant="outline" className="w-full">
            Ver horarios
          </Button>
        </div>
      </form>

      {note ? (
        <p
          role="status"
          className="mt-6 rounded-md border border-line bg-surface px-4 py-3 text-[13px] text-ink-muted"
        >
          {note}
        </p>
      ) : null}

      {service && employee && slots.length > 0 ? (
        <div className="mt-6 rounded-lg border border-line bg-surface p-5">
          <div className="border-b border-line pb-4">
            <p className="text-[11px] font-medium tracking-[0.18em] text-ink-muted uppercase">
              {service.name} · {employee.name}
            </p>
            <p className="mt-1 text-[12px] text-ink-muted">
              {service.durationMinutes} min ·{" "}
              {formatPrice(service.priceCents, business.currency, business.locale)}
            </p>
          </div>

          <ManualBookingForm
            key={`${service.id}-${employee.id}-${dateKey}-${clientRequestId}`}
            serviceId={service.id}
            employeeId={employee.id}
            dateKey={dateKey}
            slotGroups={slotGroups}
            customers={catalog.customers.map((customer) => ({
              id: customer.id,
              firstName: customer.firstName,
              lastName: customer.lastName ?? "",
              phone: customer.phone,
            }))}
            clientRequestId={clientRequestId}
          />
        </div>
      ) : null}

      <Link
        href="/admin/turnos"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-6")}
      >
        Cancelar
      </Link>
    </div>
  );
}
