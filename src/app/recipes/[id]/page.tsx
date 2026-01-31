'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ShareModal } from '@/components/social/ShareModal'
import { ArrowLeft, Clock, Users, Edit2, Trash2, ChevronDown, ChevronUp, ChefHat, Minus, Plus, Share2, Loader2, BookOpen, Star } from 'lucide-react'
import Link from 'next/link'
import { FavoriteButton } from '@/components/recipe/FavoriteButton'
import { OfflineControl } from '@/components/recipe/OfflineControl'
import { AddCookingNoteModal } from '@/components/recipe/AddCookingNoteModal'
import { getOfflineRecipe } from '@/lib/offline-storage'
import type { RecipeWithDetails, Ingredient, Instruction, CookingNote } from '@/types/database'

export default function RecipeDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const supabase = createClient()

    const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null)
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [instructions, setInstructions] = useState<Instruction[]>([])
    const [cookingNotes, setCookingNotes] = useState<CookingNote[]>([])
    const [loading, setLoading] = useState(true)
    const [multiplier, setMultiplier] = useState(1)
    const [deleting, setDeleting] = useState(false)
    const [showNoteModal, setShowNoteModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [isOfflineView, setIsOfflineView] = useState(false)

    useEffect(() => {
        loadRecipe()
        loadCookingNotes()
    }, [params.id])

    const loadRecipe = async () => {
        try {
            const id = Array.isArray(params.id) ? params.id[0] : params.id

            // Load recipe
            const { data: recipeData, error: recipeError } = await supabase
                .from('recipes')
                .select(`
                  *,
                  author:users!author_id(id, display_name)
                `)
                .eq('id', id)
                .single()

            if (recipeError) throw recipeError

            // Load images
            const { data: imagesData, error: imagesError } = await supabase
                .from('recipe_images')
                .select('*')
                .eq('recipe_id', id)

            if (imagesError) console.error('Error loading images:', imagesError)
            console.log('RecipeDetailPage loaded images:', imagesData)

            setRecipe({ ...recipeData, images: imagesData || [] })

            // Load ingredients
            const { data: ingredientsData, error: ingredientsError } = await supabase
                .from('ingredients')
                .select('*')
                .eq('recipe_id', id)
                .order('sort_order')

            if (ingredientsError) throw ingredientsError
            setIngredients(ingredientsData || [])

            // Load instructions
            const { data: instructionsData, error: instructionsError } = await supabase
                .from('instructions')
                .select('*')
                .eq('recipe_id', id)
                .order('step_number')

            if (instructionsError) throw instructionsError
            setInstructions(instructionsData || [])
        } catch (err) {
            console.error('Error loading recipe from server:', err)

            // Try loading from offline storage
            try {
                const id = Array.isArray(params.id) ? params.id[0] : params.id
                const offlineData = await getOfflineRecipe(id)

                if (offlineData) {
                    console.log('Loaded recipe from offline storage')
                    setRecipe(offlineData)
                    setIngredients(offlineData.ingredients || [])
                    setInstructions(offlineData.instructions || [])
                    setCookingNotes(offlineData.notes || [])
                    setIsOfflineView(true)
                }
            } catch (offlineErr) {
                console.error('Error loading offline recipe:', offlineErr)
            }
        } finally {
            setLoading(false)
        }
    }

    const loadCookingNotes = async () => {
        try {
            const id = Array.isArray(params.id) ? params.id[0] : params.id
            const { data, error } = await supabase
                .from('cooking_notes')
                .select('*')
                .eq('recipe_id', id)
                .order('cooked_on', { ascending: false })

            if (error) throw error
            setCookingNotes(data || [])
        } catch (err) {
            console.error('Error loading cooking notes:', err)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this recipe? This cannot be undone.')) {
            return
        }

        setDeleting(true)
        try {
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', params.id)

            if (error) throw error

            router.push('/recipes')
            router.refresh()
        } catch (err) {
            console.error('Error deleting recipe:', err)
            alert('Failed to delete recipe')
        } finally {
            setDeleting(false)
        }
    }

    const formatQuantity = (qty: number | null, scale: number = 1) => {
        if (!qty) return ''
        const scaled = qty * scale
        // Format to 2 decimal places, remove trailing zeros
        return scaled.toFixed(2).replace(/\.?0+$/, '')
    }

    const formatTime = (minutes: number | null) => {
        if (!minutes) return null
        if (minutes < 60) return `${minutes} min`
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }

    const isAuthor = user?.id === recipe?.author_id

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        )
    }

    if (!recipe) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Recipe not found</h1>
                    <p className="text-gray-600 mb-4">This recipe might check your connection or sign in.</p>
                    <Link href="/recipes" className="text-orange-600 hover:text-orange-700 block mb-2">
                        ← Back to recipes
                    </Link>
                    <Link href="/offline" className="text-gray-600 hover:text-gray-900 text-sm">
                        View Offline Recipes
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link
                        href="/recipes"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Recipes</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {isAuthor && (
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Share Recipe"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        )}
                        {isAuthor && (
                            <Link
                                href={`/recipes/${recipe.id}/edit`}
                                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Edit Recipe"
                            >
                                <Edit2 className="w-5 h-5" />
                            </Link>
                        )}
                        {isAuthor && (
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Recipe"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Share Modal */}
            {recipe && (
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    recipeId={recipe.id}
                    recipeTitle={recipe.title}
                />
            )}
            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Recipe Header */}
                    <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
                        {/* Main Image */}
                        {(() => {
                            const mainImage = recipe.images?.find(img => img.instruction_id === null)
                            if (mainImage) return (
                                <div className="mb-6 rounded-xl overflow-hidden aspect-video relative bg-gray-100">
                                    <img
                                        src={mainImage.url}
                                        alt={recipe.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )
                            // Fallback to legacy image_url if present and no new image
                            if (recipe.image_url) return (
                                <div className="mb-6 rounded-xl overflow-hidden aspect-video relative bg-gray-100">
                                    <img
                                        src={recipe.image_url}
                                        alt={recipe.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )
                            return null
                        })()}

                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
                                <p className="text-gray-600">{recipe.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-4">
                                {/* Action buttons row */}
                                <div className="flex items-center gap-3">
                                    <OfflineControl
                                        recipe={recipe}
                                        ingredients={ingredients}
                                        instructions={instructions}
                                        notes={cookingNotes}
                                    />
                                    <FavoriteButton recipeId={recipe.id} />
                                </div>
                                {/* Badges row */}
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 capitalize text-sm whitespace-nowrap">
                                        {recipe.category}
                                    </span>
                                    {isAuthor && (
                                        <span className={`px-3 py-1 rounded-full capitalize text-sm whitespace-nowrap border ${recipe.visibility === 'private' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                            recipe.visibility === 'public' ? 'bg-green-100 text-green-700 border-green-200' :
                                                recipe.visibility === 'followers' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                    'bg-blue-100 text-blue-700 border-blue-200'
                                            }`}>
                                            {recipe.visibility}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                            {recipe.prep_time_minutes && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Prep: {formatTime(recipe.prep_time_minutes)}</span>
                                </div>
                            )}
                            {recipe.cook_time_minutes && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Cook: {formatTime(recipe.cook_time_minutes)}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>{Math.round(recipe.servings * multiplier)} servings</span>
                            </div>
                        </div>

                        {recipe.source_url && (
                            <div className="mt-4 pt-4 border-t">
                                <a
                                    href={recipe.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-orange-600 hover:text-orange-700"
                                >
                                    Original source →
                                </a>
                            </div>
                        )}

                        {/* Author and actions */}
                        <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <span className="text-sm text-gray-500">
                                By {recipe.author?.display_name || 'Unknown'}
                            </span>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                <Link
                                    href={`/recipes/new?variant_of=${recipe.id}`}
                                    className="flex-1 sm:flex-initial px-4 py-2 border border-orange-300 rounded-lg text-orange-600 hover:bg-orange-50 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Variation
                                </Link>
                                {isAuthor && (
                                    <>
                                        <Link
                                            href={`/recipes/${recipe.id}/edit`}
                                            className="flex-1 sm:flex-initial px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit
                                        </Link>
                                        <button
                                            onClick={handleDelete}
                                            disabled={deleting}
                                            className="flex-1 sm:flex-initial px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {deleting ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Scaling Control */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">Scale Recipe</span>
                            <div className="flex items-center gap-3">
                                {[0.5, 1, 2, 3].map((mult) => (
                                    <button
                                        key={mult}
                                        onClick={() => setMultiplier(mult)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${multiplier === mult
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-white text-gray-700 hover:bg-orange-100'
                                            }`}
                                    >
                                        {mult}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Ingredients */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Ingredients</h2>
                            {ingredients.length === 0 ? (
                                <p className="text-gray-500">No ingredients listed</p>
                            ) : (
                                <ul className="space-y-3">
                                    {ingredients.map((ing) => (
                                        <li key={ing.id} className="flex items-start gap-3">
                                            <span className="text-orange-500 mt-1.5">•</span>
                                            <div className="flex-1">
                                                <div className="font-medium">
                                                    {ing.qty_imperial && ing.unit_imperial && (
                                                        <span className="text-gray-900">
                                                            {formatQuantity(ing.qty_imperial, multiplier)} {ing.unit_imperial}{' '}
                                                        </span>
                                                    )}
                                                    {ing.qty_metric && ing.unit_metric && (
                                                        <span className="text-gray-600 text-sm">
                                                            ({formatQuantity(ing.qty_metric, multiplier)} {ing.unit_metric})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-gray-900">{ing.name}</div>
                                                {ing.notes && (
                                                    <div className="text-sm text-gray-500 italic">{ing.notes}</div>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Instructions */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions</h2>
                            {instructions.length === 0 ? (
                                <p className="text-gray-500">No instructions listed</p>
                            ) : (
                                <ol className="space-y-6">
                                    {instructions.map((inst, index) => {
                                        const stepImage = recipe.images?.find(img => img.instruction_id === inst.id)
                                        return (
                                            <li key={inst.id} className="flex gap-4">
                                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-semibold text-sm h-fit">
                                                    {inst.step_number}
                                                </span>
                                                <div className="flex-1 pt-1">
                                                    <p className="text-gray-900 leading-relaxed">{inst.content}</p>

                                                    {stepImage && (
                                                        <div className="mt-3 relative w-full h-48 sm:h-64 rounded-lg overflow-hidden bg-gray-100">
                                                            <img
                                                                src={stepImage.url}
                                                                alt={`Step ${inst.step_number}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}

                                                    {(inst.duration_minutes || inst.temperature) && (
                                                        <div className="mt-2 text-sm text-gray-600 flex gap-4">
                                                            {inst.duration_minutes && (
                                                                <span>⏱️ {inst.duration_minutes} min</span>
                                                            )}
                                                            {inst.temperature && (
                                                                <span>🌡️ {inst.temperature}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ol>
                            )}
                        </div>
                    </div>

                    {/* Cooking Notes Section */}
                    <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Cooking Notes
                            </h2>
                            <button
                                onClick={() => setShowNoteModal(true)}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors text-sm"
                            >
                                + Add Note
                            </button>
                        </div>

                        {cookingNotes.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">
                                No cooking notes yet. Try this recipe and log your experience!
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {cookingNotes.map((note) => (
                                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {new Date(note.cooked_on).toLocaleDateString()}
                                                </span>
                                                {note.multiplier !== 1 && (
                                                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                                                        {note.multiplier}x scaled
                                                    </span>
                                                )}
                                            </div>
                                            {note.rating && (
                                                <div className="flex gap-1">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${i < note.rating!
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'text-gray-300'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {note.notes && (
                                            <p className="text-sm text-gray-700">{note.notes}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            {showNoteModal && (
                <AddCookingNoteModal
                    recipeId={recipe.id}
                    onClose={() => setShowNoteModal(false)}
                    onSuccess={loadCookingNotes}
                />
            )}
        </div>
    )
}
