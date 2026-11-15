# 02 — Modelo de datos

> PostgreSQL + Prisma. Este documento es la fuente de verdad del esquema hasta la Etapa 3.
> Convención: tablas y columnas en `snake_case` (vía `@@map`/`@map`), modelos y campos en `camelCase` en TypeScript.

---

## 1. Principios del modelo

1. **`businessId` en toda entidad de negocio.** No hay tablas "globales" salvo las de autenticación. Es la base del aislamiento entre clientes.
2. **Nada que se pueda derivar se guarda.** `totalAppointments` del cliente, `slotCount`, `ingresos del mes`: se calculan. La única excepción deliberada son los **snapshots** del turno (precio, duración y buffer al momento de reservar), porque si mañana el servicio cambia de precio, el historial debe seguir siendo correcto.
3. **Los turnos son inmutables en su identidad, mutables en su estado.** Se edita estado y horario; nunca se reescribe el pasado sin dejar un `AppointmentEvent`.
4. **Borrado lógico en catálogos.** Servicios, profesionales y clientes referenciados por turnos no se eliminan físicamente (`deletedAt` o `isActive=false`). Borrar un servicio no puede borrar el historial.
5. **Enums para estados cerrados, tablas para catálogos abiertos.** Los cinco estados de turno son un contrato del dominio: un enum es más seguro y más rápido que una tabla. Un "estado personalizado" por cliente es una mala idea de producto: rompe filtros, reportes y UI.
6. **Una sola convención de zona horaria.** Instantes en `timestamptz` (UTC). Horarios recurrentes en minutos locales. Nunca se guarda `"15:00"` como string.

---

## 2. Diagrama de relaciones (resumen)

```
Business 1─1 BusinessSettings
Business 1─1 BusinessTheme
Business 1─N Membership N─1 User
Business 1─N Employee 1─N EmployeeSchedule
Business 1─N Service   N─N Employee  (EmployeeService)
Business 1─N Customer
Business 1─N BusinessSchedule
Business 1─N Holiday
Business 1─N TimeOff  (employeeId opcional = cierre del negocio)
Business 1─N Appointment N─1 Customer
                         N─1 Employee
                         N─1 Service
              1─N AppointmentEvent
              1─N Notification
Business 1─N AuditLog
```

---

## 3. Esquema Prisma

