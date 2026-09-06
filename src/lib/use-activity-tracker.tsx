import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity.functions";
import { getOrCreateActivitySessionId } from "@/lib/activity-client";

export function useActivityTracker() {
  const router = useRouter();
  const log = useServerFn(logActivity);
  const lastPath = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sid = getOrCreateActivitySessionId();

    const loginFlagFor = (userId: string) => `annadata:login-logged:${sid}:${userId}`;
    const safeSessionGet = (key: string) => {
      try { return window.sessionStorage.getItem(key); } catch { return null; }
    };
    const safeSessionSet = (key: string, value: string) => {
      try { window.sessionStorage.setItem(key, value); } catch {}
    };
    const clearLoginFlags = () => {
      try {
        for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
          const key = window.sessionStorage.key(i);
          if (key?.startsWith(`annadata:login-logged:${sid}:`)) {
            window.sessionStorage.removeItem(key);
          }
        }
      } catch {}
    };

    const fire = async (event_type: string, extra: Record<string, unknown> = {}, userIdOverride?: string | null) => {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = userIdOverride ?? data.session?.user.id ?? null;
        const path = window.location.pathname + window.location.search;
        await log({
          data: {
            event_type,
            path,
            session_id: sid,
            user_id: userId,
            metadata: extra,
            query: (extra as { query?: string }).query ?? null,
          },
        });
      } catch {
        // swallow — analytics must never break the app
      }
    };

    const logSignedInSession = async (userId: string | null | undefined, source: string) => {
      if (!userId) return;
      const key = loginFlagFor(userId);
      if (safeSessionGet(key)) return;
      safeSessionSet(key, "1");
      await fire("user_login", { source }, userId);
    };

    // Initial page view
    lastPath.current = window.location.pathname + window.location.search;
    fire("page_view");

    // If the app is opened with an already-hydrated farmer session, record it
    // once for this browser session so the admin dashboard never misses them.
    supabase.auth.getSession()
      .then(({ data }) => logSignedInSession(data.session?.user.id, "session_detected"))
      .catch(() => {});

    // Track route changes
    const unsub = router.subscribe("onResolved", () => {
      const path = window.location.pathname + window.location.search;
      if (path === lastPath.current) return;
      lastPath.current = path;
      fire("page_view");
    });

    // Track auth transitions — once per user/browser session, but include
    // INITIAL_SESSION so OAuth/signup redirects are not skipped.
    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        logSignedInSession(session?.user?.id, event.toLowerCase());
      }
      if (event === "SIGNED_OUT") {
        clearLoginFlags();
        fire("user_logout");
      }
    });

    return () => {
      unsub();
      authSub.subscription.unsubscribe();
    };
  }, [router, log]);
}
