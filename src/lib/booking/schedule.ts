import { addDays, differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";

import { services, staff, type DemoService, type DemoStaff } from "@/lib/demo-data";

/**
 * Reloj de la demo.
 *
 * Todo el laboratorio usa un "ahora" fijo para que las capturas y la revisión
 * sean reproducibles: lunes 16 de noviembre de 2026, 09:20. Cuando exista base
 * de datos, este módulo se reemplaza por `now()` del servidor y la zona horaria
 * del negocio (ver docs/02 §6).
 */
export const DEMO_NOW = new Date(2026, 10, 16, 9, 20, 0);

export const MIN_ADVANCE_MINUTES = 120;
export const MAX_ADVANCE_DAYS = 60;
export const SLOT_GRANULARITY = 15;

/** Feriados: el negocio no abre y no se ofrecen turnos. */
export const HOLIDAYS = new Set(["2026-11-23"]);

/**
 * Día saturado a propósito para poder revisar el estado "sin disponibilidad".
 * No es un caso especial del algoritmo: se documenta acá para que se sepa que
 * es una affordance de demo, no una regla de negocio.
 */
export const DEMO_FULLY_BOOKED = new Set(["2026-11-27"]);

export type TimeRange = [startMinutes: number, endMinutes: number];

/** Horario del negocio por día de la semana (0 = domingo). Minutos desde 00:00. */
const BUSINESS_HOURS: Record<number, TimeRange[]> = {
  0: [],
  1: [
    [9 * 60, 13 * 60],
    [15 * 60, 20 * 60],
  ],
  2: [
    [9 * 60, 13 * 60],
    [15 * 60, 20 * 60],
  ],
  3: [
    [9 * 60, 13 * 60],
    [15 * 60, 20 * 60],
  ],
  4: [
    [9 * 60, 13 * 60],
    [15 * 60, 20 * 60],
  ],
  5: [
    [9 * 60, 13 * 60],
    [15 * 60, 20 * 60],
  ],
  6: [[9 * 60, 14 * 60]],
};

export function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatLongDate(date: Date): string {
  return capitalize(format(date, "EEEE d 'de' MMMM", { locale: es }));
}

export function formatMonth(date: Date): string {
  return capitalize(format(date, "MMMM 'de' yyyy", { locale: es }));
}

export function formatShortDay(date: Date): string {
  return capitalize(format(date, "EEE d MMM", { locale: es }));
}

export function isClosedDay(date: Date): boolean {
  return HOLIDAYS.has(dateKey(date)) || BUSINESS_HOURS[date.getDay()]?.length === 0;
}

export function isBookableDate(date: Date): boolean {
  if (isClosedDay(date)) return false;
  const days = differenceInCalendarDays(date, DEMO_NOW);
  if (days < 0 || days > MAX_ADVANCE_DAYS) return false;
  return true;
}

/** Rangos de atención del profesional: hereda el horario del negocio salvo sus días libres. */
export function employeeRanges(date: Date, person: DemoStaff): TimeRange[] {
  if (person.daysOff.includes(date.getDay())) return [];
  return BUSINESS_HOURS[date.getDay()] ?? [];
}

/* ---------------------------------------------------------------- ocupación */

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function random(seed: string): number {
  return hash(seed) / 0xffffffff;
}

/** Ocupación esperada por día de la semana. Sábado, casi lleno. */
const OCCUPANCY: Record<number, number> = {
  1: 0.5,
  2: 0.55,
  3: 0.6,
  4: 0.65,
  5: 0.82,
  6: 0.9,
};

const busyCache = new Map<string, TimeRange[]>();

/**
 * Intervalos ocupados de un profesional, en bloques de 30 minutos.
 *
 * En producción esto sale de `appointments` (ver docs/02 §6). Acá se genera de
 * forma determinística: la misma fecha y el mismo profesional dan siempre el
 * mismo mapa, así el estado no cambia entre renders ni tras un refresh.
 */
export function busyIntervals(date: Date, employeeId: string): TimeRange[] {
  const key = `${dateKey(date)}|${employeeId}`;
  const cached = busyCache.get(key);
  if (cached) return cached;

  const rate = OCCUPANCY[date.getDay()] ?? 0;
  const blocks: TimeRange[] = [];
  const person = staff.find((s) => s.id === employeeId);

  if (person) {
    for (const [start, end] of employeeRanges(date, person)) {
      for (let m = start; m + 30 <= end; m += 30) {
        const forced = DEMO_FULLY_BOOKED.has(dateKey(date));
        if (forced || random(`${key}|${m}`) < rate) blocks.push([m, m + 30]);
      }
    }
  }

  const merged: TimeRange[] = [];
  for (const block of blocks) {
    const last = merged[merged.length - 1];
    if (last && last[1] === block[0]) last[1] = block[1];
    else merged.push([block[0], block[1]]);
  }

  busyCache.set(key, merged);
  return merged;
}

function overlaps(ranges: TimeRange[], start: number, end: number): boolean {
  return ranges.some(([from, to]) => start < to && end > from);
}

/* ------------------------------------------------------------------- slots */

export type Slot = {
  time: string;
  minutes: number;
  available: boolean;
};

export type SlotGroup = {
  label: string;
  slots: Slot[];
};

const ANY_STAFF = "any";

export function staffFor(serviceId: string, employeeId: string): DemoStaff[] {
  const service = services.find((s) => s.id === serviceId);
  if (!service) return [];
  if (employeeId === ANY_STAFF) return staff;
  return staff.filter((s) => s.id === employeeId);
}

/**
 * Slots candidatos para un día, con la grilla de 15 minutos del negocio.
 *
 * - Con profesional elegido se muestran también los ocupados, tachados.
 * - Con "cualquiera" solo se devuelven los realmente libres: prometer un
 *   horario que después no se puede asignar es peor que mostrar menos.
 */
export function slotsFor(
  date: Date,
  service: DemoService,
  employeeId: string,
): Slot[] {
  if (!isBookableDate(date)) return [];

  const people = staffFor(service.id, employeeId);
  const showTaken = employeeId !== ANY_STAFF;
  const total = service.duration + service.buffer;
  const candidates = new Set<number>();
  const available = new Set<number>();

  for (const person of people) {
    const busy = busyIntervals(date, person.id);
    for (const [rangeStart, rangeEnd] of employeeRanges(date, person)) {
      for (let m = rangeStart; m + total <= rangeEnd; m += SLOT_GRANULARITY) {
        candidates.add(m);
        if (!overlaps(busy, m, m + total) && withinBookingWindow(date, m)) {
          available.add(m);
        }
      }
    }
  }

  const minutes = [...(showTaken ? candidates : available)].sort((a, b) => a - b);
  return minutes.map((m) => ({
    time: minutesToTime(m),
    minutes: m,
    available: available.has(m),
  }));
}

/** Ventana de reserva: 2 h de anticipación mínima y 60 días de horizonte. */
export function withinBookingWindow(date: Date, minutes: number): boolean {
  const start = new Date(date);
  start.setHours(0, minutes, 0, 0);
  const earliest = DEMO_NOW.getTime() + MIN_ADVANCE_MINUTES * 60_000;
  const latest = DEMO_NOW.getTime() + MAX_ADVANCE_DAYS * 86_400_000;
  return start.getTime() >= earliest && start.getTime() <= latest;
}

export function groupSlots(slots: Slot[]): SlotGroup[] {
  const morning = slots.filter((s) => s.minutes < 13 * 60);
  const afternoon = slots.filter((s) => s.minutes >= 13 * 60);
  return [
    { label: "Mañana", slots: morning },
    { label: "Tarde", slots: afternoon },
  ].filter((group) => group.slots.length > 0);
}

export function freeSlotCount(date: Date, service: DemoService, employeeId: string): number {
  return slotsFor(date, service, employeeId).filter((slot) => slot.available).length;
}

export function isDayAvailable(date: Date, service: DemoService, employeeId: string): boolean {
  return freeSlotCount(date, service, employeeId) > 0;
}

/* ------------------------------------------------------------------ calendario */

export type CalendarCell = {
  date: Date;
  inMonth: boolean;
  closed: boolean;
  /** Se puede abrir el día para ver horarios, aunque estén todos ocupados. */
  selectable: boolean;
  available: boolean;
  count: number;
};

/**
 * Grilla de 6 semanas, lunes primero, con la disponibilidad ya resuelta para
 * que el calendario no tenga que consultar nada más.
 */
export function monthGrid(
  month: Date,
  service: DemoService,
  employeeId: string,
): CalendarCell[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = addDays(first, -offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(start, index);
    const inMonth = date.getMonth() === month.getMonth();
    const closed = isClosedDay(date);
    const selectable = isBookableDate(date);
    const count = inMonth && selectable ? freeSlotCount(date, service, employeeId) : 0;
    return { date, inMonth, closed, selectable, available: count > 0, count };
  });
}

/* ------------------------------------------------------------------ helpers */

/** Primer día con horarios libres desde `from`. Devuelve null si no hay. */
export function firstAvailableDate(
  service: DemoService,
  employeeId: string,
  from: Date = DEMO_NOW,
): Date | null {
  for (let index = 0; index <= MAX_ADVANCE_DAYS; index += 1) {
    const date = addDays(from, index);
    if (isDayAvailable(date, service, employeeId)) return date;
  }
  return null;
}

/** Siguiente día con horarios libres, estrictamente después de `date`. */
export function nextAvailableDate(
  service: DemoService,
  employeeId: string,
  date: Date,
): Date | null {
  return firstAvailableDate(service, employeeId, addDays(date, 1));
}

/** Código de reserva legible, estable para el mismo turno. */
export function confirmationCode(date: Date, time: string, serviceId: string): string {
  const value = hash(`${dateKey(date)}|${time}|${serviceId}`) % 36 ** 4;
  return `EN-${value.toString(36).toUpperCase().padStart(4, "0")}`;
}
