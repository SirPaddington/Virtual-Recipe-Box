'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { ReauthModal } from '@/components/ReauthModal'
import { useRouter } from 'next/navigation'

interface AuthContextType {
    user: User | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [showReauthModal, setShowReauthModal] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)

            // Show re-auth modal if session expired
            if (event === 'TOKEN_REFRESHED' && !session) {
                setShowReauthModal(true)
            }
        })

        // Refresh session when app regains focus
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error || !session) {
                    // Session is invalid or expired
                    setShowReauthModal(true)
                } else {
                    // Attempt to refresh the session
                    const { error: refreshError } = await supabase.auth.refreshSession()

                    if (refreshError) {
                        setShowReauthModal(true)
                    }
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            subscription.unsubscribe()
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [supabase.auth])

    const router = useRouter()

    const signOut = async () => {
        await supabase.auth.signOut()
        setShowReauthModal(false)
    }

    const handleReauthSuccess = () => {
        setShowReauthModal(false)
    }

    const handleReauthClose = () => {
        setShowReauthModal(false)
        // User chose to access offline recipes instead
        router.push('/offline')
    }

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
            <ReauthModal
                isOpen={showReauthModal}
                onClose={handleReauthClose}
                onSuccess={handleReauthSuccess}
            />
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
