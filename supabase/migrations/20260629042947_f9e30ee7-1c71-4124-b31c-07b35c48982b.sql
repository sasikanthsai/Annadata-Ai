DROP POLICY IF EXISTS "No direct admin user access" ON public.admin_users;
CREATE POLICY "No direct admin user access"
ON public.admin_users
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS activity_logs_insert_any ON public.activity_logs;
DROP POLICY IF EXISTS activity_logs_insert_known_events ON public.activity_logs;

CREATE POLICY activity_logs_insert_known_events
ON public.activity_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type IN (
    'page_view',
    'user_login',
    'user_logout',
    'search',
    'advisor_chat',
    'weather_lookup',
    'diagnosis',
    'complaint_created',
    'admin_login',
    'admin_login_failed'
  )
);