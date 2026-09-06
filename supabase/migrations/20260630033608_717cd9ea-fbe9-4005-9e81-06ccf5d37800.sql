
-- Revoke column-level SELECT on admin_note from authenticated/anon so the
-- complaint owner can never read internal admin triage notes via PostgREST.
-- Admin reads happen through the service_role (server-only), which retains access.
REVOKE SELECT (admin_note) ON public.complaints FROM authenticated;
REVOKE SELECT (admin_note) ON public.complaints FROM anon;

-- Re-grant SELECT on all other columns explicitly to authenticated.
GRANT SELECT (id, user_id, category, title, message, status, priority, created_at, updated_at)
  ON public.complaints TO authenticated;
