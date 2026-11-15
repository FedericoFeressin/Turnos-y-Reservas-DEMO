# Booking System — Documentación

Plantilla comercializable de gestión de turnos y reservas.
Estado actual: **Etapa 1 (análisis y planificación)** — sin código de producto todavía.

## Índice

| Documento | Contenido |
|---|---|
| [01 — Arquitectura y tecnologías](./01-arquitectura-y-tecnologias.md) | Evaluación de la propuesta, comparación de stack, arquitectura, multi-tenant vs instancia única, estructura de carpetas, MVP, roadmap |
| [02 — Modelo de datos](./02-modelo-de-datos.md) | Esquema Prisma completo, restricciones SQL, índices, disponibilidad, estados, seed |
| [03 — Sistema visual y experimentación](./03-experimentacion-visual.md) | 6 conceptos visuales con tokens, matriz de decisión, plan de la Etapa 2 |

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
| Etapa 2 | **5 conceptos en baja fidelidad (L1)** → 2 finalistas en L2 → 1 elegido |
| Email de confirmación | Dentro del MVP, con patrón *outbox* y un canal simple |

## Requisitos de entorno (Etapa 0)

En esta máquina (CachyOS/Arch) **falta todo el toolchain**:

```bash
# Opción recomendada: fnm para manejar versiones de Node
sudo pacman -S fnm
fnm install --lts
fnm default lts-latest

# Alternativa directa
sudo pacman -S nodejs npm

# pnpm
npm install -g pnpm

# PostgreSQL local
sudo pacman -S postgresql
sudo -iu postgres initdb -D /var/lib/postgres/data
sudo systemctl enable --now postgresql
```

No hay Docker instalado. Para el MVP alcanza con PostgreSQL como servicio local; Docker se evalúa solo si hace falta reproducir el entorno de producción.

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
