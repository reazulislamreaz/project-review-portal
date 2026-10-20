import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlertProps = {
  variant?: "error" | "info" | "success";
  title?: string;
  children: ReactNode;
  className?: string;
};

const variantClasses = {
  error: "border-foreground/20 bg-muted text-foreground",
  info: "border-border bg-muted/60 text-subtle",
  success: "border-border bg-surface text-foreground",
} as const;

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-3.5 py-2.5 text-sm leading-relaxed",
        variantClasses[variant],
        className,
      )}
    >
      {title ? <p className="font-medium text-foreground">{title}</p> : null}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}
