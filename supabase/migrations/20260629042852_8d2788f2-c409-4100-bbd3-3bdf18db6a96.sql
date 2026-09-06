CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT complaints_category_length CHECK (char_length(category) BETWEEN 2 AND 40),
  CONSTRAINT complaints_title_length CHECK (char_length(title) BETWEEN 3 AND 160),
  CONSTRAINT complaints_message_length CHECK (char_length(message) BETWEEN 5 AND 2000),
  CONSTRAINT complaints_status_allowed CHECK (status IN ('open', 'reviewing', 'resolved')),
  CONSTRAINT complaints_priority_allowed CHECK (priority IN ('low', 'normal', 'urgent'))
);

GRANT SELECT, INSERT, UPDATE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view their own complaints"
ON public.complaints
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Farmers can create their own complaints"
ON public.complaints
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Farmers can update their own open complaints"
ON public.complaints
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status IN ('open', 'reviewing'))
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS complaints_set_updated_at ON public.complaints;
CREATE TRIGGER complaints_set_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX IF NOT EXISTS complaints_user_id_idx ON public.complaints (user_id);
CREATE INDEX IF NOT EXISTS complaints_created_at_idx ON public.complaints (created_at DESC);
CREATE INDEX IF NOT EXISTS complaints_status_idx ON public.complaints (status);