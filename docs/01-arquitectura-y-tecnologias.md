# 01 — Análisis, stack y arquitectura

> Etapa 1 del proyecto Booking System. Documento de decisiones, no de implementación.
> Fecha: noviembre 2026.

---

## 0. Resumen ejecutivo

| Decisión | Recomendación | Reversible |
|---|---|---|
| Framework | **Next.js 16 (LTS) + App Router** | Sí, con costo alto |
| Lenguaje | TypeScript estricto | No |
| Base de datos | **PostgreSQL 16+** | Sí |
| ORM | **Prisma** + migración SQL manual para la restricción anti-solapamiento | Sí |
| UI | **Tailwind CSS v4 + shadcn/ui + Lucide** | Sí |
| Validación / forms | **Zod + React Hook Form** | Sí |
| Autenticación | **Better Auth** (Prisma adapter) | Sí |
| Fechas | `date-fns` + `date-fns-tz` | Sí |
| Calendario admin | Componente propio accesible (no librería pesada) | Sí |
| Modelo comercial | **Código tenant-ready + despliegue por cliente** (híbrido A/B) | Sí |
| Arquitectura | **Monolito modular** con capa de servicios | No |
| Multi-tenant | `businessId` en todas las tablas desde el día 1, sin UI de multi-tenant | No |

**Hipótesis de producto:** el 70% del valor está en (1) el flujo de reserva móvil y (2) un panel que un dueño de negocio pueda usar sin manual. El diseño no es decoración: es el diferencial comercial frente a Calendly/Booksy.

---

## 1. Evaluación de la propuesta

### Fortalezas

- **Nicho con demanda real y recurrente.** Peluquerías, consultorios y talleres siguen gestionando turnos por WhatsApp. Hay disposición a pagar por algo que elimine el ida y vuelta.
- **Reutilización genuina.** El núcleo (servicios + profesionales + disponibilidad + reservas) es idéntico entre rubros. Lo que cambia es la capa de presentación y algunos módulos.
- **Alcance delimitado.** El brief define entidades, flujos y estados. Eso evita el "¿y si además hacemos...?".
- **El diseño como diferenciador.** La mayoría de los competidores son funcionales pero genéricos. Una plantilla con identidad fuerte se vende sola.

### Riesgos, ordenados por impacto

| # | Riesgo | Por qué duele | Mitigación |
|---|---|---|---|
| 1 | **La Etapa 2 se come el proyecto** | 5 conceptos × 8 pantallas hechas a mano = 40 pantallas. Es el error clásico de "voy a hacer 4 diseños completos". | Un solo sistema de tokens + composiciones compartidas. Un concepto = un archivo de tokens + 2–3 variantes estructurales. Ver `03-experimentacion-visual.md`. |
| 2 | **Ambigüedad del modelo comercial** | "Instalación individual" y "multi-tenant" implican arquitecturas, costos y niveles de seguridad distintos. Decidirlo tarde obliga a reescribir. | Diseñar tenant-ready y desplegar por cliente. Ver §4. |
| 3 | **Doble reserva por concurrencia** | Dos clientes eligiendo el mismo horario. Es el bug que destruye la confianza en este producto. | Restricción `EXCLUDE` en PostgreSQL + transacción + reintento. Ver `02-modelo-de-datos.md` §6. |
| 4 | **Zona horaria y DST** | Un turno a las 15:00 debe ser 15:00 en el local, no en el servidor. Argentina no aplica DST hoy, pero el producto es comercializable a otros países. | `timestamptz` en UTC, horarios como minutos locales, `Business.timezone` IANA. |
| 5 | **Accesibilidad del calendario** | Las grillas de calendario son trampas de teclado y de lector de pantalla. | Vista de grilla + vista de lista equivalente, navegación por teclado documentada. |
| 6 | **Sobredimensionar el panel** | Reportes, gráficos, exportaciones. Nada de eso valida el producto. | MVP acotado (§6). |
| 7 | **Sin notificaciones, el producto no sirve en producción** | El brief las pone como "futuro", pero un negocio real necesita confirmar por email/WhatsApp o el cliente no sabe que tiene turno. | Dejar el patrón *outbox* implementado en el MVP con un canal email simple. Se activa el envío real en Etapa 3.5. |
| 8 | **El brief pide "4 estilos" y el agente puede entregar 4 skins del mismo layout** | Sería trabajo sin valor: cuatro variaciones de color no son cuatro conceptos. | Cada concepto define densidad, tipografía, radios, jerarquía y tono de copy, no solo paleta. |

