import type { User } from "@/api/types";

export async function apiRequest<T>(path: string, options: RequestInit = {}, token: string | null = null): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(path, { ...options, headers });
  const payload = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(payload.error || `Request failed (${res.status})`);
  }
  return payload;
}

export function login(email: string, password: string) {
  return apiRequest<{ token: string; user: User }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    null
  );
}

export function register(name: string, email: string, password: string) {
  return apiRequest<{ token: string; user: User }>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    },
    null
  );
}

export function logout(token: string | null) {
  return apiRequest<{ success: boolean }>("/api/auth/logout", { method: "POST" }, token);
}

export function getMe(token: string) {
  return apiRequest<{ user: User }>("/api/auth/me", { method: "GET" }, token);
}
