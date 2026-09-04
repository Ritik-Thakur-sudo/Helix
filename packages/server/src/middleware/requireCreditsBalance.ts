import type { AuthenticatedEnv } from "./requireAuth";
import { createMiddleware } from "hono/factory";
import { getAvailableCreditsBalance } from "../lib/polar";

export const requireCreditsBalance = createMiddleware<AuthenticatedEnv>(
  async (c, next) => {
    try {
      const userId = c.get("userId");
      const creditsBalance = await getAvailableCreditsBalance(userId);

      // only start new work when the customer still has credits left.
      // It does not reverse the eventual cost of the request, so low-volume apps may tolerate small overspend on edge cases.
      if (creditsBalance <= 0) {
        return c.json(
          {
            error: "No credits remaining. Run /upgrade to buy more credits.",
          },
          402,
        );
      }

      return next();
    } catch (error) {
      console.error("Failed to verify Polar credits balance", { error, userId: c.get("userId") });
      return c.json(
        {
          error: "Unable to verify credits balance right now.",
        },
        503,
      );
    }
  },
);
