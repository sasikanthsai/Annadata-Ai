DROP POLICY IF EXISTS "Farmers can update their own open complaints" ON public.complaints;
REVOKE UPDATE ON public.complaints FROM authenticated;