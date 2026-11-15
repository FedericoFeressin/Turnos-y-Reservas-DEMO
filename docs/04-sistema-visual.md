# 04 — Sistema visual de Papel

> Documento de referencia del tema **Papel**, elegido al cerrar la Etapa 2 y convertido en la identidad base del producto. Los otros cuatro conceptos (Noche, Órbita, Brisa y Pulso) quedan como *presets* de `BusinessTheme` y se venden como estilos incluidos.
>
> La experimentación que llevó a esta decisión está en [`03-experimentacion-visual.md`](./03-experimentacion-visual.md).

---

## 1. Principios

1. **El oficio se muestra, no se explica.** La foto, el espacio y la tipografía hacen el trabajo. Nada de ornamentos que no aporten información.
2. **Una sola jerarquía por pantalla.** Un `h1` claro, un foco de acción y el resto en segundo plano.
3. **El aire es parte del diseño.** Las secciones respiran, pero `--theme-section-y` se reduce en mobile para no convertir la página en scroll eterno.
4. **Casi sin sombras.** La separación se logra con líneas de 1 px, no con elevación. La sombra existe solo para piezas flotantes (menú, modal, panel).
5. **Color con intención.** Verde profundo para acción, terracota solo como acento, y semánticos reservados para estado (éxito, aviso, error).
6. **Tokens, no hex.** Ningún componente escribe un color literal: todo pasa por `var(--theme-*)` o por las utilidades de Tailwind mapeadas en `@theme`.

---

## 2. Contrato de tokens

La interfaz común vive en `src/app/globals.css` dentro de `@theme inline`, que expone los tokens como utilidades de Tailwind. Cada concepto redefine las variables crudas en `src/styles/themes/<concepto>.css`.

| Token crudo (`--theme-*`) | Utilidad Tailwind | Uso |
|---|---|---|
| `--theme-bg` | `bg-background` | Fondo de página |
| `--theme-surface` | `bg-surface` | Tarjetas y bloques elevados |
| `--theme-surface-2` | `bg-surface-2` | Fondo sutil, hover, relleno de íconos |
| `--theme-ink` | `text-ink` | Texto principal |
| `--theme-ink-muted` | `text-ink-muted` | Texto secundario y metadatos |
| `--theme-line` | `border-line` | Bordes y separadores |
| `--theme-primary` | `bg-primary` / `text-primary` | Acción principal |
| `--theme-primary-fg` | `text-primary-fg` | Texto sobre primario |
| `--theme-primary-hover` | `hover:bg-primary-hover` | Estado hover del primario |
| `--theme-accent` | `bg-accent` / `text-accent` | Acento, nunca texto largo |
| `--theme-accent-fg` | `text-accent-fg` | Texto sobre acento |
| `--theme-success` | `bg-success` / `text-success` | Confirmado, completado OK |
| `--theme-warning` | `bg-warning` / `text-warning` | Pendiente, atención |
| `--theme-danger` | `bg-danger` / `text-danger` | Cancelado, ausente, error |
| `--theme-danger-fg` | `text-danger-fg` | Texto sobre peligro |
| `--theme-radius-sm/md/lg/xl` | `rounded-sm/md/lg/xl` | Escala de radios |
| `--theme-shadow-card` | `shadow-card` | Tarjeta / menú flotante |
| `--theme-shadow-raised` | `shadow-raised` | Modal / panel elevado |
| `--theme-section-y` | `py-[var(--theme-section-y)]` | Aire vertical de sección |
| `--theme-tracking-display` | `tracking-[var(--theme-tracking-display)]` | Titulares |
| `--theme-font-display` | `font-display` | Titulares y cifras destacadas |
| `--theme-font-body` | `font-sans` | Cuerpo |

Además, `globals.css` fija variables que **no dependen del concepto**:

