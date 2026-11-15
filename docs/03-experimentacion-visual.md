# 03 — Sistema visual y experimentación

> Etapa 2. El objetivo no es "hacer cuatro diseños": es **elegir una identidad** y convertirla en un sistema de tokens que después se reutilice para cada cliente.

---

## 1. Estrategia: tokens antes que pantallas

El error caro sería maquetar cinco sitios completos. La solución:

1. Se construye **una sola vez** la estructura de cada pantalla (componentes React).
2. Un **concepto visual = un archivo de tokens CSS** (`data-theme="..."`) + hasta dos variantes estructurales donde el layout realmente cambia.
3. El comparador cambia el `data-theme` en caliente.

Consecuencia comercial: los conceptos que no elijas **no se tiran**. Quedan como *presets* de `BusinessTheme` y se venden como "5 estilos incluidos". El laboratorio de la Etapa 2 se convierte en el sistema de personalización de la Etapa 5.

### Contrato de tokens (todos los conceptos lo implementan)

```css
/* src/styles/tokens.css — interfaz común. Ningún componente usa hex directo. */
:root {
  /* Tipografía */
  --font-display: var(--font-body);
  --font-body: system-ui, sans-serif;
  --text-xs / --text-sm / --text-base / --text-lg / --text-xl / --text-2xl / --text-3xl / --text-4xl / --text-5xl
  --leading-tight / --leading-normal / --leading-relaxed
  --tracking-tight / --tracking-normal / --tracking-wide

  /* Color */
  --color-bg;
  --color-surface;
  --color-surface-2;
  --color-ink;
  --color-ink-muted;
  --color-ink-subtle;
  --color-line;
  --color-primary;
  --color-primary-fg;
  --color-primary-hover;
  --color-accent;
  --color-accent-fg;
  --color-success; --color-warning; --color-danger; --color-info;
  --color-success-soft; --color-warning-soft; --color-danger-soft;

  /* Forma */
  --radius-sm; --radius-md; --radius-lg; --radius-xl; --radius-full;
  --border-width: 1px;
  --shadow-sm; --shadow-md; --shadow-lg;

  /* Espacio y layout */
  --space-unit: 4px;          /* 4 = denso, 8 = aireado */
  --container-max: 1200px;
  --section-y;

  /* Movimiento */
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 400ms;
  --ease: cubic-bezier(.2,.8,.2,1);

  /* Densidad */
  --density: comfortable;     /* comfortable | compact */
}
```

**Reglas duras:**
- Ningún componente contiene un color literal. Solo `var(--color-*)` o utilidades Tailwind mapeadas a tokens.
- Todo contraste se verifica con axe antes de aprobar un concepto (mínimo AA: 4.5:1 texto normal, 3:1 texto grande y bordes de controles).
- `prefers-reduced-motion: reduce` desactiva todo movimiento no esencial en los cinco conceptos.
- Modo oscuro real solo donde el concepto lo propone; no se fuerza en los claros.

---

## 2. Los conceptos

Cada concepto define **densidad, tipografía, forma, color y tono de copy**. Cambiar solo el color no cuenta como concepto.

---

### Concepto 1 — «Papel» · Minimalista editorial

**Idea:** un negocio que se toma en serio a sí mismo. Mucho blanco, tipografía con voz, cero decoración. La foto hace el trabajo.

| Token | Valor |
|---|---|
| Fondo / superficie | `#FAF8F3` / `#FFFFFF` |
| Tinta / secundaria | `#14140F` / `#6B655B` |
| Línea | `#E5DFD3` |
| Primario | `#2F5D50` (verde profundo), texto blanco |
| Acento | `#B8763F` (terracota), solo detalles |
| Display | **Instrument Serif** (400) |
| Cuerpo | **Inter** (400/500) |
| Radios | 4–6 px (casi rectos) |
| Sombras | Prácticamente ninguna; separación por línea de 1 px |
| Espaciado | `--space-unit: 8px`, secciones muy aireadas |
| Movimiento | 150 ms, fade + 4 px de desplazamiento |
| Firma de layout | Hero asimétrico 60/40 con titular grande a la izquierda y foto vertical a la derecha; numeración de secciones (`01 — Servicios`) |
| Tono de copy | Sobrio, breve, sin signos de exclamación |

