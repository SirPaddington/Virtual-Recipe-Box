'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { X, Star } from 'lucide-react'

interface AddCookingNoteModalProps {
    recipeId: string
    onClose: () => void
    onSuccess: () => void
}

export function AddCookingNoteModal({ recipeId, onClose, onSuccess }: AddCookingNoteModalProps) {
    const { user } = useAuth()
    const supabase = createClient()

    const [cookedOn, setCookedOn] = useState(new Date().toISOString().split('T')[0])
    const [multiplier, setMultiplier] = useState(1)
    const [rating, setRating] = useState<number | null>(null)
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSaving(true)
        setError('')

        try {
            const { error: insertError } = await supabase
                .from('cooking_notes')
                .insert({
                    recipe_id: recipeId,
                    user_id: user.id,
                    cooked_on: cookedOn,
                    multiplier,
                    rating,
                    notes: notes || null,
                })

            if (insertError) throw insertError

            onSuccess()
            onClose()
        } catch (err: any) {
            console.error('Error saving cooking note:', err)
            setError(err.message || 'Failed to save note')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Add Cooking Note</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Date */}
                        <div>
                            <label htmlFor="cookedOn" className="block text-sm font-medium text-gray-700 mb-2">
                                Date Cooked *
                            </label>
                            <input
                                id="cookedOn"
                                type="date"
                                value={cookedOn}
                                onChange={(e) => setCookedOn(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>

                        {/* Multiplier */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Recipe Scaled
                            </label>
                            <div className="flex gap-2">
                                {[0.5, 1, 2, 3].map((mult) => (
                                    <button
                                        key={mult}
                                        type="button"
                                        onClick={() => setMultiplier(mult)}
                                        className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${multiplier === mult
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {mult}x
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rating */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rating
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(rating === star ? null : star)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-8 h-8 ${rating && star <= rating
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                                Notes
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                placeholder="What did you think? Any modifications or tips?"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-lg transition-colors"
                            >
                                {saving ? 'Saving...' : 'Save Note'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