### Vacíos del brief y supuestos que adopté

1. **Rubro piloto:** asumo **barbería/peluquería** porque ejercita todo el modelo (múltiples profesionales, servicios con duración variable, buffer entre turnos, reserva sin pago). Es el caso más rico visualmente. Si preferís otro, se cambia solo el contenido de prueba.
2. **Idioma:** UI en español rioplatense (`es-AR`), código e identificadores en inglés. Textos centralizados para permitir i18n futura sin reescribir componentes.
3. **Moneda:** ARS por defecto, pero `currency` por negocio (no hardcodeada).
4. **Un local por negocio en el MVP.** "Sucursales" queda como módulo futuro, sin bloquear el modelo (se puede agregar `Location` después).
5. **El cliente final reserva sin crear cuenta.** Email o teléfono obligatorio, uno de los dos. Crear cuenta es fricción innecesaria para reservar una vez.
6. **Pagos fuera del MVP**, pero el estado `PENDING` + settings de seña quedan preparados.
7. **Un solo deploy, una sola base.** Sin microservicios, sin colas externas, sin Redis en el MVP.

### Lo que NO voy a hacer (y por qué)

- **No** React Native / app nativa: PWA responsive primero.
- **No** librería de componentes premium (MUI, Mantine): shadcn/ui da control total del código, que es justo lo que necesita una plantilla personalizable.
- **No** GraphQL/tRPC en el MVP: Server Actions + Route Handlers cubren el caso con menos superficie.
- **No** i18n completo: solo la estructura preparada.
- **No** tests E2E de todo: solo los flujos críticos (reservar, cancelar, conflicto de horario).

---

## 2. Comparación de tecnologías

### 2.1 Framework

Ponderación: encaje con el producto (35%), ecosistema/DX (25%), performance (20%), mantenimiento a largo plazo (20%).

| Criterio | **Next.js 16** | Astro 5 | SvelteKit | TanStack Start |
|---|---|---|---|---|
| Naturaleza de la app | 80% panel autenticado + CRUD + calendario | Excelente para contenido, débil para apps densas | Muy buena para apps interactivas | Muy buena, pero ecosistema más chico |
| Server Components / datos | Sí, nativo | Islas; el panel termina siendo una SPA aparte | Load functions | Loaders |
| Mutaciones | Server Actions + Route Handlers | Endpoints | Form actions | Server functions |
| Autenticación / sesiones | Maduro | Requiere integración manual | Buena | Buena |
| shadcn/ui | Primera clase | Limitado | No | Parcial |
| Contratar/mantener | Perfil más abundante | Perfil escaso | Perfil escaso | Perfil muy escaso |
| Complejidad operativa | Baja (un deploy, una base) | Baja, pero dos mundos (sitio + app) | Baja | Media |

**Decisión: Next.js 16 (LTS) + App Router.** El sitio público es la parte fácil; el panel es lo que define la elección, y Astro obligaría a construir dos aplicaciones (sitio + panel) y a mantener dos formas de hacer lo mismo.

⚠️ **Versión y seguridad.** A noviembre de 2026 la línea activa es **16.4.x** (LTS). El release de seguridad de noviembre de 2026 incluye una vulnerabilidad **de alta severidad de fuga de caché entre tenants** al combinar `unstable_cache` y `use cache` cuando la función cacheada lee un parámetro raíz (por ejemplo el `slug` del negocio). Consecuencia directa para el diseño:

