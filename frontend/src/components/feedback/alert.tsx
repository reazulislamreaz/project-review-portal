import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlertProps = {
  variant?: "error" | "info" | "success";
  title?: string;
  children: ReactNode;
  className?: string;
};

const variantClasses = {
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
} as const;

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("rounded-md border px-3 py-2 text-sm", variantClasses[variant], className)}
    >
      {title ? <p className="font-medium">{title}</p> : null}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}
