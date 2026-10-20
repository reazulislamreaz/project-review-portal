import type { SubmissionStatus } from "@/lib/api/types";

export function formatSubmissionDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Compact date for dense tables. */
export function formatSubmissionDateCompact(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Human-readable waiting duration from submission createdAt.
 * Does not imply deadlines or overdue status.
 */
export function formatWaitingDuration(
  createdAt: string,
  nowMs: number = Date.now(),
): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "Waiting time unavailable";
  }

  const diffMs = Math.max(0, nowMs - date.getTime());
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) {
    return "Submitted just now";
  }
  if (minutes < 60) {
    return `Submitted ${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Submitted ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `Submitted ${days} ${days === 1 ? "day" : "days"} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `Submitted ${months} ${months === 1 ? "month" : "months"} ago`;
  }

  const years = Math.floor(days / 365);
  return `Submitted ${years} ${years === 1 ? "year" : "years"} ago`;
}

export function statusLabel(status: SubmissionStatus): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}
