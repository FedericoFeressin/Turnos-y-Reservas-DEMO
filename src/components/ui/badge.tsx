import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-surface-2 text-ink-muted",
        primary: "bg-primary/10 text-primary",
        accent: "bg-accent/10 text-accent",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        danger: "bg-danger/10 text-danger",
        outline: "border border-line text-ink-muted",
      },
      size: {
        sm: "h-5 px-2",
        md: "h-6 px-2.5",
      },
      shape: {
        default: "rounded-sm",
        pill: "rounded-full",
      },
    },
    defaultVariants: { tone: "neutral", size: "md", shape: "default" },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, size, shape, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size, shape }), className)} {...props} />
  );
}
