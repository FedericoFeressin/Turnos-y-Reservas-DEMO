import type { MembershipRole } from "@/generated/prisma/enums";

import { getBusinessContext } from "@/lib/business";
import { redirect } from "next/navigation";

/**
 * Guardas de escritura del panel.
 *
 * La lectura está abierta a cualquier membresía activa; crear y editar queda
 * reservado a dueños y administradores. Los Server Actions vuelven a llamar a
 * esta guarda: ocultar un botón no es autorización.
 */
export function canManage(role: MembershipRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Versión completa del guarda, para acciones que necesitan el usuario actor
 * además del negocio (por ejemplo, al registrar un evento del turno).
 */
export async function requireManagerContext() {
  const context = await getBusinessContext();
  const membership = context.membership;

  if (!membership) {
    redirect("/ingresar?next=/admin");
  }

  if (!canManage(membership.role)) {
    redirect("/admin?error=permiso");
  }

  return { session: context.session, membership };
}

export async function requireManager() {
  const { membership } = await requireManagerContext();
  return membership;
}
