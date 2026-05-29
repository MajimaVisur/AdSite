import type { User, Post, PostDetail } from "@/api/types";

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

// ===== AUTH =====
export function register(username: string, email: string, password: string) {
  return apiRequest<{ token: string; user: User }>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ name: username, email, password }),
    },
    null
  );
}

export function login(emailOrUsername: string, password: string) {
  return apiRequest<{ token: string; user: User }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email: emailOrUsername, password }),
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

// ===== POSTS CRUD =====
export function listPosts(page = 1, limit = 20, category?: number, q?: string) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (category) params.set("category", String(category));
  if (q) params.set("q", q);
  return apiRequest<{ posts: Post[] }>(`/api/posts?${params}`);
}

export function getPostById(id: number, token?: string) {
  return apiRequest<{ post: PostDetail }>(`/api/posts/${id}`, { method: "GET" }, token ?? null);
}

export function createPost(
  title: string,
  description?: string,
  price?: number,
  image_url?: string,
  category_id?: number,
  token?: string
) {
  return apiRequest<{ post: Post }>(
    "/api/posts",
    {
      method: "POST",
      body: JSON.stringify({ title, description, price, image_url, category_id }),
    },
    token ?? null
  );
}

export function updatePost(id: number, updates: Partial<Post>, token?: string) {
  return apiRequest<{ post: Post }>(
    `/api/posts/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(updates),
    },
    token ?? null
  );
}

export function deletePost(id: number, token?: string) {
  return apiRequest<{ success: boolean }>(`/api/posts/${id}`, { method: "DELETE" }, token ?? null);
}

// ===== POSTS FAVORITES =====
export function addFavorite(postId: number, token: string) {
  return apiRequest<{ success: boolean }>(`/api/posts/${postId}/favorite`, { method: "POST" }, token);
}

export function removeFavorite(postId: number, token: string) {
  return apiRequest<{ success: boolean }>(`/api/posts/${postId}/favorite`, { method: "DELETE" }, token);
}

// ===== USER OPERATIONS =====
export function getUserInfo(token: string) {
  return apiRequest<{ user: User }>("/api/users/me", { method: "GET" }, token);
}

export function getUserFavorites(token: string) {
  return apiRequest<{ favorites: Post[] }>("/api/users/favorites", { method: "GET" }, token);
}

export function getUserPosts(token: string) {
  return apiRequest<{ posts: Post[] }>("/api/users/posts", { method: "GET" }, token);
}
