import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";
import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import { ActorType, AppointmentEventType } from "../src/generated/prisma/enums";

import {
  db,
  deleteAppointments,
  DEMO_BUSINESS_ID,
  login,
  OWNER_EMAIL,
  OWNER_ID,
  OWNER_PASSWORD,
  startsAtFor,
  TIMEZONE,
} from "./support/db";

/** Criterio 6: todo cambio de un turno deja su evento con actor y estados. */
const createdIds: string[] = [];

function futureDateKey(): string {
  let day = addDays(new Date(), 14);
  if (formatInTimeZone(day, TIMEZONE, "i") === "7") {
    day = addDays(day, 1);
  }
  return formatInTimeZone(day, TIMEZONE, "yyyy-MM-dd");
}

test.afterAll(async () => {
  await deleteAppointments(createdIds);
});

test("confirmar y cancelar un turno registra cada transición", async ({
  browser,
}) => {
  const dateKey = futureDateKey();
  const startsAt = startsAtFor(dateKey, "10:00");

  const [customer, employee, service] = await Promise.all([
    db.customer.findFirstOrThrow({ where: { businessId: DEMO_BUSINESS_ID } }),
    db.employee.findFirstOrThrow({
      where: { businessId: DEMO_BUSINESS_ID, id: "emp_tomas" },
    }),
    db.service.findFirstOrThrow({
      where: { businessId: DEMO_BUSINESS_ID, id: "srv_corte" },
    }),
  ]);

  const appointment = await db.appointment.create({
    data: {
      businessId: DEMO_BUSINESS_ID,
      customerId: customer.id,
      employeeId: employee.id,
      serviceId: service.id,
      startsAt,
      endsAt: new Date(startsAt.getTime() + service.durationMinutes * 60_000),
      blockedUntil: new Date(
        startsAt.getTime() +
          (service.durationMinutes + service.bufferAfterMinutes) * 60_000,
      ),
      status: "PENDING",
      source: "PUBLIC",
      priceCents: service.priceCents,
      currency: "ARS",
      durationMinutes: service.durationMinutes,
      bufferAfterMinutes: service.bufferAfterMinutes,
      clientRequestId: randomUUID(),
    },
  });
  createdIds.push(appointment.id);

  await db.appointmentEvent.create({
    data: {
      businessId: DEMO_BUSINESS_ID,
      appointmentId: appointment.id,
      type: AppointmentEventType.CREATED,
      actorType: ActorType.CUSTOMER,
      toStatus: "PENDING",
      note: "Turno creado por la prueba de historial",
    },
  });

  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
    await page.goto(`/admin/turnos?fecha=${dateKey}`);

    const card = page.locator(
      `li:has(input[name="id"][value="${appointment.id}"])`,
    );
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Confirmar" }).click();
    await expect(page).toHaveURL(/ok=confirmado/, { timeout: 20_000 });

    const afterConfirm = await db.appointmentEvent.findMany({
      where: { appointmentId: appointment.id },
      orderBy: { createdAt: "asc" },
    });
    expect(afterConfirm.map((event) => event.type)).toEqual([
      AppointmentEventType.CREATED,
      AppointmentEventType.CONFIRMED,
    ]);
    expect(afterConfirm[1]).toMatchObject({
      actorType: ActorType.STAFF,
      actorUserId: OWNER_ID,
      fromStatus: "PENDING",
      toStatus: "CONFIRMED",
    });

    await page.goto(`/admin/turnos?fecha=${dateKey}`);
    const confirmedCard = page.locator(
      `li:has(input[name="id"][value="${appointment.id}"])`,
    );
    await confirmedCard.getByRole("button", { name: "Cancelar" }).click();
    await expect(page).toHaveURL(/ok=cancelado/, { timeout: 20_000 });

    const afterCancel = await db.appointmentEvent.findMany({
      where: { appointmentId: appointment.id },
      orderBy: { createdAt: "asc" },
    });
    expect(afterCancel.map((event) => event.type)).toEqual([
      AppointmentEventType.CREATED,
      AppointmentEventType.CONFIRMED,
      AppointmentEventType.CANCELLED,
    ]);
    expect(afterCancel[2]).toMatchObject({
      actorType: ActorType.STAFF,
      fromStatus: "CONFIRMED",
      toStatus: "CANCELLED",
    });

    await page.goto(`/b/estudio-norte/reserva/${appointment.id}`);
    await expect(
      page.getByRole("heading", { name: "Historial del turno" }),
    ).toBeVisible();
    await expect(page.getByText("Turno confirmado")).toBeVisible();
    await expect(page.getByText("Turno cancelado")).toBeVisible();
  } finally {
    await context.close();
  }
});
