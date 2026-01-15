import { Share, PlusSquare, X } from 'lucide-react'

interface IOSInstructionsModalProps {
    isOpen: boolean
    onClose: () => void
}

export function IOSInstructionsModal({ isOpen, onClose }: IOSInstructionsModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Install "Recipe Box"</h3>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <p className="text-gray-600 text-sm">
                            Install this application on your home screen for quick access and a better experience.
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                                    1
                                </div>
                                <div className="text-sm text-gray-700">
                                    Tap the <span className="font-semibold">Share</span> icon
                                </div>
                                <Share className="w-5 h-5 text-blue-600 ml-auto" />
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                                    2
                                </div>
                                <div className="text-sm text-gray-700">
                                    Scroll down and tap <span className="font-semibold">Add to Home Screen</span>
                                </div>
                                <PlusSquare className="w-5 h-5 text-gray-600 ml-auto" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex p-4 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    )
}
