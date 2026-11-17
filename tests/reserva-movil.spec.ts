import { expect, test, type Page } from "@playwright/test";

import { deleteBookingsByPhones, futureDayLink, pickFreeSlot } from "./support/db";

/**
 * Criterio 1: reserva de punta a punta en 375 px sin zoom ni scroll
 * horizontal. Se comprueba en los cuatro pasos y en la confirmación.
 */
const PHONE = "+54 11 6100-0001";
const PHONE_KEY = "+541161000001";

// Fijamos el ancho del viewport: `isMobile` + `deviceScaleFactor` distorsionan
// el viewport de layout y desalinean los clics, sin aportar al criterio.
test.use({
  viewport: { width: 375, height: 812 },
});

test.afterAll(async () => {
  await deleteBookingsByPhones([PHONE_KEY]);
});

async function expectNoHorizontalScroll(page: Page, paso: string): Promise<void> {
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    scale: window.visualViewport?.scale ?? 1,
  }));

  expect(layout.scrollWidth, `scroll horizontal en ${paso}`).toBeLessThanOrEqual(
    layout.innerWidth + 1,
  );
  expect(layout.scale, `zoom en ${paso}`).toBeCloseTo(1, 1);
}

test("reserva completa a 375 px sin zoom ni scroll horizontal", async ({ page }) => {
  await page.goto("/b/estudio-norte");
  await expect(
    page.getByRole("heading", { name: "Reservá tu turno" }),
  ).toBeVisible();
  await expectNoHorizontalScroll(page, "servicios");

  await page.getByRole("link", { name: /Corte clásico/ }).first().click();
  await expect(
    page.getByRole("heading", { name: "¿Quién te atiende?" }),
  ).toBeVisible();
  await expectNoHorizontalScroll(page, "profesionales");

  await page.getByRole("link", { name: /Cualquiera/ }).click();
  await expect(page.getByRole("heading", { name: "Elegí el día" })).toBeVisible();
  await expectNoHorizontalScroll(page, "fechas");

  const day = await futureDayLink(page);
  await day.click();
  await expect(page.getByRole("heading", { name: "Elegí la hora" })).toBeVisible();
  await expectNoHorizontalScroll(page, "horarios");

  await page.locator('a[href*="hora="]').first().click();
  await expect(page.getByRole("heading", { name: "Tus datos" })).toBeVisible();
  await expectNoHorizontalScroll(page, "formulario");

  await page.getByLabel("Nombre").fill("Móvil");
  await page.getByLabel("Apellido").fill("QA");
  await page.getByLabel("Teléfono").fill(PHONE);
  await page.getByLabel("Email").fill("movil.qa@ejemplo.com");
  await page
    .getByLabel("Acepto la política de cancelación del negocio.")
    .check();
  await expectNoHorizontalScroll(page, "formulario completo");

  await page.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect(page).toHaveURL(/\/b\/estudio-norte\/reserva\//, {
    timeout: 20_000,
  });
  await expect(
    page.getByRole("heading", { name: "¡Tu turno está reservado!" }),
  ).toBeVisible();
  await expectNoHorizontalScroll(page, "confirmación");
});

test("el enlace de cancelación también cabe en 375 px", async ({ page }) => {
  const slot = await pickFreeSlot(page, "emp_sofia");
  await page.goto(slot.url);
  await expect(page.getByRole("heading", { name: "Tus datos" })).toBeVisible();

  await page.getByLabel("Nombre").fill("Cancelación");
  await page.getByLabel("Apellido").fill("Móvil");
  await page.getByLabel("Teléfono").fill(PHONE);
  await page
    .getByLabel("Acepto la política de cancelación del negocio.")
    .check();
  await page.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect(page).toHaveURL(/\/reserva\//, { timeout: 20_000 });

  const link = page.getByRole("link", { name: "Cancelar este turno" });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page.getByRole("heading", { name: "Cancelar turno" })).toBeVisible();
  await expectNoHorizontalScroll(page, "cancelación");
});