```prisma
// prisma/schema.prisma
// Nota: los modelos de autenticación (User, Session, Account, Verification)
// se generan con el CLI de Better Auth y se ajustan con @map. Acá se muestran
// los campos relevantes para las relaciones del dominio.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ───────────────────────────── Enums ─────────────────────────────

enum MembershipRole {
  OWNER // propietario: todo
  ADMIN // encargado: turnos, equipo, servicios, clientes
  STAFF // empleado: turnos y clientes propios/asignados
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
  NO_SHOW
}

enum AppointmentSource {
  PUBLIC
  ADMIN
  PHONE
  WHATSAPP
  WALK_IN
}

enum AppointmentEventType {
  CREATED
  CONFIRMED
  RESCHEDULED
  STATUS_CHANGED
  CANCELLED
  COMPLETED
  NO_SHOW
  NOTE_ADDED
}

enum ActorType {
  CUSTOMER
  STAFF
  SYSTEM
}

enum TimeOffType {
  VACATION
  SICK
  PERSONAL
  TRAINING
  CLOSURE
}

enum NotificationChannel {
  EMAIL
  WHATSAPP
  SMS
}

enum NotificationStatus {
  QUEUED
  SENT
  FAILED
  CANCELLED
}

// ─────────────────────────── Negocio ────────────────────────────

model Business {
  id          String    @id @default(cuid())
  slug        String    @unique
  name        String
  legalName   String?   @map("legal_name")
  taxId       String?   @map("tax_id")

  email       String?
  phone       String?
  whatsapp    String?
  instagram   String?
  website     String?

  addressLine String?   @map("address_line")
  city        String?
  province    String?
  country     String    @default("AR")
  postalCode  String?   @map("postal_code")
  latitude    Decimal?  @db.Decimal(9, 6)
  longitude   Decimal?  @db.Decimal(9, 6)

  timezone    String    @default("America/Argentina/Buenos_Aires")
  currency    String    @default("ARS")
  locale      String    @default("es-AR")

  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz(3)

  settings      BusinessSettings?
  theme         BusinessTheme?
  memberships   Membership[]
  employees     Employee[]
  services      Service[]
  customers     Customer[]
  appointments  Appointment[]
  schedules     BusinessSchedule[]
  holidays      Holiday[]
  timeOff       TimeOff[]
  notifications Notification[]
  auditLogs     AuditLog[]

  @@index([isActive])
  @@map("businesses")
}

model BusinessSettings {
  id                        String   @id @default(cuid())
  businessId                String   @unique @map("business_id")
  slotGranularityMinutes    Int      @default(15) @map("slot_granularity_minutes")
  minAdvanceMinutes         Int      @default(120) @map("min_advance_minutes")
  maxAdvanceDays            Int      @default(60) @map("max_advance_days")
  cancellationWindowMinutes Int      @default(1440) @map("cancellation_window_minutes")
  requireManualConfirmation Boolean  @default(false) @map("require_manual_confirmation")
  allowGuestBooking         Boolean  @default(true) @map("allow_guest_booking")
  allowChooseAnyStaff       Boolean  @default(true) @map("allow_choose_any_staff")
  showPrices                Boolean  @default(true) @map("show_prices")
  showStaffSelection        Boolean  @default(true) @map("show_staff_selection")
  remindersEnabled          Boolean  @default(false) @map("reminders_enabled")
  reminderHoursBefore       Int      @default(24) @map("reminder_hours_before")
  enabledModules            String[] @default([]) @map("enabled_modules")
  bookingPolicyText         String?  @map("booking_policy_text")
  cancellationPolicyText    String?  @map("cancellation_policy_text")
  updatedAt                 DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@map("business_settings")
}

model BusinessTheme {
  id              String   @id @default(cuid())
  businessId      String   @unique @map("business_id")
  preset          String?  // "papel" | "noche" | "orbita" | "brisa" | "pulso"
  logoUrl         String?  @map("logo_url")
  logoDarkUrl     String?  @map("logo_dark_url")
  faviconUrl      String?  @map("favicon_url")
  heroImageUrl    String?  @map("hero_image_url")
  primaryColor    String?  @map("primary_color")
  accentColor     String?  @map("accent_color")
  backgroundColor String?  @map("background_color")
  foregroundColor String?  @map("foreground_color")
  headingFont     String?  @map("heading_font")
  bodyFont        String?  @map("body_font")
  radius          String?  // "0" | "4px" | "8px" | "12px" | "20px"
  density         String   @default("comfortable")
  darkModeDefault Boolean  @default(false) @map("dark_mode_default")
  overrides       Json?    // tokens futuros sin migración
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@map("business_themes")
}

// ─────────────────────────── Usuarios ───────────────────────────

model User {
  id            String    @id
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false) @map("email_verified")
  image         String?
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)

  memberships         Membership[]
  employees           Employee[]
  createdAppointments Appointment[]      @relation("AppointmentCreatedBy")
  events              AppointmentEvent[]
  auditLogs           AuditLog[]
  sessions            Session[]
  accounts            Account[]

  @@map("users")
}

model Membership {
  id         String         @id @default(cuid())
  businessId String         @map("business_id")
  userId     String         @map("user_id")
  role       MembershipRole @default(STAFF)
  isActive   Boolean        @default(true) @map("is_active")
  createdAt  DateTime       @default(now()) @map("created_at") @db.Timestamptz(3)

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([businessId, userId])
  @@index([userId])
  @@map("memberships")
}

// ─────────────────────────── Catálogo ───────────────────────────

model Service {
  id                 String    @id @default(cuid())
  businessId         String    @map("business_id")
  name               String
  slug               String
  description        String?
  category           String?
  priceCents         Int       @map("price_cents")
  durationMinutes    Int       @map("duration_minutes")
  bufferAfterMinutes Int       @default(0) @map("buffer_after_minutes")
  isActive           Boolean   @default(true) @map("is_active")
  isPublic           Boolean   @default(true) @map("is_public")
  sortOrder          Int       @default(0) @map("sort_order")
  imageUrl           String?   @map("image_url")
  createdAt          DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt          DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)
  deletedAt          DateTime? @map("deleted_at") @db.Timestamptz(3)

  business   Business          @relation(fields: [businessId], references: [id], onDelete: Cascade)
  employees  EmployeeService[]
  appointments Appointment[]

  @@unique([businessId, slug])
  @@index([businessId, isActive, sortOrder])
  @@map("services")
}

model Employee {
  id          String    @id @default(cuid())
  businessId  String    @map("business_id")
  userId      String?   @map("user_id") // login opcional: no todo profesional usa el panel
  firstName   String    @map("first_name")
  lastName    String    @map("last_name")
  displayName String?   @map("display_name")
  title       String?   // "Barbero", "Kinesiólogo", "Mecánico"
  bio         String?
  email       String?
  phone       String?
  photoUrl    String?   @map("photo_url")
  color       String    @default("#64748B") // color en el calendario
  isBookable  Boolean   @default(true) @map("is_bookable")
  isActive    Boolean   @default(true) @map("is_active")
  sortOrder   Int       @default(0) @map("sort_order")
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz(3)

  business     Business           @relation(fields: [businessId], references: [id], onDelete: Cascade)
  user         User?              @relation(fields: [userId], references: [id], onDelete: SetNull)
  services     EmployeeService[]
  schedules    EmployeeSchedule[]
  timeOff      TimeOff[]
  appointments Appointment[]

  @@unique([businessId, userId])
  @@index([businessId, isActive, sortOrder])
  @@map("employees")
}

model EmployeeService {
  employeeId String @map("employee_id")
  serviceId  String @map("service_id")

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  service  Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@id([employeeId, serviceId])
  @@index([serviceId])
  @@map("employee_services")
}

model Customer {
  id               String    @id @default(cuid())
  businessId       String    @map("business_id")
  firstName        String    @map("first_name")
  lastName         String?   @map("last_name")
  email            String?
  phone            String    // tal como lo escribió el cliente
  phoneNormalized  String    @map("phone_normalized") // E.164: +5491123456789
  birthDate        DateTime? @map("birth_date") @db.Date
  notes            String?   // observaciones internas
  tags             String[]  @default([])
  marketingOptIn   Boolean   @default(false) @map("marketing_opt_in")
  isBlocked        Boolean   @default(false) @map("is_blocked")
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt        DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)
  deletedAt        DateTime? @map("deleted_at") @db.Timestamptz(3)

  business     Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  appointments Appointment[]

  @@unique([businessId, phoneNormalized])
  @@index([businessId, email])
  @@index([businessId, lastName, firstName])
  @@map("customers")
}

// ─────────────────────────── Horarios ───────────────────────────

// dayOfWeek: 1 = lunes … 7 = domingo (ISO-8601)
// startMinute / endMinute: minutos desde medianoche, hora local del negocio.
// Varias filas por día = turnos partidos (mañana/tarde).

model BusinessSchedule {
  id          String   @id @default(cuid())
  businessId  String   @map("business_id")
  dayOfWeek   Int      @map("day_of_week")
  startMinute Int      @map("start_minute")
  endMinute   Int      @map("end_minute")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@unique([businessId, dayOfWeek, startMinute])
  @@index([businessId, dayOfWeek])
  @@map("business_schedules")
}

model EmployeeSchedule {
  id          String   @id @default(cuid())
  employeeId  String   @map("employee_id")
  dayOfWeek   Int      @map("day_of_week")
  startMinute Int      @map("start_minute")
  endMinute   Int      @map("end_minute")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@unique([employeeId, dayOfWeek, startMinute])
  @@index([employeeId, dayOfWeek])
  @@map("employee_schedules")
}

// Ausencias puntuales. employeeId null = cierre de todo el negocio.
model TimeOff {
  id         String      @id @default(cuid())
  businessId String      @map("business_id")
  employeeId String?     @map("employee_id")
  type       TimeOffType @default(PERSONAL)
  startsAt   DateTime    @map("starts_at") @db.Timestamptz(3)
  endsAt     DateTime    @map("ends_at") @db.Timestamptz(3)
  reason     String?
  createdAt  DateTime    @default(now()) @map("created_at") @db.Timestamptz(3)

  business Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  employee Employee? @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([businessId, startsAt, endsAt])
  @@index([employeeId, startsAt, endsAt])
  @@map("time_off")
}

model Holiday {
  id         String   @id @default(cuid())
  businessId String   @map("business_id")
  date       DateTime @db.Date
  name       String
  isClosed   Boolean  @default(true) @map("is_closed")
  notes      String?
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@unique([businessId, date])
  @@index([businessId, date])
  @@map("holidays")
}

// ─────────────────────────── Turnos ────────────────────────────

model Appointment {
  id         String @id @default(cuid())
  businessId String @map("business_id")
  customerId String @map("customer_id")
  employeeId String @map("employee_id")
  serviceId  String @map("service_id")

  startsAt     DateTime @map("starts_at") @db.Timestamptz(3)
  endsAt       DateTime @map("ends_at") @db.Timestamptz(3) // fin del servicio
  blockedUntil DateTime @map("blocked_until") @db.Timestamptz(3) // endsAt + buffer

  status AppointmentStatus @default(PENDING)
  source AppointmentSource @default(PUBLIC)

  // Snapshots: el historial no cambia si mañana se edita el servicio
  priceCents         Int    @map("price_cents")
  currency           String @default("ARS")
  durationMinutes    Int    @map("duration_minutes")
  bufferAfterMinutes Int    @default(0) @map("buffer_after_minutes")

  customerNotes      String?   @map("customer_notes")
  internalNotes      String?   @map("internal_notes")
  cancellationReason String?   @map("cancellation_reason")
  cancelledAt        DateTime? @map("cancelled_at") @db.Timestamptz(3)
  confirmedAt        DateTime? @map("confirmed_at") @db.Timestamptz(3)
  completedAt        DateTime? @map("completed_at") @db.Timestamptz(3)
  holdExpiresAt      DateTime? @map("hold_expires_at") @db.Timestamptz(3) // PENDING sin confirmar

  createdById     String? @map("created_by_id")
  clientRequestId String? @map("client_request_id") // idempotencia del formulario

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  business  Business  @relation(fields: [businessId], references: [id], onDelete: Restrict)
  customer  Customer  @relation(fields: [customerId], references: [id], onDelete: Restrict)
  employee  Employee  @relation(fields: [employeeId], references: [id], onDelete: Restrict)
  service   Service   @relation(fields: [serviceId], references: [id], onDelete: Restrict)
  createdBy User?     @relation("AppointmentCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)

  events        AppointmentEvent[]
  notifications Notification[]

  @@unique([businessId, clientRequestId])
  @@index([businessId, startsAt])
  @@index([employeeId, startsAt])
  @@index([customerId, startsAt])
  @@index([businessId, status, startsAt])
  @@index([holdExpiresAt])
  @@map("appointments")
}

model AppointmentEvent {
  id            String               @id @default(cuid())
  businessId    String               @map("business_id")
  appointmentId String               @map("appointment_id")
  type          AppointmentEventType
  actorType     ActorType            @default(SYSTEM) @map("actor_type")
  actorUserId   String?              @map("actor_user_id")
  fromStatus    AppointmentStatus?   @map("from_status")
  toStatus      AppointmentStatus?   @map("to_status")
  startsAtBefore DateTime?           @map("starts_at_before") @db.Timestamptz(3)
  startsAtAfter  DateTime?           @map("starts_at_after") @db.Timestamptz(3)
  note          String?
  metadata      Json?
  createdAt     DateTime             @default(now()) @map("created_at") @db.Timestamptz(3)

  appointment Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  actor       User?       @relation(fields: [actorUserId], references: [id], onDelete: SetNull)

  @@index([appointmentId, createdAt])
  @@index([businessId, createdAt])
  @@map("appointment_events")
}

// ─────────────────────── Notificaciones / auditoría ─────────────────────

model Notification {
  id            String             @id @default(cuid())
  businessId    String             @map("business_id")
  appointmentId String?            @map("appointment_id")
  channel       NotificationChannel
  template      String
  recipient     String
  status        NotificationStatus @default(QUEUED)
  scheduledFor  DateTime           @default(now()) @map("scheduled_for") @db.Timestamptz(3)
  sentAt        DateTime?          @map("sent_at") @db.Timestamptz(3)
  attempts      Int                @default(0)
  lastError     String?            @map("last_error")
  payload       Json?
  createdAt     DateTime           @default(now()) @map("created_at") @db.Timestamptz(3)

  business    Business     @relation(fields: [businessId], references: [id], onDelete: Cascade)
  appointment Appointment? @relation(fields: [appointmentId], references: [id], onDelete: SetNull)

  @@index([status, scheduledFor])
  @@index([businessId, createdAt])
  @@map("notifications")
}

model AuditLog {
  id          String    @id @default(cuid())
  businessId  String    @map("business_id")
  actorType   ActorType @default(STAFF) @map("actor_type")
  actorUserId String?   @map("actor_user_id")
  entity      String    // "service" | "employee" | "settings" | ...
  entityId    String    @map("entity_id")
  action      String    // "create" | "update" | "delete" | "restore"
  before      Json?
  after       Json?
  ip          String?
  userAgent   String?   @map("user_agent")
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  actor    User?    @relation(fields: [actorUserId], references: [id], onDelete: SetNull)

  @@index([businessId, createdAt])
  @@index([entity, entityId])
  @@map("audit_logs")
}
```

