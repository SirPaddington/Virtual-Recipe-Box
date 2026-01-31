/**
 * Session Manager Utility
 * Handles session lifecycle, automatic refresh, and persistence preferences
 */

const SESSION_PREFERENCE_KEY = 'recipe-box-remember-me'
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000 // Check every 5 minutes

export type SessionDuration = 'short' | 'long'

interface SessionPreference {
    rememberMe: boolean
    duration: SessionDuration
}

/**
 * Get user's session preference
 */
export function getSessionPreference(): SessionPreference {
    if (typeof window === 'undefined') {
        return { rememberMe: false, duration: 'short' }
    }

    try {
        const stored = localStorage.getItem(SESSION_PREFERENCE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (error) {
        console.error('Error reading session preference:', error)
    }

    return { rememberMe: false, duration: 'short' }
}

/**
 * Save user's session preference
 */
export function setSessionPreference(rememberMe: boolean): void {
    if (typeof window === 'undefined') return

    const preference: SessionPreference = {
        rememberMe,
        duration: rememberMe ? 'long' : 'short',
    }

    try {
        localStorage.setItem(SESSION_PREFERENCE_KEY, JSON.stringify(preference))
    } catch (error) {
        console.error('Error saving session preference:', error)
    }
}

/**
 * Clear session preference
 */
export function clearSessionPreference(): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.removeItem(SESSION_PREFERENCE_KEY)
    } catch (error) {
        console.error('Error clearing session preference:', error)
    }
}

/**
 * Get session duration in seconds based on preference
 */
export function getSessionDuration(preference?: SessionPreference): number {
    const pref = preference || getSessionPreference()

    // Short session: 1 day (86400 seconds)
    // Long session: 60 days (5184000 seconds)
    return pref.rememberMe ? 60 * 24 * 60 * 60 : 24 * 60 * 60
}

/**
 * Check if session should be refreshed
 * Returns true if session expires within 5 minutes
 */
export function shouldRefreshSession(expiresAt?: number): boolean {
    if (!expiresAt) return false

    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = expiresAt - now

    // Refresh if less than 5 minutes until expiry
    return timeUntilExpiry < 5 * 60
}

/**
 * Calculate time until next session check
 */
export function getNextCheckTime(expiresAt?: number): number {
    if (!expiresAt) return SESSION_CHECK_INTERVAL

    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = expiresAt - now

    // If expiring soon, check more frequently
    if (timeUntilExpiry < 10 * 60) {
        return 60 * 1000 // Check every minute
    }

    return SESSION_CHECK_INTERVAL
}
