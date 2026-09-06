import { createMiddleware } from "@tanstack/react-start";

const ADMIN_TOKEN_KEY = "annadata-admin-token";

export function saveAdminToken(token: string | null | undefined) {
  if (typeof window === "undefined") return;
  if (token) window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  else window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

export const attachAdminToken = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const token = typeof window !== "undefined" ? window.sessionStorage.getItem(ADMIN_TOKEN_KEY) : null;
  return next({
    headers: token ? { "x-annadata-admin-token": token } : {},
  });
});