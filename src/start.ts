import {
  createStart,
  createMiddleware,
  createCsrfMiddleware,
} from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

import { attachAdminToken } from "@/lib/admin-token-attacher";

/* =========================================================
   CSRF protection for TanStack Start server functions
   ========================================================= */

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

/* =========================================================
   Global error middleware
   ========================================================= */

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (
      error != null &&
      typeof error === "object" &&
      "statusCode" in error
    ) {
      throw error;
    }

    console.error(error);

    return new Response(renderErrorPage(), {
      status: 500,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  }
});

/* =========================================================
   TanStack Start configuration
   ========================================================= */

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth, attachAdminToken],

  requestMiddleware: [
    csrfMiddleware,
    errorMiddleware,
  ],
}));