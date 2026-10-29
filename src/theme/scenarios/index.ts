import type { ScenarioTheme } from '../types'
import { ashenCity } from './ashenCity'
import { militaryShelter } from './militaryShelter'
import { postApocalypticDesert } from './postApocalypticDesert'

export const SCENARIOS: Record<string, ScenarioTheme> = {
  [ashenCity.id]: ashenCity,
  [militaryShelter.id]: militaryShelter,
  [postApocalypticDesert.id]: postApocalypticDesert,
}

export const SCENARIO_LIST: ScenarioTheme[] = Object.values(SCENARIOS)
export const DEFAULT_SCENARIO = ashenCity

export function getScenario(id: string): ScenarioTheme {
  return SCENARIOS[id] ?? DEFAULT_SCENARIO
}
