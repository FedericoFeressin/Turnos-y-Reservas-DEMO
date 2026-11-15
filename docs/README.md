# Booking System — Documentación

Plantilla comercializable de gestión de turnos y reservas.
Estado actual: **Etapas 0, 1 y 2 completas**; **Etapa 3 en curso** con PostgreSQL 18.7 y Prisma 7 configurados, el modelo de dominio migrado y un seed funcional. Falta autenticación (Better Auth) y conectar la UI a la base.

Laboratorio visual: `pnpm dev` → <http://localhost:3000/lab>

## Estado verificado

| Comprobación | Resultado |
|---|---|
| `pnpm typecheck` | ✅ sin errores |
| `pnpm lint` | ✅ sin errores |
| `pnpm build` | ✅ 39 rutas (38 estáticas + confirmación dinámica), 5 temas |
| `pnpm db:seed` | ✅ 23 turnos, 6 servicios, 3 profesionales, 17 clientes |
| Anti-solapamiento | ✅ `EXCLUDE USING gist` rechaza turnos solapados del mismo profesional |
| Contraste AA por tokens | ✅ 14 pares × 5 conceptos sin fallas |
| Node | 24.22.3 (instalado en `~/.local/opt/node`) |
| pnpm | 12.21.0 |
| PostgreSQL | 18.7 (instalado en `~/.local/opt/pgsql`, sin `sudo`) |
| Next.js | 16.4.6 |
| Prisma | 7.10.1 (`prisma-client` + adapter `pg`) |
| Tailwind CSS | 4.3.5 |
| TypeScript | 6.0.3 (fijado: `typescript-eslint` aún no soporta TS 7) |

> El binario de Node quedó en `~/.local/bin`, que no está en el `PATH` por defecto.
> Agregá esta línea a `~/.bashrc` (o `~/.zshrc`) para no exportarla en cada terminal:
>
> ```bash
> export PATH="$HOME/.local/bin:$PATH"
> ```

## Índice

| Documento | Contenido |
|---|---|
| [01 — Arquitectura y tecnologías](./01-arquitectura-y-tecnologias.md) | Evaluación de la propuesta, comparación de stack, arquitectura, multi-tenant vs instancia única, estructura de carpetas, MVP, roadmap |
| [02 — Modelo de datos](./02-modelo-de-datos.md) | Esquema Prisma completo, restricciones SQL, índices, disponibilidad, estados, seed |
| [03 — Sistema visual y experimentación](./03-experimentacion-visual.md) | 5 conceptos visuales con tokens, matriz de decisión, plan de la Etapa 2 y registro de ejecución de las rondas L1 y L2 |

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Framework | Next.js 16 LTS + App Router + TypeScript |
| Base de datos | PostgreSQL 16+ |
| ORM | Prisma (+ SQL manual para la restricción anti-solapamiento) |
| UI | Tailwind CSS v4 + shadcn/ui + Lucide |
| Validación | Zod + React Hook Form |
| Autenticación | Better Auth |
| Arquitectura | Monolito modular, capa de servicios por dominio |
| Multi-tenant | Tenant-ready en datos, despliegue por cliente (híbrido) |

## Decisiones validadas por el cliente

| Tema | Decisión |
|---|---|
| Modalidad comercial | **Híbrido**: código tenant-ready + una instancia y base por cliente |
| Rubro piloto | **Barbería / peluquería** ("Estudio Norte") |
| Etapa 2 | **5 conceptos en L1** → ronda L2 sobre **Papel** (elegido para profundizar) → validación final |
| Tema del producto | **Papel** como `:root`; Noche, Órbita, Brisa y Pulso quedan como presets |
| Email de confirmación | Dentro del MVP, con patrón *outbox* y un canal simple |

## Requisitos de entorno

Ya resuelto en esta máquina. Referencia de lo que se instaló (sin `sudo`, dentro del usuario):

```bash
# Node 24 LTS desde el tarball oficial, verificado con SHA-256
~/.local/opt/node/          # instalación
~/.local/bin/{node,npm,npx,pnpm}   # enlaces simbólicos

# pnpm
npm install -g pnpm@latest
```

### PostgreSQL sin `sudo`

La Etapa 3 usa una copia de PostgreSQL 18.7 dentro del usuario, sin `sudo` ni systemd. Se extrajeron los paquetes oficiales de Arch:

