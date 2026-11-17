import { expect, test, type BrowserContext, type Request } from "@playwright/test";
import { formatInTimeZone } from "date-fns-tz";

import { MembershipRole } from "../src/generated/prisma/enums";

import {
  createCredentialUser,
  db,
  DEMO_BUSINESS_ID,
  login,
  OWNER_EMAIL,
  OWNER_PASSWORD,
  TIMEZONE,
} from "./support/db";

/**
 * Criterios 4 y 5: un STAFF no modifica el catálogo y un usuario de otro
 * negocio no lee ni escribe datos ajenos. La prueba importante es el `POST`
 * directo: ocultar botones no es autorización.
 */
const STAFF_ID = "usr_qa_staff";
const STAFF_EMAIL = "qa.staff@estudionorte.com.ar";
const STAFF_PASSWORD = "qa-pass-123";
const OTHER_ID = "usr_qa_other";
const OTHER_EMAIL = "qa.otro@ejemplo.com";
const OTHER_PASSWORD = "qa-pass-456";
const OTHER_BUSINESS_ID = "biz_qa_other";
const OTHER_SLUG = "otro-negocio-qa";
const SERVICE_SLUG = "servicio-qa-temporal";

type CapturedAction = {
  url: string;
  headers: Record<string, string>;
  body: Buffer;
};

let serviceId: string;
let captured: CapturedAction;

/** Repite el POST de una Server Action con las cookies del contexto dado. */
async function replay(context: BrowserContext) {
  const headers = { ...captured.headers };
  delete headers.cookie;
  delete headers["content-length"];
  delete headers.host;

  return context.request.post(captured.url, {
    headers,
    data: captured.body,
    maxRedirects: 0,
  });
}

test.beforeAll(async ({ browser }) => {
  await createCredentialUser({
    id: STAFF_ID,
    email: STAFF_EMAIL,
    name: "Personal QA",
    password: STAFF_PASSWORD,
    businessId: DEMO_BUSINESS_ID,
    role: MembershipRole.STAFF,
  });

  await db.business.upsert({
    where: { slug: OTHER_SLUG },
    update: {},
    create: {
      id: OTHER_BUSINESS_ID,
      slug: OTHER_SLUG,
      name: "Otro Negocio QA",
      email: "hola@otro-negocio-qa.test",
      phone: "+54 11 4000-0000",
      timezone: TIMEZONE,
      currency: "ARS",
      locale: "es-AR",
      isActive: true,
    },
  });
  await db.businessSettings.upsert({
    where: { businessId: OTHER_BUSINESS_ID },
    update: {},
    create: { businessId: OTHER_BUSINESS_ID },
  });
  await db.businessTheme.upsert({
    where: { businessId: OTHER_BUSINESS_ID },
    update: {},
    create: { businessId: OTHER_BUSINESS_ID, preset: "papel" },
  });
  await createCredentialUser({
    id: OTHER_ID,
    email: OTHER_EMAIL,
    name: "Otro Negocio QA",
    password: OTHER_PASSWORD,
    businessId: OTHER_BUSINESS_ID,
    role: MembershipRole.OWNER,
  });

  const service = await db.service.create({
    data: {
      businessId: DEMO_BUSINESS_ID,
      name: "Servicio QA temporal",
      slug: SERVICE_SLUG,
      priceCents: 1000,
      durationMinutes: 30,
      bufferAfterMinutes: 0,
      sortOrder: 999,
      isActive: true,
      isPublic: false,
    },
  });
  serviceId = service.id;

  // Un OWNER real ejecuta la acción. Capturamos esa petición para repetirla
  // después con la sesión de STAFF y con la de otro negocio.
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
    await page.goto("/admin/servicios");

    const form = page.locator(
      `form:has(input[name="id"][value="${serviceId}"])`,
    );
    const waitForPost = page.waitForRequest(
      (request: Request) =>
        request.method() === "POST" &&
        request.url().includes("/admin/servicios"),
    );
    await form.getByRole("button", { name: "Desactivar" }).click();
    const request = await waitForPost;

    captured = {
      url: request.url(),
      headers: request.headers(),
      body: request.postDataBuffer() ?? Buffer.alloc(0),
    };
    await expect(page).toHaveURL(/ok=actualizado/, { timeout: 20_000 });
  } finally {
    await context.close();
  }
});

