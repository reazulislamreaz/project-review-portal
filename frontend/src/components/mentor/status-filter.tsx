"use client";

import { Button } from "@/components/ui/button";
import type { StatusFilter } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Needs review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

type StatusFilterProps = {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
  disabled?: boolean;
  /** Optional pending count shown on the Needs review control. */
  pendingCount?: number | null;
};

export function StatusFilterControl({
  value,
  onChange,
  disabled,
  pendingCount,
}: StatusFilterProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filter submissions by status"
    >
      {FILTERS.map((filter) => {
        const selected = value === filter.value;
        const isPendingFilter = filter.value === "PENDING";
        const badgeValue =
          typeof pendingCount === "number" && pendingCount >= 0 ? pendingCount : null;

        return (
          <Button
            key={filter.value}
            type="button"
            size="sm"
            variant={selected ? "default" : "outline"}
            aria-pressed={selected}
            disabled={disabled}
            className={cn(isPendingFilter && "min-w-[8.75rem] justify-center")}
            onClick={() => onChange(filter.value)}
          >
            {filter.label}
            {isPendingFilter ? (
              <span
                className={
                  selected
                    ? "min-w-[1.25rem] rounded bg-primary-foreground/15 px-1.5 py-0.5 text-center text-[0.7rem] tabular-nums"
                    : "min-w-[1.25rem] rounded bg-muted px-1.5 py-0.5 text-center text-[0.7rem] tabular-nums text-subtle"
                }
              >
                {badgeValue ?? "–"}
              </span>
            ) : null}
          </Button>
        );
      })}
    </div>
  );
}
