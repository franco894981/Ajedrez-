import type { ScenarioTheme } from '../types'

/**
 * Escenario 1: ciudad destruida.
 * Los colores están pensados para que el tablero domine la escena: el fondo es
 * más oscuro y menos saturado que las casillas.
 */
export const ashenCity: ScenarioTheme = {
  id: 'ashen-city',
  name: 'Ciudad de Ceniza',
  tagline: 'Última resistencia entre ruinas',
  backdrop: 'ashen-city',
  palette: {
    skyTop: '#0b0a09',
    skyMid: '#17110e',
    skyBottom: '#241b16',
    fog: '#3a2c22',
    lightSquare: '#6b6156',
    darkSquare: '#332d28',
    boardFrame: '#191614',
    allyPiece: '#ddd5c4',
    allyPieceDark: '#9b9283',
    allyWeapon: '#8d8b85',
    enemyPiece: '#402a24',
    enemyPieceDark: '#241816',
    enemyWeapon: '#b06a3e',
    ember: '#ff8a3d',
    accent: '#f0c47a',
  },
}