- **Rubros:** barbería premium, estudio de arquitectura, consultorio particular, estética.
- **Riesgo:** en mobile el aire puede volverse scroll eterno. Mitigación: reducir `--section-y` a la mitad en `< 640px`.
- **Nivel de esfuerzo:** bajo.

---

### Concepto 2 — «Noche» · Premium oscuro

**Idea:** exclusividad. Fondo casi negro, líneas de 1 px, dorado usado con cuentagotas. Se siente caro antes de leer el precio.

| Token | Valor |
|---|---|
| Fondo / superficie / elevada | `#0A0A0B` / `#121214` / `#1A1A1D` |
| Tinta / secundaria | `#F4F1EA` / `#A39C90` |
| Línea | `#26262A` |
| Primario | `#C9A227` (oro), texto casi negro encima |
| Acento | `#7A6A4A` (solo hairlines y etiquetas grandes, nunca texto chico) |
| Display | **Cormorant Garamond** (500/600) |
| Cuerpo | **Manrope** (400/500) |
| Radios | 2 px |
| Sombras | Halo suave (`0 0 60px rgba(201,162,39,.08)`), sin drop shadows |
| Espaciado | `--space-unit: 8px`, mucho espacio negativo |
| Movimiento | 300 ms, fundidos lentos; imagen con leve `scale(1.02)` al hover |
| Firma de layout | Hero a pantalla completa con overlay, titular centrado en serif grande, botón fantasma con borde dorado; secciones separadas por hairlines |
| Tono de copy | Corto, aspiracional, en segunda persona |

- **Rubros:** barbería de alta gama, spa, restaurante, tattoo studio.
- **Riesgo:** el dorado sobre negro falla AA si se usa en texto chico o si se baja la opacidad. Solo `#C9A227` pleno para texto; nada de `#C9A227/60` en párrafos.
- **Riesgo 2:** el panel administrativo en oscuro cansa en jornadas largas; se puede ofrecer tema claro para el admin y oscuro para el sitio público (decisión por negocio).
- **Nivel de esfuerzo:** medio (las imágenes y el tratamiento tipográfico necesitan más cuidado).

---

### Concepto 3 — «Órbita» · SaaS moderno

**Idea:** el panel es el producto. Información densa pero respirable, jerarquía por peso y color, navegación lateral fija.

| Token | Valor |
|---|---|
| Fondo / superficie | `#F5F6F8` / `#FFFFFF` |
| Tinta / secundaria | `#0F172A` / `#5B6472` |
| Línea | `#E2E5EA` |
| Primario | `#4338CA` (índigo), texto blanco |
| Acento | `#0E7490` (teal) para datos secundarios |
| Estados | éxito `#15803D`, alerta `#B45309`, error `#B91C1C` |
| Display | **Space Grotesk** (500/600) |
| Cuerpo | **Inter** (400/500) |
| Radios | 10–12 px |
| Sombras | `0 1px 2px rgba(15,23,42,.06)` + borde; nunca sombras grandes |
| Espaciado | `--space-unit: 4px`, densidad alta |
| Movimiento | 150 ms; transiciones de estado, skeletons de carga |
| Firma de layout | Sidebar de 264 px con secciones, topbar con breadcrumb y buscador (`⌘K`), tarjetas de KPI, tablas con densidad configurable |
| Tono de copy | Directo, operativo, orientado a la acción |

