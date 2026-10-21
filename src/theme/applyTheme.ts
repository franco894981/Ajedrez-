import type { ScenarioTheme } from './types'

/**
 * Vuelca la paleta del escenario en variables CSS del documento.
 * Así los componentes solo usan var(--...) y se pueden añadir escenarios
 * futuros sin tocar el CSS.
 */
export function applyTheme(theme: ScenarioTheme, root: HTMLElement = document.documentElement): void {
  const p = theme.palette
  const vars: Record<string, string> = {
    '--sky-top': p.skyTop,
    '--sky-bottom': p.skyBottom,
    '--fog': p.fog,
    '--sq-light': p.lightSquare,
    '--sq-dark': p.darkSquare,
    '--board-frame': p.boardFrame,
    '--ally-piece': p.allyPiece,
    '--ally-piece-dark': p.allyPieceDark,
    '--ally-weapon': p.allyWeapon,
    '--enemy-piece': p.enemyPiece,
    '--enemy-piece-dark': p.enemyPieceDark,
    '--enemy-weapon': p.enemyWeapon,
    '--ember': p.ember,
    '--accent': p.accent,
  }
  for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value)
}
