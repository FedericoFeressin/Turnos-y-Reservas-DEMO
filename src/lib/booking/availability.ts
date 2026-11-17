import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

import { dayBounds } from "@/lib/date";

/**
 * Disponibilidad real de la barbería.
 *
 * Este módulo es puro: recibe los datos ya consultados y devuelve horarios.
 * No conoce `DEMO_NOW`, no tiene horarios fijos y no consulta la base. Así la
 * misma función se usa para pintar el calendario y para validar el Server
 * Action Justo antes de insertar el turno.
 */

export type BookingSettings = {
  slotGranularityMinutes: number;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  allowChooseAnyStaff: boolean;
  showStaffSelection: boolean;
  showPrices: boolean;
  requireManualConfirmation: boolean;
  bookingPolicyText: string | null;
  cancellationPolicyText: string | null;
};

export type ScheduleRange = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};

export type EmployeeRange = ScheduleRange & { employeeId: string };

export type AvailabilitySource = {
  now: Date;
  todayKey: string;
  timezone: string;
  settings: BookingSettings;
  businessRanges: ScheduleRange[];
  employeeRanges: EmployeeRange[];
  employeesWithOwnSchedule: string[];
  timeOff: { employeeId: string | null; startsAt: Date; endsAt: Date }[];
  holidays: { dateKey: string; name: string; isClosed: boolean }[];
  appointments: { employeeId: string; startsAt: Date; blockedUntil: Date }[];
};

export type ServiceDuration = {
  durationMinutes: number;
  bufferAfterMinutes: number;
};

export type Slot = { time: string; minutes: number };

export type DayAvailability = {
  dateKey: string;
  count: number;
  closed: boolean;
  selectable: boolean;
};

export const ANY_STAFF = "any";

/** Minutos desde medianoche → `HH:mm`. */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

