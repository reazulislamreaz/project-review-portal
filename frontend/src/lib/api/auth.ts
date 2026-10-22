import { apiRequest } from "./client";
import type { AuthResult, SafeUser } from "./types";

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export async function signupStudent(payload: SignupPayload): Promise<AuthResult> {
  return apiRequest<AuthResult>("/api/auth/signup", {
    method: "POST",
    body: payload,
  });
}

export async function loginUser(payload: LoginPayload): Promise<AuthResult> {
  return apiRequest<AuthResult>("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function getCurrentUser(token: string): Promise<SafeUser> {
  const data = await apiRequest<{ user: SafeUser }>("/api/auth/me", {
    method: "GET",
    token,
  });
  return data.user;
}

export type UpdateProfilePayload = {
  name: string;
};

export async function updateCurrentUserProfile(
  payload: UpdateProfilePayload,
  token: string,
): Promise<SafeUser> {
  const data = await apiRequest<{ user: SafeUser }>("/api/auth/me", {
    method: "PATCH",
    body: payload,
    token,
  });
  return data.user;
}
