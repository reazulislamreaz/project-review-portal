import { ApiError, type ApiFailure, type ApiResponse } from "./types";

const DEFAULT_API_BASE_URL = "http://localhost:4000";

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  return configured && configured.length > 0 ? configured.replace(/\/$/, "") : DEFAULT_API_BASE_URL;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

function isApiFailure(value: unknown): value is ApiFailure {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as { success: unknown }).success === false &&
    "message" in value &&
    typeof (value as { message: unknown }).message === "string"
  );
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token, signal } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check that the API is running.", 0);
  }

  let payload: unknown = null;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      payload = await response.json();
    } catch {
      throw new ApiError("Received an invalid response from the server.", response.status);
    }
  }

  if (!response.ok) {
    if (isApiFailure(payload)) {
      throw new ApiError(payload.message, response.status, payload.errors ?? []);
    }

    throw new ApiError(
      response.status >= 500 ? "Something went wrong. Please try again." : "Request failed.",
      response.status,
    );
  }

  const success = payload as ApiResponse<T>;
  if (
    typeof success !== "object" ||
    success === null ||
    !("success" in success) ||
    success.success !== true ||
    !("data" in success)
  ) {
    throw new ApiError("Received an unexpected response from the server.", response.status);
  }

  return success.data;
}
