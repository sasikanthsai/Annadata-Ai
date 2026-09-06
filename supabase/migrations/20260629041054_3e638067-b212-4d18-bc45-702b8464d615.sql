
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  event_type text NOT NULL,
  path text,
  query text,
  metadata jsonb,
  user_agent text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.activity_logs TO anon, authenticated;
GRANT ALL ON public.activity_logs TO service_role;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_logs_insert_any
  ON public.activity_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX activity_logs_created_at_idx ON public.activity_logs (created_at DESC);
CREATE INDEX activity_logs_event_type_idx ON public.activity_logs (event_type);
CREATE INDEX activity_logs_user_id_idx ON public.activity_logs (user_id);
CREATE INDEX activity_logs_session_id_idx ON public.activity_logs (session_id);
