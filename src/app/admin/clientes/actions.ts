"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireManager } from "@/lib/admin/guard";
import {
  customerSchema,
  fieldErrors,
  normalizePhone,
  readCustomerForm,
  type CustomerFormState,
  type CustomerFormValues,
} from "@/lib/admin/schemas";
import { dateKeyToUtcDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";

/** Etiquetas: texto separado por comas → array sin vacíos ni duplicados. */
function parseTags(value: string): string[] {
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return [...new Set(tags)];
}

export async function saveCustomerAction(
  _state: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const membership = await requireManager();
  const values = readCustomerForm(formData);
  const parsed = customerSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Revisá los campos marcados.",
      fieldErrors: fieldErrors<CustomerFormValues>(parsed.error),
      values,
    };
  }

  const { businessId } = membership;
  const phoneNormalized = normalizePhone(parsed.data.phone);
  const id = String(formData.get("id") ?? "");

  /*
   * El teléfono normalizado es único por negocio, incluso entre clientes dados
   * de baja: el índice de la base no distingue `deletedAt`. Se valida acá para
   * devolver un error de campo en vez de un fallo de constraint.
   */
  const duplicate = await prisma.customer.findFirst({
    where: {
      businessId,
      phoneNormalized,
      ...(id ? { NOT: { id } } : {}),
    },
    select: { id: true, firstName: true, lastName: true },
  });

  if (duplicate) {
    return {
      error: "Revisá los campos marcados.",
      fieldErrors: {
        phone: `Ese teléfono ya está registrado a nombre de ${[
          duplicate.firstName,
          duplicate.lastName,
        ]
          .filter(Boolean)
          .join(" ")}.`,
      },
      values,
    };
  }

  const data = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone,
    phoneNormalized,
    birthDate: parsed.data.birthDate
      ? dateKeyToUtcDate(parsed.data.birthDate)
      : null,
    notes: parsed.data.notes || null,
    tags: parseTags(parsed.data.tags),
    marketingOptIn: parsed.data.marketingOptIn,
    isBlocked: parsed.data.isBlocked,
  };

  if (id) {
    const existing = await prisma.customer.findFirst({
      where: { id, businessId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return {
        error: "Ese cliente ya no existe.",
        fieldErrors: {},
        values,
      };
    }

    await prisma.customer.update({ where: { id }, data });
    revalidatePath("/admin/clientes");
    revalidatePath(`/admin/clientes/${id}`);
    redirect("/admin/clientes?ok=actualizado");
  }

  const customer = await prisma.customer.create({
    data: { ...data, businessId },
    select: { id: true },
  });

  revalidatePath("/admin/clientes");
  redirect(`/admin/clientes/${customer.id}?ok=creado`);
}
