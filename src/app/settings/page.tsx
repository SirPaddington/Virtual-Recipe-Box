'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { BiometricSetup } from '@/components/BiometricSetup'
import { ArrowLeft, User, Users, Copy, Check, Loader2, Home } from 'lucide-react'
import Link from 'next/link'
import { InstallAppButton } from '@/components/pwa/InstallAppButton'

interface HouseholdInfo {
    id: string
    name: string
    invite_code: string | null
    role: 'owner' | 'admin' | 'member'
    members_count: number
    allow_member_edits: boolean
}

export default function SettingsPage() {
    const { user } = useAuth()
    const supabase = createClient()

    const [household, setHousehold] = useState<HouseholdInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        if (user) {
            loadHousehold()
        }
    }, [user])

    const loadHousehold = async () => {
        try {
            // Get household membership and details
            const { data: memberData, error: memberError } = await supabase
                .from('household_members')
                .select(`
                    role,
                    households (
                        id,
                        name,
                        invite_code,
                        allow_member_edits
                    )
                `)
                .eq('user_id', user!.id)
                .single()

            if (memberError) throw memberError

            const householdData = Array.isArray(memberData.households)
                ? memberData.households[0]
                : memberData.households

            if (!householdData) throw new Error('Household data not found')

            // Get member count
            const { count, error: countError } = await supabase
                .from('household_members')
                .select('*', { count: 'exact', head: true })
                .eq('household_id', householdData.id)

            if (countError) throw countError

            setHousehold({
                id: householdData.id,
                name: householdData.name,
                invite_code: householdData.invite_code,
                role: memberData.role,
                members_count: count || 1,
                allow_member_edits: householdData.allow_member_edits || false
            })
        } catch (err) {
            console.error('Error loading household:', err)
        } finally {
            setLoading(false)
        }
    }

    const copyInviteCode = () => {
        if (household?.invite_code) {
            navigator.clipboard.writeText(household.invite_code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const toggleMemberEdits = async () => {
        if (!household || updating) return

        setUpdating(true)
        try {
            const newValue = !household.allow_member_edits

            const { error } = await supabase
                .from('households')
                .update({ allow_member_edits: newValue })
                .eq('id', household.id)

            if (error) throw error

            setHousehold(prev => prev ? { ...prev, allow_member_edits: newValue } : null)
        } catch (err) {
            console.error('Error updating household setting:', err)
            alert('Failed to update setting')
        } finally {
            setUpdating(false)
        }
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

                    <div className="grid gap-6 max-w-2xl">
                        {/* Install App Section */}
                        <InstallAppButton />

                        {/* Biometric Authentication Section */}
                        <section>
                            <BiometricSetup />
                        </section>

                        {/* Profile Section */}
                        <section className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-gray-500" />
                                Profile
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Display Name</label>
                                    <div className="text-gray-900 font-medium">{user?.user_metadata?.display_name || 'N/A'}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                                    <div className="text-gray-900">{user?.email}</div>
                                </div>
                            </div>
                        </section>

                        {/* Household Section */}
                        <section className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-500" />
                                Household
                            </h2>

                            {loading ? (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Loading...
                                </div>
                            ) : household ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Household Name</label>
                                            <div className="text-gray-900 font-medium">{household.name}</div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Members</label>
                                            <div className="text-gray-900">{household.members_count} member{household.members_count !== 1 && 's'}</div>
                                        </div>
                                    </div>

                                    {/* Settings for Owner/Admin */}
                                    {(household.role === 'owner' || household.role === 'admin') && (
                                        <div className="border-t border-gray-100 pt-4 space-y-4">
                                            {/* Invite Code */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Invite Code
                                                </label>
                                                {household.invite_code ? (
                                                    <div className="flex items-center gap-2">
                                                        <code className="flex-1 bg-gray-100 px-4 py-3 rounded-lg text-lg font-mono font-bold tracking-wider border border-gray-200 text-center">
                                                            {household.invite_code}
                                                        </code>
                                                        <button
                                                            onClick={copyInviteCode}
                                                            className="p-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                                                            title="Copy to clipboard"
                                                        >
                                                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                                                        No invite code generated. Please run the database migration.
                                                    </div>
                                                )}
                                                <p className="text-sm text-gray-500 mt-2">
                                                    Share this code with family members to let them join your household.
                                                </p>
                                            </div>

                                            {/* Shared Editing Setting */}
                                            <div className="flex items-start justify-between gap-4 pt-2">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-900 block">
                                                        Allow member editing
                                                    </label>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Let household members edit recipes created by others in the household.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={toggleMemberEdits}
                                                    disabled={updating}
                                                    className={`
                                                        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                                                        ${household.allow_member_edits ? 'bg-orange-500' : 'bg-gray-200'}
                                                        ${updating ? 'opacity-50 cursor-wait' : ''}
                                                    `}
                                                    role="switch"
                                                    aria-checked={household.allow_member_edits}
                                                >
                                                    <span className="sr-only">Allow member editing</span>
                                                    <span
                                                        aria-hidden="true"
                                                        className={`
                                                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                                            ${household.allow_member_edits ? 'translate-x-5' : 'translate-x-0'}
                                                        `}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {household.role === 'member' && (
                                        <div className="border-t border-gray-100 pt-4">
                                            <div className="text-sm text-gray-500 italic">
                                                Contact your household admin to manage invites and settings.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-red-500">Could not load household information.</div>
                            )}
                        </section>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
