'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Copy, Link as LinkIcon, RefreshCw, Trash2, X, Check, Globe } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'

interface ShareModalProps {
    isOpen: boolean
    onClose: () => void
    recipeId: string
    recipeTitle: string
}

export function ShareModal({ isOpen, onClose, recipeId, recipeTitle }: ShareModalProps) {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [shareToken, setShareToken] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (isOpen) {
            fetchShareLink()
        }
    }, [isOpen, recipeId])

    const fetchShareLink = async () => {
        setLoading(true)
        setError('')
        try {
            const { data, error } = await supabase
                .from('recipe_shares')
                .select('token')
                .eq('recipe_id', recipeId)
                .single()

            if (error && error.code !== 'PGRST116') { // PGRST116 is 'Row not found'
                throw error
            }

            if (data) {
                setShareToken(data.token)
            } else {
                setShareToken(null)
            }
        } catch (err: any) {
            console.error('Error fetching share link:', err)
            setError('Failed to load share settings')
        } finally {
            setLoading(false)
        }
    }

    const createShareLink = async () => {
        setLoading(true)
        setError('')
        try {
            // Generate a random token
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

            // Get current user required for RLS policies
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('You must be logged in')

            const { data, error } = await supabase
                .from('recipe_shares')
                .insert({
                    recipe_id: recipeId,
                    token: token,
                    created_by: user.id
                })
                .select()
                .single()

            if (error) throw error
            setShareToken(data.token)
        } catch (err: any) {
            console.error('Error creating share link:', err)
            setError('Failed to create share link')
        } finally {
            setLoading(false)
        }
    }

    const revokeShareLink = async () => {
        if (!confirm('Are you sure? The existing link will stop working immediately.')) return

        setLoading(true)
        setError('')
        try {
            const { error } = await supabase
                .from('recipe_shares')
                .delete()
                .eq('recipe_id', recipeId)

            if (error) throw error
            setShareToken(null)
        } catch (err: any) {
            console.error('Error revoking share link:', err)
            setError('Failed to revoke link')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (!shareToken) return
        const url = `${window.location.origin}/share/${shareToken}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const shareUrl = shareToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareToken}` : ''

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <Globe className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Share Recipe</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <p className="text-gray-600 mb-6">
                        Create a public link for <strong>{recipeTitle}</strong>. Anyone with this link can view the recipe, regardless of their login status.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {loading && !shareToken ? (
                        <div className="py-8 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : !shareToken ? (
                        <div className="text-center py-4">
                            <button
                                onClick={createShareLink}
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <LinkIcon className="w-5 h-5" />
                                Create Public Link
                            </button>
                            <p className="text-xs text-gray-400 mt-3">
                                The link will be active until you revoke it.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Public Link
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={shareUrl}
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className={`px-4 rounded-lg font-medium transition-all flex items-center gap-2 ${copied
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={revokeShareLink}
                                    disabled={loading}
                                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Revoke Link
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
