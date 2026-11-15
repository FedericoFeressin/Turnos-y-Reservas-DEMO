import { addDays } from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** Clave de fecha local del negocio: `yyyy-MM-dd`. */
export function todayKey(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

/** Suma días a una clave de fecha sin pasar por zonas horarias. */
export function shiftDateKey(dateKey: string, days: number): string {
  const noon = new Date(`${dateKey}T12:00:00Z`);
  return formatInTimeZone(addDays(noon, days), "UTC", "yyyy-MM-dd");
}

/** Rango `[inicio, fin)` del día en la zona del negocio. */
export function dayBounds(
  dateKey: string,
  timezone: string,
): { start: Date; end: Date } {
  return {
    start: fromZonedTime(`${dateKey}T00:00:00`, timezone),
    end: fromZonedTime(`${shiftDateKey(dateKey, 1)}T00:00:00`, timezone),
  };
}

/** Día ISO: 1 = lunes … 7 = domingo. */
export function isoDayOfWeek(dateKey: string): number {
  const day = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

export function formatTime(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "HH:mm");
}

export function formatLongDate(dateKey: string, timezone: string): string {
  const noon = fromZonedTime(`${dateKey}T12:00:00`, timezone);
  const label = formatInTimeZone(noon, timezone, "EEEE d 'de' MMMM", { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatShortDate(dateKey: string, timezone: string): string {
  const noon = fromZonedTime(`${dateKey}T12:00:00`, timezone);
  return formatInTimeZone(noon, timezone, "d MMM", { locale: es });
}

export function formatPrice(cents: number, currency: string, locale = "es-AR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Minutos desde medianoche → `HH:mm`. */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

/**
 * Clave `yyyy-MM-dd` → `Date` en UTC. Es el formato que espera Prisma para las
 * columnas `@db.Date` (feriados y fecha de nacimiento): la fecha se guarda sin
 * hora ni zona.
 */
export function dateKeyToUtcDate(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00Z`);
}

/** `@db.Date` (medianoche UTC) → `yyyy-MM-dd`, el valor de un `<input type="date">`. */
export function dateToDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** `@db.Date` → texto legible sin corrimiento de zona horaria. */
export function formatDateOnly(date: Date): string {
  return formatInTimeZone(date, "UTC", "d 'de' MMMM 'de' yyyy", { locale: es });
}

/** Fecha de un turno para el historial: `Lun 16 nov 2026`. */
export function formatHistoryDate(date: Date, timezone: string): string {
  const label = formatInTimeZone(date, timezone, "EEE d MMM yyyy", {
    locale: es,
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Día y mes de un turno: `16 nov`. */
export function formatShortDay(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "d MMM", { locale: es });
}

/** Clave de fecha de un instante en la zona del negocio. */
export function dateKeyInZone(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd");
}
