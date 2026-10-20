/**
 * Token storage trade-off (B6.1)
 *
 * The Express API authenticates with `Authorization: Bearer <jwt>` and does not
 * set HttpOnly session cookies. Switching to cookies would require backend auth
 * contract changes (Set-Cookie on login/signup, cookie parser, CSRF strategy,
 * and CORS credentials). That is out of scope for B6.1.
 *
 * Compatible approach: store the access token in `localStorage` and send it as
 * a Bearer header. This is XSS-sensitive; keep the frontend free of unsafe HTML
 * injection. Never put JWT_SECRET or passwords in frontend env or source.
 *
 * Client-side route guards improve UX only — backend RBAC remains authoritative.
 */

const TOKEN_STORAGE_KEY = "psr_access_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    return token && token.trim().length > 0 ? token : null;
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}