```css
:root {
  --theme-duration-fast: 120ms;
  --theme-duration-base: 200ms;
  --theme-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

### Regla dura

> Si un componente necesita un color y no existe el token, **se agrega el token** antes de escribir el hex. Esto es lo que permite que el mismo componente funcione en los cinco presets y en la personalización por cliente de la Etapa 5.

---

## 3. Paleta de Papel

Valores definitivos en `src/styles/themes/papel.css`. `:root` y `[data-theme="papel"]` comparten bloque: cualquier ruta fuera de `/lab` nace con esta identidad.

| Rol | Valor | Dónde se usa |
|---|---|---|
| Fondo | `#FAF8F3` | Lienzo de la página (blanco cálido, no puro) |
| Superficie | `#FFFFFF` | Tarjetas, inputs, panel |
| Superficie 2 | `#F2EEE5` | Rellenos sutiles, hover, chips |
| Tinta | `#14140F` | Texto principal y titulares |
| Tinta secundaria | `#6B655B` | Descripciones, metadatos, labels |
| Línea | `#E5DFD3` | Bordes, separadores, reglas |
| Primario | `#2F5D50` | Botón principal, foco, enlaces activos |
| Texto sobre primario | `#FFFFFF` | Etiqueta del botón primario |
| Primario hover | `#264A40` | Estado hover del botón |
| Acento | `#9A5A27` | Terracota: detalles, "más pedido", numeración |
| Texto sobre acento | `#FFFFFF` | Etiqueta sobre acento |
| Éxito | `#2F6B4F` | Turno confirmado |
| Aviso | `#8A5F14` | Turno pendiente |
| Peligro | `#A63A2E` | Cancelado, ausente, error |
| Texto sobre peligro | `#FFFFFF` | Etiqueta sobre peligro |

> **Nota histórica.** El acento original era `#B8763F`, que daba 3.47:1 sobre el fondo y fallaba AA. Se reemplazó por `#9A5A27` (5.45:1). Ver el registro de contraste en `docs/03` §8.

### Contraste

Todos los pares texto/fondo cumplen **WCAG AA**: 4.5:1 para texto normal y 3:1 para texto grande y bordes de controles. Antes de aprobar un cambio de token hay que recalcular el par afectado; no se ajusta "a ojo".

| Par | Ratio |
|---|---|
| Tinta sobre fondo | 17.41:1 |
| Tinta secundaria sobre fondo | 5.44:1 |
| Tinta secundaria sobre `surface-2` | 4.99:1 |
| Blanco sobre primario | 7.49:1 |
| Blanco sobre acento | 5.43:1 |
| Blanco sobre peligro | 6.43:1 |
| Éxito sobre fondo | 5.93:1 |
| Aviso sobre fondo | 5.31:1 |
| Línea sobre superficie | 1.33:1 (borde decorativo, no texto) |

---

## 4. Tipografía

| Rol | Familia | Pesos | Variable |
|---|---|---|---|
| Display | **Instrument Serif** | 400 | `--font-instrument-serif` |
| Cuerpo | **Inter** | 400/500 | `--font-inter` |

Ambas se cargan con `next/font/google` en `src/app/layout.tsx`, con `display: "swap"` y `subsets: ["latin"]`. No se descargan fuentes en runtime ni se usan `<link>` externos.

### Escala en uso

| Elemento | Clases de referencia |
|---|---|
| Hero | `font-display text-5xl sm:text-7xl leading-[1.02] font-medium` con `tracking-[var(--theme-tracking-display)]` |
| Título de sección (`h2`) | `font-display text-2xl sm:text-3xl font-semibold leading-[1.15]` |
| Título de tarjeta (`h3`) | `font-display text-[17px] font-semibold leading-snug` |
| Cuerpo | `text-sm sm:text-[15px] leading-relaxed` |
| Metadato / label | `text-[11px] uppercase tracking-[0.2em] text-ink-muted` |
| Numeración editorial | `font-mono text-[11px] text-ink-muted` |
| Precio | `font-display text-[17px] font-semibold` |

### Reglas

- Un solo `h1` por página. El resumen de reserva y los títulos de tarjeta no compiten con el formulario.
- `h1–h4` usan `font-display`; `p` y controles usan cuerpo.
- `text-wrap: balance` en titulares y `text-wrap: pretty` en párrafos (definido en `globals.css`).
- La numeración de secciones (`01 — Servicios`) se escribe con `font-mono` y mayúsculas espaciadas: es firma del concepto, no decoración.
- No se usa cursiva decorativa ni mayúsculas sostenidas en párrafos.

