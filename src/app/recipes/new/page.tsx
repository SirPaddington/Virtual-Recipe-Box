'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { IngredientInput } from '@/components/recipe/IngredientInput'
import { InstructionInput } from '@/components/recipe/InstructionInput'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { RecipeCategory, Ingredient, Instruction, RecipeVisibility } from '@/types/database'

export default function NewRecipePage() {
    const { user } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const variantOfId = searchParams.get('variant_of')

    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState<RecipeCategory>('cooking')
    const [visibility, setVisibility] = useState<RecipeVisibility>('household')
    const [prepTime, setPrepTime] = useState('')
    const [cookTime, setCookTime] = useState('')
    const [servings, setServings] = useState('4')
    const [sourceUrl, setSourceUrl] = useState('')
    const [mainImage, setMainImage] = useState<{ url: string, storagePath: string } | null>(null)
    const [parentRecipeTitle, setParentRecipeTitle] = useState('')

    const [ingredients, setIngredients] = useState<Omit<Ingredient, 'id' | 'recipe_id'>[]>([])
    const [instructions, setInstructions] = useState<any[]>([])

    const [loading, setLoading] = useState(false)
    const [loadingParent, setLoadingParent] = useState(false)
    const [error, setError] = useState('')

    // Load parent recipe if creating a variation
    useEffect(() => {
        if (variantOfId) {
            loadParentRecipe()
        }
    }, [variantOfId])

    const loadParentRecipe = async () => {
        setLoadingParent(true)
        try {
            const { data: recipe, error: recipeError } = await supabase
                .from('recipes')
                .select('*')
                .eq('id', variantOfId)
                .single()

            if (recipeError) throw recipeError

            // Load ingredients
            const { data: ingredientsData, error: ingredientsError } = await supabase
                .from('ingredients')
                .select('*')
                .eq('recipe_id', variantOfId)
                .order('sort_order')

            if (ingredientsError) throw ingredientsError

            // Load instructions
            const { data: instructionsData, error: instructionsError } = await supabase
                .from('instructions')
                .select('*')
                .eq('recipe_id', variantOfId)
                .order('step_number')

            if (instructionsError) throw instructionsError

            // Pre-populate form
            setParentRecipeTitle(recipe.title)
            setTitle(`${recipe.title} (Variation)`)
            setDescription(recipe.description || '')
            setCategory(recipe.category)
            setVisibility(recipe.visibility) // Inherit visibility
            setPrepTime(recipe.prep_time_minutes?.toString() || '')
            setCookTime(recipe.cook_time_minutes?.toString() || '')
            setServings(recipe.servings.toString())
            setSourceUrl(recipe.source_url || '')
            setIngredients(ingredientsData.map(({ id, recipe_id, ...rest }) => rest))
            setInstructions(instructionsData.map(({ id, recipe_id, ...rest }) => rest))
        } catch (err) {
            console.error('Error loading parent recipe:', err)
            setError('Failed to load parent recipe')
        } finally {
            setLoadingParent(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Get user's household
            const { data: membershipData, error: membershipError } = await supabase
                .from('household_members')
                .select('household_id')
                .eq('user_id', user!.id)
                .single()

            if (membershipError) throw new Error('Could not find your household')

            // Create recipe
            const { data: recipeData, error: recipeError } = await supabase
                .from('recipes')
                .insert({
                    title,
                    description: description || null,
                    category,
                    visibility,
                    prep_time_minutes: prepTime ? parseInt(prepTime) : null,
                    cook_time_minutes: cookTime ? parseInt(cookTime) : null,
                    servings: parseInt(servings),
                    source_url: sourceUrl || null,
                    author_id: user!.id,
                    household_id: membershipData.household_id,
                    parent_recipe_id: variantOfId || null,
                    // Legacy image_url support for backward compatibility if needed, 
                    // though we are moving to recipe_images table.
                    image_url: mainImage?.url || null
                })
                .select()
                .single()

            if (recipeError) throw recipeError

            // Create Main Image Record
            if (mainImage) {
                const { error: imageError } = await supabase
                    .from('recipe_images')
                    .insert({
                        recipe_id: recipeData.id,
                        url: mainImage.url,
                        storage_path: mainImage.storagePath,
                        caption: 'Main Image',
                        order_index: 0
                    })
                if (imageError) throw imageError
            }

            // Add ingredients
            if (ingredients.length > 0) {
                const { error: ingredientsError } = await supabase
                    .from('ingredients')
                    .insert(
                        ingredients.map((ing, idx) => ({
                            ...ing,
                            recipe_id: recipeData.id,
                            sort_order: idx,
                        }))
                    )

                if (ingredientsError) throw ingredientsError
            }

            // Add instructions
            if (instructions.length > 0) {
                const { data: instructionsData, error: instructionsError } = await supabase
                    .from('instructions')
                    .insert(
                        instructions.map((inst) => ({
                            step_number: inst.step_number,
                            content: inst.content,
                            duration_minutes: inst.duration_minutes,
                            temperature: inst.temperature,
                            recipe_id: recipeData.id,
                        }))
                    )
                    .select()

                if (instructionsError) throw instructionsError

                // Upload Instruction Images
                // We need to map the uploaded instructions back to our local state to find the images
                // The returned `instructionsData` should match the order of insertion (which matches `instructions` state)
                if (instructionsData) {
                    const imagePromises = instructionsData.map(async (insertedInst, index) => {
                        const localInst = instructions[index] as any // Cast to access image
                        if (localInst.image) {
                            const { error: imageError } = await supabase
                                .from('recipe_images')
                                .insert({
                                    recipe_id: recipeData.id,
                                    instruction_id: insertedInst.id,
                                    url: localInst.image.url,
                                    storage_path: localInst.image.storagePath,
                                    caption: `Step ${insertedInst.step_number}`,
                                    order_index: 0
                                })
                            if (imageError) throw imageError
                        }
                    })
                    await Promise.all(imagePromises)
                }
            }

            // Success!
            router.push(`/recipes/${recipeData.id}`)
            router.refresh()
        } catch (err: any) {
            console.error('Error creating recipe:', err)
            setError(err.message || 'Failed to create recipe')
        } finally {
            setLoading(false)
        }
    }

    const defaultUnit = category === 'baking' ? 'metric' : 'imperial'

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm border-b">
                    <div className="container mx-auto px-4 py-4">
                        <Link
                            href="/recipes"
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back to Recipes</span>
                        </Link>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-8">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {variantOfId ? 'Create Recipe Variation' : 'Create New Recipe'}
                            </h1>
                            {parentRecipeTitle && (
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md font-medium">
                                        Variation of: {parentRecipeTitle}
                                    </span>
                                </p>
                            )}
                        </div>

                        {loadingParent && (
                            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-3">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                <p className="text-sm text-blue-600">Loading parent recipe...</p>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-8 space-y-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                        Recipe Title *
                                    </label>
                                    <input
                                        id="title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="e.g., Grandma's Chocolate Chip Cookies"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Recipe Photo
                                    </label>
                                    <ImageUpload
                                        value={mainImage?.url}
                                        onChange={(url, storagePath) => setMainImage({ url, storagePath })}
                                        onRemove={() => setMainImage(null)}
                                        className="w-full sm:w-2/3"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="What makes this recipe special?"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                            Category *
                                        </label>
                                        <select
                                            id="category"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value as RecipeCategory)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        >
                                            <option value="cooking">Cooking</option>
                                            <option value="baking">Baking</option>
                                            <option value="beverage">Beverage</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {category === 'baking' ? 'Defaults to metric units' : 'Defaults to imperial units'}
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
                                            Visibility
                                        </label>
                                        <select
                                            id="visibility"
                                            value={visibility}
                                            onChange={(e) => setVisibility(e.target.value as RecipeVisibility)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        >
                                            <option value="private">Private (Only Me)</option>
                                            <option value="household">Household (Members Only)</option>
                                            <option value="followers">Followers (Members + Followers)</option>
                                            <option value="public">Public (Everyone)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="servings" className="block text-sm font-medium text-gray-700 mb-2">
                                            Servings *
                                        </label>
                                        <input
                                            id="servings"
                                            type="number"
                                            min="1"
                                            value={servings}
                                            onChange={(e) => setServings(e.target.value)}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700 mb-2">
                                            Prep Time (minutes)
                                        </label>
                                        <input
                                            id="prepTime"
                                            type="number"
                                            min="0"
                                            value={prepTime}
                                            onChange={(e) => setPrepTime(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="cookTime" className="block text-sm font-medium text-gray-700 mb-2">
                                            Cook Time (minutes)
                                        </label>
                                        <input
                                            id="cookTime"
                                            type="number"
                                            min="0"
                                            value={cookTime}
                                            onChange={(e) => setCookTime(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700 mb-2">
                                        Source URL (Optional)
                                    </label>
                                    <input
                                        id="sourceUrl"
                                        type="url"
                                        value={sourceUrl}
                                        onChange={(e) => setSourceUrl(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="https://example.com/recipe"
                                    />
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200" />

                            {/* Ingredients */}
                            <IngredientInput
                                ingredients={ingredients}
                                onChange={setIngredients}
                                defaultUnit={defaultUnit}
                            />

                            {/* Divider */}
                            <div className="border-t border-gray-200" />

                            {/* Instructions */}
                            <InstructionInput
                                instructions={instructions}
                                onChange={setInstructions}
                            />

                            {/* Submit */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        variantOfId ? 'Create Variation' : 'Create Recipe'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
