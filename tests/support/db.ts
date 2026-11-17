import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { expect, type Page } from "@playwright/test";
import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { PrismaClient } from "../../src/generated/prisma/client";
import { MembershipRole } from "../../src/generated/prisma/enums";

config({ path: [".env.local", ".env"], quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Falta DATABASE_URL: los tests E2E necesitan la base de desarrollo.");
}

/** Mismo adaptador y zona que el seed, para que los `timestamptz` no se corran. */
export const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
    options: "-c timezone=UTC",
  }),
});

export const TIMEZONE = "America/Argentina/Buenos_Aires";
export const DEMO_BUSINESS_ID = "biz_estudio_norte";
export const OWNER_ID = "usr_tomas";
export const OWNER_EMAIL = "tomas@estudionorte.com.ar";
export const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "estudio-norte";

export async function login(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/ingresar");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar al panel" }).click();
  await expect(page).toHaveURL(/\/admin(?:\?|$)/, { timeout: 20_000 });
}

/** Borra solo los turnos creados por un test, identificados por teléfono. */
export async function deleteBookingsByPhones(phones: string[]): Promise<void> {
  const customers = await db.customer.findMany({
    where: { phoneNormalized: { in: phones } },
    select: { id: true },
  });
  if (customers.length === 0) return;

  const customerIds = customers.map((customer) => customer.id);
  const appointments = await db.appointment.findMany({
    where: { customerId: { in: customerIds } },
    select: { id: true },
  });
  const appointmentIds = appointments.map((appointment) => appointment.id);

  await db.notification.deleteMany({
    where: { appointmentId: { in: appointmentIds } },
  });
  await db.appointmentEvent.deleteMany({
    where: { appointmentId: { in: appointmentIds } },
  });
  await db.appointment.deleteMany({ where: { id: { in: appointmentIds } } });
  await db.customer.deleteMany({ where: { id: { in: customerIds } } });
}

export async function deleteAppointments(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.notification.deleteMany({ where: { appointmentId: { in: ids } } });
  await db.appointmentEvent.deleteMany({ where: { appointmentId: { in: ids } } });
  await db.appointment.deleteMany({ where: { id: { in: ids } } });
}

/** Crea un usuario de Better Auth con una membresía en el negocio dado. */
export async function createCredentialUser({
  id,
  email,
  name,
  password,
  businessId,
  role,
}: {
  id: string;
  email: string;
  name: string;
  password: string;
  businessId: string;
  role: MembershipRole;
}): Promise<void> {
  await db.user.upsert({
    where: { email },
    update: { name, emailVerified: true },
    create: { id, name, email, emailVerified: true },
  });
  await db.account.deleteMany({
    where: { userId: id, providerId: "credential" },
  });
  await db.account.create({
    data: {
      id: `acc_${id}_credential`,
      accountId: id,
      providerId: "credential",
      userId: id,
      password: await hashPassword(password),
    },
  });
  await db.membership.upsert({
    where: { businessId_userId: { businessId, userId: id } },
    update: { role, isActive: true },
    create: { businessId, userId: id, role, isActive: true },
  });
}

/**
 * Devuelve el primer día con horarios libres desde mañana en adelante.
 *
 * El día de hoy puede quedar a menos de `minAdvanceMinutes` del primer turno
 * (por ejemplo, a las 17:00 el primer slot de las 19:00 ya no es reservable);
 * usar mañana evita esa carrera entre render y envío del formulario.
 */
export async function futureDayLink(page: Page) {
  const links = page.locator(
    'a[href*="fecha="]:not([aria-disabled="true"])',
  );
  const tomorrowKey = formatInTimeZone(
    addDays(new Date(), 1),
    TIMEZONE,
    "yyyy-MM-dd",
  );
  const count = await links.count();

  for (let index = 0; index < count; index += 1) {
    const href = await links.nth(index).getAttribute("href");
    const key = href
      ? new URL(href, "http://localhost").searchParams.get("fecha")
      : null;
    if (key && key >= tomorrowKey) return links.nth(index);
  }

  return links.first();
}

/**
 * Navega el asistente hasta un horario libre concreto y devuelve la URL del
 * paso 4. Usar un profesional explícito evita que la reserva pueda caer en
 * otro profesional y hace determinista la prueba de concurrencia.
 */
export async function pickFreeSlot(
  page: Page,
  employeeId: string,
  dateKey?: string,
): Promise<{ dateKey: string; time: string; url: string }> {
  const base = `/b/estudio-norte?servicio=srv_corte&profesional=${employeeId}`;
  await page.goto(dateKey ? `${base}&fecha=${dateKey}` : base);

  const day = dateKey
    ? page
        .locator('a[href*="fecha="]:not([aria-disabled="true"])')
        .first()
    : await futureDayLink(page);
  await expect(day).toBeVisible({ timeout: 20_000 });
  const dayHref = await day.getAttribute("href");
  if (!dayHref) throw new Error("No apareció un día con horarios libres.");

  await page.goto(dayHref);
  const timeLink = page.locator('a[href*="hora="]').first();
  await expect(timeLink).toBeVisible({ timeout: 20_000 });
  const timeHref = await timeLink.getAttribute("href");
  if (!timeHref) throw new Error("No apareció un horario libre.");

  const params = new URL(timeHref, "http://localhost").searchParams;
  return {
    dateKey: params.get("fecha") ?? "",
    time: params.get("hora") ?? "",
    url: timeHref,
  };
}

export function startsAtFor(dateKey: string, time: string): Date {
  return fromZonedTime(`${dateKey}T${time}:00`, TIMEZONE);
}
