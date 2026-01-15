'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { IngredientInput } from '@/components/recipe/IngredientInput'
import { InstructionInput } from '@/components/recipe/InstructionInput'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { RecipeCategory, Ingredient, Instruction, Recipe, RecipeVisibility } from '@/types/database'

export default function EditRecipePage() {
    const params = useParams()
    const { user } = useAuth()
    const router = useRouter()
    const supabase = createClient()

    // Form state
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [recipe, setRecipe] = useState<Recipe | null>(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState<RecipeCategory>('cooking')
    const [visibility, setVisibility] = useState<RecipeVisibility>('household')
    const [prepTime, setPrepTime] = useState('')
    const [cookTime, setCookTime] = useState('')
    const [servings, setServings] = useState('4')
    const [sourceUrl, setSourceUrl] = useState('')
    const [mainImage, setMainImage] = useState<{ url: string, storagePath: string } | null>(null)

    const [ingredients, setIngredients] = useState<Omit<Ingredient, 'id' | 'recipe_id'>[]>([])
    const [instructions, setInstructions] = useState<any[]>([])

    useEffect(() => {
        loadRecipe()
    }, [params.id])

    const loadRecipe = async () => {
        try {
            // Load recipe
            const { data: recipeData, error: recipeError } = await supabase
                .from('recipes')
                .select('*')
                .eq('id', params.id)
                .single()

            if (recipeError) throw recipeError

            // Check if user is the author
            if (recipeData.author_id !== user?.id) {
                router.push(`/recipes/${params.id}`)
                return
            }

            setRecipe(recipeData)
            setTitle(recipeData.title)
            setDescription(recipeData.description || '')
            setCategory(recipeData.category)
            setVisibility(recipeData.visibility)
            setPrepTime(recipeData.prep_time_minutes?.toString() || '')
            setCookTime(recipeData.cook_time_minutes?.toString() || '')
            setServings(recipeData.servings.toString())
            setSourceUrl(recipeData.source_url || '')

            // Load images
            const { data: imagesData, error: imagesError } = await supabase
                .from('recipe_images')
                .select('*')
                .eq('recipe_id', params.id)

            if (imagesError) throw imagesError

            // Find main image
            const mainImg = imagesData.find(img => img.instruction_id === null)
            if (mainImg) {
                setMainImage({ url: mainImg.url, storagePath: mainImg.storage_path })
            } else if (recipeData.image_url) {
                // Determine if the legacy URL is a Supabase storage URL to try and extract path, 
                // or just treat as legacy URL without storage path.
                // For simplicity and safety, we treat it as "external/legacy" (no storagePath) 
                // unless we want to try to reverse engineer the path.
                setMainImage({ url: recipeData.image_url, storagePath: '' })
            }

            // Load ingredients
            const { data: ingredientsData, error: ingredientsError } = await supabase
                .from('ingredients')
                .select('*')
                .eq('recipe_id', params.id)
                .order('sort_order')

            if (ingredientsError) throw ingredientsError
            setIngredients(ingredientsData.map(({ id, recipe_id, ...rest }) => rest))

            // Load instructions
            const { data: instructionsData, error: instructionsError } = await supabase
                .from('instructions')
                .select('*')
                .eq('recipe_id', params.id)
                .order('step_number')

            if (instructionsError) throw instructionsError

            // Map instructions and attach their images
            setInstructions(instructionsData.map(({ id, recipe_id, ...rest }) => {
                const img = imagesData.find(img => img.instruction_id === id)
                return {
                    ...rest,
                    image: img ? { url: img.url, storagePath: img.storage_path } : null
                }
            }))
        } catch (err) {
            console.error('Error loading recipe:', err)
            setError('Failed to load recipe')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        try {
            // Check if we are keeping a legacy image
            const isLegacyImage = mainImage && !mainImage.storagePath

            // Update recipe
            const { error: recipeError } = await supabase
                .from('recipes')
                .update({
                    title,
                    description: description || null,
                    category,
                    visibility,
                    prep_time_minutes: prepTime ? parseInt(prepTime) : null,
                    cook_time_minutes: cookTime ? parseInt(cookTime) : null,
                    servings: parseInt(servings),
                    source_url: sourceUrl || null,
                    // If it's a legacy image, keep the URL. If it's a new system image OR removed, clear the legacy column.
                    image_url: isLegacyImage ? mainImage.url : null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', params.id)

            if (recipeError) throw recipeError

            // Delete existing ingredients and instructions
            await supabase.from('ingredients').delete().eq('recipe_id', params.id)
            await supabase.from('instructions').delete().eq('recipe_id', params.id)

            // Re-insert ingredients
            if (ingredients.length > 0) {
                const { error: ingredientsError } = await supabase
                    .from('ingredients')
                    .insert(
                        ingredients.map((ing, idx) => ({
                            ...ing,
                            recipe_id: params.id as string,
                            sort_order: idx,
                        }))
                    )

                if (ingredientsError) throw ingredientsError
            }

            // Handle Main Image in New System

            // 1. Delete ALL existing images for this recipe (clean slate approach is safest for now to avoid orphans)
            // Note: This includes instruction images which we are about to re-insert anyway.
            const { error: deleteError } = await supabase
                .from('recipe_images')
                .delete()
                .eq('recipe_id', params.id)

            if (deleteError) {
                console.error('Error deleting images:', deleteError)
                throw deleteError
            }

            // 2. Insert Main Image if exists
            // If we have a main image AND it's NOT legacy (meaning it has a storagePath), insert it into the new table.
            if (mainImage && !isLegacyImage) {
                const { error: imageError } = await supabase
                    .from('recipe_images')
                    .insert({
                        recipe_id: params.id as string,
                        url: mainImage.url,
                        storage_path: mainImage.storagePath,
                        caption: 'Main Image',
                        order_index: 0,
                        instruction_id: null // Explicitly null for main image
                    })
                if (imageError) throw imageError
            }

            // Re-insert instructions
            if (instructions.length > 0) {
                const { data: instructionsData, error: instructionsError } = await supabase
                    .from('instructions')
                    .insert(
                        instructions.map((inst) => ({
                            step_number: inst.step_number,
                            content: inst.content,
                            duration_minutes: inst.duration_minutes,
                            temperature: inst.temperature,
                            recipe_id: params.id as string,
                        }))
                    )
                    .select()

                if (instructionsError) throw instructionsError

                // Upload Instruction Images
                if (instructionsData) {
                    const imagePromises = instructionsData.map(async (insertedInst, index) => {
                        const localInst = instructions[index] as any
                        if (localInst.image) {
                            const { error: imageError } = await supabase
                                .from('recipe_images')
                                .insert({
                                    recipe_id: params.id as string,
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

            // Success! Redirect to recipe detail
            router.push(`/recipes/${params.id}`)
            router.refresh()
        } catch (err: any) {
            console.error('Error updating recipe:', err)
            setError(err.message || 'Failed to update recipe')
        } finally {
            setSaving(false)
        }
    }

    const defaultUnit = category === 'baking' ? 'metric' : 'imperial'

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
            </ProtectedRoute>
        )
    }

    if (!recipe) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recipe not found</h1>
                        <Link href="/recipes" className="text-orange-600 hover:text-orange-700">
                            ← Back to recipes
                        </Link>
                    </div>
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm border-b">
                    <div className="container mx-auto px-4 py-4">
                        <Link
                            href={`/recipes/${params.id}`}
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back to Recipe</span>
                        </Link>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-8">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Recipe</h1>

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
                                    disabled={saving}
                                    className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
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
