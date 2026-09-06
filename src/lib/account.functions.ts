import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const exportMyDataCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ csv: string; filename: string }> => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("predictions")
      .select("created_at,crop,disease_name,disease_slug,confidence,is_healthy,notes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    const rows = data ?? [];
    const header = ["Date", "Crop", "Disease", "Slug", "Confidence", "Healthy", "Notes"];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push([
        r.created_at,
        csv(r.crop),
        csv(r.disease_name),
        csv(r.disease_slug ?? ""),
        r.confidence ?? "",
        r.is_healthy ? "yes" : "no",
        csv(r.notes ?? ""),
      ].join(","));
    }
    return { csv: lines.join("\n"), filename: `annadataai-history-${new Date().toISOString().slice(0, 10)}.csv` };
  });

function csv(v: unknown) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Cascades remove farms/reminders/settings/predictions via FK ON DELETE CASCADE
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