- **Rubros:** cualquiera; es el concepto "base" para el panel de todos los clientes.
- **Riesgo:** es el más genérico de los cinco. Se diferencia por tipografía, el calendario y los detalles de datos, no por la paleta.
- **Nota:** este concepto puede **combinarse** con cualquiera de los otros: sitio público «Papel», panel «Órbita». Es una decisión válida y probablemente la mejor.
- **Nivel de esfuerzo:** medio (muchos estados: tablas, filtros, vacíos, carga).

---

### Concepto 4 — «Brisa» · Creativo y comercial

**Idea:** cercanía. Formas suaves, color cálido, micro-animaciones. Se siente humano y fácil de usar; ideal para reservar desde el celular en 40 segundos.

| Token | Valor |
|---|---|
| Fondo / superficie | `#FFFCF5` / `#FFFFFF` |
| Tinta / secundaria | `#1C1917` / `#78716C` |
| Línea | `#EDE7DE` |
| Primario | `#C2410C` (naranja profundo), texto blanco |
| Acento | `#0F766E` (teal) para confirmaciones y datos |
| Decorativo | degradado `#FB7185 → #F97316`, solo fondos y blobs, nunca texto |
| Display | **Bricolage Grotesque** (600/700) |
| Cuerpo | **DM Sans** (400/500) |
| Radios | 16–24 px, botones tipo píldora |
| Sombras | `0 8px 24px rgba(28,25,23,.08)` en tarjetas flotantes |
| Espaciado | `--space-unit: 8px` |
| Movimiento | 220 ms; hover con `translateY(-2px)`, aparición escalonada de tarjetas (respetando `reduced-motion`) |
| Firma de layout | Hero con tarjeta de reserva flotante y superpuesta (en mobile pasa a bloque), tarjetas de servicio con ícono e imagen, stepper de reserva con progreso visible |
| Tono de copy | Cálido, en primera persona plural ("te esperamos"), sin ser informal de más |

- **Rubros:** peluquería, estética, gastronomía, gimnasio, servicios independientes.
- **Riesgo:** el naranja `#C2410C` es el mínimo aceptable para AA con blanco; no se puede aclarar "para que se vea más lindo". Los degradados no llevan texto encima.
- **Nivel de esfuerzo:** medio-alto (más componentes con personalidad).

---

### Concepto 5 — «Pulso» · Clínico y confiable

**Idea:** tranquilidad. Azul-verde profundo, mucho blanco, información clara, señales de confianza (matrícula, especialidad, obras sociales). Nada que distraiga.

| Token | Valor |
|---|---|
| Fondo / superficie | `#F6FAFB` / `#FFFFFF` |
| Tinta / secundaria | `#0C2A33` / `#52707A` |
| Línea | `#DDE8EB` |
| Primario | `#0E7490` (petróleo), texto blanco |
| Acento | `#0D9488` (turquesa) para chips y confirmaciones |
| Estados | éxito `#15803D`, alerta `#B45309`, error `#B91C1C` |
| Display | **Lora** (500/600) |
| Cuerpo | **Source Sans 3** (400/600) |
| Radios | 8 px |
| Sombras | Mínimas, borde de 1 px |
| Espaciado | `--space-unit: 8px` |
| Movimiento | 150 ms, solo opacidad |
| Firma de layout | Hero con foto del profesional y datos verificables; bloques de servicio con duración y preparación previa; agenda en formato lista por día (no grilla densa) |
| Tono de copy | Claro, tranquilizador, sin tecnicismos innecesarios |

- **Rubros:** consultorio médico, odontológico, kinesiología, nutrición, veterinaria.
- **Riesgo:** puede leerse como "genérico de salud". Se diferencia por la tipografía serif en titulares y por el tratamiento de la información de confianza.
- **Nivel de esfuerzo:** bajo-medio.

---

### Concepto 6 (opcional) — «Taller» · Industrial

Solo si querés cubrir el rubro mecánico: tipografía condensada (**Archivo** o **Oswald**), fondo gris claro `#F2F2F0`, tinta `#111111`, primario amarillo seguridad `#F5B301` (texto negro encima), radios 0, bordes gruesos, fotos en blanco y negro. Muy distintivo, muy de nicho. **No lo construyo en la primera ronda** salvo que lo pidas.