> **Regla de proyecto:** ninguna función cacheada puede leer el tenant y quedar cacheada sin segmentar. Toda caché de datos de negocio se invalida por tag `business:<id>` y se versiona por `updatedAt`. El sitio público se cachea por `slug`, nunca con `use cache` genérico sobre datos mutables.

Se fija versión exacta en `package.json` (sin `^`) y se actualiza con revisión de changelog.

### 2.2 Base de datos

| Criterio | **PostgreSQL** | SQLite | MySQL |
|---|---|---|---|
| Concurrencia de escritura | Excelente (MVCC, row locks) | Un escritor a la vez (WAL ayuda) | Buena |
| Anti-solapamiento declarativo | `EXCLUDE USING gist` con rangos | No | No (solo triggers) |
| Tipos de rango / `timestamptz` | Nativos, correctos con zona horaria | `TEXT`/`INTEGER`, sin zona horaria real | Limitado |
| JSON validable + indexable | `jsonb` + GIN | `json1`, limitado | `json`, aceptable |
| Hosting gestionado barato | Neon, Supabase, RDS | Archivo local / Turso | PlanetScale, RDS |
| Multi-tenant futuro (RLS) | RLS nativo | No | No |
| Operación en local | Docker / servicio del sistema | Un archivo | Docker |

**Decisión: PostgreSQL.** No es solo "porque el brief lo pide": la razón técnica es la **restricción de exclusión sobre rangos**, que hace imposible el doble booking a nivel de motor en lugar de depender de un `SELECT` previo (que siempre tiene una ventana de carrera). SQLite no puede expresarla y su modelo de escritura única limita el crecimiento multi-tenant.

**Desviación consciente:** el `agent.md` declara dominio de SQLite. Acá PostgreSQL es la herramienta correcta para el problema (concurrencia + rangos + RLS futura). Uso SQLite solo si el objetivo fuese un demo de un solo local sin concurrencia real.

> Nota de entorno: en esta máquina **no hay Node, npm, Docker ni PostgreSQL instalados** (CachyOS/Arch). Es parte de la Etapa 0.

### 2.3 ORM

| Criterio | **Prisma** | Drizzle | Kysely |
|---|---|---|---|
| DX / autocompletado | Muy alto | Alto | Medio |
| Migraciones | `prisma migrate`, diffs automáticos | `drizzle-kit`, más manual | Manual |
| SQL crudo cuando hace falta | `$queryRaw` / migración manual | Natural | Natural |
| SQL generado predecible | A veces genera joins subóptimos | Sí, es lo que escribís | Sí |
| Tipos en queries complejas | Buenos | Muy buenos | Muy buenos |
| Curva de aprendizaje | Baja | Media | Media |
| Adapter de Better Auth | Oficial | Oficial | No oficial |

**Decisión: Prisma.** El 95% de las consultas del proyecto son simples (CRUD + rangos de fechas); el 5% restante (disponibilidad y anti-solapamiento) se escribe en SQL dentro de una migración versionada. Prisma gana en velocidad de desarrollo y en migraciones reproducibles, que es lo que un producto que se replica por cliente necesita.

**Consecuencia:** la restricción `EXCLUDE` no se puede expresar en `schema.prisma`. Se crea con `prisma migrate dev --create-only` y se edita el SQL a mano, versionado en `prisma/migrations/`.

### 2.4 UI y sistema visual

- **Tailwind CSS v4**: configuración *CSS-first* (`@theme` en vez de `tailwind.config.js`). Es la base del sistema de theming: los colores del negocio son custom properties, no clases generadas en build.
- **shadcn/ui**: los componentes se copian al repo, no se importan de un paquete. Para esta plantilla es determinante: cada cliente puede personalizar sin pelear con overrides de una librería cerrada. A la fecha, el CLI v4 soporta presets (`shadcn apply`) y Base UI como primitiva por defecto (Radix sigue disponible).
- **Lucide**: íconos consistentes, tree-shakeable.
- **Descartado:** MUI/Mantine/Chakra (difíciles de re-brandear), Bootstrap (estética difícil de salir), DaisyUI (limita la identidad).

