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

export async function requireManager() {
  const { membership } = await getBusinessContext();

  if (!membership) {
    redirect("/ingresar?next=/admin");
  }

  if (!canManage(membership.role)) {
    redirect("/admin?error=permiso");
  }

  return membership;
}
