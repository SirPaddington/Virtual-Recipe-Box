// Database types matching our Supabase schema

export type RecipeCategory = 'cooking' | 'baking' | 'beverage' | 'other'
export type RecipeVisibility = 'private' | 'household' | 'followers' | 'public'
export type HouseholdRole = 'owner' | 'admin' | 'member'

export type UnitType =
    | 'tsp' | 'tbsp' | 'cup' | 'fl_oz' | 'pint' | 'quart' | 'gallon'
    | 'oz' | 'lb'
    | 'ml' | 'l' | 'g' | 'kg'
    | 'pinch' | 'dash'
    | 'piece' | 'whole' | 'slice' | 'clove' | 'sprig' | 'leaf'
    | 'to_taste' | 'as_needed'

export interface User {
    id: string
    email: string
    display_name: string | null
    avatar_url: string | null
    created_at: string
}

export interface Household {
    id: string
    name: string
    owner_id: string
    allow_member_edits: boolean
    created_at: string
}

export interface HouseholdMember {
    id: string
    household_id: string
    user_id: string
    role: HouseholdRole
    joined_at: string
}

export interface HouseholdFollow {
    id: string
    follower_user_id: string
    followed_household_id: string
    created_at: string
}

export interface RecipeShare {
    id: string
    recipe_id: string
    token: string
    created_by: string
    created_at: string
}

export interface Recipe {
    id: string
    author_id: string | null
    household_id: string
    parent_recipe_id: string | null
    title: string
    description: string | null
    category: RecipeCategory
    visibility: RecipeVisibility
    prep_time_minutes: number | null
    cook_time_minutes: number | null
    servings: number
    source_url: string | null
    image_url: string | null
    created_at: string
    updated_at: string
}

export interface Ingredient {
    id: string
    recipe_id: string
    name: string
    qty_imperial: number | null
    unit_imperial: UnitType | null
    qty_metric: number | null
    unit_metric: UnitType | null
    sort_order: number
    notes: string | null
}

export interface Instruction {
    id: string
    recipe_id: string
    step_number: number
    content: string
    duration_minutes: number | null
    temperature: string | null
}

export interface RecipeComment {
    id: string
    recipe_id: string
    user_id: string
    content: string
    created_at: string
}

export interface CookingNote {
    id: string
    recipe_id: string
    user_id: string
    cooked_on: string
    multiplier: number
    rating: number | null
    notes: string | null
    photo_url: string | null
    created_at: string
}

export interface UserFavorite {
    id: string
    user_id: string
    recipe_id: string
    created_at: string
}

export interface RecipeImage {
    id: string
    recipe_id: string
    instruction_id: string | null
    url: string
    storage_path: string
    caption: string | null
    order_index: number
    created_at: string
}

// Extended types with relations for display
export interface RecipeWithDetails extends Recipe {
    ingredients?: Ingredient[]
    instructions?: Instruction[]
    images?: RecipeImage[]
    author?: Pick<User, 'id' | 'display_name'>
    is_favorite?: boolean
    parent_recipe?: {
        title: string
    }
}

// Form types for creating/editing
export interface CreateRecipeInput {
    title: string
    description?: string
    category: RecipeCategory
    visibility: RecipeVisibility
    prep_time_minutes?: number
    cook_time_minutes?: number
    servings: number
    source_url?: string
    image_url?: string
    ingredients: Omit<Ingredient, 'id' | 'recipe_id'>[]
    instructions: Omit<Instruction, 'id' | 'recipe_id'>[]
}

export interface UpdateRecipeInput extends Partial<CreateRecipeInput> {
    id: string
}
