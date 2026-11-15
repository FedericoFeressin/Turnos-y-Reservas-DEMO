"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireManager } from "@/lib/admin/guard";
import {
  readScheduleForm,
  readTimeOffForm,
  scheduleSchema,
  timeOffSchema,
  timeToMinutes,
} from "@/lib/admin/schemas";
import { dayBounds } from "@/lib/date";
import { prisma } from "@/lib/prisma";

async function employeeBelongsToBusiness(
  businessId: string,
  employeeId: string,
): Promise<boolean> {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, businessId, deletedAt: null },
    select: { id: true },
  });

  return employee !== null;
}

export async function addScheduleAction(formData: FormData) {
  const membership = await requireManager();
  const values = readScheduleForm(formData);
  const parsed = scheduleSchema.safeParse(values);

  if (!parsed.success) {
    const suffix = values.employeeId
      ? `?empleado=${encodeURIComponent(values.employeeId)}&error=horario`
      : "?error=horario";
    redirect(`/admin/horarios${suffix}`);
  }

  const { employeeId, dayOfWeek, start, end } = parsed.data;
  const base = `/admin/horarios?empleado=${employeeId}`;

  if (!(await employeeBelongsToBusiness(membership.businessId, employeeId))) {
    redirect("/admin/horarios?error=profesional");
  }

  const startMinute = timeToMinutes(start);
  const endMinute = timeToMinutes(end);

  const ranges = await prisma.employeeSchedule.findMany({
    where: { employeeId, dayOfWeek },
    select: { startMinute: true, endMinute: true },
  });

  const overlaps = ranges.some(
    (range) => startMinute < range.endMinute && endMinute > range.startMinute,
  );

  if (overlaps) {
    redirect(`${base}&error=superpuesto`);
  }

  await prisma.employeeSchedule.create({
    data: { employeeId, dayOfWeek, startMinute, endMinute },
  });

  revalidatePath("/admin/horarios");
  redirect(`${base}&ok=franja-agregada`);
}

export async function removeScheduleAction(formData: FormData) {
  const membership = await requireManager();
  const id = String(formData.get("id") ?? "");

  const schedule = await prisma.employeeSchedule.findFirst({
    where: { id, employee: { businessId: membership.businessId } },
    select: { id: true, employeeId: true },
  });

  if (!schedule) {
    redirect("/admin/horarios?error=franja");
  }

  await prisma.employeeSchedule.delete({ where: { id: schedule.id } });

  revalidatePath("/admin/horarios");
  redirect(`/admin/horarios?empleado=${schedule.employeeId}&ok=franja-eliminada`);
}

export async function addTimeOffAction(formData: FormData) {
  const membership = await requireManager();
  const parsed = timeOffSchema.safeParse(readTimeOffForm(formData));

  if (!parsed.success) {
    redirect("/admin/horarios?error=fechas#ausencias");
  }

  const { employeeId, type, startDate, endDate, reason } = parsed.data;

  if (
    employeeId &&
    !(await employeeBelongsToBusiness(membership.businessId, employeeId))
  ) {
    redirect("/admin/horarios?error=profesional#ausencias");
  }

  const { timezone } = membership.business;

  await prisma.timeOff.create({
    data: {
      businessId: membership.businessId,
      employeeId: employeeId || null,
      type,
      startsAt: dayBounds(startDate, timezone).start,
      endsAt: dayBounds(endDate, timezone).end,
      reason: reason || null,
    },
  });

  revalidatePath("/admin/horarios");
  redirect("/admin/horarios?ok=ausencia-creada#ausencias");
}

export async function removeTimeOffAction(formData: FormData) {
  const membership = await requireManager();
  const id = String(formData.get("id") ?? "");

  const timeOff = await prisma.timeOff.findFirst({
    where: { id, businessId: membership.businessId },
    select: { id: true },
  });

  if (!timeOff) {
    redirect("/admin/horarios?error=ausencia#ausencias");
  }

  await prisma.timeOff.delete({ where: { id: timeOff.id } });

  revalidatePath("/admin/horarios");
  redirect("/admin/horarios?ok=ausencia-eliminada#ausencias");
}