---

## 5. Layout y espaciado

| Pieza | Regla |
|---|---|
| Contenedor | `max-w-6xl` (1152 px) con `px-5 sm:px-8` |
| Sección | `py-[var(--theme-section-y)]`; Papel usa `clamp(3.25rem, 8vw, 7rem)` |
| Grillas | 12 columnas implícitas con `grid`; en mobile todo colapsa a una columna |
| Hero | Asimétrico ~60/40: titular a la izquierda, media vertical 4:5 a la derecha |
| Breakpoints | Los de Tailwind: `sm` 640, `md` 768, `lg` 1024, `xl` 1280 |

`Container`, `Section` y `SectionHead` viven en `src/components/site/layout-primitives.tsx`. Ninguna página inventa sus propios márgenes.

### Media

`<Media />` es un placeholder fotográfico: resuelve proporción (`4/5`, `1/1`, `3/2`, `16/9`), tinte por token y una trama sutil. Se reemplaza por `<Image>` sin tocar el layout. Proporciones fijas para que el diseño no dependa de una foto que todavía no existe.

---

## 6. Forma: radios, bordes y sombras

| Token | Valor | Uso |
|---|---|---|
| `--theme-radius-sm` | `2px` | Badges, chips |
| `--theme-radius-md` | `4px` | Botones, inputs, tarjetas |
| `--theme-radius-lg` | `6px` | Contenedores |
| `--theme-radius-xl` | `8px` | Modales |
| `--theme-shadow-card` | `0 0 0 0 transparent` | Sin sombra: la tarjeta se separa por línea |
| `--theme-shadow-raised` | `0 18px 40px -24px rgb(20 20 15 / 0.25)` | Solo piezas flotantes |

Reglas:

- Un borde de 1 px (`border-line`) es la separación por defecto. No se combinan borde y sombra en la misma tarjeta salvo que flote.
- Los radios son casi rectos: Papel no usa píldoras. `buttonVariants({ shape: "pill" })` existe para los otros presets, no para Papel.
- No hay gradientes decorativos. El único degradado permitido es el del placeholder `<Media>`.

---

## 7. Movimiento

- Transiciones de `120ms` (rápidas) y `200ms` (base) con `--theme-ease`.
- Se anima **color, borde, opacidad y, como máximo, 4 px de desplazamiento**. Nada de escalas ni rebotes.
- `prefers-reduced-motion: reduce` desactiva animaciones y transiciones no esenciales (regla global en `globals.css`).
- Ninguna animación puede retrasar la reserva. El feedback de un paso del wizard es inmediato.

---

## 8. Componentes

### Button — `src/components/ui/button.tsx`

Variantes (`variant`):

| Variante | Cuándo |
|---|---|
| `primary` | Acción principal de la pantalla (Reservar, Confirmar) |
| `accent` | Acción secundaria destacada; una por pantalla como máximo |
| `outline` | Acción alternativa sobre fondo claro |
| `soft` | Acción terciaria sobre `surface-2` |
| `ghost` | Enlaces de navegación y acciones de fila |
| `danger` | Cancelar turno, acciones destructivas |
| `dark` | Cierre de bloque sobre fondo primario (donde el acento no alcanza AA) |

Tamaños: `sm` (36 px), `md` (44 px, mínimo táctil), `lg` (48 px).
Formas: `default` (`rounded-md`), `pill`, `none`.
`full` ocupa el ancho del contenedor (mobile).

### Badge — `src/components/ui/badge.tsx`

Tonos: `neutral`, `primary`, `accent`, `success`, `warning`, `danger`, `outline`.
Tamaños: `sm` (20 px), `md` (24 px). Formas: `default`, `pill`.
Se usan con `bg-<tono>/10 text-<tono>`: el color informa, la opacidad evita que grite.

Estado de turno → tono (mapeo único en `admin-views.tsx`):

| Estado | Etiqueta | Tono |
|---|---|---|
| `CONFIRMED` | Confirmado | `success` |
| `PENDING` | Pendiente | `warning` |
| `COMPLETED` | Completado | `neutral` |
| `CANCELLED` | Cancelado | `danger` |
| `NO_SHOW` | Ausente | `danger` |

