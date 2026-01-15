-- IMPORTANT: Postgres does not allow adding an enum value and using it in the same transaction block.
-- Please run "STEP 1" separately, then run "STEP 2".

-- STEP 1: Run this line alone:
-- ALTER TYPE public.recipe_visibility ADD VALUE IF NOT EXISTS 'followers';

-- STEP 2: Run the rest of this script (everything below):
-- (Make sure Step 1 is done first!)

 CREATE TABLE public.recipe_shares (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
    token text UNIQUE NOT NULL,
    created_by uuid REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- Create household_follows table
CREATE TABLE public.household_follows (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    followed_household_id uuid REFERENCES public.households(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(follower_user_id, followed_household_id)
);

-- Helper function to check if user follows a household
CREATE OR REPLACE FUNCTION public.is_following_household(household_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.household_follows 
        WHERE follower_user_id = auth.uid() 
        AND followed_household_id = household_id
    );
$$ LANGUAGE sql STABLE;

-- RLS: recipe_shares
ALTER TABLE public.recipe_shares ENABLE ROW LEVEL SECURITY;

-- Owner can manage their shares
CREATE POLICY "Users can manage shares for their recipes" ON public.recipe_shares
    FOR ALL
    USING (
        recipe_id IN (
            SELECT id FROM public.recipes WHERE author_id = auth.uid()
        )
    );

-- RLS: household_follows
ALTER TABLE public.household_follows ENABLE ROW LEVEL SECURITY;

-- Users can view who they follow
CREATE POLICY "Users can view their follows" ON public.household_follows
    FOR SELECT
    USING (follower_user_id = auth.uid());

-- Users can follow/unfollow
CREATE POLICY "Users can manage their follows" ON public.household_follows
    FOR ALL
    USING (follower_user_id = auth.uid());

-- UPDATE RECIPES RLS POLICIES

-- Drop existing "View household recipes" to replace it with stricter logic
DROP POLICY IF EXISTS "View household recipes" ON public.recipes;

-- 1. Strict Household Policy: Only ACTUAL members can see 'household' visibility
CREATE POLICY "View household recipes (Strict)" ON public.recipes
    FOR SELECT
    USING (
        visibility = 'household' 
        AND household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

-- 2. Followers Policy: Members + Followers can see 'followers' visibility
CREATE POLICY "View followers recipes" ON public.recipes
    FOR SELECT
    USING (
        visibility = 'followers'
        AND (
            -- Is Member
            household_id IN (
                SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
            )
            OR
            -- Is Follower
            public.is_following_household(household_id)
        )
    );

-- RPC for Public Share View
CREATE OR REPLACE FUNCTION public.get_shared_recipe(token_input text)
RETURNS jsonb AS $$
DECLARE
    found_recipe_id uuid;
    result jsonb;
BEGIN
    -- Find recipe ID from token
    SELECT recipe_id INTO found_recipe_id
    FROM public.recipe_shares
    WHERE token = token_input;

    IF found_recipe_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Return recipe details (bypassing RLS via SECURITY DEFINER if we marked it, holding off on marking strict security definer for now to keep it simple, actually this is just a read)
    -- But since this is anonymous access, we need to be careful. 
    -- We can just select directly here.
    
    SELECT to_jsonb(r) || jsonb_build_object(
        'author', (SELECT to_jsonb(u) FROM public.users u WHERE u.id = r.author_id),
        'ingredients', (SELECT jsonb_agg(i ORDER BY i.sort_order) FROM public.ingredients i WHERE i.recipe_id = r.id),
        'instructions', (SELECT jsonb_agg(inst ORDER BY inst.step_number) FROM public.instructions inst WHERE inst.recipe_id = r.id),
        'images', (SELECT jsonb_agg(img ORDER BY img.order_index) FROM public.recipe_images img WHERE img.recipe_id = r.id)
    )
    INTO result
    FROM public.recipes r
    WHERE r.id = found_recipe_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
