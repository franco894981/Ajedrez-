export type DifficultyId = 'prototipo' | 'veterano'

export interface DifficultyConfig {
  id: DifficultyId
  label: string
  description: string
  maxDepth: number
  timeBudgetMs: number
  quiescenceDepth: number
}

/** Perfiles compactos para el motor local; Veterano amplía la búsqueda sin cambiar las reglas. */
export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  prototipo: {
    id: 'prototipo',
    label: 'Prototipo',
    description: 'Fácil y rápida; deja más oportunidades.',
    maxDepth: 2,
    timeBudgetMs: 1100,
    quiescenceDepth: 3,
  },
  veterano: {
    id: 'veterano',
    label: 'Veterano',
    description: 'Piensa más lejos y protege mejor sus piezas valiosas.',
    maxDepth: 3,
    timeBudgetMs: 1800,
    quiescenceDepth: 4,
  },
}

export const DIFFICULTY_LIST = Object.values(DIFFICULTIES)