```bash
mkdir -p ~/.local/opt/pgsql ~/.local/tmp
cd ~/.local/tmp
curl -fLO https://geo.mirror.pkgbuild.com/extra/os/x86_64/postgresql-18.7-1-x86_64.pkg.tar.zst
curl -fLO https://geo.mirror.pkgbuild.com/extra/os/x86_64/postgresql-libs-18.7-1-x86_64.pkg.tar.zst
bsdtar -xf postgresql-18.7-1-x86_64.pkg.tar.zst -C ~/.local/opt/pgsql
bsdtar -xf postgresql-libs-18.7-1-x86_64.pkg.tar.zst -C ~/.local/opt/pgsql

export PATH="$HOME/.local/opt/pgsql/usr/bin:$PATH"
export LD_LIBRARY_PATH="$HOME/.local/opt/pgsql/usr/lib"
initdb -D ~/.local/share/pgsql/data --auth-local=trust --auth-host=trust \
  --encoding=UTF8 --locale=C.UTF-8
createdb -h localhost -p 5432 turnos
```

La base corre en `localhost:5432`, con autenticación `trust` (solo desarrollo local) y un clúster en `~/.local/share/pgsql/data`. Los binarios necesitan `LD_LIBRARY_PATH`; el script lo resuelve por vos.

No hay Docker instalado y no hace falta: el clúster vive enteramente en el home del usuario.

## Base de datos

Scripts de `package.json`:

| Comando | Qué hace |
|---|---|
| `pnpm db:start` | Levanta el clúster user-local (idempotente) |
| `pnpm db:stop` | Lo detiene ordenadamente |
| `pnpm db:status` | Estado del servidor |
| `pnpm db:migrate` | `prisma migrate dev` (crea y aplica migraciones) |
| `pnpm db:seed` | Repuebla el negocio de demostración |
| `pnpm db:studio` | Abre Prisma Studio |

`scripts/dev-db.sh psql` abre una consola contra la base `turnos`. El script setea `PATH`, `LD_LIBRARY_PATH` y `PGDATA`, así que no hace falta exportar nada.

### Prisma 7

Prisma 7 cambió la configuración:

- El archivo es **`prisma7.config.ts`** (no `prisma.config.ts`).
- El generator es `prisma-client` con `output = "../src/generated/prisma"`. El cliente generado **no se versiona** (`/src/generated/prisma` está en `.gitignore`); se regenera con `pnpm exec prisma generate`, que corre automáticamente en `pnpm install` y en cada migración.
- El cliente exige un **driver adapter**: `@prisma/adapter-pg` sobre `pg`. La conexión se crea así:

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
```

- La CLI no lee `.env` de Next: `prisma7.config.ts` carga `.env.local` y `.env` con `dotenv`.

### Variables de entorno

Copiar `.env.example` a `.env.local` y ajustar el usuario de PostgreSQL:

```bash
cp .env.example .env.local
# editar DATABASE_URL
```

`.env.local` está ignorado por git.

### Seed

`prisma/seed.ts` reproduce el negocio **Estudio Norte** con datos relativos a la semana en que se ejecuta:

- Arranca en el lunes de la semana actual; si se corre un domingo, usa la semana siguiente.
- 6 servicios, 3 profesionales (Sofía no trabaja los miércoles), 17 clientes, 23 turnos y un feriado.
- Owner de prueba: `tomas@estudionorte.com.ar` (`usr_tomas`), con membresía `OWNER`.
- Es idempotente: borra y recrea catálogo, agenda y clientes de ese negocio, sin tocar otros negocios ni usuarios.
- Los turnos ya pasados quedan `COMPLETED`, salvo los marcados `CANCELLED` o `NO_SHOW`.

### Integridad de los turnos

El anti-solapamiento no depende de la aplicación: la migración inicial agrega `btree_gist` y una restricción de exclusión en `appointments` que impide dos turnos activos (`PENDING`/`CONFIRMED`) del mismo profesional cuyos rangos `[starts_at, blocked_until)` se superpongan. También hay `CHECK` de coherencia temporal y de rangos en horarios y servicios (ver `docs/02-modelo-de-datos.md` §5).

## Convención de commits

```
feat:      nueva funcionalidad
fix:       corrección de bug
docs:      solo documentación
style:     formato, sin cambio lógico
refactor:  refactorización sin fix ni feat
test:      agregar o corregir tests
chore:     deps, build, tareas de mantenimiento
```

Commits atómicos, en imperativo y en español. Una rama por funcionalidad.
