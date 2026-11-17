import { expect, test, type Page } from "@playwright/test";

import {
  db,
  deleteBookingsByPhones,
  pickFreeSlot,
  startsAtFor,
} from "./support/db";

/**
 * Criterio 2: dos clientes pelean el mismo horario del mismo profesional.
 * Uno gana y el otro ve un error claro con el selector todavía en pantalla.
 */
const PHONES = ["+54 11 6200-0001", "+54 11 6200-0002"];
const PHONE_KEYS = ["+541162000001", "+541162000002"];

async function fillBooking(page: Page, phone: string, firstName: string) {
  await page.getByLabel("Nombre").fill(firstName);
  await page.getByLabel("Apellido").fill("Concurrencia");
  await page.getByLabel("Teléfono").fill(phone);
  await page.getByLabel("Email").fill(`${firstName.toLowerCase()}@ejemplo.com`);
  await page
    .getByLabel("Acepto la política de cancelación del negocio.")
    .check();
}

test("dos reservas simultáneas: una gana y la otra recibe un error claro", async ({
  browser,
}) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  let slot: Awaited<ReturnType<typeof pickFreeSlot>> | null = null;

  try {
    const probe = await contextA.newPage();
    slot = await pickFreeSlot(probe, "emp_tomas");
    await probe.close();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    await pageA.goto(slot.url);
    await pageB.goto(slot.url);

    await expect(pageA.getByRole("heading", { name: "Tus datos" })).toBeVisible();
    await expect(pageB.getByRole("heading", { name: "Tus datos" })).toBeVisible();

    // Cada página tiene su propio clientRequestId: no es el idempotency key
    // lo que decide, sino la restricción de no solapamiento en la base.
    const requestIds = await Promise.all([
      pageA.locator('input[name="clientRequestId"]').inputValue(),
      pageB.locator('input[name="clientRequestId"]').inputValue(),
    ]);
    expect(requestIds[0]).not.toBe(requestIds[1]);

    await fillBooking(pageA, PHONES[0]!, "Uno");
    await fillBooking(pageB, PHONES[1]!, "Dos");

    await Promise.all([
      pageA.getByRole("button", { name: "Confirmar reserva" }).click({ noWaitAfter: true }),
      pageB.getByRole("button", { name: "Confirmar reserva" }).click({ noWaitAfter: true }),
    ]);

    await expect
      .poll(
        async () =>
          pageA.url().includes("/reserva/") || pageB.url().includes("/reserva/"),
        { timeout: 30_000 },
      )
      .toBe(true);

    const winner = pageA.url().includes("/reserva/") ? pageA : pageB;
    const loser = winner === pageA ? pageB : pageA;

    await expect(winner).toHaveURL(/\/b\/estudio-norte\/reserva\//);
    await expect(
      winner.getByRole("heading", { name: "¡Tu turno está reservado!" }),
    ).toBeVisible();

    await expect(loser).toHaveURL(/\/b\/estudio-norte\?/);
    await expect(loser.locator('p[role="alert"]')).toContainText(
      /ya no está disponible|recién se ocupó/,
      { timeout: 20_000 },
    );
    await expect(
      loser.getByRole("heading", { name: "Elegí la hora" }),
    ).toBeVisible();

    const startsAt = startsAtFor(slot.dateKey, slot.time);
    const count = await db.appointment.count({
      where: {
        businessId: "biz_estudio_norte",
        employeeId: "emp_tomas",
        startsAt,
      },
    });
    expect(count, "solo un turno pudo ocupar el horario").toBe(1);
  } finally {
    await deleteBookingsByPhones(PHONE_KEYS);
    await contextA.close();
    await contextB.close();
  }
});