---

## 3. Matriz comparativa

Puntuá de 1 a 5. Los pesos son una propuesta; ajustalos si tu criterio comercial es otro.

| Criterio | Peso | Papel | Noche | Órbita | Brisa | Pulso |
|---|---|---|---|---|---|---|
| Personalidad / atractivo comercial | 25% | | | | | |
| Adaptabilidad a distintos rubros | 20% | | | | | |
| Accesibilidad (contraste, foco, motion) | 15% | | | | | |
| Escalabilidad al panel administrativo | 15% | | | | | |
| Diferenciación frente a competidores | 15% | | | | | |
| Costo de implementación | 10% | | | | | |

**Hipótesis previa (a validar con tus ojos, no con la teoría):**

- **Brisa** gana en conversión móvil y en amplitud de rubros.
- **Papel** gana en percepción de calidad para tickets altos.
- **Órbita** es el mejor panel, pero como sitio público es el más olvidable.
- **Noche** es el más memorable y el más riesgoso (accesibilidad y mantenimiento).
- **Pulso** es el más seguro para salud y el menos diferencial.

**Combinación que probablemente recomiende al final:** sitio público de un concepto + panel «Órbita» con los tokens del concepto elegido (misma paleta, distinta densidad). Un producto no necesita que el panel sea tan expresivo como el sitio.

---

## 4. Plan de experimentación

### Fase 0 — Preparación (1–2 días)

- Fixture de contenido realista en español para 3 rubros: barbería ("Estudio Norte"), consultorio ("Dra. Rivas"), taller ("Taller Sur").
- Copys definitivos por concepto (el tono cambia: no se reutiliza el mismo texto).
- Fotografías: placeholders locales con proporciones fijas (4:5, 1:1, 16:9) para no decidir diseño en función de una foto que después no existe.
- Definir el set de datos de la demo: 6 servicios, 3 profesionales, 3 clientes, horarios reales.

### Fase 1 — Shell del laboratorio (2–3 días)

- `src/styles/themes/{papel,noche,orbita,brisa,pulso}.css` con el contrato de tokens.
- `ThemeProvider` que aplica `data-theme` y persiste la elección en la URL (`?theme=brisa`) y en `localStorage`.
- `/lab` — índice con una tarjeta por concepto: paleta, tipografías, rubro sugerido, y accesos directos a cada pantalla.
- Barra flotante de desarrollo (solo `NODE_ENV=development`): cambiar concepto, ancho de vista (375 / 768 / 1440), modo oscuro cuando aplique, y un contador de clics para el test de 5 segundos.
- La ruta `/lab` **no se enlaza** desde la app y se excluye del build de producción.

### Fase 2 — Primera ronda: 5 conceptos en fidelidad L1 (3–4 días)

Fidelidad **L1**: estructura y estilo reales, interacción simulada, sin lógica.

| # | Pantalla | Qué se evalúa |
|---|---|---|
| 1 | Home pública | Primera impresión, jerarquía, propuesta de valor |
| 2 | Servicios | Cómo se lee precio + duración sin tabla pesada |
| 3 | Equipo | Confianza y decisión de "elegir profesional" |
| 4 | Reserva — fecha y hora | El corazón del producto: claridad de slots, estados vacío/ocupado |
| 5 | Confirmación | Sensación de cierre y seguridad |
| 6 | Panel — dashboard | Densidad, KPIs, prioridades del día |
| 7 | Panel — calendario semanal | Legibilidad con 3 profesionales y 20 turnos |

**Gate 1:** elegís **dos finalistas**. Los otros tres se archivan como presets (no se descartan).

### Fase 3 — Segunda ronda: 2 finalistas en fidelidad L2 (4–6 días)

Fidelidad **L2**: flujo de reserva navegable de punta a punta con datos falsos en memoria, validación de formulario, estados de carga/error/vacío, responsive real a 375 px, teclado completo.

