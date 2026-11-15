import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/prisma";

/**
 * Autenticación del panel.
 *
 * - Email y contraseña: el negocio da de alta a su equipo; no hay registro
 *   público. Los usuarios se crean desde el seed o desde el panel de equipo.
 * - `nextCookies` va último: traduce los `Set-Cookie` de Better Auth al helper
 *   de cookies de Next, necesario en Server Actions.
 *
 * Las tablas `User`, `Session`, `Account` y `Verification` están mapeadas a
 * snake_case en `prisma/schema.prisma`; el adaptador las resuelve por el nombre
 * del modelo de Prisma.
 */
export const auth = betterAuth({
  appName: "Booking System",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  plugins: [nextCookies()],
});
