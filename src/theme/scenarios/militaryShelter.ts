import type { ScenarioTheme } from '../types'

/** Refugio con placas de acero y luces de emergencia discretas. */
export const militaryShelter: ScenarioTheme = {
  id: 'military-shelter',
  name: 'Refugio Militar',
  tagline: 'Alerta roja en el último bastión',
  backdrop: 'military-shelter',
  palette: {
    skyTop: '#0b1117',
    skyMid: '#13191f',
    skyBottom: '#24272b',
    fog: '#29333a',
    lightSquare: '#72797c',
    darkSquare: '#363b3e',
    boardFrame: '#171b1e',
    allyPiece: '#e6e4db',
    allyPieceDark: '#a7a9a2',
    allyWeapon: '#aab3b6',
    enemyPiece: '#464b4e',
    enemyPieceDark: '#24292c',
    enemyWeapon: '#a74948',
    ember: '#f54d4b',
    accent: '#c4d0d2',
  },
}
