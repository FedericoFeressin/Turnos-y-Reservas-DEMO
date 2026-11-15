import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI no lee las variables de entorno de Next.js.
// Se cargan .env.local y .env; el primero tiene prioridad.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
