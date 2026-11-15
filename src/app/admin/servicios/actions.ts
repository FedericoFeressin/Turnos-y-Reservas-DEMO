"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireManager } from "@/lib/admin/guard";
import {
  fieldErrors,
  readServiceForm,
  serviceSchema,
  type ServiceFormState,
  type ServiceFormValues,
} from "@/lib/admin/schemas";
import { prisma } from "@/lib/prisma";

function slugify(value: string): string {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return base || "servicio";
}

/** El slug es único por negocio; si colisiona se agrega un sufijo numérico. */
async function uniqueServiceSlug(businessId: string, name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;

  for (let suffix = 2; suffix < 50; suffix += 1) {
    const existing = await prisma.service.findFirst({
      where: { businessId, slug: candidate },
      select: { id: true },
    });

    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
  }

  return `${base}-${Date.now().toString(36)}`;
}

export async function saveServiceAction(
  _state: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const membership = await requireManager();
  const values = readServiceForm(formData);
  const parsed = serviceSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Revisá los campos marcados.",
      fieldErrors: fieldErrors<ServiceFormValues>(parsed.error),
      values,
    };
  }

  const data = {
    name: parsed.data.name,
    category: parsed.data.category || null,
    description: parsed.data.description || null,
    priceCents: Math.round(parsed.data.price * 100),
    durationMinutes: parsed.data.durationMinutes,
    bufferAfterMinutes: parsed.data.bufferAfterMinutes,
    isActive: parsed.data.isActive,
    isPublic: parsed.data.isPublic,
  };

  const id = String(formData.get("id") ?? "");

  if (id) {
    const existing = await prisma.service.findFirst({
      where: { id, businessId: membership.businessId },
      select: { id: true },
    });

    if (!existing) {
      return {
        error: "Ese servicio ya no existe.",
        fieldErrors: {},
        values,
      };
    }

    await prisma.service.update({ where: { id }, data });
    revalidatePath("/admin/servicios");
    redirect("/admin/servicios?ok=actualizado");
  }

  const [slug, last] = await Promise.all([
    uniqueServiceSlug(membership.businessId, parsed.data.name),
    prisma.service.aggregate({
      where: { businessId: membership.businessId },
      _max: { sortOrder: true },
    }),
  ]);

  await prisma.service.create({
    data: {
      ...data,
      businessId: membership.businessId,
      slug,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/admin/servicios");
  redirect("/admin/servicios?ok=creado");
}

export async function toggleServiceAction(formData: FormData) {
  const membership = await requireManager();
  const id = String(formData.get("id") ?? "");

  const service = await prisma.service.findFirst({
    where: { id, businessId: membership.businessId },
    select: { id: true, isActive: true },
  });

  if (!service) {
    redirect("/admin/servicios?error=no-encontrado");
  }

  await prisma.service.update({
    where: { id: service.id },
    data: { isActive: !service.isActive },
  });

  revalidatePath("/admin/servicios");
  redirect("/admin/servicios?ok=actualizado");
}
