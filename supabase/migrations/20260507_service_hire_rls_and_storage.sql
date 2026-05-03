-- RLS policies for the order-attachments bucket created in S1.
-- Path convention: {order_id}/{question_key}/{filename}
--
-- Reads:
--   - The client of the order can read their attachments.
--   - Admin staff (members.is_active) can read all attachments.
-- Writes:
--   - INSERT/UPDATE/DELETE only via service_role (server actions).
--     No public policies for write — Supabase service role bypasses RLS.

CREATE POLICY "order owner can read attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'order-attachments'
  AND (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND o.client_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      WHERE sp.user_id = auth.uid()
    )
  )
);
