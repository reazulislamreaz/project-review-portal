/** Normalize email for consistent uniqueness checks and storage. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
