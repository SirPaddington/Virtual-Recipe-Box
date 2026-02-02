'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export function HomeRedirect() {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                router.replace('/recipes')
            }
        }
        checkSession()
    }, [router, supabase])

    // Render nothing (or a small loader) while checking
    // This component is mounted on the Home Page, so it runs immediately
    return null
}
