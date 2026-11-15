import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-[background-color,border-color,color,transform,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:bg-primary-hover",
        accent: "bg-accent text-accent-fg hover:brightness-110",
        outline: "border border-line bg-transparent text-ink hover:bg-surface-2",
        soft: "bg-surface-2 text-ink hover:brightness-[0.97]",
        ghost: "text-ink hover:bg-surface-2",
        dark: "bg-ink text-background hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3.5 text-[13px]",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-[15px]",
      },
      shape: {
        default: "rounded-md",
        pill: "rounded-full",
        none: "",
      },
      full: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      shape: "default",
      full: false,
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, shape, full, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, shape, full }), className)}
      {...props}
    />
  );
}
