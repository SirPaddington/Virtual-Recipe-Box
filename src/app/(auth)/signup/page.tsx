'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Users, Loader2 } from 'lucide-react'

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [householdName, setHouseholdName] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const [isJoining, setIsJoining] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Call server-side signup API
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    displayName,
                    householdName: !isJoining ? householdName : undefined,
                    inviteCode: isJoining ? inviteCode : undefined,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed')
            }

            // Sign in the user after successful signup
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) throw signInError

            // Success! Redirect to recipes
            router.push('/recipes')
            router.refresh()
        } catch (err: any) {
            console.error('Signup error:', err)
            setError(err.message || 'An error occurred during signup')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Title */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Get Started</h1>
                    <p className="text-gray-600">Create your account and household</p>
                </div>

                {/* Signup Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSignup}>
                        {/* Display Name */}
                        <div className="mb-4">
                            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                                Your Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="displayName"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        {/* Email */}
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

                        {/* Password */}
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
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="••••••••"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
                        </div>

                        {/* Household Toggle */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Household Setup
                            </label>
                            <div className="flex p-1 bg-gray-100 rounded-lg mb-4">
                                <button
                                    type="button"
                                    onClick={() => setIsJoining(false)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isJoining
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Create New
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsJoining(true)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isJoining
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Join Existing
                                </button>
                            </div>

                            {isJoining ? (
                                <div>
                                    <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                                        Household Invite Code
                                    </label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="inviteCode"
                                            type="text"
                                            value={inviteCode}
                                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                            required={isJoining}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase tracking-wider font-mono"
                                            placeholder="ABC12345"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Ask a household member for their invite code</p>
                                </div>
                            ) : (
                                <div>
                                    <label htmlFor="householdName" className="block text-sm font-medium text-gray-700 mb-2">
                                        Household Name (Optional)
                                    </label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="householdName"
                                            type="text"
                                            value={householdName}
                                            onChange={(e) => setHouseholdName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            placeholder="Smith Family"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Will default to "{displayName}'s Household"</p>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 text-center">
                        <span className="text-sm text-gray-500">Already have an account?</span>
                    </div>

                    {/* Login Link */}
                    <Link
                        href="/login"
                        className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
                    >
                        Sign In
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
