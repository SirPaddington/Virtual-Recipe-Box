'use client'

import { useState } from 'react'
import { X, GripVertical } from 'lucide-react'
import type { Ingredient, UnitType } from '@/types/database'

interface IngredientInputProps {
    ingredients: Omit<Ingredient, 'id' | 'recipe_id'>[]
    onChange: (ingredients: Omit<Ingredient, 'id' | 'recipe_id'>[]) => void
    defaultUnit: 'imperial' | 'metric'  // Based on recipe category
}

const IMPERIAL_UNITS: UnitType[] = ['tsp', 'tbsp', 'cup', 'fl_oz', 'oz', 'lb', 'pint', 'quart', 'gallon', 'pinch', 'dash']
const METRIC_UNITS: UnitType[] = ['ml', 'l', 'g', 'kg']
const COUNT_UNITS: UnitType[] = ['piece', 'whole', 'slice', 'clove', 'sprig', 'leaf', 'to_taste', 'as_needed']

export function IngredientInput({ ingredients, onChange, defaultUnit }: IngredientInputProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

    const addIngredient = () => {
        onChange([
            ...ingredients,
            {
                name: '',
                qty_imperial: null,
                unit_imperial: null,
                qty_metric: null,
                unit_metric: null,
                sort_order: ingredients.length,
                notes: null,
            },
        ])
    }

    const removeIngredient = (index: number) => {
        onChange(ingredients.filter((_, i) => i !== index))
    }

    const updateIngredient = (index: number, field: string, value: any) => {
        const updated = [...ingredients]
        updated[index] = { ...updated[index], [field]: value }
        onChange(updated)
    }

    const handleDragStart = (index: number) => {
        setDraggedIndex(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()

        if (draggedIndex === null || draggedIndex === index) return

        const reordered = [...ingredients]
        const draggedItem = reordered[draggedIndex]

        // Remove from old position
        reordered.splice(draggedIndex, 1)
        // Insert at new position
        reordered.splice(index, 0, draggedItem)

        onChange(reordered)
        setDraggedIndex(index)
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Ingredients</label>
                <button
                    type="button"
                    onClick={addIngredient}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                    + Add Ingredient
                </button>
            </div>

            {ingredients.map((ingredient, index) => (
                <div
                    key={index}
                    className={`bg-gray-50 rounded-lg p-4 space-y-3 ${draggedIndex === index ? 'opacity-50' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-2">
                        {/* Drag handle */}
                        <div className="flex items-center cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-5 h-5 text-gray-400" />
                        </div>

                        {/* Ingredient name */}
                        <input
                            type="text"
                            value={ingredient.name}
                            onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                            placeholder="Ingredient name"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => removeIngredient(index)}
                            className="text-gray-400 hover:text-red-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Imperial */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600">
                                {defaultUnit === 'imperial' ? 'Quantity (Primary)' : 'Imperial (Optional)'}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    step="any"
                                    value={ingredient.qty_imperial ?? ''}
                                    onChange={(e) => updateIngredient(index, 'qty_imperial', e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="Qty"
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                                <select
                                    value={ingredient.unit_imperial ?? ''}
                                    onChange={(e) => updateIngredient(index, 'unit_imperial', e.target.value || null)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="">Unit</option>
                                    <optgroup label="Volume">
                                        {IMPERIAL_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                    </optgroup>
                                    <optgroup label="Count">
                                        {COUNT_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        {/* Metric */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600">
                                {defaultUnit === 'metric' ? 'Quantity (Primary)' : 'Metric (Optional)'}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    step="any"
                                    value={ingredient.qty_metric ?? ''}
                                    onChange={(e) => updateIngredient(index, 'qty_metric', e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="Qty"
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                                <select
                                    value={ingredient.unit_metric ?? ''}
                                    onChange={(e) => updateIngredient(index, 'unit_metric', e.target.value || null)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="">Unit</option>
                                    <optgroup label="Weight/Volume">
                                        {METRIC_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                    </optgroup>
                                    <optgroup label="Count">
                                        {COUNT_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Optional notes */}
                    <input
                        type="text"
                        value={ingredient.notes ?? ''}
                        onChange={(e) => updateIngredient(index, 'notes', e.target.value || null)}
                        placeholder="Notes (optional, e.g., 'finely chopped')"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                </div>
            ))}

            {ingredients.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No ingredients yet. Click "Add Ingredient" to get started.</p>
                </div>
            )}
        </div>
    )
}
