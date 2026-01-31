'use client'

import { useState } from 'react'
import { X, GripVertical } from 'lucide-react'
import type { Instruction } from '@/types/database'
import { ImageUpload } from '@/components/ui/ImageUpload'

// Extended instruction type for local state
interface InstructionWithImage extends Omit<Instruction, 'id' | 'recipe_id'> {
    image?: {
        url: string
        storagePath: string
    } | null
}

interface InstructionInputProps {
    instructions: InstructionWithImage[]
    onChange: (instructions: InstructionWithImage[]) => void
}

export function InstructionInput({ instructions, onChange }: InstructionInputProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

    const addInstruction = () => {
        onChange([
            ...instructions,
            {
                step_number: instructions.length + 1,
                content: '',
                duration_minutes: null,
                temperature: null,
                image: null,
            },
        ])
    }

    const removeInstruction = (index: number) => {
        const updated = instructions
            .filter((_, i) => i !== index)
            .map((inst, i) => ({ ...inst, step_number: i + 1 }))
        onChange(updated)
    }

    const updateInstruction = (index: number, field: string, value: any) => {
        const updated = [...instructions]
        updated[index] = { ...updated[index], [field]: value }
        onChange(updated)
    }

    const handleDragStart = (index: number) => {
        setDraggedIndex(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()

        if (draggedIndex === null || draggedIndex === index) return

        const reordered = [...instructions]
        const draggedItem = reordered[draggedIndex]

        // Remove from old position
        reordered.splice(draggedIndex, 1)
        // Insert at new position
        reordered.splice(index, 0, draggedItem)

        // Update step numbers
        const updated = reordered.map((inst, i) => ({ ...inst, step_number: i + 1 }))
        onChange(updated)
        setDraggedIndex(index)
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Instructions</label>
                <button
                    type="button"
                    onClick={addInstruction}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                    + Add Step
                </button>
            </div>

            {instructions.map((instruction, index) => (
                <div
                    key={index}
                    className={`bg-gray-50 rounded-lg p-2 sm:p-4 space-y-2 sm:space-y-3 ${draggedIndex === index ? 'opacity-50' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-1 sm:gap-2">
                        {/* Step number indicator with drag handle */}
                        <div className="flex items-start pt-2">
                            <div className="flex items-center gap-1 cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-gray-700 text-sm sm:text-base">
                                    {index + 1}.
                                </span>
                            </div>
                        </div>

                        {/* Step content */}
                        <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                            <textarea
                                value={instruction.content}
                                onChange={(e) => updateInstruction(index, 'content', e.target.value)}
                                placeholder="Describe this step..."
                                rows={4}
                                className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
                                required
                            />

                            {/* Optional timing and temperature */}
                            <div className="flex gap-2 sm:gap-4">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <label className="text-xs text-gray-600 whitespace-nowrap">Time:</label>
                                    <input
                                        type="number"
                                        value={instruction.duration_minutes ?? ''}
                                        onChange={(e) => updateInstruction(index, 'duration_minutes', e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder="mins"
                                        className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex items-center gap-1 sm:gap-2">
                                    <label className="text-xs text-gray-600 whitespace-nowrap">Temp:</label>
                                    <input
                                        type="text"
                                        value={instruction.temperature ?? ''}
                                        onChange={(e) => updateInstruction(index, 'temperature', e.target.value || null)}
                                        placeholder="350°F"
                                        className="w-20 sm:w-28 px-1 sm:px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div className="w-full">
                                <ImageUpload
                                    value={instruction.image?.url}
                                    onChange={(url, storagePath) => updateInstruction(index, 'image', { url, storagePath })}
                                    onRemove={() => updateInstruction(index, 'image', null)}
                                    className="w-full"
                                    compact={true}
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => removeInstruction(index)}
                            className="text-gray-400 hover:text-red-600 self-start p-0.5 sm:p-1"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            ))}

            {instructions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No instructions yet. Click "Add Step" to get started.</p>
                </div>
            )}
        </div>
    )
}
