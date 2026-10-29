/**
 * Estilos de escenario separados del resto del juego para poder añadir más
 * escenarios más adelante sin tocar la lógica ni los componentes.
 * Un escenario solo aporta paleta y fondo; nunca cambia reglas.
 */
export interface ScenarioTheme {
  id: string
  name: string
  tagline: string
  /** Fondo decorativo que dibuja la interfaz. */
  backdrop: 'ashen-city'
  palette: {
    skyTop: string
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
