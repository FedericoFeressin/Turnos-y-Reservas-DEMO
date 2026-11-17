"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireManager } from "@/lib/admin/guard";
import {
  businessProfileSchema,
  businessScheduleSchema,
  fieldErrors,
  holidaySchema,
  readBusinessForm,
  readBusinessScheduleForm,
  readHolidayForm,
  timeToMinutes,
  type BusinessProfileFormState,
  type BusinessProfileFormValues,
} from "@/lib/admin/schemas";
import { dateKeyToUtcDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export async function saveBusinessAction(
  _state: BusinessProfileFormState,
  formData: FormData,
): Promise<BusinessProfileFormState> {
  const membership = await requireManager();
  const values = readBusinessForm(formData);
  const parsed = businessProfileSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Revisá los campos marcados.",
      fieldErrors: fieldErrors<BusinessProfileFormValues>(parsed.error),
      values,
    };
  }

  const data = parsed.data;

  await prisma.business.update({
    where: { id: membership.businessId },
    data: {
      name: data.name,
      legalName: data.legalName || null,
      taxId: data.taxId || null,
      email: data.email || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      instagram: data.instagram || null,
      website: data.website || null,
      addressLine: data.addressLine || null,
      city: data.city || null,
      province: data.province || null,
      postalCode: data.postalCode || null,
      country: data.country,
      timezone: data.timezone,
      currency: data.currency,
    },
  });

  // El layout del panel muestra el nombre del negocio: se revalida entero.
  revalidatePath("/admin", "layout");
  redirect("/admin/configuracion?seccion=datos&ok=datos");
}

export async function addBusinessScheduleAction(formData: FormData) {
  const membership = await requireManager();
  const parsed = businessScheduleSchema.safeParse(
    readBusinessScheduleForm(formData),
  );

  if (!parsed.success) {
    redirect("/admin/configuracion?seccion=horarios&error=horario");
  }

  const { dayOfWeek, start, end } = parsed.data;
  const startMinute = timeToMinutes(start);
  const endMinute = timeToMinutes(end);

  const ranges = await prisma.businessSchedule.findMany({
    where: { businessId: membership.businessId, dayOfWeek },
    select: { startMinute: true, endMinute: true },
  });

  const overlaps = ranges.some(
    (range) => startMinute < range.endMinute && endMinute > range.startMinute,
  );

  if (overlaps) {
    redirect("/admin/configuracion?seccion=horarios&error=superpuesto");
  }

  await prisma.businessSchedule.create({
    data: {
      businessId: membership.businessId,
      dayOfWeek,
      startMinute,
      endMinute,
    },
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin");
  redirect("/admin/configuracion?seccion=horarios&ok=franja-agregada");
}

export async function removeBusinessScheduleAction(formData: FormData) {
  const membership = await requireManager();
  const id = String(formData.get("id") ?? "");

  const schedule = await prisma.businessSchedule.findFirst({
    where: { id, businessId: membership.businessId },
    select: { id: true },
  });

  if (!schedule) {
    redirect("/admin/configuracion?seccion=horarios&error=franja");
  }

  await prisma.businessSchedule.delete({ where: { id: schedule.id } });

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin");
  redirect("/admin/configuracion?seccion=horarios&ok=franja-eliminada");
}

export async function addHolidayAction(formData: FormData) {
  const membership = await requireManager();
  const parsed = holidaySchema.safeParse(readHolidayForm(formData));

  if (!parsed.success) {
    redirect("/admin/configuracion?seccion=feriados&error=feriado");
  }

  const date = dateKeyToUtcDate(parsed.data.date);
  const duplicate = await prisma.holiday.findFirst({
    where: { businessId: membership.businessId, date },
    select: { id: true },
  });

  if (duplicate) {
    redirect("/admin/configuracion?seccion=feriados&error=feriado-duplicado");
  }

  await prisma.holiday.create({
    data: {
      businessId: membership.businessId,
      date,
      name: parsed.data.name,
      isClosed: parsed.data.isClosed,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin");
  redirect("/admin/configuracion?seccion=feriados&ok=feriado-agregado");
}

export async function removeHolidayAction(formData: FormData) {
  const membership = await requireManager();
  const id = String(formData.get("id") ?? "");

  const holiday = await prisma.holiday.findFirst({
    where: { id, businessId: membership.businessId },
    select: { id: true },
  });

  if (!holiday) {
    redirect("/admin/configuracion?seccion=feriados&error=feriado-inexistente");
  }

  await prisma.holiday.delete({ where: { id: holiday.id } });

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin");
  redirect("/admin/configuracion?seccion=feriados&ok=feriado-eliminado");
}
