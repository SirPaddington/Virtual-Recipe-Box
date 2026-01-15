'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Clock, Users, ChefHat, BookOpen } from 'lucide-react'
import Link from 'next/link'
import type { RecipeWithDetails, Ingredient, Instruction, RecipeImage } from '@/types/database'

export default function SharedRecipePage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()

    const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        loadSharedRecipe()
    }, [params.token])

    const loadSharedRecipe = async () => {
        try {
            const { data, error } = await supabase.rpc('get_shared_recipe', {
                token_input: params.token as string
            })

            if (error || !data) throw error

            // Transform JSONB result to match RecipeWithDetails structure roughly
            // The RPC returns a JSON object, we might need to cast or ensure types
            setRecipe(data as any)
        } catch (err) {
            console.error('Error loading shared recipe:', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (minutes: number | null) => {
        if (!minutes) return null
        if (minutes < 60) return `${minutes} min`
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        )
    }

    if (error || !recipe) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ChefHat className="w-8 h-8 text-gray-400" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Recipe Not Found</h1>
                    <p className="text-gray-600 mb-6">
                        This share link might be invalid or has been revoked by the owner.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors w-full"
                    >
                        Go to Home
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
                            VRB
                        </div>
                        <span className="font-bold text-gray-900 hidden sm:block">Virtual Recipe Box</span>
                    </div>

                    <Link
                        href="/login"
                        className="text-sm font-medium text-orange-600 hover:text-orange-700"
                    >
                        Log in to Save
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Recipe Header */}
                    <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
                        {/* Main Image */}
                        {(() => {
                            const mainImage = recipe.images?.find((img: any) => img.instruction_id === null)
                            if (mainImage) return (
                                <div className="mb-6 rounded-xl overflow-hidden aspect-video relative bg-gray-100">
                                    <img
                                        src={mainImage.url}
                                        alt={recipe.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )
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

                        <div className="mb-4">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
                            <p className="text-gray-600">{recipe.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-6 text-sm text-gray-600 pt-4 border-t">
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
                                <span>{recipe.servings} servings</span>
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
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Ingredients */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Ingredients</h2>
                            {!recipe.ingredients || recipe.ingredients.length === 0 ? (
                                <p className="text-gray-500">No ingredients listed</p>
                            ) : (
                                <ul className="space-y-3">
                                    {recipe.ingredients.map((ing) => (
                                        <li key={ing.id} className="flex items-start gap-3">
                                            <span className="text-orange-500 mt-1.5">•</span>
                                            <div className="flex-1">
                                                <div className="font-medium">
                                                    {ing.qty_imperial && ing.unit_imperial && (
                                                        <span className="text-gray-900">
                                                            {ing.qty_imperial} {ing.unit_imperial}{' '}
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
                            {!recipe.instructions || recipe.instructions.length === 0 ? (
                                <p className="text-gray-500">No instructions listed</p>
                            ) : (
                                <ol className="space-y-6">
                                    {recipe.instructions.map((inst, index) => {
                                        const stepImage = recipe.images?.find((img: any) => img.instruction_id === inst.id)
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
                </div>
            </main>
        </div>
    )
}
