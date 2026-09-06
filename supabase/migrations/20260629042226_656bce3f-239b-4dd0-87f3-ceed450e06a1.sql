
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (server) can access.

INSERT INTO public.admin_users (username, password_hash, created_by)
VALUES ('sasi', encode(digest('123', 'sha256'), 'hex'), 'system')
ON CONFLICT (username) DO NOTHING;
