# Booking System — Documentación

Plantilla comercializable de gestión de turnos y reservas.
Estado actual: **Etapas 0, 1, 2 y 3 completas** con PostgreSQL 18.7, Prisma 7, el modelo de dominio migrado, un seed funcional, **autenticación operativa** (Better Auth con email y contraseña), un **panel con la agenda real**, el **CRUD de servicios, equipo y clientes**, **horarios y ausencias** y la **configuración del negocio**. La **Etapa 4 está en curso**: ya funciona el flujo público de reserva en `/b/[slug]`, sin cuentas de cliente. Siguen pendientes dentro de esa etapa la cancelación, el historial de eventos y el outbox de notificaciones.

Laboratorio visual: `pnpm dev` → <http://localhost:3000/lab>
Panel protegido: `pnpm dev` → <http://localhost:3000/admin> (redirige a `/ingresar`)
Reserva pública: `pnpm dev` → <http://localhost:3000/b/estudio-norte>

## Estado verificado

| Comprobación | Resultado |
|---|---|
| `pnpm typecheck` | ✅ sin errores |
| `pnpm lint` | ✅ sin errores |
| `pnpm build` | ✅ build limpio (laboratorio con 5 temas + panel, ingreso y API de auth) |
| `pnpm db:seed` | ✅ 23 turnos, 6 servicios, 3 profesionales, 17 clientes, cuenta de acceso |
| Anti-solapamiento | ✅ `EXCLUDE USING gist` rechaza turnos solapados del mismo profesional |
| Autenticación | ✅ login, guard de `/admin`, sesión y logout |
| Panel | ✅ agenda del día desde PostgreSQL, KPIs, navegación por fecha, estados vacío/cerrado/feriado |
| Catálogo | ✅ alta, edición y activación de servicios y profesionales, con permisos por rol |
| Clientes | ✅ alta, edición, búsqueda e historial de turnos con KPIs |
| Disponibilidad | ✅ horario semanal por profesional (franjas múltiples) y ausencias/cierres |
| Configuración | ✅ datos del negocio, horario general y feriados, con permisos por rol |
| Reserva pública | ✅ servicio → profesional → fecha → hora → datos → confirmación, sin cuenta de cliente |
| Idempotencia | ✅ un `clientRequestId` repetido devuelve el mismo turno, sin duplicados |
| Disponibilidad real | ✅ anticipación mínima, franjas por profesional, ausencias, feriados y rangos ocupados |
| Zona horaria | ✅ la sesión de PostgreSQL se fija en UTC; un turno elegido a las 12:00 local se guarda como 15:00Z y vuelve a leerse a las 12:00 |
| Contraste AA por tokens | ✅ 14 pares × 5 conceptos sin fallas |
| Node | 24.22.3 (instalado en `~/.local/opt/node`) |
| pnpm | 12.21.0 |
| PostgreSQL | 18.7 (instalado en `~/.local/opt/pgsql`, sin `sudo`) |
| Next.js | 16.4.6 |
| Prisma | 7.10.1 (`prisma-client` + adapter `pg`) |
| Better Auth | 1.7.25 (+ `@better-auth/prisma-adapter`) |
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
| [04 — Sistema visual de Papel](./04-sistema-visual.md) | Tokens, paleta, tipografía, componentes, accesibilidad y reglas de uso del tema del producto |

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
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    options: "-c timezone=UTC",
  }),
});
```

- **`options: "-c timezone=UTC"` es obligatorio.** `@prisma/adapter-pg` serializa los `Date` como `YYYY-MM-DD HH:mm:ss` sin sufijo de zona. Si la sesión queda en `America/Argentina/Buenos_Aires`, PostgreSQL interpreta ese texto como hora local y guarda los `timestamptz` con un desfase de 3 horas. Fijar UTC en la conexión alinea la escritura con el `Date` de JavaScript. El mismo ajuste está en `prisma/seed.ts`.
- La CLI no lee `.env` de Next: `prisma7.config.ts` carga `.env.local` y `.env` con `dotenv`.

### Variables de entorno

Copiar `.env.example` a `.env.local` y ajustar el usuario de PostgreSQL:

```bash
cp .env.example .env.local
# editar DATABASE_URL
```

`BETTER_AUTH_SECRET` es obligatorio (mínimo 32 caracteres); se genera con:

```bash
openssl rand -base64 32
```

`.env.local` está ignorado por git.

### Seed

`prisma/seed.ts` reproduce el negocio **Estudio Norte** con datos relativos a la semana en que se ejecuta:

- Arranca en el lunes de la semana actual; si se corre un domingo, usa la semana siguiente.
- 6 servicios, 3 profesionales (Sofía no trabaja los miércoles), 17 clientes, 23 turnos y un feriado.
- Owner de prueba: `tomas@estudionorte.com.ar` (`usr_tomas`), con membresía `OWNER`.
- Cuenta de acceso del owner con contraseña `estudio-norte` (override con `SEED_OWNER_PASSWORD`).
- Es idempotente: borra y recrea catálogo, agenda y clientes de ese negocio, sin tocar otros negocios ni usuarios.
- Los turnos ya pasados quedan `COMPLETED`, salvo los marcados `CANCELLED` o `NO_SHOW`.

### Integridad de los turnos

El anti-solapamiento no depende de la aplicación: la migración inicial agrega `btree_gist` y una restricción de exclusión en `appointments` que impide dos turnos activos (`PENDING`/`CONFIRMED`) del mismo profesional cuyos rangos `[starts_at, blocked_until)` se superpongan. También hay `CHECK` de coherencia temporal y de rangos en horarios y servicios (ver `docs/02-modelo-de-datos.md` §5).

## Autenticación

Better Auth 1.7 con email y contraseña, adaptador de Prisma y sesiones en base.

| Pieza | Archivo |
|---|---|
| Instancia del servidor | `src/lib/auth.ts` |
| Cliente React | `src/lib/auth-client.ts` |
| Route handler `/api/auth/*` | `src/app/api/auth/[...all]/route.ts` |
| Guard optimista | `src/proxy.ts` |
| Ingreso | `src/app/ingresar/{page,login-form,actions}.tsx` |
| Panel protegido | `src/app/admin/{page,actions}.tsx` |
| Cliente Prisma singleton | `src/lib/prisma.ts` |

Cómo funciona:

1. `src/proxy.ts` (el `middleware` de Next 16) revisa que exista la cookie de sesión para `/admin/*`. Si no está, redirige a `/ingresar?next=…`. Es un chequeo **optimista**, no una validación.
2. `/ingresar` valida con Zod y llama `auth.api.signInEmail` desde una Server Action. El plugin `nextCookies` escribe la cookie.
3. `/admin` valida la sesión con `auth.api.getSession` contra la base y busca la membresía activa del usuario. Sin sesión redirige; sin negocio muestra un estado vacío.
4. El logout es una Server Action que llama `auth.api.signOut` y vuelve a `/ingresar`.

No hay registro público: `emailAndPassword.disableSignUp` cierra el endpoint `/api/auth/sign-up/*` (no solo se oculta el formulario). Los usuarios se crean desde el seed o, más adelante, desde la invitación del panel de equipo.

### Acceso de demo

- URL: <http://localhost:3000/admin>
- Email: `tomas@estudionorte.com.ar`
- Contraseña: `estudio-norte`

Solo para desarrollo local. En producción se cambia al aprovisionar la instancia.

## Panel

`/admin` es la agenda del negocio, todavía **de solo lectura**.

| Pieza | Archivo |
|---|---|
| Shell del panel | `src/app/admin/layout.tsx` |
| Navegación (server + cliente) | `src/app/admin/panel-nav.tsx` |
| Agenda del día | `src/app/admin/page.tsx` |
| Contexto de sesión y membresía | `src/lib/business.ts` |
| Consultas de agenda | `src/lib/booking/queries.ts` |
| Helpers de fecha y precio | `src/lib/date.ts` |
| Etiquetas y tonos de estado | `src/lib/appointments.ts` |

Comportamiento:

1. El layout valida sesión y membresía activa una sola vez con `getBusinessContext` (memoizado por request con `cache`). Sin negocio muestra un estado con cierre de sesión.
2. La agenda toma `?fecha=yyyy-MM-dd`; si falta o es inválida, usa la fecha de hoy en la zona horaria del negocio.
3. El rango del día se calcula con `dayBounds` y todos los turnos se filtran por `businessId` (frontera del tenant).
4. Se muestran KPIs (turnos sin cancelar, confirmados, pendientes y facturación estimada) y el listado con horario, cliente, servicio, profesional y estado.
5. Estados del día: `feriado` (cierre por feriado), `cerrado` (sin horario cargado), `sin turnos` (día abierto sin reservas) y listado normal. Los turnos cancelados se muestran atenuados, no se ocultan.
6. La navegación permite ir al día anterior, al siguiente y volver a hoy.

El panel sigue siendo de solo lectura: crear, confirmar o cancelar turnos desde `/admin` llega con el CRUD de la Etapa 5. La reserva pública ya escribe en la misma tabla.

## Catálogo: servicios y equipo

| Ruta | Contenido |
|---|---|
| `/admin/servicios` | Listado del catálogo + alta/edición en línea |
| `/admin/equipo` | Profesionales + servicios asignados |

| Pieza | Archivo |
|---|---|
| Esquemas Zod y lectura de `FormData` | `src/lib/admin/schemas.ts` |
| Consultas del panel | `src/lib/admin/queries.ts` |
| Permisos (`canManage`, `requireManager`) | `src/lib/admin/guard.ts` |
| Formularios cliente | `src/app/admin/{servicios,equipo}/*-form.tsx` |
| Server Actions | `src/app/admin/{servicios,equipo}/actions.ts` |
| Controles de formulario | `src/components/ui/field.tsx` |

Reglas:

1. **Permisos.** `OWNER` y `ADMIN` pueden escribir; `STAFF` solo lee. La UI oculta los controles y los Server Actions vuelven a validar con `requireManager` (ocultar un botón no es autorización). Un intento de escritura de `STAFF` redirige a `/admin?error=permiso`.
2. **Validación compartida.** Los formularios y las acciones usan el mismo esquema Zod. Los campos numéricos se validan como texto y se transforman, así un campo vacío no se convierte en `0`.
3. **Precio.** Se carga en pesos y se guarda en centavos (`priceCents`) para evitar decimales flotantes.
4. **Slug.** Se genera del nombre al crear y se mantiene estable al editar; si colisiona dentro del negocio se agrega `-2`, `-3`…
5. **Borrado lógico.** Desactivar un servicio o profesional cambia `isActive`; no se borra, porque los turnos históricos lo referencian. La lista muestra los inactivos atenuados.
6. **Servicios del profesional.** La asignación se sincroniza en una transacción: se borran los vínculos anteriores y se crean los nuevos. Los ids se validan contra el `businessId` para que un id manipulado no cruce tenants.
7. **Acciones con PRG.** Las acciones exitosas redirigen con `?ok=creado|actualizado`, evitando reenvíos al refrescar.

Pendiente en esta sección: horarios de atención por profesional, ausencias y borrado definitivo.

## Clientes

| Ruta | Contenido |
|---|---|
| `/admin/clientes` | Directorio con búsqueda + alta/edición en línea |
| `/admin/clientes/[id]` | Ficha con contacto, preferencias, KPIs e historial de turnos |

| Pieza | Archivo |
|---|---|
| Esquema `customerSchema` y `normalizePhone` | `src/lib/admin/schemas.ts` |
| Consultas `listCustomers` y `getCustomer` | `src/lib/admin/queries.ts` |
| Server Action `saveCustomerAction` | `src/app/admin/clientes/actions.ts` |
| Formulario | `src/app/admin/clientes/customer-form.tsx` |
| Listado y ficha | `src/app/admin/clientes/{page,[id]/page}.tsx` |

Reglas:

1. **Teléfono como identidad.** Se guarda el texto tal como lo escribió el usuario y, además, `phoneNormalized` (`+` y solo dígitos). La unicidad es por `(businessId, phoneNormalized)`.
2. **Duplicados.** Antes de guardar se busca otro cliente con el mismo teléfono, **incluidos los dados de baja**, porque el índice de la base no distingue `deletedAt`. Si existe, el error se muestra sobre el campo teléfono con el nombre del cliente que ya lo usa.
3. **Edición.** Al editar, la verificación de duplicados excluye al propio cliente.
4. **Fecha de nacimiento.** Se carga como `aaaa-mm-dd` y se guarda en una columna `@db.Date` a medianoche UTC; se muestra con `formatDateOnly` para que no se corra un día.
5. **Etiquetas.** Se cargan separadas por comas y se guardan como `String[]` sin vacíos ni duplicados.
6. **Búsqueda.** Filtra por nombre, apellido, email, teléfono visible y teléfono normalizado (solo dígitos), sin distinguir mayúsculas. `?q=` es el parámetro.
7. **Historial y KPIs.** La ficha muestra turnos, cancelados/ausencias, total gastado (solo `COMPLETED`) y próximo turno (`PENDING`/`CONFIRMED` en el futuro). El historial incluye servicio, profesional, duración, precio y estado.
8. **Permisos y PRG.** Mismas reglas que el catálogo: `OWNER`/`ADMIN` escriben con `requireManager`; el alta redirige a la ficha (`?ok=creado`) y la edición al listado (`?ok=actualizado`).

El flujo público ya reutiliza este criterio: busca por `phoneNormalized` antes de crear y actualiza el nombre y el email del cliente existente en vez de duplicarlo. Pendiente: baja lógica y fusión de duplicados históricos.

## Horarios y ausencias

| Ruta | Contenido |
|---|---|
| `/admin/horarios` | Horario semanal por profesional + ausencias y cierres |

| Pieza | Archivo |
|---|---|
| Esquemas `scheduleSchema` y `timeOffSchema` | `src/lib/admin/schemas.ts` |
| Consultas `listScheduleBoard` y `listTimeOff` | `src/lib/admin/queries.ts` |
| Server Actions | `src/app/admin/horarios/actions.ts` |
| Pantalla | `src/app/admin/horarios/page.tsx` |

Reglas:

1. **Franjas múltiples.** Un día puede tener varias franjas (por ejemplo 09:00–13:00 y 15:00–20:00). Se agregan y quitan de a una, con acciones atómicas.
2. **Validación.** El fin debe ser posterior al inicio y la franja no puede superponerse con otra del mismo profesional y día. La comparación se hace en minutos desde medianoche.
3. **Zona horaria.** Los minutos se interpretan en la zona del negocio (`business.timezone`), igual que la agenda. El horario es semanal y se repite.
4. **Ausencias.** Tienen tipo (`VACATION`, `SICK`, `PERSONAL`, `TRAINING`, `CLOSURE`), rango de fechas inclusive y alcance: un profesional o todo el negocio (`employeeId = null`).
5. **Días completos.** Una ausencia bloquea desde el inicio del primer día hasta el inicio del día siguiente al último, calculado con `dayBounds` en la zona del negocio.
6. **Turnos existentes.** Cambiar horarios o cargar ausencias **no mueve ni cancela turnos ya agendados**. La pantalla lo advierte; el reencaje llega con el motor de reservas.
7. **Permisos.** `OWNER`/`ADMIN` editan con `requireManager`; `STAFF` ve la pantalla en modo solo lectura, sin formularios ni botones de borrado.

Pendiente en esta sección: excepciones por fecha, validación contra la agenda y detección de turnos afectados.

## Configuración

| Ruta | Contenido |
|---|---|
| `/admin/configuracion?seccion=datos` | Datos públicos y operativos del negocio |
| `/admin/configuracion?seccion=horarios` | Horario general de atención semanal |
| `/admin/configuracion?seccion=feriados` | Feriados y cierres puntuales |

| Pieza | Archivo |
|---|---|
| Esquemas `businessProfileSchema`, `businessScheduleSchema` y `holidaySchema` | `src/lib/admin/schemas.ts` |
| Consultas `listBusinessSchedule` y `listHolidays` | `src/lib/admin/queries.ts` |
| Server Actions | `src/app/admin/configuracion/actions.ts` |
| Formulario de datos | `src/app/admin/configuracion/business-form.tsx` |
| Pantalla con secciones | `src/app/admin/configuracion/page.tsx` |

Reglas:

1. **Datos del negocio.** Nombre, razón social, CUIT, contacto, redes, ubicación, zona horaria y moneda. El sitio web agrega `https://` si falta el protocolo y el usuario de Instagram se guarda sin `@`.
2. **Zona horaria y moneda.** Se validan contra `Intl` y con códigos ISO (`AR`, `ARS`). Cambiar la zona horaria cambia cómo se interpretan los horarios de la agenda.
3. **Horario general.** Franjas semanales del negocio con la misma validación que las de cada profesional: fin posterior al inicio y sin superposición por día.
4. **Feriados.** Fecha única por negocio (columna `@db.Date`), nombre, nota y estado abierto/cerrado. No se puede repetir la misma fecha.
5. **Turnos existentes.** Ni el horario general ni los feriados cancelan turnos ya agendados.
6. **Permisos.** `OWNER`/`ADMIN` editan con `requireManager`; `STAFF` ve las tres secciones en modo solo lectura. Al guardar los datos se revalida el layout completo para actualizar el nombre en el encabezado.

Fuera del alcance simple: temas por negocio, logo y multi-negocio en la interfaz. La reserva pública lee `BusinessSettings` directamente: anticipación mínima, granularidad, "cualquiera", visibilidad de precios y profesional, confirmación manual y políticas.

## Reserva pública

| Ruta | Contenido |
|---|---|
| `/b/[slug]` | Asistente de cuatro pasos (servicio, profesional, fecha/hora, datos) |
| `/b/[slug]/reserva/[id]` | Confirmación con código, detalle y link al calendario |

| Pieza | Archivo |
|---|---|
| Disponibilidad pura | `src/lib/booking/availability.ts` |
| Consultas públicas | `src/lib/booking/public.ts` |
| Esquema y lectura de `FormData` | `src/lib/booking/public-schema.ts` |
| Server Action e idempotencia | `src/app/b/[slug]/actions.ts` |
| Wizard | `src/app/b/[slug]/page.tsx` |
| Formulario con `useActionState` | `src/app/b/[slug]/booking-form.tsx` |
| Layout y metadata | `src/app/b/[slug]/layout.tsx` |
| Confirmación | `src/app/b/[slug]/reserva/[id]/page.tsx` |

Reglas:

1. **Sin cuenta de cliente.** El teléfono normalizado es la identidad. Si ya existe un cliente con ese número en el negocio, se reutiliza y se actualizan sus datos; si está bloqueado, la reserva se rechaza.
2. **Slug como frontera.** Toda lectura y escritura filtra por el `businessId` resuelto desde el slug. Un slug inexistente o inactivo da 404; la confirmación de otro negocio también da 404.
3. **Disponibilidad calculada en servidor, dos veces.** La misma función pura genera la grilla que ve el cliente y revalida el `POST` justo antes de insertar. Se consideran horario general, franjas propias del profesional, ausencias, feriados cerrados, anticipación mínima, granularidad y el rango `[starts_at, blocked_until)` de los turnos activos.
4. **Herencia de horarios.** Si el profesional no tiene ninguna franja cargada en la semana hereda el horario general; si tiene al menos una, solo atiende esas franjas. Así Sofía sigue sin atender los miércoles aunque el negocio abra.
5. **"Cualquiera" se resuelve en servidor.** Se prueban los profesionales elegibles en orden y, si la restricción de exclusión rechaza uno por una carrera, se intenta con el siguiente antes de devolver error.
6. **Idempotencia.** El formulario genera un `clientRequestId` (UUID). Un doble submit devuelve siempre la misma URL de confirmación.
7. **Estado inicial.** El turno nace `PENDING` si `requireManualConfirmation` está activo; si no, `CONFIRMED` con `confirmedAt`. El estado se muestra en la confirmación.
8. **Snapshots.** Se guardan precio, duración, buffer y moneda del turno, para que editar el catálogo no reescriba el historial.
9. **Ventana acotada.** La tira muestra 21 días aunque `maxAdvanceDays` permita 60.
10. **Datos sensibles.** Los campos ocultos son solo selectores; el action vuelve a validar servicio, profesional, fecha y hora contra la base antes de escribir.

Pendiente dentro de la Etapa 4: cancelación por link con token, historial de eventos del turno y outbox de notificaciones.

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
