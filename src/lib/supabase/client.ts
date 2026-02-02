import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
            cookieOptions: {
                name: 'sb-virtual-recipe-box-auth-token',
                // lifetime: 1 year for PWA persistence
                maxAge: 60 * 60 * 24 * 365,
                domain: '',
                path: '/',
                sameSite: 'lax',
            }
        }
    )
}
