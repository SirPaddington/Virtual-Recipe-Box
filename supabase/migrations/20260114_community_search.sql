-- Allow all authenticated users to view households (for search/community feature)
-- Policies are OR-ed, so this effectively opens up read access to all households for logged-in users.

CREATE POLICY "Authenticated users can view all households" ON public.households
    FOR SELECT
    TO authenticated
    USING (true);
