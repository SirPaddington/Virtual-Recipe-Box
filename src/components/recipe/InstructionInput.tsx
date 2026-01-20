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
                <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex gap-2">
                        {/* Step number indicator */}
                        <div className="flex flex-col items-center gap-2 pt-2">
                            <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-gray-700 min-w-[1.5rem]">
                                    {index + 1}.
                                </span>
                            </div>
                        </div>

                        {/* Step content */}
                        <div className="flex-1 space-y-3">
                            <textarea
                                value={instruction.content}
                                onChange={(e) => updateInstruction(index, 'content', e.target.value)}
                                placeholder="Describe this step..."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                required
                            />

                            {/* Optional timing and temperature */}
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-600">Time:</label>
                                    <input
                                        type="number"
                                        value={instruction.duration_minutes ?? ''}
                                        onChange={(e) => updateInstruction(index, 'duration_minutes', e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder="mins"
                                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-600">Temp:</label>
                                    <input
                                        type="text"
                                        value={instruction.temperature ?? ''}
                                        onChange={(e) => updateInstruction(index, 'temperature', e.target.value || null)}
                                        placeholder="e.g., 350°F"
                                        className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div className="flex items-start gap-2">
                                <div className="w-32">
                                    <ImageUpload
                                        value={instruction.image?.url}
                                        onChange={(url, storagePath) => updateInstruction(index, 'image', { url, storagePath })}
                                        onRemove={() => updateInstruction(index, 'image', null)}
                                        className="w-full"
                                    />
                                    <p className="text-[10px] text-gray-500 text-center mt-1">Step Photo</p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => removeInstruction(index)}
                            className="text-gray-400 hover:text-red-600 self-start p-1"
                        >
                            <X className="w-5 h-5" />
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
