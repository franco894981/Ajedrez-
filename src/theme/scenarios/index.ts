import type { ScenarioTheme } from '../types'
import { ashenCity } from './ashenCity'

export const SCENARIOS: Record<string, ScenarioTheme> = {
  [ashenCity.id]: ashenCity,
}

/** Escenario único de esta primera etapa. */
export const DEFAULT_SCENARIO = ashenCity

export function getScenario(id: string): ScenarioTheme {
  return SCENARIOS[id] ?? DEFAULT_SCENARIO
}
