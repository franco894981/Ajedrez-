import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SCENARIO, SCENARIO_LIST } from '../theme/scenarios'
import { DIFFICULTIES } from '../game/ai/difficulty'
import type { DifficultyId } from '../game/ai/difficulty'

export interface Settings {
  reducedMotion: boolean
  music: boolean
  sfx: boolean
  difficulty: DifficultyId
  scenarioId: string
}

const STORAGE_KEY = 'tlc.settings.v1'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function loadSettings(): Settings {
  const defaults: Settings = {
    reducedMotion: prefersReducedMotion(),
    music: true,
    sfx: true,
    difficulty: 'prototipo',
    scenarioId: DEFAULT_SCENARIO.id,
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<Settings>
    const difficulty =
      typeof parsed.difficulty === 'string' && Object.hasOwn(DIFFICULTIES, parsed.difficulty)
        ? (parsed.difficulty as DifficultyId)
        : defaults.difficulty
    const scenarioId =
      typeof parsed.scenarioId === 'string' && SCENARIO_LIST.some(({ id }) => id === parsed.scenarioId)
        ? parsed.scenarioId
        : defaults.scenarioId
    return {
      reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : defaults.reducedMotion,
      music: typeof parsed.music === 'boolean' ? parsed.music : true,
      sfx: typeof parsed.sfx === 'boolean' ? parsed.sfx : true,
      difficulty,
      scenarioId,
    }
  } catch {
    return defaults
  }
}

export function saveSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* modo privado o almacenamiento lleno: no es crítico */
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())

  useEffect(() => {
    saveSettings(settings)
    document.documentElement.dataset.reducedMotion = settings.reducedMotion ? 'true' : 'false'
  }, [settings])

  const toggleMusic = useCallback(() => {
    setSettings((current) => ({ ...current, music: !current.music }))
  }, [])

  const toggleSfx = useCallback(() => {
    setSettings((current) => ({ ...current, sfx: !current.sfx }))
  }, [])

  const toggleReducedMotion = useCallback(() => {
    setSettings((current) => ({ ...current, reducedMotion: !current.reducedMotion }))
  }, [])

  const selectDifficulty = useCallback((difficulty: DifficultyId) => {
    setSettings((current) => ({ ...current, difficulty }))
  }, [])

  const selectScenario = useCallback((scenarioId: string) => {
    setSettings((current) => ({ ...current, scenarioId }))
  }, [])

  return { settings, toggleMusic, toggleSfx, toggleReducedMotion, selectDifficulty, selectScenario }
}
