import type { Color } from '../game/types'

/**
 * Paletas de las piezas. Se aplican como atributos del propio SVG (no solo
 * como CSS) para que el arte se vea igual en cualquier navegador y también al
 * exportar imágenes de previsualización.
 *
 * Los aliados (blancas) son marfil de ceniza con acero; los rivales (negras)
 * metal ennegrecido con óxido y brasas. El contraste no depende solo del color:
 * también cambian las formas de los remates y las armas.
 */
export interface PiecePalette {
  body: string
  bodyDark: string
  edge: string
  weapon: string
  weaponDark: string
  accent: string
  glow: string
}

export const ALLY_PALETTE: PiecePalette = {
  body: '#ddd5c4',
  bodyDark: '#9b9283',
  edge: '#15110d',
  weapon: '#8d8b85',
  weaponDark: '#3b3a36',
  accent: '#cbb083',
  glow: '#ffe1b0',
}

export const ENEMY_PALETTE: PiecePalette = {
  body: '#4b3026',
  bodyDark: '#261814',
  edge: '#080505',
  weapon: '#b06a3e',
  weaponDark: '#4a2418',
  accent: '#ff7a35',
  glow: '#ff5a24',
}

export function paletteFor(color: Color): PiecePalette {
  return color === 'w' ? ALLY_PALETTE : ENEMY_PALETTE
}
