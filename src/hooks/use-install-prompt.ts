import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function useInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        // Check if running in standalone mode (already installed)
        const isInStandaloneMode = () => {
            const mqStandAlone = '(display-mode: standalone)'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return window.matchMedia(mqStandAlone).matches || (window.navigator as any).standalone || document.referrer.includes('android-app://')
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
        setIsStandalone(isInStandaloneMode())

        // Check for iOS
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        setIsIOS(iOS)

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const promptInstall = async () => {
        if (!deferredPrompt) return

        await deferredPrompt.prompt()

        // We can check the outcome but usually we don't need to do much
        const choiceResult = await deferredPrompt.userChoice

        if (choiceResult.outcome === 'accepted') {
            setDeferredPrompt(null)
        }
    }

    return {
        isInstallable: !!deferredPrompt && !isStandalone,
        isIOS: isIOS && !isStandalone,
        isStandalone,
        promptInstall
    }
}
