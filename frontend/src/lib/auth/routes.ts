import type { Role } from "@/lib/api/types";

export function homePathForRole(role: Role): string {
  return role === "MENTOR" ? "/mentor" : "/student";
}
