"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SectionNavItem = {
  href: string;
  label: string;
  /** When true, only exact pathname matches (e.g. dashboard at `/student`). */
  exact?: boolean;
};

type SectionNavProps = {
  items: readonly SectionNavItem[];
  label: string;
  className?: string;
};

export function SectionNav({ items, label, className }: SectionNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={label}
      className={cn(
        "mb-8 flex gap-1 overflow-x-auto border-b border-border",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
