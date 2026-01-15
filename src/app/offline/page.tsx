'use client'

import { useState, useEffect } from 'react'
import { getAllOfflineRecipes } from '@/lib/offline-storage'
import { ArrowLeft, Clock, Users, WifiOff } from 'lucide-react'
import Link from 'next/link'
import type { RecipeWithDetails } from '@/types/database'

export default function OfflineRecipesPage() {
    const [recipes, setRecipes] = useState<RecipeWithDetails[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadOfflineRecipes()
    }, [])

    const loadOfflineRecipes = async () => {
        try {
            if (typeof window !== 'undefined' && 'indexedDB' in window) {
                const data = await getAllOfflineRecipes()
                // Sort by most recently saved (you might want to add savedAt to the type if strictly typed)
                setRecipes(data.reverse())
            }
        } catch (err) {
            console.error('Error loading offline recipes:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link
                        href="/recipes"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Online Recipes</span>
                    </Link>
                    <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-sm font-medium">
                        <WifiOff className="w-4 h-4" />
                        Offline Mode
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Saved for Offline</h1>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                    </div>
                ) : recipes.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <WifiOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Offline Recipes</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Save recipes for shopping by clicking the "Save for Shopping" button on any recipe detail page.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recipes.map((recipe) => (
                            <Link
                                key={recipe.id}
                                href={`/recipes/${recipe.id}`}
                                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group block"
                            >
                                {/* Image Placeholder */}
                                <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                                    <span className="text-4xl">🍳</span>
                                    <div className="absolute top-2 right-2 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                        <WifiOff className="w-3 h-3" />
                                        Offline Ready
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                                        {recipe.title}
                                    </h3>

                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)}m</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            <span>{recipe.servings}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
