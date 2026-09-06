import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type Farm = {
  id: string;
  name: string;
  village: string;
  crop: string | null;
  area_acres: number | null;
  notes: string | null;
  is_default: boolean;
};

const CreateInput = z.object({
  name: z.string().trim().min(1).max(80),
  village: z.string().trim().min(1).max(100),
  crop: z.string().trim().max(60).optional().nullable(),
  area_acres: z.number().positive().max(100000).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  is_default: z.boolean().optional(),
});

const UpdateInput = CreateInput.partial().extend({ id: z.string().uuid() });

export const listFarms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Farm[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("farms")
      .select("id,name,village,crop,area_acres,notes,is_default")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Farm[];
  });

export const createFarm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.is_default) {
      await supabase.from("farms").update({ is_default: false }).eq("user_id", userId);
    }
    const { data: row, error } = await supabase
      .from("farms")
      .insert({ ...data, user_id: userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateFarm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { id, ...patch } = data;
    if (patch.is_default) {
      await supabase.from("farms").update({ is_default: false }).eq("user_id", userId);
    }
    const { error } = await supabase.from("farms").update(patch).eq("id", id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFarm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("farms").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
