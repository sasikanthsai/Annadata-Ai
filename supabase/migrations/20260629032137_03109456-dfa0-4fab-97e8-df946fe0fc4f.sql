
-- Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM anon, authenticated, PUBLIC;

-- Storage policies for crop-images bucket (private)
-- Path convention: <user_id>/<filename>
CREATE POLICY "crop_images_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'crop-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "crop_images_select_own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'crop-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "crop_images_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'crop-images' AND (storage.foldername(name))[1] = auth.uid()::text);
