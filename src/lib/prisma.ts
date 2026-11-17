import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Falta DATABASE_URL. Copiá .env.example a .env.local y completá la conexión.",
    );
  }

  // El adaptador pg serializa los `Date` como `YYYY-MM-DD HH:mm:ss` sin zona.
  // Si la sesión de PostgreSQL queda en America/Argentina/Buenos_Aires, esos
  // valores se interpretan como hora local y los timestamptz se guardan con un
  // desfase de 3 horas. Fijar UTC en la conexión hace que la lectura y la
  // escritura usen el mismo instante que el `Date` de JavaScript.
  const adapter = new PrismaPg({
    connectionString,
    options: "-c timezone=UTC",
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// En desarrollo Next recarga los módulos; sin el singleton se abriría un pool
// nuevo en cada recarga hasta agotar las conexiones de Postgres.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