### 2.5 Formularios y validación

`Zod` como única fuente de verdad de esquemas, compartidos entre cliente y servidor. `React Hook Form` + `@hookform/resolvers` para el estado del formulario.

> El esquema Zod se valida **siempre** otra vez en el servidor. El cliente solo mejora la UX; nunca es la defensa.

### 2.6 Autenticación

| Criterio | **Better Auth** | Auth.js v5 | Clerk |
|---|---|---|---|
| Estado del proyecto | Activo; tomó el mantenimiento de Auth.js | Modo mantenimiento | Comercial |
| Datos en tu DB | Sí | Sí | No (vendor) |
| Roles / organizaciones | Plugin oficial | Manual | Plan pago |
| 2FA / passkeys | Incluidos | No nativos | Plan pago |
| Costo | 0 | 0 | Por MAU |
| Lock-in | Bajo | Bajo | Alto |

**Decisión: Better Auth.** Autohospedado, sesiones en PostgreSQL, roles y organizaciones como plugin (útil cuando se active multi-tenant), y no ata el producto a un proveedor que después haya que pagar por cliente.

**Esquema de permisos del MVP:** `OWNER` (todo), `STAFF` (turnos y clientes; sin configuración ni gestión de servicios). La autorización se evalúa en el servidor, en un único helper (`requireMembership`), no en cada componente.

### 2.7 Fechas

`date-fns` v4 + `date-fns-tz`. Reglas:

- En base de datos: `timestamptz` (UTC).
- En horarios de atención: día de semana + minutos desde medianoche **locales del negocio** (inmune a DST).
- Conversión a UTC solo al calcular disponibilidad, usando `Business.timezone`.
- En la UI: siempre en la zona del negocio, con la zona explícita si el usuario está en otra.

Descartado: `moment` (obsoleto), `dayjs` (correcto pero sin ventaja acá), `Temporal` (aún no es estándar en todos los runtimes; se reevalúa).

### 2.8 Calendario

| Opción | Pro | Contra |
|---|---|---|
| **Componente propio** | Control total del diseño, accesible, sin licencias, vista por profesional a medida | Es trabajo real (grilla, drag, teclado) |
| FullCalendar | Maduro | La vista de recursos (por profesional) es **premium paga**; difícil de estilizar |
| Schedule-X | Open source, moderno | Menos flexible para la vista de recursos; a evaluar |

**Decisión:** calendario propio para el MVP, con **vista lista** como alternativa accesible y móvil. Es una de las pantallas que más define la percepción de calidad del producto; delegarla a una librería con licencia paga por cliente no escala comercialmente. Drag & drop queda para la Etapa 3.5 (primero "mover turno" con formulario, que es accesible y suficiente).

### 2.9 Stack completo y justificación de cada dependencia

| Paquete | Para qué | ¿Se puede evitar? |
|---|---|---|
| `next` | Framework | No |
| `react`, `react-dom` | UI | No |
| `typescript` | Tipos | No |
| `tailwindcss` | Estilos | No |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Variantes de componentes | Son la base de shadcn |
| `lucide-react` | Íconos | Sí, pero no conviene |
| `zod` | Validación | No |
| `react-hook-form` + `@hookform/resolvers` | Formularios | Sí, pero ahorra mucho |
| `@prisma/client`, `prisma` | ORM | No |
| `better-auth` + `@better-auth/prisma-adapter` | Auth | No |
| `date-fns`, `date-fns-tz` | Fechas | No |
| `sonner` | Toasts | Sí (shadcn migró a sonner) |
| `recharts` | Gráficos del dashboard | Sí — solo si el dashboard los necesita |
| `vitest`, `@testing-library/react` | Tests unitarios | No |
| `@playwright/test`, `@axe-core/playwright` | E2E + accesibilidad | No |
| `eslint`, `prettier` | Calidad | No |

