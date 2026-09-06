import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type LogInput = {
  event_type: string;
  path?: string | null;
  query?: string | null;
  session_id?: string | null;
  user_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

export const logActivity = createServerFn({ method: "POST" })
  .inputValidator((data: LogInput) => {
    if (!data || typeof data.event_type !== "string" || !data.event_type) {
      throw new Error("event_type is required");
    }
    return {
      event_type: String(data.event_type).slice(0, 64),
      path: data.path ? String(data.path).slice(0, 512) : null,
      query: data.query ? String(data.query).slice(0, 1024) : null,
      session_id: data.session_id ? String(data.session_id).slice(0, 128) : null,
      user_id: data.user_id ? String(data.user_id).slice(0, 64) : null,
      metadata: data.metadata ?? null,
    };
  })
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const ua = getRequestHeader("user-agent") ?? null;
    let ip: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
    } catch {
      ip = null;
    }
    await supabase.from("activity_logs").insert({
      event_type: data.event_type,
      path: data.path,
      query: data.query,
      session_id: data.session_id,
      user_id: data.user_id,
      metadata: data.metadata as never,
      user_agent: ua,
      ip,
    });
    return { ok: true } as const;
  });
