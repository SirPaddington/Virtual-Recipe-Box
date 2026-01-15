'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
    value?: string | null
    onChange: (url: string, storagePath: string) => void
    onRemove?: () => void
    className?: string
    bucketName?: string
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    className = "",
    bucketName = "recipe-images"
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0]
            if (!file) return

            setUploading(true)
            setError(null)

            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Please upload an image file')
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('Image must be less than 5MB')
            }

            // Create unique file path
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // Upload
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath)

            onChange(data.publicUrl, filePath)
        } catch (err: any) {
            console.error('Upload failed:', err)
            setError(err.message || 'Upload failed')
        } finally {
            setUploading(false)
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleRemove = () => {
        if (onRemove) onRemove()
    }

    return (
        <div className={`relative ${className}`}>
            {value ? (
                <div className="relative rounded-lg overflow-hidden bg-gray-100 group">
                    <div className="aspect-video relative">
                        <Image
                            src={value}
                            alt="Uploaded image"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                        />
                    </div>
                    {onRemove && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white shadow-sm hover:bg-red-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        border-2 border-dashed border-gray-300 rounded-lg p-6 
                        flex flex-col items-center justify-center cursor-pointer
                        hover:border-orange-500 hover:bg-orange-50 transition-colors
                        bg-gray-50 aspect-video
                        ${uploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                >
                    {uploading ? (
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-2" />
                    ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                    )}
                    <span className="text-sm font-medium text-gray-600">
                        {uploading ? 'Uploading...' : 'Click to upload image'}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                        Max 5MB
                    </span>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-500 mt-2">{error}</p>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
            />
        </div>
    )
}
