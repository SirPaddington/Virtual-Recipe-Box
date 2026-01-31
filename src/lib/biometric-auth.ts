/**
 * Biometric Authentication Utility using WebAuthn API
 * Enables fingerprint/face ID authentication for quick re-authentication
 */

import { createClient } from './supabase/client'

const CREDENTIAL_STORAGE_KEY = 'recipe-box-webauthn-credentials'

export interface BiometricCredential {
    id: string
    publicKey: string
    deviceName: string
    createdAt: number
}

/**
 * Check if WebAuthn is supported in the current browser
 */
export function isBiometricSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        window.PublicKeyCredential !== undefined &&
        navigator.credentials !== undefined
    )
}

/**
 * Check if platform authenticator (fingerprint/face ID) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!isBiometricSupported()) return false

    try {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch (error) {
        console.error('Error checking platform authenticator:', error)
        return false
    }
}

/**
 * Register a new biometric credential for the current user
 */
export async function registerBiometric(
    userId: string,
    email: string
): Promise<BiometricCredential | null> {
    if (!isBiometricSupported()) {
        throw new Error('Biometric authentication is not supported on this device')
    }

    try {
        // Generate a challenge (in production, this should come from your server)
        const challenge = new Uint8Array(32)
        crypto.getRandomValues(challenge)

        // Create credential options
        const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
            challenge,
            rp: {
                name: 'Virtual Recipe Box',
                id: window.location.hostname,
            },
            user: {
                id: new TextEncoder().encode(userId),
                name: email,
                displayName: email,
            },
            pubKeyCredParams: [
                { alg: -7, type: 'public-key' }, // ES256
                { alg: -257, type: 'public-key' }, // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required',
                requireResidentKey: false,
            },
            timeout: 60000,
            attestation: 'none',
        }

        // Create the credential
        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions,
        }) as PublicKeyCredential

        if (!credential) {
            throw new Error('Failed to create credential')
        }

        // Store credential info
        const credentialData: BiometricCredential = {
            id: credential.id,
            publicKey: arrayBufferToBase64(credential.rawId),
            deviceName: getDeviceName(),
            createdAt: Date.now(),
        }

        saveBiometricCredential(credentialData)

        return credentialData
    } catch (error: any) {
        console.error('Error registering biometric:', error)

        // User cancelled or error occurred
        if (error.name === 'NotAllowedError') {
            throw new Error('Biometric registration was cancelled')
        }

        throw new Error('Failed to register biometric authentication')
    }
}

/**
 * Authenticate using biometric credential
 */
export async function authenticateWithBiometric(): Promise<boolean> {
    if (!isBiometricSupported()) {
        throw new Error('Biometric authentication is not supported on this device')
    }

    const credential = getBiometricCredential()
    if (!credential) {
        throw new Error('No biometric credential found. Please set up biometric authentication first.')
    }

    try {
        // Generate a challenge
        const challenge = new Uint8Array(32)
        crypto.getRandomValues(challenge)

        // Create authentication options
        const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
            challenge,
            allowCredentials: [
                {
                    id: base64ToArrayBuffer(credential.publicKey),
                    type: 'public-key',
                    transports: ['internal'],
                },
            ],
            timeout: 60000,
            userVerification: 'required',
        }

        // Get the credential
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions,
        }) as PublicKeyCredential

        if (!assertion) {
            throw new Error('Authentication failed')
        }

        // In a production app, you would verify the assertion on your server
        // For now, we'll just return success
        return true
    } catch (error: any) {
        console.error('Error authenticating with biometric:', error)

        if (error.name === 'NotAllowedError') {
            throw new Error('Biometric authentication was cancelled')
        }

        throw new Error('Biometric authentication failed')
    }
}

/**
 * Remove biometric credential
 */
export function removeBiometricCredential(): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.removeItem(CREDENTIAL_STORAGE_KEY)
    } catch (error) {
        console.error('Error removing biometric credential:', error)
    }
}

/**
 * Check if user has biometric credential registered
 */
export function hasBiometricCredential(): boolean {
    return getBiometricCredential() !== null
}

/**
 * Get stored biometric credential
 */
function getBiometricCredential(): BiometricCredential | null {
    if (typeof window === 'undefined') return null

    try {
        const stored = localStorage.getItem(CREDENTIAL_STORAGE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (error) {
        console.error('Error reading biometric credential:', error)
    }

    return null
}

/**
 * Save biometric credential to storage
 */
function saveBiometricCredential(credential: BiometricCredential): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify(credential))
    } catch (error) {
        console.error('Error saving biometric credential:', error)
    }
}

/**
 * Get device name for display
 */
function getDeviceName(): string {
    const ua = navigator.userAgent

    if (/iPhone/.test(ua)) return 'iPhone'
    if (/iPad/.test(ua)) return 'iPad'
    if (/Android/.test(ua)) return 'Android Device'
    if (/Mac/.test(ua)) return 'Mac'
    if (/Windows/.test(ua)) return 'Windows PC'

    return 'This Device'
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
}

/**
 * Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
}