> `Session`, `Account` y `Verification` los genera Better Auth con `npx @better-auth/cli generate`. No se editan a mano salvo el `@@map` para respetar `snake_case`.

---

## 4. Decisiones de diseño y justificación

| Entidad del brief | Cómo se resolvió | Por qué |
|---|---|---|
| `Role` | Enum `MembershipRole` dentro de `Membership` | Un rol es un conjunto fijo de permisos. Una tabla `Role` obliga a un sistema de permisos dinámicos que nadie pidió. Si más adelante hace falta granularidad, se agrega una tabla de permisos sin migrar datos. |
| `AppointmentStatus` | Enum PostgreSQL | Mismo criterio: estados cerrados, indexables, sin joins. Los reportes filtran por enum, no por texto libre. |
| `Business` + `User` | `Membership` como tabla puente | Permite que un usuario trabaje en dos negocios y que cada negocio tenga sus roles. Sin `Membership`, multi-tenant es imposible. |
| `Customer` vs `User` | Separados | Un cliente no tiene por qué tener login. Mezclarlos obliga a crear cuentas para reservar (fricción y riesgo de seguridad). |
| `Employee` vs `User` | Separados con vínculo opcional | Un mecánico puede existir en la agenda sin acceso al panel. |
| `EmployeeService` | Tabla puente con PK compuesta | Relación N:N explícita, sin id sustituto innecesario. |
| `EmployeeSchedule` | Horario semanal + `TimeOff` aparte | El horario semanal no cambia; las vacaciones sí. Mezclarlos complica el cálculo de disponibilidad. |
| `Holiday` | `businessId` obligatorio | Evita el problema de unicidad con `NULL` en Postgres y hace que cada negocio controle su calendario. Los feriados nacionales se precargan por seed. |
| `BusinessSettings` / `BusinessTheme` | Tablas 1:1 | Separadas de `Business` para no cargar 25 columnas en cada consulta pública. `Theme.overrides` (JSON) permite sumar tokens sin migración. |
| `Notification` | Tabla *outbox* | La reserva no falla si el email falla. Permite reintentos y, mañana, cambiar de proveedor sin tocar el flujo. |
| `AuditLog` + `AppointmentEvent` | Dos tablas, dos propósitos | `AppointmentEvent` es la historia legible de un turno (lo ve el dueño). `AuditLog` es trazabilidad técnica de cualquier entidad (lo ve soporte). |

