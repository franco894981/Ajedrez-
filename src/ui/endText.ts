import type { Color, GameEnd } from '../game/types'

export type EndTone = 'win' | 'loss' | 'draw'

export interface EndDescription {
  title: string
  detail: string
  tone: EndTone
  reasonLabel: string
}

/**
 * Textos de resultado en español. Distingue condiciones automáticas de tablas
 * reclamadas por el jugador.
 */
export function describeEnd(end: GameEnd, humanColor: Color): EndDescription {
  const won = end.winner === humanColor
  const reasonLabel = (() => {
    switch (end.reason) {
      case 'checkmate':
        return 'Jaque mate'
      case 'stalemate':
        return 'Ahogado'
      case 'insufficient-material':
        return 'Material insuficiente'
      case 'seventy-five-move':
        return 'Regla de 75 movimientos'
      case 'fivefold-repetition':
        return 'Repetición quíntuple'
      case 'claim-threefold':
        return 'Tablas reclamadas · triple repetición'
      case 'claim-fifty-move':
        return 'Tablas reclamadas · 50 movimientos'
      default:
        return 'Tablas'
    }
  })()

  if (end.reason === 'checkmate') {
    return {
      title: won ? 'Victoria' : 'Derrota',
      detail: won
        ? 'Jaque mate. El rey rival ha caído y la ciudad sigue en pie.'
        : 'Jaque mate. Tu rey ha caído; las cenizas cubren el tablero.',
      tone: won ? 'win' : 'loss',
      reasonLabel,
    }
  }

  const detail = (() => {
    switch (end.reason) {
      case 'stalemate':
        return 'Ahogado: el rey no está en jaque, pero no queda ninguna jugada legal.'
      case 'insufficient-material':
        return 'No queda material suficiente para dar jaque mate.'
      case 'seventy-five-move':
        return 'Condición automática: 75 jugadas seguidas sin peones ni capturas.'
      case 'fivefold-repetition':
        return 'Condición automática: la misma posición se repitió cinco veces.'
      case 'claim-threefold':
        return 'Has reclamado las tablas por triple repetición.'
      case 'claim-fifty-move':
        return 'Has reclamado las tablas por la regla de 50 movimientos.'
      default:
        return 'La partida termina en tablas.'
    }
  })()

  return { title: 'Tablas', detail, tone: 'draw', reasonLabel }
}

export const SCORE_LABEL: Record<string, string> = {
  '1-0': 'Blancas ganan',
  '0-1': 'Negras ganan',
  '1/2-1/2': 'Tablas',
}