Se agregan:
- Vista móvil del flujo de reserva (prioridad absoluta).
- Estados: slot ocupado, sin disponibilidad ese día, error de red, reserva confirmada.
- Panel: tabla de turnos con filtros y estado vacío.

**Gate 2:** elegís **un concepto**. Se documentan los ajustes pedidos (máximo una ronda de cambios por finalista, para no entrar en un loop infinito).

### Fase 4 — Cierre (2–3 días)

- Ajustes finales y verificación de contraste con axe en las 7 pantallas.
- `docs/04-sistema-visual.md`: paleta final, tipografías, escala, radios, espaciado, componentes, reglas de uso y ejemplos de "hacer / no hacer".
- El concepto ganador pasa a ser el tema por defecto del producto; los demás quedan como presets seleccionables desde Configuración → Apariencia.
- Recién acá se empieza la Etapa 3 (lógica y base de datos).

---

## 5. Protocolo de evaluación

Para que la decisión no sea solo "me gusta":

1. **Test de 5 segundos** (home): ¿qué vende este negocio? ¿a quién? Si no se responde, el hero falla.
2. **Tres tareas con el celular en la mano:**
   - "Reservá un corte para el jueves a la tarde con cualquier profesional."
   - "Cancelá el turno."
   - "Como dueño, mirá cuántos turnos tenés mañana."
3. **Recorrido solo con teclado** en la reserva: tab, enter, escape, foco visible.
4. **axe DevTools** en las 7 pantallas. Cualquier violación AA es bloqueante, no "para después".
5. **Prueba de estrés de contenido:** nombre de servicio largo, precio de 6 cifras, profesional sin foto, 12 servicios, 0 turnos hoy.
6. **Registro escrito** de cada observación con pantalla, concepto y severidad. Sin registro, la decisión se pierde.

---

## 6. Anti-patrones prohibidos en esta etapa

- Cuatro variantes del mismo layout con distinto color.
- Gradiente violeta genérico + tarjetas blancas + sombra difusa (el "SaaS de plantilla").
- Glassmorphism decorativo.
- Íconos emoji como iconografía del producto.
- Texto gris claro sobre blanco "porque queda elegante".
- Animaciones que retrasan la reserva.
- Un hero con carrusel automático.
- Depender de una foto de stock perfecta: si el diseño no funciona con una foto mediocre, no funciona.

---

## 7. Qué necesito de vos para arrancar

1. **Rubro piloto** para el contenido de la demo (mi supuesto: barbería).
2. **Dos referencias visuales** que te gusten y **una que no** (links, capturas o nombres de marcas). Esto ahorra una ronda entera.
3. **Confirmación del orden:** ¿5 conceptos en L1 y después profundizar 2, o preferís 3 conceptos ya en L2 desde el inicio? (La primera opción muestra más diversidad; la segunda, más profundidad por concepto.)

---

## 8. Registro de ejecución — Etapa 2, ronda L1

Estado: **construida, verificada y pendiente de elección**. Los tres gates de esta etapa siguen abiertos hasta que haya decisión.

### Qué se construyó

Una sola implementación de cada pantalla; el concepto entra por `data-theme` y por dos variantes estructurales (`layout.hero`, `layout.slots`) declaradas en `src/lib/concepts.ts`.

| Ruta | Pantalla | Archivo de vista |
|---|---|---|
| `/` | Estado del proyecto | `src/app/page.tsx` |
| `/lab` | Comparador de los 5 conceptos | `src/app/lab/page.tsx` |
| `/lab/[concept]` | Home pública | `views/site-views.tsx` → `HomeView` |
| `/lab/[concept]/servicios` | Carta de servicios | `ServicesView` |
| `/lab/[concept]/equipo` | Equipo | `TeamView` |
| `/lab/[concept]/reservar` | Reserva: fecha y hora | `views/booking-views.tsx` |
| `/lab/[concept]/confirmacion` | Confirmación | `ConfirmationView` |
| `/lab/[concept]/admin` | Panel: dashboard | `views/admin-views.tsx` |
| `/lab/[concept]/admin/calendario` | Panel: agenda semanal | `AdminCalendarView` |