### Por qué snapshots en `Appointment`

Si el precio del corte sube de $8.000 a $10.000, los turnos del mes pasado deben seguir mostrando $8.000. Guardar `priceCents`, `durationMinutes` y `bufferAfterMinutes` en el turno congela el acuerdo con el cliente y hace que los reportes de ingresos sean históricamente correctos.

### Por qué `blockedUntil` y no solo `endsAt`

El buffer entre turnos es parte del tiempo ocupado. Si el turno termina 10:30 y el servicio tiene 10 minutos de limpieza, nadie puede reservar 10:35. Se guarda `blockedUntil = endsAt + buffer`, y la restricción anti-solapamiento usa ese valor. `endsAt` se conserva para mostrar el horario real al cliente.

---

## 5. Restricciones que Prisma no puede expresar

Se agregan en una migración SQL versionada (`prisma migrate dev --create-only` + edición manual). En la implementación quedaron en la migración inicial `20261115175237_init`:

```sql
-- prisma/migrations/20261115175237_init/migration.sql

-- Necesario para combinar igualdad (=) con solapamiento (&&) en un índice GiST
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1) NÚCLEO: un profesional no puede tener dos turnos activos solapados.
--    '[)' = inicio incluido, fin excluido: un turno que termina 10:00
--    no choca con otro que empieza 10:00.
ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    employee_id WITH =,
    tstzrange(starts_at, blocked_until, '[)') WITH &&
  )
  WHERE (status IN ('PENDING', 'CONFIRMED'));

-- 2) Coherencia temporal
ALTER TABLE appointments
  ADD CONSTRAINT appointments_time_order
  CHECK (starts_at < ends_at AND ends_at <= blocked_until);

-- 3) Valores no negativos
ALTER TABLE appointments
  ADD CONSTRAINT appointments_non_negative
  CHECK (price_cents >= 0 AND duration_minutes > 0 AND buffer_after_minutes >= 0);

-- 4) Horarios válidos (0 = 00:00, 1440 = 24:00)
ALTER TABLE business_schedules
  ADD CONSTRAINT business_schedules_range
  CHECK (start_minute >= 0 AND end_minute <= 1440 AND start_minute < end_minute);

ALTER TABLE employee_schedules
  ADD CONSTRAINT employee_schedules_range
  CHECK (start_minute >= 0 AND end_minute <= 1440 AND start_minute < end_minute);

-- 5) Precio y duración de servicios
ALTER TABLE services
  ADD CONSTRAINT services_valid
  CHECK (price_cents >= 0 AND duration_minutes > 0 AND buffer_after_minutes >= 0);

-- 6) Día de la semana ISO
ALTER TABLE business_schedules
  ADD CONSTRAINT business_schedules_dow CHECK (day_of_week BETWEEN 1 AND 7);
ALTER TABLE employee_schedules
  ADD CONSTRAINT employee_schedules_dow CHECK (day_of_week BETWEEN 1 AND 7);

-- 7) Ausencias con rango válido
ALTER TABLE time_off ADD CONSTRAINT time_off_range CHECK (starts_at < ends_at);
```

