import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Category = z.enum(["general", "app_issue", "crop_diagnosis", "weather", "account"]);
const Priority = z.enum(["low", "normal", "urgent"]);

const ComplaintInput = z.object({
  category: Category.default("general"),
  priority: Priority.default("normal"),
  title: z.string().trim().min(3).max(160),
  message: z.string().trim().min(5).max(2000),
});

export type Complaint = {
  id: string;
  category: string;
  title: string;
  message: string;
  status: "open" | "reviewing" | "resolved";
  priority: "low" | "normal" | "urgent";
  created_at: string;
  updated_at: string;
};


export const createComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ComplaintInput.parse(data))
  .handler(async ({ data, context }): Promise<Complaint> => {
    const { supabase, userId } = context;
    const { data: complaint, error } = await supabase
      .from("complaints")
      .insert({
        user_id: userId,
        category: data.category,
        priority: data.priority,
        title: data.title,
        message: data.message,
      })
      .select("id, category, title, message, status, priority, admin_note, created_at, updated_at")
      .single();

    if (error) throw new Error(error.message);

    await supabase.from("activity_logs").insert({
      event_type: "complaint_created",
      path: "/complaints",
      query: data.title,
      user_id: userId,
      metadata: { category: data.category, priority: data.priority, complaint_id: complaint.id } as never,
    });

    return complaint as Complaint;
  });

export const listMyComplaints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Complaint[]> => {
    const { data, error } = await context.supabase
      .from("complaints")
      .select("id, category, title, message, status, priority, admin_note, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return (data ?? []) as Complaint[];
  });

export const deleteMyComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("complaints")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });