"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  loginUser,
  signupStudent,
  updateCurrentUserProfile,
} from "@/lib/api/auth";
import { ApiError, type AuthResult, type SafeUser } from "@/lib/api/types";
import { clearStoredToken, getStoredToken, storeToken } from "@/lib/auth/token";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: SafeUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<SafeUser>;
  signup: (name: string, email: string, password: string) => Promise<SafeUser>;
  updateProfile: (name: string) => Promise<SafeUser>;
  logout: () => void;
  refreshUser: () => Promise<SafeUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function hydrateFromToken(token: string): Promise<SafeUser> {
  return getCurrentUser(token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<SafeUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const applyAuthResult = useCallback((result: AuthResult) => {
    storeToken(result.token);
    setToken(result.token);
    setUser(result.user);
    setStatus("authenticated");
  }, []);

  const clearAuth = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const stored = getStoredToken();
      if (!stored) {
        if (!cancelled) {
          setStatus("unauthenticated");
        }
        return;
      }

      try {
        const profile = await hydrateFromToken(stored);
        if (cancelled) {
          return;
        }
        setToken(stored);
        setUser(profile);
        setStatus("authenticated");
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
          clearStoredToken();
        }
        setToken(null);
        setUser(null);
        setStatus("unauthenticated");
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginUser({ email, password });
      applyAuthResult(result);
      return result.user;
    },
    [applyAuthResult],
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await signupStudent({ name, email, password });
      applyAuthResult(result);
      return result.user;
    },
    [applyAuthResult],
  );

  const refreshUser = useCallback(async () => {
    const currentToken = token ?? getStoredToken();
    if (!currentToken) {
      clearAuth();
      return null;
    }

    try {
      const profile = await hydrateFromToken(currentToken);
      setToken(currentToken);
      setUser(profile);
      setStatus("authenticated");
      return profile;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        clearAuth();
      }
      throw error;
    }
  }, [clearAuth, token]);

  const updateProfile = useCallback(
    async (name: string) => {
      const currentToken = token ?? getStoredToken();
      if (!currentToken) {
        clearAuth();
        throw new ApiError("Authentication required", 401);
      }

      try {
        const profile = await updateCurrentUserProfile({ name }, currentToken);
        setUser(profile);
        setStatus("authenticated");
        return profile;
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
          clearAuth();
        }
        throw error;
      }
    },
    [clearAuth, token],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      token,
      login,
      signup,
      updateProfile,
      logout: clearAuth,
      refreshUser,
    }),
    [status, user, token, login, signup, updateProfile, clearAuth, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
