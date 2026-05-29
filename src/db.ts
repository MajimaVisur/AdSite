import { randomUUID } from "node:crypto";
import { sql, SQL } from "bun";

export type UserRole = "admin" | "user";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_blocked: number;
};

export const db = new SQL("sqlite://database.sqlite");

export async function initDatabase() {
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
      is_blocked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price REAL,
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `;



  const userCount = await db`SELECT COUNT(*) AS count FROM users`;
  if (userCount.length === 0 || (userCount[0] as any).count === 0) {
    const adminPassword = await Bun.password.hash("admin123");
    const userPassword = await Bun.password.hash("user123");

    await db`
      INSERT INTO users ${sql({
        name: "Main Admin",
        email: "admin@example.com",
        password_hash: adminPassword,
        role: "admin",
      })}
    `;

    await db`
      INSERT INTO users ${sql({
        name: "Demo User",
        email: "user@example.com",
        password_hash: userPassword,
        role: "user",
      })}
    `;
  }


}

export async function createSession(userId: number) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  await db`
    INSERT INTO sessions ${sql({
      token,
      user_id: userId,
      expires_at: expiresAt,
    })}
  `;
  return token;
}

export async function deleteSession(token: string) {
  await db`DELETE FROM sessions WHERE token = ${token}`;
}

export async function getUserFromToken(token: string | null): Promise<AuthUser | null> {
  if (!token) {
    return null;
  }

  const sessions = await db`
    SELECT u.id, u.name, u.email, u.role, u.is_blocked
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND datetime(s.expires_at) > datetime('now')
  `;

  if (sessions.length === 0) {
    return null;
  }

  return sessions[0] as AuthUser;
}

export function sanitizeUser(user: AuthUser) {
  return {
    id: user.id,
    username: user.name,
    email: user.email,
    is_admin: user.role === "admin",
  };
}

export function parseTokenFromHeader(authHeader: string | null) {
  if (!authHeader) {
    return null;
  }

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return authHeader.trim();
}

export function nowIso() {
  return new Date().toISOString();
}