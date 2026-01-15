'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { Heart } from 'lucide-react'

interface FavoriteButtonProps {
    recipeId: string
    className?: string
}

export function FavoriteButton({ recipeId, className = '' }: FavoriteButtonProps) {
    const { user } = useAuth()
    const supabase = createClient()
    const [isFavorite, setIsFavorite] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        checkFavoriteStatus()
    }, [recipeId, user])

    const checkFavoriteStatus = async () => {
        if (!user) return

        try {
            const { data, error } = await supabase
                .from('user_favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('recipe_id', recipeId)
                .maybeSingle()

            if (error && error.code !== 'PGRST116') throw error
            setIsFavorite(!!data)
        } catch (err) {
            console.error('Error checking favorite status:', err)
        }
    }

    const toggleFavorite = async () => {
        if (!user || loading) return

        setLoading(true)
        try {
            if (isFavorite) {
                // Remove from favorites
                const { error } = await supabase
                    .from('user_favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('recipe_id', recipeId)

                if (error) throw error
                setIsFavorite(false)
            } else {
                // Add to favorites
                const { error } = await supabase
                    .from('user_favorites')
                    .insert({
                        user_id: user.id,
                        recipe_id: recipeId,
                    })

                if (error) throw error
                setIsFavorite(true)
            }
        } catch (err) {
            console.error('Error toggling favorite:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={toggleFavorite}
            disabled={loading}
            className={`group transition-all ${className}`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            <Heart
                className={`w-6 h-6 transition-all ${isFavorite
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-400 group-hover:text-red-500 group-hover:scale-110'
                    } ${loading ? 'opacity-50' : ''}`}
            />
        </button>
    )
}
