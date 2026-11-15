# Booking System — Documentación

Plantilla comercializable de gestión de turnos y reservas.
Estado actual: **Etapa 0 y 1 completas**. Etapa 2 (laboratorio visual) por comenzar.

## Estado verificado

| Comprobación | Resultado |
|---|---|
| `pnpm typecheck` | ✅ sin errores |
| `pnpm lint` | ✅ sin errores |
| `pnpm build` | ✅ 3 rutas estáticas |
| Node | 24.22.3 (instalado en `~/.local/opt/node`) |
| pnpm | 12.21.0 |
| Next.js | 16.4.6 |
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

## Requisitos de entorno

Ya resuelto en esta máquina. Referencia de lo que se instaló (sin `sudo`, dentro del usuario):

```bash
# Node 24 LTS desde el tarball oficial, verificado con SHA-256
~/.local/opt/node/          # instalación
~/.local/bin/{node,npm,npx,pnpm}   # enlaces simbólicos

# pnpm
npm install -g pnpm@latest
```

Pendiente para la Etapa 3 (no hace falta para la Etapa 2):

```bash
sudo pacman -S postgresql
sudo -iu postgres initdb -D /var/lib/postgres/data
sudo systemctl enable --now postgresql
```

No hay Docker instalado. Para el MVP alcanza con PostgreSQL como servicio local.

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
