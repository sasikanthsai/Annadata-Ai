import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type UserSettings = {
  theme: "light" | "dark" | "system";
  accent: "forest" | "sky" | "sunset" | "amber" | "violet";
  language: "en" | "hi" | "mr" | "ta" | "te";
  temperature_unit: "C" | "F";
  rainfall_unit: "mm" | "in";
  notify_weather: boolean;
  notify_reminders: boolean;
  notify_email_digest: boolean;
  default_farm_id: string | null;
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: "system",
  accent: "forest",
  language: "en",
  temperature_unit: "C",
  rainfall_unit: "mm",
  notify_weather: true,
  notify_reminders: true,
  notify_email_digest: false,
  default_farm_id: null,
};

const SettingsInput = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  accent: z.enum(["forest", "sky", "sunset", "amber", "violet"]).optional(),
  language: z.enum(["en", "hi", "mr", "ta", "te"]).optional(),
  temperature_unit: z.enum(["C", "F"]).optional(),
  rainfall_unit: z.enum(["mm", "in"]).optional(),
  notify_weather: z.boolean().optional(),
  notify_reminders: z.boolean().optional(),
  notify_email_digest: z.boolean().optional(),
  default_farm_id: z.string().uuid().nullable().optional(),
});

export const getMySettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserSettings> => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_settings")
      .select("theme,accent,language,temperature_unit,rainfall_unit,notify_weather,notify_reminders,notify_email_digest,default_farm_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) {
      await supabase.from("user_settings").insert({ user_id: userId });
      return DEFAULT_SETTINGS;
    }
    return data as UserSettings;
  });

export const updateMySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SettingsInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
