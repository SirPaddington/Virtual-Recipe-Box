'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { setSessionPreference } from '@/lib/session-manager'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [useMagicLink, setUseMagicLink] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [hasBiometrics, setHasBiometrics] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        // Check if we have biometric credentials saved
        if (typeof window !== 'undefined') {
            const hasCreds = localStorage.getItem('recipe-box-webauthn-credentials')
            setHasBiometrics(!!hasCreds)
        }
    }, [])

    const handleBiometricClick = async () => {
        // Since we don't have Full Passkey logic yet, we can't "Login" from cold start
        // But we can check if there's a session hanging around or guide the user
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            router.push('/recipes')
        } else {
            setError('Please sign in with password once to re-enable biometric access.')
        }
    }

    // Debug helper
    useEffect(() => {
        if (typeof window !== 'undefined') {
            console.log('Checking biometrics:', localStorage.getItem('recipe-box-webauthn-credentials'))
        }
    }, [])

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            // Save Remember Me preference
            setSessionPreference(rememberMe)

            router.push('/recipes')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'An error occurred during login')
        } finally {
            setLoading(false)
        }
    }

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setMessage('')

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) throw error

            setMessage('Check your email for the magic link!')
        } catch (err: any) {
            setError(err.message || 'An error occurred sending the magic link')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Title */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                    <p className="text-gray-600">Sign in to access your recipes</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Toggle between methods */}
                    <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
                        <button
                            type="button"
                            onClick={() => setUseMagicLink(false)}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${!useMagicLink
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Password
                        </button>
                        <button
                            type="button"
                            onClick={() => setUseMagicLink(true)}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${useMagicLink
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Magic Link
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {message && (
                        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
                            <p className="text-sm text-green-600">{message}</p>
                        </div>
                    )}

                    <form onSubmit={useMagicLink ? handleMagicLink : handleEmailLogin}>
                        {/* Email Field */}
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {/* Password Field (only for password login) */}
                        {!useMagicLink && (
                            <>
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
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {/* Remember Me Checkbox */}
                                <div className="mb-6 flex items-center">
                                    <input
                                        id="remember-me"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
                                        Remember me for 60 days
                                    </label>
                                </div>
                            </>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    {useMagicLink ? 'Sending...' : 'Signing in...'}
                                </>
                            ) : (
                                <>{useMagicLink ? 'Send Magic Link' : 'Sign In'}</>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 text-center">
                        <span className="text-sm text-gray-500">Don't have an account?</span>
                    </div>

                    {/* Signup Link */}
                    <Link
                        href="/signup"
                        className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
                    >
                        Create Account
                    </Link>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
