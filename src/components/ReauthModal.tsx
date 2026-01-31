'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { authenticateWithBiometric, hasBiometricCredential } from '@/lib/biometric-auth'
import { Lock, Fingerprint, X, Loader2 } from 'lucide-react'

interface ReauthModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function ReauthModal({ isOpen, onClose, onSuccess }: ReauthModalProps) {
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [biometricAvailable, setBiometricAvailable] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        setBiometricAvailable(hasBiometricCredential())
    }, [])

    const handleBiometricAuth = async () => {
        setLoading(true)
        setError('')

        try {
            const success = await authenticateWithBiometric()

            if (success) {
                // Refresh the session
                const { error: refreshError } = await supabase.auth.refreshSession()

                if (refreshError) throw refreshError

                onSuccess()
                onClose()
            }
        } catch (err: any) {
            setError(err.message || 'Biometric authentication failed')
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user?.email) {
                throw new Error('No user email found')
            }

            // Re-authenticate with password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password,
            })

            if (signInError) throw signInError

            onSuccess()
            onClose()
            setPassword('')
        } catch (err: any) {
            setError(err.message || 'Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Session Expired</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-gray-600 mb-6">
                    Your session has expired. Please re-authenticate to continue.
                </p>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {biometricAvailable && (
                    <div className="mb-4">
                        <button
                            onClick={handleBiometricAuth}
                            disabled={loading}
                            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <Fingerprint className="w-5 h-5" />
                                    Use Biometric
                                </>
                            )}
                        </button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">or</span>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handlePasswordAuth}>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Enter your password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <button
                    onClick={onClose}
                    className="w-full mt-3 text-sm text-gray-600 hover:text-gray-900 py-2"
                >
                    Access Offline Recipes
                </button>
            </div>
        </div>
    )
}
