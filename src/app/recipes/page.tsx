'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { ChefHat, Plus, LogOut, Clock, Users, Search, X, Heart, WifiOff, Settings, LayoutGrid, List, Square } from 'lucide-react'
import Link from 'next/link'
import { FavoriteButton } from '@/components/recipe/FavoriteButton'
import type { RecipeWithDetails, RecipeCategory } from '@/types/database'

export default function RecipesPage() {
    const { user, signOut } = useAuth()
    const supabase = createClient()
    const [recipes, setRecipes] = useState<RecipeWithDetails[]>([])
    const [loading, setLoading] = useState(true)

    // Filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | 'all'>('all')
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
    const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<Set<string>>(new Set())

    const [viewMode, setViewMode] = useState<'grid' | 'card' | 'list'>('grid')

    useEffect(() => {
        loadRecipes()
        loadFavorites()
    }, [])

    const loadRecipes = async () => {
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select(`
                  *,
                  author:users!author_id(id, display_name)
                `)
                .order('created_at', { ascending: false })

            // Manually fetch images for all recipes because we don't have a direct relation setup in the query above
            // (Note: We could setup a view or better relation, but fetching images for the list is efficient enough)
            const { data: imagesData, error: imagesError } = await supabase
                .from('recipe_images')
                .select('*')
                .is('instruction_id', null) // Only fetch main images for list view

            if (error) throw error

            const recipesWithImages = (data || []).map(recipe => {
                const mainImage = imagesData?.find(img => img.recipe_id === recipe.id)
                return {
                    ...recipe,
                    // Prioritize new image system, fallback to legacy
                    display_image: mainImage?.url || recipe.image_url
                }
            })

            setRecipes(recipesWithImages)
        } catch (err) {
            console.error('Error loading recipes:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadFavorites = async () => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from('user_favorites')
                .select('recipe_id')
                .eq('user_id', user.id)

            if (error) throw error
            setFavoriteRecipeIds(new Set(data.map(f => f.recipe_id)))
        } catch (err) {
            console.error('Error loading favorites:', err)
        }
    }

    const formatTime = (minutes: number | null) => {
        if (!minutes) return null
        if (minutes < 60) return `${minutes}m`
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }

    // Filter recipes
    const filteredRecipes = recipes.filter(recipe => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            const matchesSearch =
                recipe.title.toLowerCase().includes(query) ||
                recipe.description?.toLowerCase().includes(query)
            if (!matchesSearch) return false
        }

        // Category filter
        if (selectedCategory !== 'all' && recipe.category !== selectedCategory) {
            return false
        }

        // Favorites filter
        if (showFavoritesOnly && !favoriteRecipeIds.has(recipe.id)) {
            return false
        }

        return true
    })

    const renderRecipeCard = (recipe: RecipeWithDetails & { display_image?: string }, isCardView = false) => (
        <div key={recipe.id} className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden group relative ${isCardView ? 'flex flex-col' : ''}`}>
            {/* Image placeholder */}
            <Link href={`/recipes/${recipe.id}`} className={`block bg-gray-100 flex items-center justify-center relative overflow-hidden ${isCardView ? 'h-64' : 'h-48'}`}>
                {recipe.display_image ? (
                    <img
                        src={recipe.display_image}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                        <ChefHat className={`${isCardView ? 'w-24 h-24' : 'w-16 h-16'} text-white/50`} />
                    </div>
                )}
                {/* Favorite button overlay */}
                <div
                    className="absolute top-3 right-3 z-10"
                    onClick={(e) => e.preventDefault()}
                >
                    <FavoriteButton recipeId={recipe.id} />
                </div>
            </Link>

            {/* Content */}
            <Link href={`/recipes/${recipe.id}`} className="block p-5 flex-1">
                <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 ${isCardView ? 'text-xl' : 'text-lg'}`}>
                        {recipe.title}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 capitalize whitespace-nowrap ml-2">
                        {recipe.category}
                    </span>
                </div>

                {recipe.description && (
                    <p className={`text-gray-600 mb-3 line-clamp-2 ${isCardView ? 'text-base' : 'text-sm'}`}>
                        {recipe.description}
                    </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                    {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                                {formatTime((recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0))}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{recipe.servings} servings</span>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    By {recipe.author?.display_name || 'Unknown'}
                </div>
            </Link>
        </div>
    )

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm">
                    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-500 rounded-lg p-2">
                                <ChefHat className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Virtual Recipe Box</h1>
                                <p className="text-sm text-gray-600">Welcome, {user?.user_metadata?.display_name || user?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/community"
                                className="flex items-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                            >
                                <Users className="w-5 h-5" />
                                <span className="text-sm font-medium hidden sm:inline">Community</span>
                            </Link>
                            <Link
                                href="/offline"
                                className="flex items-center gap-2 text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-lg transition-colors"
                            >
                                <WifiOff className="w-5 h-5" />
                                <span className="text-sm font-medium hidden sm:inline">Offline Recipes</span>
                            </Link>
                            <Link
                                href="/settings"
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg transition-colors"
                            >
                                <Settings className="w-5 h-5" />
                                <span className="text-sm font-medium hidden sm:inline">Settings</span>
                            </Link>
                            <button
                                onClick={signOut}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="text-sm font-medium hidden sm:inline">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                        <h2 className="text-2xl font-bold text-gray-900">My Recipes</h2>
                        <Link
                            href="/recipes/new"
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Recipe
                        </Link>
                    </div>

                    {/* Search, Filters and View Toggle */}
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6 space-y-4">
                        {/* Search bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search recipes..."
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            {/* Filters */}
                            <div className="flex flex-wrap gap-3">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value as RecipeCategory | 'all')}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="cooking">Cooking</option>
                                    <option value="baking">Baking</option>
                                    <option value="beverage">Beverage</option>
                                    <option value="other">Other</option>
                                </select>

                                <button
                                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${showFavoritesOnly
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                                    {showFavoritesOnly ? 'Favorites Only' : 'Show All'}
                                </button>
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg self-start md:self-auto">
                                <button
                                    onClick={() => setViewMode('card')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'card' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="Card View"
                                >
                                    <Square className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="Grid View"
                                >
                                    <LayoutGrid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="List View"
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Results count */}
                        <div className="text-sm text-gray-600">
                            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                            <p className="mt-4 text-gray-600">Loading recipes...</p>
                        </div>
                    ) : filteredRecipes.length === 0 ? (
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                                <div className="bg-orange-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                                    {showFavoritesOnly ? (
                                        <Heart className="w-10 h-10 text-orange-500" />
                                    ) : searchQuery || selectedCategory !== 'all' ? (
                                        <Search className="w-10 h-10 text-orange-500" />
                                    ) : (
                                        <ChefHat className="w-10 h-10 text-orange-500" />
                                    )}
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    {showFavoritesOnly
                                        ? 'No Favorites Yet'
                                        : searchQuery || selectedCategory !== 'all'
                                            ? 'No Recipes Found'
                                            : 'No Recipes Yet'}
                                </h3>

                                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                    {showFavoritesOnly
                                        ? 'Start favoriting recipes to see them here!'
                                        : searchQuery || selectedCategory !== 'all'
                                            ? 'Try adjusting your search or filters.'
                                            : 'Get started by adding your first recipe!'}
                                </p>

                                {!showFavoritesOnly && !searchQuery && selectedCategory === 'all' && (
                                    <Link
                                        href="/recipes/new"
                                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Create Your First Recipe
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={
                            viewMode === 'grid'
                                ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                                : viewMode === 'card'
                                    ? "max-w-2xl mx-auto space-y-8"
                                    : "space-y-2"
                        }>
                            {filteredRecipes.map((recipe) => (
                                viewMode === 'list' ? (
                                    <div key={recipe.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex items-center justify-between group">
                                        <Link href={`/recipes/${recipe.id}`} className="flex-1 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600 font-bold overflow-hidden">
                                                {(recipe as any).display_image ? (
                                                    <img src={(recipe as any).display_image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ChefHat className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                                                    {recipe.title}
                                                </h3>
                                                {recipe.description && (
                                                    <p className="text-sm text-gray-500 line-clamp-1 hidden sm:block">
                                                        {recipe.description}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize hidden sm:inline-block">
                                                {recipe.category}
                                            </span>
                                            <FavoriteButton recipeId={recipe.id} />
                                        </div>
                                    </div>
                                ) : (
                                    renderRecipeCard(recipe, viewMode === 'card')
                                )
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    )
}

