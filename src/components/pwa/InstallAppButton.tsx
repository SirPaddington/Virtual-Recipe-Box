'use client'

import { useState } from 'react'
import { Download, Smartphone } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { IOSInstructionsModal } from './IOSInstructionsModal'

export function InstallAppButton() {
    const { isInstallable, isIOS, isStandalone, promptInstall } = useInstallPrompt()
    const [showIOSModal, setShowIOSModal] = useState(false)

    // Don't show anything if already installed
    if (isStandalone) return null

    // Don't show if not installable and not on iOS (e.g. unsupported desktop browser without beforeinstallprompt support)
    if (!isInstallable && !isIOS) return null

    const handleClick = () => {
        if (isIOS) {
            setShowIOSModal(true)
        } else {
            promptInstall()
        }
    }

    return (
        <>
            <section className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-gray-500" />
                    App Installation
                </h2>
                <button
                    onClick={handleClick}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors text-left group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                            {isIOS ? <Smartphone className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">Install App</div>
                            <div className="text-sm text-gray-500">
                                {isIOS ? 'Add to your home screen' : 'Install for the best experience'}
                            </div>
                        </div>
                    </div>
                </button>
            </section>

            <IOSInstructionsModal
                isOpen={showIOSModal}
                onClose={() => setShowIOSModal(false)}
            />
        </>
    )
}
