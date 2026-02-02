-- Add allow_member_edits to households
ALTER TABLE public.households ADD COLUMN IF NOT EXISTS allow_member_edits boolean DEFAULT false;

-- 1. RECIPES: Update RLS for 'UPDATE'
-- Previously: "Author can update recipe"
DROP POLICY IF EXISTS "Author can update recipe" ON public.recipes;

CREATE POLICY "Users can update recipes" ON public.recipes FOR UPDATE
USING (
  author_id = auth.uid()
  OR (
    -- Household member edit permission
    visibility = 'household'
    AND household_id IN (
      SELECT id FROM public.households 
      WHERE allow_member_edits = true 
      AND id IN (
        SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
      )
    )
  )
);

-- 2. INGREDIENTS: Update RLS for 'ALL' (Insert/Update/Delete)
-- Previously: "Author can modify ingredients"
DROP POLICY IF EXISTS "Author can modify ingredients" ON public.ingredients;

CREATE POLICY "Modify ingredients with permission" ON public.ingredients FOR ALL
USING (
  recipe_id IN (
    SELECT id FROM public.recipes 
    WHERE author_id = auth.uid()
    OR (
        visibility = 'household'
        AND household_id IN (
            SELECT id FROM public.households 
            WHERE allow_member_edits = true 
            AND id IN (
                SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
            )
        )
    )
  )
);

-- 3. INSTRUCTIONS: Update RLS for 'ALL' (Insert/Update/Delete)
-- Previously: "Author can modify instructions"
DROP POLICY IF EXISTS "Author can modify instructions" ON public.instructions;

CREATE POLICY "Modify instructions with permission" ON public.instructions FOR ALL
USING (
  recipe_id IN (
    SELECT id FROM public.recipes 
    WHERE author_id = auth.uid()
    OR (
        visibility = 'household'
        AND household_id IN (
            SELECT id FROM public.households 
            WHERE allow_member_edits = true 
            AND id IN (
                SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
            )
        )
    )
  )
);

-- 4. RECIPE IMAGES: Update RLS for 'ALL' (Insert/Update/Delete)
-- Previously: 
-- "Authors and household members can upload images" (INSERT)
-- "Authors can delete images" (DELETE)
DROP POLICY IF EXISTS "Authors and household members can upload images" ON public.recipe_images;
DROP POLICY IF EXISTS "Authors can delete images" ON public.recipe_images;

-- Create a unified policy for modifying images
CREATE POLICY "Modify images with permission" ON public.recipe_images FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.id = recipe_images.recipe_id
    AND (
      r.author_id = auth.uid() 
      OR (
        r.visibility = 'household' 
        AND r.household_id IN (
            SELECT id FROM public.households 
            WHERE allow_member_edits = true 
            AND id IN (
                SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
            )
        )
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.id = recipe_images.recipe_id
    AND (
      r.author_id = auth.uid() 
      OR (
        r.visibility = 'household' 
        AND r.household_id IN (
            SELECT id FROM public.households 
            WHERE allow_member_edits = true 
            AND id IN (
                SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
            )
        )
      )
    )
  )
);
