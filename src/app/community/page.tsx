'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ArrowLeft, Search, UserPlus, UserMinus, Users, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Household {
    id: string
    name: string
    owner_id: string
}

interface FollowedHousehold {
    id: string
    followed_household_id: string
    household: Household
}

export default function CommunityPage() {
    const { user } = useAuth()
    const supabase = createClient()

    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Household[]>([])
    const [searching, setSearching] = useState(false)

    const [following, setFollowing] = useState<FollowedHousehold[]>([])
    const [loadingFollows, setLoadingFollows] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null) // ID of household being processed

    useEffect(() => {
        loadFollowedHouseholds()
    }, [user])

    const loadFollowedHouseholds = async () => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from('household_follows')
                .select(`
                    id,
                    followed_household_id,
                    household:households(*)
                `)
                .eq('follower_user_id', user.id)

            if (error) throw error
            setFollowing(data || [])
        } catch (err) {
            console.error('Error loading follows:', err)
        } finally {
            setLoadingFollows(false)
        }
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return

        setSearching(true)
        try {
            const { data, error } = await supabase
                .from('households')
                .select('*')
                .ilike('name', `%${searchQuery}%`)
                .limit(20)

            if (error) throw error

            // Filter out own household(s) from results if needed, 
            // though users might want to verify their own household visibility.
            // For now, we just show matches.
            setSearchResults(data || [])
        } catch (err) {
            console.error('Error searching households:', err)
        } finally {
            setSearching(false)
        }
    }

    const handleFollow = async (householdId: string) => {
        if (!user) return
        setActionLoading(householdId)
        try {
            const { error } = await supabase
                .from('household_follows')
                .insert({
                    follower_user_id: user.id,
                    followed_household_id: householdId
                })

            if (error) throw error

            // Reload follows and clear this from search results if desired, or just update UI
            await loadFollowedHouseholds()
        } catch (err) {
            console.error('Error following household:', err)
            alert('Failed to follow household')
        } finally {
            setActionLoading(null)
        }
    }

    const handleUnfollow = async (householdId: string) => {
        if (!user) return
        setActionLoading(householdId)
        try {
            const { error } = await supabase
                .from('household_follows')
                .delete()
                .eq('follower_user_id', user.id)
                .eq('followed_household_id', householdId)

            if (error) throw error

            // Update local state optimistic/reload
            setFollowing(prev => prev.filter(f => f.followed_household_id !== householdId))
        } catch (err) {
            console.error('Error unfollowing household:', err)
            alert('Failed to unfollow household')
        } finally {
            setActionLoading(null)
        }
    }

    // Check if a household is already followed
    const isFollowed = (householdId: string) => {
        return following.some(f => f.followed_household_id === householdId)
    }

    // Check if a household matches the user's own household (optional, to avoid following self)
    // We'd need to fetch user's own household ID. For now skipping this complexity.

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

                <main className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Community</h1>
                            <p className="text-gray-600">Find and follow other households to see their shared recipes.</p>
                        </div>

                        {/* Search Section */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Find Households</h2>
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by household name..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={searching || !searchQuery.trim()}
                                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-lg transition-colors flex items-center"
                                >
                                    {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                                </button>
                            </form>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="mt-6 space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Results</h3>
                                    {searchResults.map(household => {
                                        const followed = isFollowed(household.id)
                                        return (
                                            <div key={household.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-orange-100 p-2 rounded-full">
                                                        <Users className="w-5 h-5 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{household.name}</div>
                                                        <div className="text-xs text-gray-500">Spread the love!</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => !followed ? handleFollow(household.id) : null}
                                                    disabled={followed || actionLoading === household.id}
                                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${followed
                                                            ? 'bg-green-100 text-green-700 cursor-default'
                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {actionLoading === household.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : followed ? (
                                                        <span>Following</span>
                                                    ) : (
                                                        <>
                                                            <UserPlus className="w-4 h-4" />
                                                            Follow
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {!searching && searchQuery && searchResults.length === 0 && (
                                <p className="mt-4 text-gray-500 text-center text-sm py-4">No households found matching "{searchQuery}"</p>
                            )}
                        </div>

                        {/* Following List */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Households You Follow</h2>
                            {loadingFollows ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                                </div>
                            ) : following.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 font-medium">Not following anyone yet</p>
                                    <p className="text-sm text-gray-500 mt-1">Search above to find households to follow!</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {following.map(follow => (
                                        <div key={follow.id} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:border-orange-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-100 p-2 rounded-full">
                                                    <Users className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">
                                                    {follow.household.name}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleUnfollow(follow.followed_household_id)}
                                                disabled={actionLoading === follow.followed_household_id}
                                                className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                                                title="Unfollow"
                                            >
                                                {actionLoading === follow.followed_household_id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <UserMinus className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
