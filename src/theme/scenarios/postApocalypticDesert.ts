import type { ScenarioTheme } from '../types'

/** Horizonte ocre y polvo en suspensión; el tablero conserva contraste. */
export const postApocalypticDesert: ScenarioTheme = {
  id: 'post-apocalyptic-desert',
  name: 'Desierto Postapocalíptico',
  tagline: 'Una tormenta cubre el horizonte',
  backdrop: 'post-apocalyptic-desert',
  palette: {
    skyTop: '#21170f',
    skyMid: '#362519',
    skyBottom: '#65452c',
    fog: '#735437',
    lightSquare: '#88745d',
    darkSquare: '#49382a',
    boardFrame: '#211910',
    allyPiece: '#f1e2c7',
    allyPieceDark: '#b8a487',
    allyWeapon: '#9f8c70',
    enemyPiece: '#563824',
    enemyPieceDark: '#2b1b13',
    enemyWeapon: '#c67c42',
    ember: '#f69a42',
    accent: '#e2bb83',
  },
}
