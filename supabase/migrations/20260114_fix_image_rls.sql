-- Fix RLS for recipe_images to include 'followers' visibility and ensure author always has access

-- Drop existing "View images for visible recipes" policy
DROP POLICY IF EXISTS "View images for visible recipes" ON public.recipe_images;

-- Re-create policy with comprehensive visibility logic
CREATE POLICY "View images for visible recipes" ON public.recipe_images
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes r
            WHERE r.id = recipe_images.recipe_id
            AND (
                -- 1. Author always has access
                r.author_id = auth.uid()
                
                -- 2. Public
                OR r.visibility = 'public'
                
                -- 3. Household (Members Only)
                OR (
                    r.visibility = 'household' 
                    AND r.household_id IN (
                        SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
                    )
                )
                
                -- 4. Followers (Members + Followers)
                OR (
                    r.visibility = 'followers'
                    AND (
                        -- Is Member
                        r.household_id IN (
                            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
                        )
                        OR
                        -- Is Follower
                        public.is_following_household(r.household_id)
                    )
                )
            )
        )
    );
