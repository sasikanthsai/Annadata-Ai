import { supabase } from "@/integrations/supabase/client";

export function getOrCreateActivitySessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem("annadata_sid");
    if (!id) {
      id = window.crypto?.randomUUID?.() ?? `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem("annadata_sid", id);
    }
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

export async function getCurrentActivityUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}