**Por qué la restricción de exclusión es la pieza clave:** cualquier verificación en la aplicación del tipo *"¿está libre este horario?"* seguida de un `INSERT` tiene una ventana de carrera. Con dos requests concurrentes, ambas consultas pueden responder "libre". La restricción hace que el motor rechace el segundo `INSERT` con el código `23P01` (`exclusion_violation`), que la aplicación traduce a `SLOT_TAKEN`. Es la única garantía real.

---

## 6. Flujo de disponibilidad

```
Entrada: businessId, serviceId, employeeId?, fecha local (YYYY-MM-DD)

1. Cargar Business (timezone, settings) y Service (duration, buffer).
2. Si Holiday(businessId, date).isClosed → devolver [].
3. Rango del día en UTC: [inicioLocal, finLocal) convertido con la timezone del negocio.
4. Candidatos de profesional:
   a. Si employeeId → solo ese (validar EmployeeService y isBookable).
   b. Si no → todos los que ofrecen el servicio y están activos.
5. Para cada profesional:
   a. Rangos de BusinessSchedule del dayOfWeek (varios si hay turno partido).
   b. Intersección con EmployeeSchedule del dayOfWeek (si no tiene filas, hereda el del negocio).
   c. Restar TimeOff que se solape con el día (propios + cierres del negocio).
   d. Restar Appointment activos (PENDING/CONFIRMED) del día → rangos ocupados.
6. Generar slots cada `slotGranularityMinutes` dentro de los rangos libres,
   donde quepa `duration + buffer` sin tocar un rango ocupado.
7. Filtrar por ventana de reserva: ahora + minAdvanceMinutes ≤ slot ≤ ahora + maxAdvanceDays.
8. Devolver [{ startUtc, endUtc, employeeId }] ordenado; el cliente solo formatea.
```

