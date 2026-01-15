'use client'

import { useState, useEffect } from 'react'
import { Download, Check, RefreshCw, Smartphone } from 'lucide-react'
import {
    saveRecipeOffline,
    removeOfflineRecipe,
    isRecipeOffline,
    getOfflineRecipe
} from '@/lib/offline-storage'
import type { RecipeWithDetails, Ingredient, Instruction, CookingNote } from '@/types/database'

interface OfflineControlProps {
    recipe: RecipeWithDetails
    ingredients: Ingredient[]
    instructions: Instruction[]
    notes: CookingNote[]
}

export function OfflineControl({ recipe, ingredients, instructions, notes }: OfflineControlProps) {
    const [isOffline, setIsOffline] = useState(false)
    const [loading, setLoading] = useState(true)
    const [isSupported, setIsSupported] = useState(false)

    useEffect(() => {
        checkSupport()
    }, [recipe.id])

    const checkSupport = async () => {
        // Check if IndexedDB is supported
        if (typeof window !== 'undefined' && 'indexedDB' in window) {
            setIsSupported(true)
            const offline = await isRecipeOffline(recipe.id)
            setIsOffline(offline)
        }
        setLoading(false)
    }

    const toggleOffline = async () => {
        setLoading(true)
        try {
            if (isOffline) {
                await removeOfflineRecipe(recipe.id)
                setIsOffline(false)
            } else {
                await saveRecipeOffline(recipe, ingredients, instructions, notes)
                setIsOffline(true)
            }
        } catch (err) {
            console.error('Error toggling offline status:', err)
            alert('Failed to update offline status. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (!isSupported) return null

    return (
        <button
            onClick={toggleOffline}
            disabled={loading}
            className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
        ${isOffline
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
      `}
            title={isOffline ? "Saved for offline gathering" : "Save for shopping offline"}
        >
            {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isOffline ? (
                <>
                    <Check className="w-4 h-4" />
                    <span>Saved Offline</span>
                </>
            ) : (
                <>
                    <Download className="w-4 h-4" />
                    <span>Save for Shopping</span>
                </>
            )}
        </button>
    )
}
