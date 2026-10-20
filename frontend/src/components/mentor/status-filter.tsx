"use client";

import { Button } from "@/components/ui/button";
import type { StatusFilter } from "@/lib/api/types";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

type StatusFilterProps = {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
  disabled?: boolean;
};

export function StatusFilterControl({ value, onChange, disabled }: StatusFilterProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filter submissions by status"
    >
      {FILTERS.map((filter) => {
        const selected = value === filter.value;
        return (
          <Button
            key={filter.value}
            type="button"
            size="sm"
            variant={selected ? "default" : "outline"}
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(filter.value)}
          >
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}