La consulta de rangos ocupados:

```sql
SELECT employee_id, starts_at, blocked_until
FROM appointments
WHERE business_id = $1
  AND starts_at < $3       -- fin del día
  AND blocked_until > $2   -- inicio del día
  AND status IN ('PENDING', 'CONFIRMED');
-- usa el índice (employee_id, starts_at)
```

**Reglas de resolución de conflictos** (determinísticas y documentadas):
1. Feriado cerrado → no hay turnos, sin excepción manual (salvo crear turno desde el panel, que sí lo permite con confirmación explícita).
2. `TimeOff` gana sobre horario semanal.
3. Si un profesional no tiene `EmployeeSchedule`, hereda el horario del negocio (evita configurar dos veces lo mismo).
4. Duración mínima de slot = `slotGranularityMinutes`; si el servicio dura 50 y la granularidad es 15, los inicios posibles son 09:00, 09:15, ... (no 09:50).

---

## 7. Máquina de estados del turno

```
                 ┌──────────────► CANCELLED (terminal)
                 │
PENDING ─────────┼──────────────► CONFIRMED ───┬──► COMPLETED (terminal)
   │             │                             ├──► NO_SHOW  (terminal)
   │             │                             └──► CANCELLED (terminal)
   └─────────────┴──► (auto-cancel por hold vencido)
```

