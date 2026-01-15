import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { email, password, displayName, householdName, inviteCode } = await request.json()

        // Use service role key to bypass RLS for signup
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm since email confirmation is disabled
            user_metadata: {
                display_name: displayName,
            },
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('No user data returned')

        // 2. Create user profile
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                display_name: displayName,
            })

        if (profileError) throw profileError

        let householdId = null
        let role = 'owner'

        if (inviteCode) {
            // Join existing household
            const { data: household, error: findError } = await supabase
                .from('households')
                .select('id')
                .eq('invite_code', inviteCode)
                .single()

            if (findError || !household) {
                // Determine if we should clean up user? For now just throw.
                throw new Error('Invalid invite code. Please check and try again.')
            }
            householdId = household.id
            role = 'member'
        } else {
            // 3. Create household
            // Generate a simple random code if one wasn't provided (fallback)
            const generatedInviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()

            const { data: householdData, error: householdError } = await supabase
                .from('households')
                .insert({
                    name: householdName || `${displayName}'s Household`,
                    owner_id: authData.user.id,
                    invite_code: generatedInviteCode,
                })
                .select()
                .single()

            if (householdError) throw householdError
            householdId = householdData.id
        }

        // 4. Add user to household
        const { error: memberError } = await supabase
            .from('household_members')
            .insert({
                household_id: householdId,
                user_id: authData.user.id,
                role: role,
            })

        if (memberError) throw memberError

        return NextResponse.json({
            success: true,
            user: authData.user
        })
    } catch (error: any) {
        console.error('Signup API error:', error)
        return NextResponse.json(
            { error: error.message || 'Signup failed' },
            { status: 400 }
        )
    }
}