`[concept]` ∈ `papel | noche | orbita | brisa | pulso`. Son 35 páginas estáticas del laboratorio; el build completo genera 39.

### Desvíos respecto del plan de la §4, y por qué

| Planificado | Implementado | Motivo |
|---|---|---|
| `ThemeProvider` + `?theme=` + `localStorage` | Concepto en la ruta (`/lab/[concept]`) | La URL es compartible y no hay estado global que hidratar; el provider se agrega en la Etapa 3 cuando exista `BusinessTheme` en base. |
| Barra de desarrollo solo en development | `LabBar` visible también en producción | Permite previsualizar con `pnpm build && pnpm start` sin dos modos distintos. `/lab` sigue siendo `noindex`. |
| `/lab` excluida del build | Incluida, con `robots: noindex, nofollow` | Se necesita revisar el resultado compilado antes del gate. Se excluye en la Etapa 3. |
| Contador del test de 5 segundos | No implementado | Se resuelve con un cronómetro externo; no cambia la decisión. |

### Verificación ejecutada

| Comprobación | Resultado |
|---|---|
| `pnpm typecheck` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm build` | ✅ 39 rutas estáticas, 5 temas compilados |
| Contraste WCAG AA por tokens | ✅ 14 pares × 5 conceptos; se corrigieron 6 tokens que fallaban |
| 375 px / teclado / axe | ⏳ pendiente de la ronda L2 |

Correcciones de contraste aplicadas (texto normal, umbral 4.5:1):

| Concepto | Token | Antes | Después | Fallaba en |
|---|---|---|---|---|
| Papel | `accent` | `#b8763f` (3.47) | `#9a5a27` (5.45) | texto de acento sobre fondo |
| Noche | `accent` | `#7a6a4a` (3.76) | `#a08a63` (5.95) | texto de acento sobre fondo |
| Noche | `accent-fg` | `#f4f1ea` (2.95) | `#0a0a0b` (5.95) | etiqueta sobre acento |
| Brisa | `ink-muted` | `#78716c` (4.24) | `#6b645f` (5.13) | texto secundario sobre `surface-2` |
| Pulso | `accent` | `#0d9488` (3.56) | `#0f766e` (5.21) | texto de acento sobre fondo |
| Órbita / Pulso | `line` | 1.17 / 1.19 | 1.27 / 1.28 | definición de bordes |

El botón del bloque de reserva sobre fondo primario pasó de `accent` a `dark`: en Noche el acento es un bronce claro y el texto claro encima no alcanzaba AA.

### Cómo revisarlo

```bash
export PATH="$HOME/.local/bin:$PATH"
pnpm dev            # http://localhost:3000/lab
```

Recorrido sugerido, en este orden: `/lab` (impresión de conjunto) → Home → Servicios → Equipo → Reserva → Confirmación → Panel → Calendario. Después repetir con la ventana a 375 px.

### Qué queda para la ronda L2

Solo dos conceptos, con: flujo de reserva de punta a punta con validación real, estados de error y vacío, responsive verificado, teclado completo y axe sin violaciones. Eso se hace **después** de que elijas los dos finalistas.

---

## 9. Registro de ejecución — Etapa 2, ronda L2 sobre «Papel»

Estado: **construida y verificada, pendiente de validación**. La ronda se hizo solo sobre Papel, que además pasó a ser el tema por defecto del producto. Noche, Órbita, Brisa y Pulso quedan como presets en L1 a la espera de la decisión.

### Por qué Papel y no dos finalistas

El objetivo de la ronda era probar el flujo completo, no comparar estéticas otra vez. Profundizar un solo concepto permite llegar a una reserva realista sin duplicar el trabajo de dominio. Si la dirección visual no cierra, el flujo se conserva y se reemplaza la capa de tokens.

Papel dejó de ser «un concepto del laboratorio» y pasó a ser la identidad base: `:root` y `[data-theme="papel"]` comparten bloque en `src/styles/themes/papel.css`. Cualquier ruta fuera de `/lab` nace con esta paleta, tipografía y escala de radios.

### Qué se construyó

| Pieza | Archivo | Qué resuelve |
|---|---|---|
| Dominio de disponibilidad | `src/lib/booking/schedule.ts` | Horarios del local, días libres por profesional, ocupación determinística, buffers, slots, grilla mensual, ventana de reserva |
| Validación compartida | `src/lib/booking/schema.ts` | Zod para el formulario de datos y para los parámetros de la confirmación |
| Wizard de 4 pasos | `src/components/booking/wizard/*` | Servicio → profesional → fecha y hora → datos, con resumen lateral y validación inline |
| Confirmación | `src/components/booking/confirmation-card.tsx` | Recibo, código, calendario de Google y cancelación con estado local |
| Vista de reserva y confirmación | `src/components/views/booking-views.tsx` | Composición de las dos rutas del laboratorio |

Reglas de la demo, alineadas con `docs/02`:

- Grilla de 15 minutos; el turno ocupa `duración + buffer`.
- Anticipación mínima de 2 horas y horizonte de 60 días.
- Cancelación sin costo hasta 24 horas antes.
- Profesional «el primero disponible»: solo se muestran horarios realmente libres para alguno del equipo, para no prometer un turno que después no se puede asignar.
- Profesional elegido: se muestran también los ocupados, tachados y no accionables.
- Calendario con día cerrado, día sin lugar y feriado diferenciados por texto y forma, no solo por color.
- Estados simulables para revisar errores: turno tomado por otro cliente y falla de red al confirmar. Ambos se activan desde «Opciones de demo» en el último paso.

Ficción temporal de la demo: **lunes 16 de noviembre de 2026, 09:20**. El feriado del 23/11 cierra el local y el 27/11 está saturado a propósito para poder ver el estado vacío. Es una affordance del laboratorio, documentada en el módulo, no una regla de negocio.

### Accesibilidad y responsive de esta ronda

- Skip link a `#contenido` en el sitio público y en el panel.
- Menú móvil con `aria-expanded`, `aria-controls`, cierre con Escape y foco devuelto al disparador.
- Wizard con `aria-current="step"`, anuncio del paso por `aria-live`, foco al título en cada transición y errores asociados con `aria-describedby`.
- Radios y checkboxes reales dentro de `label`, con estado visible por `:checked` y foco por `:focus-visible`.
- Panel admin alineado a la misma semana de la demo para que las fechas no se contradigan entre pantallas.
- Un solo `h1` por página; el resumen de reserva no compite con el formulario.

### Verificación ejecutada

| Comprobación | Resultado |
|---|---|
| `pnpm typecheck` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm build` | ✅ 39 rutas; `/lab/[concept]/confirmacion` queda dinámica |
| Navegación completa del wizard | ✅ en dev server, con y sin profesional elegido |
| Estados de error y vacío | ✅ conflicto, red, día saturado y feriado |
| 375 px / 1440 px | ⏳ revisión visual del cliente |
| axe / lector de pantalla | ⏳ pendiente; no hay navegador headless funcional en este entorno |

### Qué queda para la Etapa 3

- Persistir la reserva: Server Action + validación Zod en servidor + `EXCLUDE USING gist` para el anti-solapamiento.
- Reemplazar el reloj de demo por `now()` y la zona horaria del negocio.
- Reemplazar la ocupación determinística por consultas a `appointments`.
- Llevar la cancelación de estado local a una mutación real con token de gestión.
- Aplicar el mismo flujo a un segundo concepto si la decisión visual lo pide; el wizard ya es token-driven.

