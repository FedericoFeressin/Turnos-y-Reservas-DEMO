import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { db, DEMO_BUSINESS_ID, pickFreeSlot } from "./support/db";

/**
 * Aporta a criterio 8: axe sobre las pantallas públicas y de ingreso.
 * Lighthouse (también exigido por el criterio) se mide en otro bloque.
 */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function checkAccessibility(page: Page, pantalla: string) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const relevant = results.violations.filter(
    (violation) =>
      violation.impact === "critical" || violation.impact === "serious",
  );

  const resumen = relevant.map(
    (violation) => `${violation.id}: ${violation.help} (${violation.impact})`,
  );
  if (resumen.length > 0) {
    console.log(`Violaciones en ${pantalla}:`, resumen);
  }

  expect(resumen, `violaciones graves en ${pantalla}`).toEqual([]);
}

test("axe: home del proyecto", async ({ page }) => {
  await page.goto("/");
  await checkAccessibility(page, "home");
});

test("axe: asistente de reserva", async ({ page }) => {
  await page.goto("/b/estudio-norte");
  await checkAccessibility(page, "asistente");

  const slot = await pickFreeSlot(page, "emp_tomas");
  await page.goto(slot.url);
  await checkAccessibility(page, "formulario de reserva");
});

test("axe: confirmación pública", async ({ page }) => {
  const appointment = await db.appointment.findFirstOrThrow({
    where: { businessId: DEMO_BUSINESS_ID },
    select: { id: true },
  });
  await page.goto(`/b/estudio-norte/reserva/${appointment.id}`);
  await checkAccessibility(page, "confirmación");
});

test("axe: ingreso al panel", async ({ page }) => {
  await page.goto("/ingresar");
  await checkAccessibility(page, "ingresar");
});