test.afterAll(async () => {
  await db.service.deleteMany({ where: { id: serviceId } });
  await db.membership.deleteMany({
    where: { businessId: { in: [DEMO_BUSINESS_ID, OTHER_BUSINESS_ID] }, userId: { in: [STAFF_ID, OTHER_ID] } },
  });
  await db.account.deleteMany({ where: { userId: { in: [STAFF_ID, OTHER_ID] } } });
  await db.user.deleteMany({ where: { id: { in: [STAFF_ID, OTHER_ID] } } });
  await db.business.deleteMany({ where: { id: OTHER_BUSINESS_ID } });
});

test("STAFF solo lee: sin controles y con el POST rechazado en servidor", async ({
  browser,
}) => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await login(page, STAFF_EMAIL, STAFF_PASSWORD);

    await page.goto("/admin/servicios");
    await expect(
      page.locator('a[href="/admin/servicios?editar=nuevo"]'),
    ).toHaveCount(0);
    await expect(
      page.locator(`form:has(input[name="id"][value="${serviceId}"])`),
    ).toHaveCount(0);

    // La decisión acordada es que Configuración se ve en solo lectura.
    await page.goto("/admin/configuracion");
    await expect(page.getByRole("button", { name: /Guardar/ })).toHaveCount(0);

    const response = await replay(context);
    // Next 16 responde 200: el destino del redirect va en `x-action-redirect`.
    expect(response.status()).toBe(200);
    expect(response.headers()["x-action-redirect"] ?? "").toContain(
      "error=permiso",
    );

    const service = await db.service.findUniqueOrThrow({
      where: { id: serviceId },
    });
    expect(service.isActive, "STAFF no pudo modificar el servicio").toBe(false);
  } finally {
    await context.close();
  }
});

test("otro negocio no lee ni modifica turnos ni servicios ajenos", async ({
  browser,
}) => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await login(page, OTHER_EMAIL, OTHER_PASSWORD);

    await expect(page.locator("header")).toContainText("Otro Negocio QA");
    await expect(page.locator("header")).not.toContainText("Estudio Norte");

    await page.goto("/admin/servicios");
    await expect(page.getByText("Corte clásico", { exact: true })).toHaveCount(0);
    await expect(
      page.locator(`input[name="id"][value="${serviceId}"]`),
    ).toHaveCount(0);

    const foreign = await db.appointment.findFirst({
      where: { businessId: DEMO_BUSINESS_ID, status: { not: "CANCELLED" } },
      include: { customer: { select: { firstName: true } } },
    });
    if (!foreign) throw new Error("No hay turnos de la demo para la prueba.");
    const dateKey = formatInTimeZone(foreign.startsAt, TIMEZONE, "yyyy-MM-dd");

    await page.goto(`/admin/turnos?fecha=${dateKey}`);
    await expect(page.locator("main")).not.toContainText(
      foreign.customer.firstName,
    );

    const response = await replay(context);
    // El dueño del otro negocio pasa la guarda de rol, pero el servicio no
    // pertenece a su negocio: la búsqueda por businessId no lo encuentra.
    expect(response.status()).toBe(200);
    expect(response.headers()["x-action-redirect"] ?? "").toContain(
      "error=no-encontrado",
    );

    const service = await db.service.findUniqueOrThrow({
      where: { id: serviceId },
    });
    expect(service.isActive, "otro negocio no pudo modificar el servicio").toBe(
      false,
    );
  } finally {
    await context.close();
  }
});