| Desde | Hacia | Quién | Cuándo |
|---|---|---|---|
| — | `PENDING` | Cliente / Staff | Se crea con `requireManualConfirmation = true` |
| — | `CONFIRMED` | Cliente / Staff | Se crea con confirmación automática (default) |
| `PENDING` | `CONFIRMED` | Staff | Confirmación manual |
| `PENDING` | `CANCELLED` | Sistema | `holdExpiresAt` vencido (job) |
| `PENDING`/`CONFIRMED` | `CANCELLED` | Cliente (con token) / Staff | Antes del inicio, respetando `cancellationWindowMinutes` |
| `CONFIRMED` | `COMPLETED` | Staff | Al terminar el turno |
| `CONFIRMED` | `NO_SHOW` | Staff | El cliente no vino |
| `COMPLETED`/`NO_SHOW`/`CANCELLED` | — | — | Terminales |

`RESCHEDULED` no es un estado: es un **evento**. El turno conserva su estado y cambia de horario; el evento guarda `startsAtBefore` y `startsAtAfter`.

---

## 8. Índices y por qué

| Índice | Consulta que resuelve |
|---|---|
| `appointments (business_id, starts_at)` | Agenda del día / rango del dashboard |
| `appointments (employee_id, starts_at)` | Disponibilidad y vista por profesional |
| `appointments (customer_id, starts_at)` | Historial del cliente |
| `appointments (business_id, status, starts_at)` | KPIs y filtros por estado |
| `appointments (hold_expires_at)` | Job de expiración de holds |
| `appointments` GiST `(employee_id, tstzrange)` | Anti-solapamiento (el más importante) |
| `customers (business_id, phone_normalized)` único | Identificar cliente al reservar sin duplicados |
| `services (business_id, is_active, sort_order)` | Catálogo público |
| `notifications (status, scheduled_for)` | Worker de envío |
| `audit_logs (entity, entity_id)` | Historial de una entidad |

---

## 9. Datos de demo (seed)

Un solo seed reproducible (`prisma/seed.ts`), idempotente y relativo a la fecha en que se ejecuta:

- Negocio: **"Estudio Norte"** (barbería), `slug: estudio-norte`, timezone `America/Argentina/Buenos_Aires`.
- Horarios: lun–vie 09:00–13:00 y 15:00–20:00; sáb 09:00–14:00; dom cerrado.
- 6 servicios (corte, corte + barba, barba, color, corte para niños, tratamiento) con duraciones de 20 a 90 min y buffers de 5 a 15 min.
- 3 profesionales (uno no trabaja los miércoles) y un feriado el lunes siguiente.
- 17 clientes con teléfonos normalizados.
- 23 turnos sobre la semana en curso: los días ya pasados quedan `COMPLETED` (salvo cancelados o ausentes), y los próximos mezclan `CONFIRMED` y `PENDING` para que el panel tenga actividad.
- 1 usuario: `tomas@estudionorte.com.ar` (`usr_tomas`), con membresía `OWNER` y vinculado al profesional fundador. Las credenciales de acceso se agregan en la etapa de autenticación.
- Si el seed se corre un domingo, arranca en el lunes siguiente para no sembrar una semana ya terminada.

> El seed **no** se usa como sustituto de funcionalidad: sirve para ver el sistema poblado y para los tests E2E.

---

## 10. Integridad y ciclo de vida

- **Borrar negocio:** lógico (`deletedAt`). Físicamente solo en un entorno de desarrollo.
- **Borrar servicio/profesional/cliente:** lógico. Si no tiene turnos, se puede permitir borrado físico desde el panel.
- **Borrar turno:** no existe. Se cancela.
- **Anonimizar cliente:** reemplaza `firstName`, `lastName`, `email`, `phone` por valores neutros y borra `notes`; conserva el turno para las estadísticas (derecho al olvido sin romper reportes).
- **Retención:** los turnos se conservan indefinidamente en el MVP; la política se define por cliente en Etapa 5.
