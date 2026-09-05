import * as Sentry from "@sentry/hono/bun";
import { Hono } from "hono";
// import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@helix/database/client";
import type { AuthenticatedEnv } from "../middleware/requireAuth";
import { requireCreditsBalance } from "../middleware/requireCreditsBalance";

const createSessionSchema = z.object({
  title: z.string(),
});

const createSessionValidator = zValidator(
  "json",
  createSessionSchema,
  (result, c) => {
    if (!result.success) {
      Sentry.logger.warn("Session creation validate failed", {
        path: c.req.path,
        issue: result.error.issues.length,
      });
      return c.json({ error: "Invalid request body" }, 400);
    }
  },
);

const app = new Hono<AuthenticatedEnv>()
  .get("/", async (c) => {
    const userId = c.get("userId");

    const session = await db.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    Sentry.logger.info("Listed sessions", {
      count: session.length,
    });
    return c.json(session);
  })
  .get("/:id", async (c) => {
    // await new Promise((r) => setTimeout(r, 5000));
    // throw new HTTPException(500, {
    //   message: "Mock error: session loading failed",
    // });

    const id = c.req.param("id");
    const userId = c.get("userId");

    const session = await db.session.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!session) {
      Sentry.logger.warn("Session not found", {
        sessionId: id,
        userId,
      });
      return c.json({ error: "Session not found" }, 404);
    }

    Sentry.logger.info("Loaded session", {
      sessionId: session.id,
    });

    return c.json(session);
  })
  .post("/", requireCreditsBalance, createSessionValidator, async (c) => {
    // await new Promise((r) => setTimeout(r, 5000));
    // throw new HTTPException(500, {
    //   message: "Mock error: session loading failed",
    // });

    const userId = c.get("userId");
    const data = c.req.valid("json");

    const session = await db.session.create({
      data: {
        ...data,
        userId,
      },
    });

    Sentry.logger.info("Created session", {
      sessionId: session.id,
      title: session.title,
    });

    return c.json(session, 201);
  });

export default app;
