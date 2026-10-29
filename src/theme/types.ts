/**
 * Estilos de escenario separados del resto del juego.
 * Un escenario aporta una paleta y un fondo decorativo: nunca cambia reglas.
 */
export interface ScenarioTheme {
  id: string
  name: string
  tagline: string
  /** Variante del fondo CSS correspondiente al escenario. */
  backdrop: 'ashen-city' | 'military-shelter' | 'post-apocalyptic-desert'
  palette: {
    skyTop: string
    skyMid: string
    skyBottom: string
    fog: string
    lightSquare: string
    darkSquare: string
    boardFrame: string
    allyPiece: string
    allyPieceDark: string
    allyWeapon: string
    enemyPiece: string
    enemyPieceDark: string
    enemyWeapon: string
    ember: string
    accent: string
  }
}
