import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Use getSession() — reads from localStorage synchronously and avoids
    // the race where getUser() fires before the session is rehydrated,
    // which was bouncing freshly signed-in users back to /auth.
    let { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Wait briefly for storage hydration (first paint after login)
      await new Promise((r) => setTimeout(r, 250));
      ({ data: { session } } = await supabase.auth.getSession());
    }
    if (!session?.user) throw redirect({ to: "/auth" });
    return { user: session.user };
  },
  component: () => <Outlet />,
});
