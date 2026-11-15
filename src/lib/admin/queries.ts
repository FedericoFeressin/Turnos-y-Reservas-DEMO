import { prisma } from "@/lib/prisma";

/** Consultas del panel. Todas filtran por `businessId`: frontera del tenant. */

export async function listServices(businessId: string) {
  return prisma.service.findMany({
    where: { businessId, deletedAt: null },
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      priceCents: true,
      durationMinutes: true,
      bufferAfterMinutes: true,
      isActive: true,
      isPublic: true,
      sortOrder: true,
      _count: { select: { employees: true, appointments: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listEmployees(businessId: string) {
  return prisma.employee.findMany({
    where: { businessId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      displayName: true,
      title: true,
      email: true,
      phone: true,
      color: true,
      isActive: true,
      isBookable: true,
      sortOrder: true,
      services: { select: { serviceId: true } },
      _count: { select: { appointments: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { firstName: "asc" }],
  });
}

export type ServiceRow = Awaited<ReturnType<typeof listServices>>[number];
export type EmployeeRow = Awaited<ReturnType<typeof listEmployees>>[number];