> El estado nunca se comunica **solo** por color: siempre lleva etiqueta de texto.

### Layout

- `Container`: ancho máximo y padding lateral.
- `Section`: espaciado vertical del tema.
- `SectionHead`: índice (`01`), título, descripción y acción opcional.

### Reserva

- Wizard de 4 pasos (servicio → profesional → fecha y hora → datos) con `aria-current="step"` y anuncio por `aria-live`.
- Slots: grilla de 15 min. Ocupado = tachado + `aria-disabled`, no accionable. Cerrado y feriado se distinguen por texto y forma, no solo color.
- Resumen lateral fijo en desktop; colapsa arriba en mobile.
- Confirmación con recibo, código y calendario; la cancelación es una acción secundaria.

---

## 9. Accesibilidad

- **Foco visible** global: `outline: 2px solid var(--theme-primary); outline-offset: 2px`.
- **Skip link** a `#contenido` en sitio público y panel.
- **Menú móvil** con `aria-expanded`, `aria-controls`, cierre con Escape y foco devuelto al disparador.
- **Radios y checkboxes** reales dentro de `label`, con estado visible por `:checked` y foco por `:focus-visible`.
- **Errores de formulario** asociados con `aria-describedby` y anunciados en el paso.
- **Contraste** verificado por token; cualquier violación AA es bloqueante.
- **Movimiento** reducido respetado.
- **Idioma** `es-AR` en `<html>`.

---

## 10. Hacer / no hacer

| ✅ Hacer | ❌ No hacer |
|---|---|
| Usar `text-ink-muted` para texto secundario | Usar gris claro "porque queda elegante" |
| Separar bloques con `border-line` de 1 px | Apilar sombras difusas para dar profundidad |
| Un `h1` y una acción principal por pantalla | Varios botones primarios compitiendo |
| Acento terracota en detalles puntuales | Acento en párrafos o botones grandes |
| Placeholder con proporción fija | Depender de una foto de stock perfecta |
| Numeración `01 — Servicios` como firma | Numerar todo, incluso listas internas |
| Estado con etiqueta + color | Estado solo por color |
| Texto breve, sobrio, sin exclamaciones | Copy publicitario con signos de exclamación |
| `rounded-md` (4 px) | Píldoras y radios grandes en Papel |
| Motion ≤ 200 ms y funcional | Animaciones que retrasan la reserva |

---

## 11. Cómo se agrega un tema (presets y Etapa 5)

Un concepto nuevo es **un archivo de tokens**, no una copia de pantallas:

1. Crear `src/styles/themes/<id>.css` y definir el bloque `[data-theme="<id>"]` con todos los tokens de la §2.
2. Importarlo en `src/app/layout.tsx`.
3. Registrar el concepto en `src/lib/concepts.ts` (nombre, paleta, fuentes, variantes de layout).
4. Si cambia la estructura, usar las variantes existentes (`layout.hero`, `layout.slots`, `layout.nav`, `layout.shape`) antes de agregar una nueva.
5. Verificar contraste AA de los 14 pares y correr `pnpm typecheck`, `pnpm lint` y `pnpm build`.

En la Etapa 5, `BusinessTheme` guardará el preset elegido y los overrides (logo, colores, fuentes, radios). El panel de Configuración → Apariencia escribe esos overrides; el CSS de este documento sigue siendo la base.

---

## 12. Archivos de referencia

| Archivo | Contenido |
|---|---|
| `src/app/globals.css` | Mapa de tokens → Tailwind, base, foco, reduced motion |
| `src/styles/themes/papel.css` | Paleta y forma definitivas de Papel |
| `src/styles/themes/{noche,orbita,brisa,pulso}.css` | Presets alternativos |
| `src/lib/concepts.ts` | Metadatos y variantes de layout por concepto |
| `src/components/ui/button.tsx` | Variantes de botón |
| `src/components/ui/badge.tsx` | Variantes de badge |
| `src/components/site/layout-primitives.tsx` | `Container`, `Section`, `SectionHead`, `Media` |
| `docs/03-experimentacion-visual.md` | Proceso de decisión, rondas L1/L2 y contraste |
