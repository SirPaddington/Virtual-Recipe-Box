'use client'

import { useState, useEffect } from 'react'
import {
    isBiometricSupported,
    isPlatformAuthenticatorAvailable,
    registerBiometric,
    hasBiometricCredential,
    removeBiometricCredential,
} from '@/lib/biometric-auth'
import { useAuth } from '@/components/auth/AuthProvider'
import { Fingerprint, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function BiometricSetup() {
    const { user } = useAuth()
    const [isSupported, setIsSupported] = useState(false)
    const [isAvailable, setIsAvailable] = useState(false)
    const [hasCredential, setHasCredential] = useState(false)
    const [loading, setLoading] = useState(true)
    const [registering, setRegistering] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        checkBiometricSupport()
    }, [])

    const checkBiometricSupport = async () => {
        setLoading(true)
        try {
            const supported = isBiometricSupported()
            setIsSupported(supported)

            if (supported) {
                const available = await isPlatformAuthenticatorAvailable()
                setIsAvailable(available)
                setHasCredential(hasBiometricCredential())
            }
        } catch (error) {
            console.error('Error checking biometric support:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async () => {
        if (!user) return

        setRegistering(true)
        setError('')
        setSuccess('')

        try {
            await registerBiometric(user.id, user.email || '')
            setHasCredential(true)
            setSuccess('Biometric authentication enabled successfully!')
        } catch (err: any) {
            setError(err.message || 'Failed to enable biometric authentication')
        } finally {
            setRegistering(false)
        }
    }

    const handleRemove = () => {
        removeBiometricCredential()
        setHasCredential(false)
        setSuccess('Biometric authentication disabled')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!isSupported || !isAvailable) {
        return (
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-gray-900 mb-1">
                            Biometric Authentication Unavailable
                        </h3>
                        <p className="text-sm text-gray-600">
                            {!isSupported
                                ? 'Your browser does not support biometric authentication.'
                                : 'No biometric authenticator (fingerprint/face ID) detected on this device.'}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-4">
                <Fingerprint className="w-6 h-6 text-orange-500 mt-0.5" />
                <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                        Biometric Authentication
                    </h3>
                    <p className="text-sm text-gray-600">
                        Use fingerprint or face ID for quick and secure sign-in
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <p className="text-sm text-green-600">{success}</p>
                </div>
            )}

            {hasCredential ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Biometric authentication is enabled</span>
                    </div>
                    <button
                        onClick={handleRemove}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                        Disable Biometric Authentication
                    </button>
                </div>
            ) : (
                <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {registering ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Setting up...
                        </>
                    ) : (
                        <>
                            <Fingerprint className="w-4 h-4" />
                            Enable Biometric Authentication
                        </>
                    )}
                </button>
            )}
        </div>
    )
}