/** `HH:mm` → minutos desde medianoche. Devuelve null si no es válido. */
export function timeToMinutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Instante real de `fecha` + `hora` en la zona del negocio. */
export function zonedDateTime(
  dateKey: string,
  time: string,
  timezone: string,
): Date | null {
  const minutes = timeToMinutes(time);
  if (minutes === null || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;

  const local = `${dateKey}T${minutesToTime(minutes)}:00`;
  const date = fromZonedTime(local, timezone);
  if (Number.isNaN(date.getTime())) return null;

  // En horarios de verano inexistentes, date-fns desplaza la hora. No queremos
  // reservar un turno que el cliente vería a otra hora.
  if (formatInTimeZone(date, timezone, "HH:mm") !== minutesToTime(minutes)) {
    return null;
  }

  return date;
}

export function isDateWithinWindow(
  source: AvailabilitySource,
  dateKey: string,
): boolean {
  if (dateKey < source.todayKey) return false;
  const lastKey = shift(source.todayKey, source.settings.maxAdvanceDays);
  return dateKey <= lastKey;
}

function shift(dateKey: string, days: number): string {
  const noon = new Date(`${dateKey}T12:00:00Z`);
  noon.setUTCDate(noon.getUTCDate() + days);
  return noon.toISOString().slice(0, 10);
}

export function holidayFor(source: AvailabilitySource, dateKey: string) {
  return source.holidays.find((holiday) => holiday.dateKey === dateKey) ?? null;
}

export function isClosedDay(source: AvailabilitySource, dateKey: string): boolean {
  return holidayFor(source, dateKey)?.isClosed === true;
}

/**
 * Un profesional con filas propias ese día usa las suyas. Si no tiene ninguna
 * fila en toda la semana, hereda el horario general del negocio.
 *
 * Esto respeta el caso sembrado: Sofía tiene horario propio de lunes a martes y
 * de jueves a domingo, así que el miércoles no atiende aunque el negocio abra.
 */
export function rangesForEmployee(
  source: AvailabilitySource,
  employeeId: string,
  dayOfWeek: number,
): { startMinute: number; endMinute: number }[] {
  const own = source.employeeRanges.filter(
    (range) => range.employeeId === employeeId && range.dayOfWeek === dayOfWeek,
  );

  if (own.length > 0) {
    return own.map(({ startMinute, endMinute }) => ({ startMinute, endMinute }));
  }

  if (source.employeesWithOwnSchedule.includes(employeeId)) return [];

  return source.businessRanges
    .filter((range) => range.dayOfWeek === dayOfWeek)
    .map(({ startMinute, endMinute }) => ({ startMinute, endMinute }));
}

function isoDayOfWeek(dateKey: string): number {
  const day = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

function overlaps(
  ranges: { start: number; end: number }[],
  start: number,
  end: number,
): boolean {
  return ranges.some((range) => start < range.end && end > range.start);
}

/** Minutos transcurridos desde la medianoche local del día consultado. */
function offsetMinutes(date: Date, dayStart: Date): number {
  return Math.round((date.getTime() - dayStart.getTime()) / 60_000);
}

function busyRanges(
  source: AvailabilitySource,
  employeeId: string,
  dateKey: string,
): { start: number; end: number }[] {
  const { start: dayStart, end: dayEnd } = dayBounds(dateKey, source.timezone);

  return source.appointments
    .filter(
      (appointment) =>
        appointment.employeeId === employeeId &&
        appointment.startsAt < dayEnd &&
        appointment.blockedUntil > dayStart,
    )
    .map((appointment) => ({
      start: offsetMinutes(appointment.startsAt, dayStart),
      end: offsetMinutes(appointment.blockedUntil, dayStart),
    }));
}

function isOnTimeOff(
  source: AvailabilitySource,
  employeeId: string,
  dateKey: string,
): boolean {
  const { start: dayStart, end: dayEnd } = dayBounds(dateKey, source.timezone);

  return source.timeOff.some(
    (absence) =>
      (absence.employeeId === null || absence.employeeId === employeeId) &&
      absence.startsAt < dayEnd &&
      absence.endsAt > dayStart,
  );
}

/**
 * Horarios libres de un profesional para un día y un servicio.
 *
 * Se descartan los turnos cancelados antes de llegar acá (los consulta el
 * loader) y se bloquea el margen posterior del servicio (`blockedUntil`).
 */
export function slotsForDate(
  source: AvailabilitySource,
  dateKey: string,
  service: ServiceDuration,
  employeeId: string,
): Slot[] {
  if (!isDateWithinWindow(source, dateKey) || isClosedDay(source, dateKey)) {
    return [];
  }
  if (isOnTimeOff(source, employeeId, dateKey)) return [];

  const { start: dayStart } = dayBounds(dateKey, source.timezone);
  const ranges = rangesForEmployee(source, employeeId, isoDayOfWeek(dateKey));
  const busy = busyRanges(source, employeeId, dateKey);
  const total = service.durationMinutes + service.bufferAfterMinutes;
  const step = source.settings.slotGranularityMinutes > 0
    ? source.settings.slotGranularityMinutes
    : 15;
  const earliest = source.now.getTime() + source.settings.minAdvanceMinutes * 60_000;

  const minutes = new Set<number>();

  for (const range of ranges) {
    for (let candidate = range.startMinute; candidate + total <= range.endMinute; candidate += step) {
      const startsAt = new Date(dayStart.getTime() + candidate * 60_000);
      if (startsAt.getTime() < earliest) continue;
      if (overlaps(busy, candidate, candidate + total)) continue;
      if (formatInTimeZone(startsAt, source.timezone, "HH:mm") !== minutesToTime(candidate)) {
        continue;
      }
      minutes.add(candidate);
    }
  }

  return [...minutes]
    .sort((a, b) => a - b)
    .map((minute) => ({ minutes: minute, time: minutesToTime(minute) }));
}

export function isSlotAvailable(
  source: AvailabilitySource,
  dateKey: string,
  service: ServiceDuration,
  employeeId: string,
  time: string,
): boolean {
  const minutes = timeToMinutes(time);
  if (minutes === null) return false;
  return slotsForDate(source, dateKey, service, employeeId).some(
    (slot) => slot.minutes === minutes,
  );
}

/** Resumen de los próximos días para la tira del calendario. */
export function availabilityStrip(
  source: AvailabilitySource,
  service: ServiceDuration,
  employeeIds: string[],
  days: number,
): DayAvailability[] {
  return Array.from({ length: days }, (_, index) => {
    const dateKey = shift(source.todayKey, index);
    const closed = isClosedDay(source, dateKey);
    const selectable = isDateWithinWindow(source, dateKey) && !closed;

    const times = new Set<string>();
    if (selectable) {
      for (const employeeId of employeeIds) {
        for (const slot of slotsForDate(source, dateKey, service, employeeId)) {
          times.add(slot.time);
        }
      }
    }

    return { dateKey, count: times.size, closed, selectable };
  });
}

/** Agrupa los horarios para mostrar Mañana y Tarde por separado. */
export function groupSlots(slots: Slot[]): { label: string; slots: Slot[] }[] {
  return [
    { label: "Mañana", slots: slots.filter((slot) => slot.minutes < 13 * 60) },
    { label: "Tarde", slots: slots.filter((slot) => slot.minutes >= 13 * 60) },
  ].filter((group) => group.slots.length > 0);
}
