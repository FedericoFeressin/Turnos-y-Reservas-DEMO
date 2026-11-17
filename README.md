# Booking System

Plataforma de turnos y reservas para negocios de servicios. Una plantilla lista para operar: reserva pública sin cuentas de cliente, agenda real sobre PostgreSQL, panel con roles por membresía, historial de turnos y notificaciones encoladas.

La interfaz usa el tema **Actual**, una identidad moderna y de alto contraste. El laboratorio visual conserva cinco conceptos (Papel, Noche, Órbita, Brisa y Pulso) como presets reutilizables.

---

## Tabla de contenidos

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Inicio rápido](#inicio-rápido)
- [Variables de entorno](#variables-de-entorno)
- [Demo incluida](#demo-incluida)
- [Scripts](#scripts)
- [Pruebas](#pruebas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Despliegue](#despliegue)
- [Seguridad](#seguridad)
- [Documentación](#documentación)
- [Derechos de autor](#derechos-de-autor)

---

## Funcionalidades

| Módulo | Qué resuelve |
|---|---|
| **Reserva pública** | Flujo de servicio → profesional → fecha → hora → datos → confirmación, sin crear cuenta. Identidad por teléfono normalizado e idempotencia por `clientRequestId`. |
| **Disponibilidad real** | Franjas semanales por profesional, ausencias, feriados, anticipación mínima y bloqueo anti-solapamiento en PostgreSQL. |
| **Panel de administración** | Acceso con Better Auth, memberships por negocio y permisos reales según OWNER / ADMIN / STAFF. |
| **Agenda** | Vistas día y semana, KPIs semanales, alta manual de turnos y transiciones de estado válidas. |
| **Catálogo y equipo** | Alta, edición y activación de servicios y profesionales con duración, precio y disponibilidad por persona. |
| **Clientes y horarios** | Historial por cliente, franjas, ausencias y cierres que se reflejan en la reserva pública. |
| **Cancelación segura** | Enlace firmado con HMAC-SHA256, ventana configurable y cancelación idempotente. |
| **Historial y outbox** | Cada transición genera un evento y encola notificaciones en la misma transacción. |
| **Identidad visual** | Tema Actual en todo el producto y laboratorio con cinco presets basados en tokens. |

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.4.6 |
| UI | React | 19.3.1 |
| Estilos | Tailwind CSS | 4.3.5 |
| Tipado | TypeScript | 6.0.3 |
| Base de datos | PostgreSQL | 18.7 |
| ORM | Prisma + `@prisma/adapter-pg` | 7.10.1 |
| Autenticación | Better Auth | 1.7.25 |
| Validación | Zod | 4.3.6 |
| Pruebas | Playwright + axe-core | 1.65.1 / 4.14.0 |
| Gestor de paquetes | pnpm | 12.21.0 |

## Arquitectura

Monolito modular organizado por dominio (`src/lib/booking`, `src/lib/admin`, `src/lib/appointments`). El código es **tenant-ready**: las consultas llevan `businessId` y la reserva pública vive en `/b/[slug]`. El modelo comercial es **híbrido**: una instancia y una base por cliente, sin tablas de tenant en la base.

La definición de contratos, tokens y decisiones técnicas está en [`docs/README.md`](./docs/README.md).

## Requisitos

- Node.js **24 o superior**
- pnpm **12.21.0** (`corepack enable`)
- PostgreSQL accesible (se validó con 18.7); el usuario debe poder crear la extensión `btree_gist`
- Navegador Chromium para las pruebas E2E

## Inicio rápido

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
# Editar .env.local: DATABASE_URL, BETTER_AUTH_SECRET y BETTER_AUTH_URL
pnpm db:deploy
pnpm db:seed
pnpm dev
```

`pnpm install` ejecuta `postinstall`, que genera el cliente de Prisma en `src/generated/prisma` (ese directorio no se versiona). Para correr los tests por primera vez:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

> El build necesita las `devDependencies` (entre ellas, la CLI de Prisma). No uses `pnpm install --prod` en el paso de build.

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión a PostgreSQL, con `?schema=public`. |
| `BETTER_AUTH_SECRET` | Sí | Secreto de sesiones, mínimo 32 caracteres. Puede generarse con `openssl rand -base64 32`. También firma enlaces de cancelación si no se define `BOOKING_TOKEN_SECRET`. |
| `BETTER_AUTH_URL` | Sí | URL base de la app, por ejemplo `http://localhost:3000`. |
| `BOOKING_TOKEN_SECRET` | No | Secreto independiente para los enlaces de cancelación. Recomendado en producción. |
| `SEED_OWNER_PASSWORD` | No | Contraseña del owner al correr el seed. |
| `DEFAULT_BUSINESS_SLUG` | No | Slug del negocio creado por el seed. |

`.env.local` está ignorado por Git y nunca debe subirse al repositorio.

## Demo incluida

El seed crea **Estudio Norte** con 6 servicios, 3 profesionales, 17 clientes, 23 turnos y un feriado de la semana en curso.

| Superficie | URL | Credenciales |
|---|---|---|
| Home | <http://localhost:3000/> | — |
| Reserva pública | <http://localhost:3000/b/estudio-norte> | Sin cuenta de cliente |
| Panel | <http://localhost:3000/admin> | `tomas@estudionorte.com.ar` / `estudio-norte` |
| Ingreso | <http://localhost:3000/ingresar> | ídem |
| Laboratorio visual | <http://localhost:3000/lab> | — |

## Scripts

| Comando | Acción |
|---|---|
| `pnpm dev` | Servidor de desarrollo. |
| `pnpm build` / `pnpm start` | Build de producción y servidor. |
| `pnpm typecheck` | Comprobación de tipos. |
| `pnpm lint` | ESLint. |
| `pnpm test:e2e` | Suite Playwright (10 pruebas, 1 worker). |
| `pnpm db:start` / `db:stop` / `db:status` | Helper para el PostgreSQL del entorno de desarrollo. |
| `pnpm db:deploy` | Aplica migraciones a una base vacía (recomendado para clonar y desplegar). |
| `pnpm db:migrate` | Migración en desarrollo (`prisma migrate dev`). |
| `pnpm db:seed` | Repuebla la demo. |
| `pnpm db:studio` | Abre Prisma Studio. |

## Pruebas

- **10 pruebas E2E** en verde: reserva móvil a 375 px sin zoom ni scroll horizontal, concurrencia, autorización por negocio y rol, historial de eventos y axe.
- **axe** sin violaciones graves en home, asistente de reserva, confirmación e ingreso; verificado también en las siete rutas del panel.
- **Lighthouse** quedó diferido por decisión de producto.

## Estructura del proyecto

```text
src/app/                 Rutas App Router (home, /b/[slug], /admin, /ingresar, /lab)
src/components/          Componentes por dominio y primitivas de UI
src/lib/                 Servicios de dominio, acceso a datos y reglas de negocio
src/styles/themes/       Tokens de Actual, Papel y los cuatro presets restantes
prisma/                  Schema, migración única y seed
tests/                   Especificaciones Playwright y soporte de base de datos
docs/                    Documentación técnica por etapas
```

## Despliegue

1. Configurar las variables de entorno en la plataforma (nunca commitear `.env.local`).
2. Instalar dependencias completas para que corra `postinstall`.
3. Ejecutar `pnpm db:deploy` contra la base de producción.
4. Correr `pnpm build` y servir con `pnpm start`.

En entornos serverless conviene usar un pooler de conexiones y mantener `options: "-c timezone=UTC"` en el adapter de Prisma: sin ese ajuste los `timestamptz` se guardan con un desfase de tres horas en `America/Argentina/Buenos_Aires`.

## Seguridad

- Los secretos no están versionados; `.env.example` solo contiene placeholders.
- Las contraseñas se almacenan con Better Auth y el acceso al panel valida sesión y membresía en servidor.
- Los enlaces públicos de cancelación se firman con HMAC-SHA256 y expiran según el inicio del turno.
- Las acciones del panel verifican permisos tanto en la interfaz como en el servidor.

## Documentación

La memoria técnica completa —arquitectura, modelo de datos, sistema visual, decisiones validadas y cierre de etapas— está en [`docs/README.md`](./docs/README.md).

## Derechos de autor

Copyright © 2026 Federico. Todos los derechos reservados.

Este proyecto y su documentación son de titularidad privada. No se concede licencia de uso, copia, modificación, distribución ni comercialización sin autorización escrita del titular. Consultá [`LICENSE`](./LICENSE).
