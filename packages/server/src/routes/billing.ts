import { Hono } from "hono";
import type { AuthenticatedEnv } from "../middleware/requireAuth";
import {
  createCheckoutUrl,
  createCustomerPortalUrl,
  hasPolarStatusCode,
} from "../lib/polar";

const app = new Hono<AuthenticatedEnv>()
  .post("/checkout", async (c) => {
    const userId = c.get("userId");

    return c.json({
      url: await createCheckoutUrl({
        customerExternalId: userId,
        requestUrl: c.req.url,
      }),
    });
  })
  .post("/portal", async (c) => {
    const userId = c.get("userId");

    try {
      return c.json({
        url: await createCustomerPortalUrl({
          customerExternalId: userId,
          requestUrl: c.req.url,
        }),
      });
    } catch (error) {
      console.error("Failed to create Polar customer portal session", {
        error,
        userId,
      });

      if (hasPolarStatusCode(error, 404)) {
        return c.json(
          {
            error:
              "No Polar customer exists yet. Run /upgrade and complete checkout before opening billing usage.",
          },
          404,
        );
      }

      throw error;
    }
  })
  .get("/success", (c) =>
    c.text("Done. You may close this tab and return to the Helix."),
  );

export default app;
