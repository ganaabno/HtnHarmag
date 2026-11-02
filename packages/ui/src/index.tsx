import { Slot } from "@radix-ui/react-slot";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ButtonHTMLAttributes } from "react";
export const cn = (...values: ClassValue[]) => twMerge(clsx(values));
export function Button({
  asChild = false,
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "outline" | "light" | "ghost";
}) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn("button", `button-${variant}`, className)}
      {...props}
      onPointerMove={(event) => {
        props.onPointerMove?.(event);
        if (
          event.pointerType !== "mouse" ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return;
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          "--magnetic-x",
          `${(event.clientX - rect.left - rect.width / 2) * 0.055}px`,
        );
        event.currentTarget.style.setProperty(
          "--magnetic-y",
          `${(event.clientY - rect.top - rect.height / 2) * 0.055}px`,
        );
      }}
      onPointerLeave={(event) => {
        props.onPointerLeave?.(event);
        event.currentTarget.style.setProperty("--magnetic-x", "0px");
        event.currentTarget.style.setProperty("--magnetic-y", "0px");
      }}
    />
  );
}