**No se instala nada más sin justificarlo por escrito en el PR.**

---

## 3. Arquitectura recomendada

### 3.1 Forma general: monolito modular

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js (un deploy)                                         │
│                                                              │
│  app/            Rutas, layouts, páginas. Finas.             │
│    (public)      Sitio del negocio + flujo de reserva        │
│    (admin)       Panel autenticado                           │
│    api/          Route Handlers públicos (availability, etc.)│
│                                                              │
│  modules/        Lógica de negocio por dominio               │
│    appointments/ availability/ services/ staff/ customers/   │
│    settings/     theme/        auth/      business/          │
│      ├── schemas.ts     Zod (entrada/salida)                 │
│      ├── queries.ts     Lecturas (siempre con businessId)    │
│      ├── service.ts     Casos de uso + reglas               │
│      └── actions.ts     Server Actions (adaptadores finos)   │
│                                                              │
│  components/     UI reutilizable (ui/, public/, admin/, ...) │
│  lib/            db, auth, rbac, errors, dates, rate-limit   │
│  styles/themes/  Tokens por concepto visual                  │
└──────────────────────────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  PostgreSQL     │
                    └─────────────────┘
```

**Reglas no negociables:**

1. **Las páginas no consultan Prisma.** Una página importa de `modules/*`, nunca de `@prisma/client`. Esto permite testear la lógica sin UI y cambiar el transporte (actions → API) sin tocar pantallas.
2. **Toda consulta recibe `businessId`.** No existe un query de negocio sin scope. Se fuerza con un tipo `TenantContext` y un helper `requireBusiness()` que lee la sesión (admin) o el `slug` (público).
3. **Validación en el borde.** Toda Server Action y Route Handler empieza con `schema.parse(input)`. Sin excepción.
4. **Server-first.** `"use client"` solo donde hay interacción real (calendario, selector de horarios, formularios). El resto es RSC.
5. **Errores tipados.** `AppError` con `code` (`SLOT_TAKEN`, `OUTSIDE_HOURS`, `UNAUTHORIZED`, ...). La UI mapea códigos a mensajes; el servidor nunca devuelve stack traces.
6. **Idempotencia en reservas.** El formulario genera un `clientRequestId` (UUID). Si el usuario hace doble clic o reintenta, no se crean dos turnos.
7. **Caché segmentada por tenant.** Tags `business:<id>` y `public:<slug>`. Prohibido cachear datos de negocio sin tag (ver §2.1).

### 3.2 Flujo de una reserva (camino crítico)

```
Cliente → /b/[slug]/reservar
  1. GET  server: servicios activos + profesionales habilitados
  2. POST /api/availability  { serviceId, employeeId?, date }
        → calcula slots en el servidor (nunca en el cliente)
  3. Cliente elige slot y completa datos
  4. Server Action createAppointment(input)
        a. zod.parse
        b. requireBusiness(slug) + rate limit por IP/teléfono
        c. upsert Customer (por teléfono/email normalizado)
        d. TRANSACCIÓN:
             - revalidar slot (por si cambió desde el GET)
             - INSERT Appointment  → si choca, EXCLUDE constraint falla
        e. si 23P01 (exclusion_violation) → reintentar 0 veces, devolver SLOT_TAKEN
        f. encolar Notification (outbox, misma transacción)
  5. Redirect a /confirmacion/[token]  (token opaco, no el id)
```

**Por qué revalidar en el servidor:** entre el `GET` de disponibilidad y el `POST` pueden pasar minutos. La fuente de verdad es el `INSERT` dentro de la transacción, no la lista que vio el usuario.

### 3.3 Enforcement de tenant

Tres capas, de menor a mayor costo:

| Capa | MVP | Notas |
|---|---|---|
| 1. App: toda query filtra por `businessId` | ✅ | Única defensa en el MVP |
| 2. Tests: suite que intenta acceso cruzado | ✅ | Un test por módulo |
| 3. PostgreSQL RLS con `app.tenant_id` | Etapa 5 | Defensa en profundidad para multi-tenant real |

No implemento RLS ahora porque Prisma con un único usuario de conexión requiere `SET LOCAL app.tenant_id` por transacción; es complejidad que no paga hasta tener varios negocios en la misma base.

### 3.4 Observabilidad mínima

- Logs estructurados (JSON) con `businessId`, `requestId`, `action`.
- Sin PII en logs (teléfono/email enmascarados).
- `error.tsx` y `not-found.tsx` reales, no pantallas en blanco.

---

## 4. Instalación individual vs multi-tenant

| Dimensión | **A. Instancia por cliente** | **B. Plataforma multi-tenant** |
|---|---|---|
| Aislamiento de datos | Total (base separada) | Lógico (filtro + RLS) |
| Riesgo de fuga entre clientes | Casi nulo | Requiere disciplina y tests; hay CVEs reales de caché cruzada |
| Costo por cliente | DB + deploy (~USD 0–20/mes) | Marginal (~centavos) |
| Onboarding | Manual: crear DB, deploy, seed | Self-service en minutos |
| Actualizaciones | N deploys (hay que versionar y automatizar) | Un deploy para todos |
| Personalización profunda | Libre (se puede tocar el código) | Limitada a lo que la plataforma permita |
| Dominio propio | Trivial | Requiere wildcard + verificación |
| Complejidad inicial | Baja | Media-alta |
| Cuándo conviene | 1–15 clientes, venta asistida | 20+ clientes, autoservicio, suscripción |

### Recomendación: híbrido — "tenant-ready, single-tenant deploy"

1. **Modelo de datos y código preparados para múltiples negocios** desde el día 1: `businessId` en todas las tablas, rutas `/b/[slug]`, tema por negocio, sin singletons globales. Costo: casi cero.
2. **Comercialmente, Modalidad A** durante el MVP y los primeros clientes: una instancia y una base por negocio. Permite personalizar de verdad (que es el argumento de venta) y elimina el riesgo de fuga entre clientes.
3. **Migrar a B** cuando exista demanda de autoservicio. El código ya lo soporta: alcanza con apuntar todas las instancias a una base, activar RLS y agregar el alta de negocios.
4. **Automatizar el aprovisionamiento** en Etapa 5 (script: crear DB, correr migraciones, seed del negocio, deploy). Sin eso, la Modalidad A se vuelve insostenible a los 10 clientes.

**Descartado:** empezar multi-tenant "porque total es solo un campo". Un campo no es multi-tenant: faltan RLS, cuotas, aislamiento de caché, dominios, planes y facturación. Es la sobreingeniería que el propio brief pide evitar.

---

## 5. Estructura del proyecto

```
turnos-y-reservas/
├── docs/
│   ├── README.md
│   ├── 01-arquitectura-y-tecnologias.md
│   ├── 02-modelo-de-datos.md
│   ├── 03-experimentacion-visual.md
│   └── 04-sistema-visual.md          ← paleta, tipografía, componentes y reglas de Papel
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   └── images/                       ← placeholders de la demo, luego por cliente
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── (public)/
│   │   │   └── b/[slug]/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx                  Inicio
│   │   │       ├── servicios/page.tsx
│   │   │       ├── equipo/page.tsx
│   │   │       ├── reservar/page.tsx         Flujo de reserva
│   │   │       └── reserva/[token]/page.tsx  Confirmación
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       ├── layout.tsx                Sidebar + guard
│   │   │       ├── page.tsx                  Dashboard
│   │   │       ├── turnos/page.tsx           Calendario + lista
│   │   │       ├── servicios/page.tsx
│   │   │       ├── equipo/page.tsx
│   │   │       ├── clientes/page.tsx
│   │   │       └── configuracion/{negocio,horarios,reservas,apariencia}
│   │   ├── api/
│   │   │   ├── auth/[...all]/route.ts
│   │   │   └── availability/route.ts
│   │   ├── lab/                              ← Etapa 2, solo dev
│   │   │   ├── page.tsx                      Comparador de conceptos
│   │   │   └── [concept]/...
│   │   └── error.tsx / not-found.tsx
│   ├── components/
│   │   ├── ui/                               shadcn + primitivas propias
│   │   ├── public/                           Hero, ServiceCard, StaffCard...
│   │   ├── booking/                          Stepper, DatePicker, SlotGrid
│   │   ├── admin/                            Kpi, DataTable, Sidebar
│   │   └── calendar/                         DayGrid, WeekGrid, AgendaList
│   ├── modules/
│   │   ├── appointments/
│   │   ├── availability/
│   │   ├── services/
│   │   ├── staff/
│   │   ├── customers/
│   │   ├── settings/
│   │   ├── theme/
│   │   ├── notifications/
│   │   └── auth/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── rbac.ts
│   │   ├── errors.ts
│   │   ├── dates.ts
│   │   ├── rate-limit.ts
│   │   ├── env.ts                            validación de env con Zod
│   │   └── utils.ts
│   ├── styles/
│   │   ├── tokens.css                        contrato de variables
│   │   └── themes/                           un archivo por concepto
│   ├── config/
│   │   ├── features.ts                       flags de módulos
│   │   └── site.ts
│   └── types/
├── tests/
│   ├── unit/
│   └── e2e/
├── .env.example
├── .gitignore
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

**Criterio de organización:** por **dominio** (`modules/`), no por tipo de archivo. Un cambio en reservas toca una carpeta, no cinco.

---

## 6. Definición del MVP

### Dentro

**Sitio público (por negocio)**
- Inicio con identidad del negocio, servicios destacados, equipo, horarios, ubicación y contacto.
- Listado de servicios con precio y duración.
- Perfil de profesionales.
- Flujo de reserva: servicio → profesional (u "cualquiera") → fecha → horario → datos → revisión → confirmación.
- Página de confirmación con código de reserva.
- Página de cancelación por link con token.
- Políticas de cancelación visibles.

**Panel**
- Login (email + contraseña), roles `OWNER` / `STAFF`.
- Dashboard: turnos de hoy, pendientes, confirmados, cancelados, ingresos estimados, próximos turnos.
- Turnos: vista día / semana, lista, crear, editar, confirmar, cancelar, completar, no asistió; búsqueda y filtro por estado/profesional.
- Servicios: CRUD, precio, duración, buffer, profesionales habilitados, activo/inactivo.
- Profesionales: CRUD, especialidades, servicios, horarios semanales, excepciones y días libres.
- Clientes: CRUD, historial, contacto, observaciones, cantidad de turnos.
- Configuración: datos del negocio, horarios, reglas de reserva (anticipación mín./máx., cancelación), feriados, apariencia (tema), módulos activos.

**Sistema**
- Prevención de solapamiento a nivel de base de datos.
- Cálculo de disponibilidad en servidor.
- Zona horaria por negocio.
- Historial de cambios de cada turno.
- Notificación interna (outbox) + email de confirmación cableado.
- Seed reproducible con datos de demo.
- Accesibilidad AA en flujos críticos y responsive real.

### Fuera (explícito)

Pagos online y señas · WhatsApp · Google Calendar · cupones · reportes avanzados · sucursales · dominio personalizado · suscripciones · PWA instalable · app nativa · multi-tenant con alta self-service · drag & drop de turnos · i18n completo.

> Estas features están previstas en el modelo (campos y tablas preparadas), pero **no se implementan**.

### Criterios de aceptación del MVP

1. Un cliente puede reservar de punta a punta en un celular de 375 px sin zoom ni scroll horizontal.
2. Dos reservas simultáneas del mismo horario: una gana, la otra recibe un error claro y vuelve al selector.
3. Cambiar el horario de atención se refleja en la disponibilidad pública sin deploy.
4. Un `STAFF` no puede entrar a Configuración ni modificar servicios (verificado en servidor).
5. Un usuario de otro negocio no puede leer ni escribir datos ajenos (test automatizado).
6. Todo turno modificado deja un registro en su historial.
7. `npm run build` pasa sin errores de tipos ni de ESLint.
8. Lighthouse ≥ 90 en Accesibilidad y ≥ 90 en Performance en la home pública.
9. La reserva funciona con el servidor en UTC y el negocio en otra zona horaria.
10. No hay datos hardcodeados de negocio en componentes: todo viene de la base.

---

## 7. Roadmap

Estimaciones indicativas asumiendo dedicación parcial (~20 h/semana). No son compromisos.

| Etapa | Entregable | Salida (exit criteria) | Esfuerzo |
|---|---|---|---|
| **0. Entorno** | Node (fnm), pnpm, Docker + Postgres local, repo git, Next.js con TS/ESLint/Prettier/Tailwind, `.env.example` | `pnpm dev` levanta; `pnpm build` pasa; commit inicial | 1–2 días |
| **1. Planificación** | Estos documentos + decisiones validadas | Vos aprobás stack, modalidad y rubro piloto | ✅ cerrada |
| **2. Laboratorio visual** | Shell del lab + sistema de tokens + 5 conceptos en 4 pantallas clave + comparador | Elegís un concepto; se documenta el sistema visual | ✅ cerrada (Papel) |
| **3. MVP núcleo** | Modelo de datos, migraciones, seed, auth, CRUD de servicios/equipo/clientes, configuración | Panel usable con datos reales; tests de tenant | 🔄 en curso: base, seed, auth y agenda listos |
| **4. Motor de reservas** | Disponibilidad, flujo público, anti-solapamiento, cancelación, historial, outbox | Criterios de aceptación 1–4 y 6–9 | 2–3 semanas |
| **5. Calendario y dashboard** | Vistas día/semana/lista, creación manual, KPIs, estados vacíos | Un dueño puede operar el día completo desde el panel | 1–2 semanas |
| **6. QA** | Playwright E2E, axe, revisión responsive, pruebas de concurrencia, Lighthouse | Criterios 1–10 verificados | 1–2 semanas |
| **7. Comercial** | Aprovisionamiento scriptado, documentación de despliegue, backup, guía de personalización | Se puede entregar una instancia nueva en < 1 h | 1–2 semanas |

Orden intencional: **el diseño se decide antes de construir la lógica** (Etapa 2), porque cambia la estructura de las pantallas y de los componentes. Pero el modelo de datos se define antes del laboratorio para que los datos de prueba sean realistas.

---

## 8. Riesgos técnicos abiertos (a resolver en implementación)

| Riesgo | Plan |
|---|---|
| Edición de turno con cambio de empleado/servicio puede violar la exclusión | Operación `reschedule` en transacción: cancelar el rango viejo + insertar el nuevo; si falla, rollback total |
| Cálculo de disponibilidad costoso con muchos profesionales | Query de rangos ocupados por día + generación en memoria; índice `(employee_id, starts_at)` |
| Feriados y excepciones que se cruzan | Resolución determinística: feriado cerrado > time off > horario semanal |
| Emails rebotados / sin proveedor | Outbox persistente + reintentos; la reserva no falla si el email falla |
| Fuentes e imágenes con licencia | Solo Google Fonts (OFL) e imágenes propias o de Unsplash (verificar licencia por imagen) |
| Crecimiento del CSS de temas | Un archivo de tokens por concepto, sin colores hardcodeados en componentes (regla de lint) |

---

## 9. Decisiones que necesitan tu validación

1. **Modalidad comercial:** ¿confirmás el enfoque híbrido (tenant-ready + deploy por cliente) o querés multi-tenant desde el inicio?
2. **Rubro piloto:** ¿barbería/peluquería, o preferís otro para la demo visual?
3. **Alcance del MVP:** ¿el email de confirmación entra en el MVP o se deja como stub hasta la Etapa 5?
4. **Stack:** ¿alguna objeción a Next.js 16 + PostgreSQL + Prisma + Better Auth?
