import { serve } from "bun";
import { sql } from "bun";
import index from "./index.html";
import {
  createSession,
  db,
  deleteSession,
  getUserFromToken,
  initDatabase,
  nowIso,
  parseTokenFromHeader,
  sanitizeUser,
} from "./db";

type JsonObject = Record<string, unknown>;

function json(body: JsonObject, status = 200) {
  return Response.json(body, { status });
}

async function readJson(req: Request) {
  try {
    return (await req.json()) as JsonObject;
  } catch {
    return null;
  }
}

async function getAuthUser(req: Request) {
  const token = parseTokenFromHeader(req.headers.get("authorization"));
  return getUserFromToken(token);
}

async function requireAuth(req: Request) {
  const user = await getAuthUser(req);
  if (!user) {
    return {
      error: json({ error: "Authentication required" }, 401),
      user: null,
    };
  }
  if (user.is_blocked) {
    return {
      error: json({ error: "Your account is blocked" }, 403),
      user: null,
    };
  }
  return { error: null, user };
}

await initDatabase();

const server = serve({
  routes: {
    "/api/health": () =>
      json({ status: "ok", timestamp: new Date().toISOString() }),

    "/api/auth/register": {
      async POST(req) {
        const body = await readJson(req);
        if (!body) {
          return json({ error: "Invalid JSON payload" }, 400);
        }

        const name = String(body.name || "").trim();
        const email = String(body.email || "")
          .trim()
          .toLowerCase();
        const password = String(body.password || "").trim();

        if (!name || !email || password.length < 6) {
          return json(
            { error: "Name, email and password (6+ chars) are required" },
            400,
          );
        }

        const exists = await db`SELECT id FROM users WHERE email = ${email}`;
        if (exists.length > 0) {
          return json({ error: "Email is already in use" }, 400);
        }

        const passwordHash = await Bun.password.hash(password);
        await db`
          INSERT INTO users ${sql({
            name,
            email,
            password_hash: passwordHash,
            role: "user",
          })}
        `;

        const created =
          await db`SELECT id, name, email, role, is_blocked FROM users WHERE email = ${email}`;
        const user = created[0] as any;

        const token = await createSession(user.id);
        return json({ token, user: sanitizeUser(user) }, 201);
      },
    },

    "/api/auth/login": {
      async POST(req) {
        const body = await readJson(req);
        if (!body) {
          return json({ error: "Invalid JSON payload" }, 400);
        }

        const email = String(body.email || "")
          .trim()
          .toLowerCase();
        const password = String(body.password || "").trim();

        if (!email || !password) {
          return json({ error: "Email and password are required" }, 400);
        }

        const users =
          await db`SELECT id, name, email, role, is_blocked, password_hash FROM users WHERE email = ${email}`;
        const user = users.length > 0 ? (users[0] as any) : null;

        if (!user) {
          return json({ error: "Invalid email or password" }, 401);
        }

        const ok = await Bun.password.verify(password, user.password_hash);
        if (!ok) {
          return json({ error: "Invalid email or password" }, 401);
        }
        if (user.is_blocked) {
          return json({ error: "Your account is blocked" }, 403);
        }

        const token = await createSession(user.id);
        return json({ token, user: sanitizeUser(user) });
      },
    },

    "/api/auth/logout": {
      async POST(req) {
        const token = parseTokenFromHeader(req.headers.get("authorization"));
        if (token) {
          await deleteSession(token);
        }
        return json({ success: true });
      },
    },

    "/api/auth/me": {
      async GET(req) {
        const auth = await requireAuth(req);
        if (auth.error || !auth.user) {
          return auth.error;
        }
        return json({ user: sanitizeUser(auth.user) });
      },
    },



    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Advertisement app server running at ${server.url}`);
