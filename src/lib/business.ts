import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Contexto del panel: sesión autenticada + membresía activa con su negocio.
 *
 * `cache` memoiza por request, así el layout y la página comparten una sola
 * consulta. La membresía puede ser `null`; el layout de `/admin` muestra el
 * estado "sin negocio" en ese caso.
 */
export const getBusinessContext = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/ingresar?next=/admin");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: { business: true },
    orderBy: { createdAt: "asc" },
  });

  return { session, membership };
});
