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

    "/api/posts": {
      async GET(req) {
        const url = new URL(req.url);
        const page = Number(url.searchParams.get("page") || "1");
        const limit = Number(url.searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;

        const posts = await db`
          SELECT id, user_id, title, description, price, image_url, created_at, updated_at 
          FROM posts 
          ORDER BY created_at DESC 
          LIMIT ${limit} OFFSET ${offset}
        `;
        return json({ posts });
      },

      async POST(req) {
        const auth = await requireAuth(req);
        if (auth.error) {
          return auth.error;
        }

        const body = await readJson(req);
        if (!body) {
          return json({ error: "Invalid JSON payload" }, 400);
        }

        const title = String(body.title || "").trim();
        const description = String(body.description || "").trim() || null;
        const price = body.price ? Number(body.price) : null;
        const image_url = String(body.image_url || "").trim() || null;

        if (!title) {
          return json({ error: "Title is required" }, 400);
        }

        await db`
          INSERT INTO posts ${sql({
            user_id: auth.user!.id,
            title,
            description,
            price,
            image_url,
          })}
        `;

        const posts = await db`SELECT id, user_id, title, description, price, image_url, created_at, updated_at FROM posts WHERE id = last_insert_rowid()`;
        return json({ post: posts[0] }, 201);
      },
    },

    "/api/posts/*": async (req: Request) => {
      const url = new URL(req.url);
      const pathname = url.pathname;

      const idMatch = pathname.match(/^\/api\/posts\/(\d+)$/);
      if (idMatch) {
        const postId = Number(idMatch[1]);

        if (req.method === "GET") {
          const posts = await db`
            SELECT id, user_id, title, description, price, image_url, created_at, updated_at 
            FROM posts 
            WHERE id = ${postId}
          `;

          if (posts.length === 0) {
            return json({ error: "Post not found" }, 404);
          }

          const post = posts[0] as any;
          const auth = await getAuthUser(req);
          let favorited = false;

          if (auth) {
            const fav = await db`
              SELECT COUNT(*) as count FROM favorites 
              WHERE user_id = ${auth.id} AND post_id = ${postId}
            `;
            favorited = (fav[0] as any).count > 0;
          }

          return json({ post: { ...post, favorited } });
        }

        if (req.method === "PUT") {
          const auth = await requireAuth(req);
          if (auth.error) {
            return auth.error;
          }

          const posts = await db`SELECT user_id FROM posts WHERE id = ${postId}`;
          if (posts.length === 0) {
            return json({ error: "Post not found" }, 404);
          }

          if ((posts[0] as any).user_id !== auth.user!.id) {
            return json({ error: "Forbidden" }, 403);
          }

          const body = await readJson(req);
          if (!body) {
            return json({ error: "Invalid JSON payload" }, 400);
          }

          const updated_at = new Date().toISOString();
          const updates: any = {};

          if (body.title !== undefined) {
            updates.title = String(body.title || "").trim();
          }
          if (body.description !== undefined) {
            updates.description = String(body.description || "").trim() || null;
          }
          if (body.price !== undefined) {
            updates.price = body.price ? Number(body.price) : null;
          }
          if (body.image_url !== undefined) {
            updates.image_url = String(body.image_url || "").trim() || null;
          }

          updates.updated_at = updated_at;

          await db`UPDATE posts SET ${sql(updates)} WHERE id = ${postId}`;

          const updated = await db`SELECT id, user_id, title, description, price, image_url, created_at, updated_at FROM posts WHERE id = ${postId}`;
          return json({ post: updated[0] });
        }

        if (req.method === "DELETE") {
          const auth = await requireAuth(req);
          if (auth.error) {
            return auth.error;
          }

          const posts = await db`SELECT user_id FROM posts WHERE id = ${postId}`;
          if (posts.length === 0) {
            return json({ error: "Post not found" }, 404);
          }

          if ((posts[0] as any).user_id !== auth.user!.id) {
            return json({ error: "Forbidden" }, 403);
          }

          await db`DELETE FROM posts WHERE id = ${postId}`;
          return json({ success: true });
        }
      }

      const favMatch = pathname.match(/^\/api\/posts\/(\d+)\/favorite$/);
      if (favMatch) {
        const postId = Number(favMatch[1]);

        if (req.method === "POST") {
          const auth = await requireAuth(req);
          if (auth.error) {
            return auth.error;
          }

          const posts = await db`SELECT id FROM posts WHERE id = ${postId}`;
          if (posts.length === 0) {
            return json({ error: "Post not found" }, 404);
          }

          const existing = await db`
            SELECT COUNT(*) as count FROM favorites 
            WHERE user_id = ${auth.user!.id} AND post_id = ${postId}
          `;

          if ((existing[0] as any).count > 0) {
            return json({ error: "Already favorited" }, 400);
          }

          await db`
            INSERT INTO favorites ${sql({
              user_id: auth.user!.id,
              post_id: postId,
            })}
          `;
          return json({ success: true });
        }

        if (req.method === "DELETE") {
          const auth = await requireAuth(req);
          if (auth.error) {
            return auth.error;
          }

          await db`DELETE FROM favorites WHERE user_id = ${auth.user!.id} AND post_id = ${postId}`;
          return json({ success: true });
        }
      }

      return json({ error: "Not found" }, 404);
    },



    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Advertisement app server running at ${server.url}`);
