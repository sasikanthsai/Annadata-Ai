
-- Farms (multiple villages/fields per farmer)
CREATE TABLE public.farms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  village text NOT NULL,
  crop text,
  area_acres numeric,
  notes text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farms TO authenticated;
GRANT ALL ON public.farms TO service_role;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
CREATE POLICY farms_own_all ON public.farms FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER farms_set_updated_at BEFORE UPDATE ON public.farms
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX farms_user_idx ON public.farms(user_id);

-- Reminders (crop calendar tasks)
CREATE TYPE public.reminder_kind AS ENUM ('sowing','irrigation','fertilizer','pesticide','harvest','custom');
CREATE TABLE public.reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id uuid REFERENCES public.farms(id) ON DELETE SET NULL,
  title text NOT NULL,
  kind public.reminder_kind NOT NULL DEFAULT 'custom',
  crop text,
  due_date date NOT NULL,
  notes text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY reminders_own_all ON public.reminders FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER reminders_set_updated_at BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX reminders_user_due_idx ON public.reminders(user_id, due_date);

-- User settings (one row per user)
CREATE TABLE public.user_settings (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'system',           -- 'light' | 'dark' | 'system'
  accent text NOT NULL DEFAULT 'forest',          -- forest|sky|sunset|amber|violet
  language text NOT NULL DEFAULT 'en',            -- en|hi|mr|ta|te
  temperature_unit text NOT NULL DEFAULT 'C',     -- C|F
  rainfall_unit text NOT NULL DEFAULT 'mm',       -- mm|in
  notify_weather boolean NOT NULL DEFAULT true,
  notify_reminders boolean NOT NULL DEFAULT true,
  notify_email_digest boolean NOT NULL DEFAULT false,
  default_farm_id uuid REFERENCES public.farms(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_own_all ON public.user_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER user_settings_set_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
