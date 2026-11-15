"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireManager } from "@/lib/admin/guard";
import {
  employeeSchema,
  fieldErrors,
  readEmployeeForm,
  type EmployeeFormState,
  type EmployeeFormValues,
} from "@/lib/admin/schemas";
import { prisma } from "@/lib/prisma";

/**
 * Servicios del negocio que pueden asignarse a un profesional. Se filtran por
 * `businessId` para que un id manipulado no pueda enlazar datos de otro tenant.
 */
async function resolveServiceIds(businessId: string, requested: string[]) {
  if (requested.length === 0) return [];

  const services = await prisma.service.findMany({
    where: { businessId, id: { in: requested } },
    select: { id: true },
  });

  return services.map((service) => service.id);
}

export async function saveEmployeeAction(
  _state: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const membership = await requireManager();
  const values = readEmployeeForm(formData);
  const parsed = employeeSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Revisá los campos marcados.",
      fieldErrors: fieldErrors<EmployeeFormValues>(parsed.error),
      values,
    };
  }

  const { businessId } = membership;
  const data = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    displayName: parsed.data.displayName || null,
    title: parsed.data.title || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    color: parsed.data.color,
    isBookable: parsed.data.isBookable,
    isActive: parsed.data.isActive,
  };

  const serviceIds = await resolveServiceIds(businessId, parsed.data.serviceIds);
  const id = String(formData.get("id") ?? "");

  if (id) {
    const existing = await prisma.employee.findFirst({
      where: { id, businessId },
      select: { id: true },
    });

    if (!existing) {
      return {
        error: "Ese profesional ya no existe.",
        fieldErrors: {},
        values,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.employee.update({ where: { id }, data });
      await tx.employeeService.deleteMany({ where: { employeeId: id } });

      if (serviceIds.length > 0) {
        await tx.employeeService.createMany({
          data: serviceIds.map((serviceId) => ({ employeeId: id, serviceId })),
        });
      }
    });

    revalidatePath("/admin/equipo");
    redirect("/admin/equipo?ok=actualizado");
  }

  const last = await prisma.employee.aggregate({
    where: { businessId },
    _max: { sortOrder: true },
  });

  await prisma.$transaction(async (tx) => {
    const employee = await tx.employee.create({
      data: {
        ...data,
        businessId,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
      select: { id: true },
    });

    if (serviceIds.length > 0) {
      await tx.employeeService.createMany({
        data: serviceIds.map((serviceId) => ({
          employeeId: employee.id,
          serviceId,
        })),
      });
    }
  });

  revalidatePath("/admin/equipo");
  redirect("/admin/equipo?ok=creado");
}

export async function toggleEmployeeAction(formData: FormData) {
  const membership = await requireManager();
  const id = String(formData.get("id") ?? "");

  const employee = await prisma.employee.findFirst({
    where: { id, businessId: membership.businessId },
    select: { id: true, isActive: true },
  });

  if (!employee) {
    redirect("/admin/equipo?error=no-encontrado");
  }

  await prisma.employee.update({
    where: { id: employee.id },
    data: { isActive: !employee.isActive },
  });

  revalidatePath("/admin/equipo");
  redirect("/admin/equipo?ok=actualizado");
}
