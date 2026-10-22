import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <header className={cn("min-w-0 space-y-2", className)}>
      <h1 className="break-words text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-subtle">{description}</p>
      ) : null}
    </header>
  );
}
