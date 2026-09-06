import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type ReminderKind = "sowing" | "irrigation" | "fertilizer" | "pesticide" | "harvest" | "custom";

export type Reminder = {
  id: string;
  title: string;
  kind: ReminderKind;
  crop: string | null;
  due_date: string;
  notes: string | null;
  completed: boolean;
  farm_id: string | null;
};

const CreateInput = z.object({
  title: z.string().trim().min(1).max(120),
  kind: z.enum(["sowing", "irrigation", "fertilizer", "pesticide", "harvest", "custom"]),
  crop: z.string().trim().max(60).optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().trim().max(500).optional().nullable(),
  farm_id: z.string().uuid().optional().nullable(),
});
const UpdateInput = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(120).optional(),
  kind: z.enum(["sowing", "irrigation", "fertilizer", "pesticide", "harvest", "custom"]).optional(),
  crop: z.string().trim().max(60).optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
  completed: z.boolean().optional(),
  farm_id: z.string().uuid().optional().nullable(),
});

export const listReminders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Reminder[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("reminders")
      .select("id,title,kind,crop,due_date,notes,completed,farm_id")
      .eq("user_id", userId)
      .order("completed", { ascending: true })
      .order("due_date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Reminder[];
  });

export const createReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("reminders")
      .insert({ ...data, user_id: userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { id, ...patch } = data;
    const { error } = await supabase.from("reminders").update(patch).eq("id", id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("reminders").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
