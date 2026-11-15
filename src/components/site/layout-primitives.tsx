import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

export function Section({
  className,
  children,
  id,
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-[var(--theme-section-y)]", className)}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHead({
  index,
  title,
  description,
  action,
}: {
  index?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6 sm:mb-14">
      <div className="max-w-xl">
        {index ? (
          <p className="mb-3 font-mono text-[11px] tracking-[0.22em] text-ink-muted uppercase">
            {index}
          </p>
        ) : null}
        <h2 className="font-display text-2xl leading-[1.15] font-semibold tracking-[var(--theme-tracking-display)] sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/**
 * Placeholder fotográfico: en la Etapa 2 no hay imágenes definitivas,
 * así que la composición se resuelve con color y textura del propio tema.
 * Reemplazable por <Image> sin tocar el layout.
 */
export function Media({
  className,
  ratio = "4/5",
  label = "foto",
  tone = "primary",
}: {
  className?: string;
  ratio?: "4/5" | "1/1" | "3/2" | "16/9";
  label?: string;
  tone?: "primary" | "accent" | "ink";
}) {
  const aspect =
    ratio === "4/5"
      ? "aspect-[4/5]"
      : ratio === "1/1"
        ? "aspect-square"
        : ratio === "3/2"
          ? "aspect-[3/2]"
          : "aspect-[16/9]";

  const tint = `var(--theme-${tone})`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-2 ring-1 ring-line/70",
        aspect,
        className,
      )}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(120% 90% at 15% 0%, color-mix(in oklab, ${tint} 30%, transparent) 0%, transparent 55%), radial-gradient(90% 80% at 90% 100%, color-mix(in oklab, ${tint} 16%, transparent) 0%, transparent 60%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 9px)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/5 to-transparent" />
      <span className="absolute bottom-3 left-3 text-[9px] font-medium tracking-[0.25em] text-ink/40 uppercase">
        {label}
      </span>
    </div>
  );
}
