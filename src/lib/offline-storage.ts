import { openDB, DBSchema } from 'idb'
import type { RecipeWithDetails, Ingredient, Instruction, CookingNote } from '@/types/database'

interface OfflineRecipe extends RecipeWithDetails {
    ingredients: Ingredient[]
    instructions: Instruction[]
    notes: CookingNote[]
    savedAt: number
}

interface RecipeDB extends DBSchema {
    recipes: {
        key: string
        value: OfflineRecipe
        indexes: { 'by-title': string }
    }
}

const DB_NAME = 'recipe-box-offline'
const STORE_NAME = 'recipes'

export async function initDB() {
    return openDB<RecipeDB>(DB_NAME, 1, {
        upgrade(db) {
            const store = db.createObjectStore(STORE_NAME, {
                keyPath: 'id',
            })
            store.createIndex('by-title', 'title')
        },
    })
}

export async function saveRecipeOffline(
    recipe: RecipeWithDetails,
    ingredients: Ingredient[],
    instructions: Instruction[],
    notes: CookingNote[] = []
) {
    const db = await initDB()
    await db.put(STORE_NAME, {
        ...recipe,
        ingredients,
        instructions,
        notes,
        savedAt: Date.now(),
    })
}

export async function getOfflineRecipe(id: string) {
    const db = await initDB()
    return db.get(STORE_NAME, id)
}

export async function removeOfflineRecipe(id: string) {
    const db = await initDB()
    await db.delete(STORE_NAME, id)
}

export async function getAllOfflineRecipes() {
    const db = await initDB()
    return db.getAllFromIndex(STORE_NAME, 'by-title')
}

export async function isRecipeOffline(id: string) {
    const db = await initDB()
    const recipe = await db.get(STORE_NAME, id)
    return !!recipe
}
