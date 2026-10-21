/**
 * Tipos compartidos por la lógica de ajedrez, la interfaz y la IA.
 * Este archivo no depende de React ni del DOM.
 */

export type Color = 'w' | 'b'
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
export type File = (typeof FILES)[number]
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
export type Square = `${File}${Rank}`

export const ALL_SQUARES: Square[] = (() => {
  const list: Square[] = []
  for (const rank of ['8', '7', '6', '5', '4', '3', '2', '1'] as const) {
    for (const file of FILES) list.push(`${file}${rank}` as Square)
  }
  return list
})()

export interface PieceOnBoard {
  /** Identificador estable mientras la pieza exista; permite animar el mismo nodo. */
  id: number
  type: PieceType
  color: Color
  square: Square
}

export type GameResult = '1-0' | '0-1' | '1/2-1/2'

export type EndReason =
  | 'checkmate'
  | 'stalemate'
  | 'insufficient-material'
  | 'seventy-five-move'
  | 'fivefold-repetition'
  | 'claim-threefold'
  | 'claim-fifty-move'
  | 'claimed-draw'

export interface ClaimableDraws {
  threefoldRepetition: boolean
  fiftyMoveRule: boolean
}

export interface GameEnd {
  result: GameResult
  reason: EndReason
  winner: Color | null
  /** true = condición automática; false = tablas reclamadas por el jugador. */
  automatic: boolean
}

export interface GameStatus {
  turn: Color
  inCheck: boolean
  isOver: boolean
  end: GameEnd | null
  halfmoveClock: number
  /** Tablas que la biblioteca no cierra solas y el jugador puede reclamar. */
  claimable: ClaimableDraws
  moveNumber: number
}

export interface PendingPromotion {
  from: Square
  to: Square
  color: Color
  /** Piezas entre las que se puede elegir (la dama siempre está primero). */
  choices: PieceType[]
}

export interface LegalTarget {
  square: Square
  capture: boolean
  enPassant: boolean
  castling: 'k' | 'q' | null
  promotion: boolean
}

export interface MoveInput {
  from: Square
  to: Square
  promotion?: PieceType
}

export interface MoveOutcome {
  ok: boolean
  error?: MoveError
  move?: AppliedMove
}

export type MoveError =
  | 'game-over'
  | 'not-your-turn'
  | 'no-piece'
  | 'opponent-piece'
  | 'illegal-move'
  | 'promotion-required'

export interface AppliedMove {
  from: Square
  to: Square
  color: Color
  piece: PieceType
  captured?: { type: PieceType; square: Square; id: number }
  promotion?: PieceType
  castling: 'k' | 'q' | null
  enPassant: boolean
  san: string
  check: boolean
  checkmate: boolean
}

export interface PieceMotion {
  pieceId: number
  from: Square
  to: Square
  pieceType: PieceType
  color: Color
  captured: boolean
  capturedPieceType: PieceType | null
  castling: 'k' | 'q' | null
  enPassant: boolean
}

export interface GameSnapshot {
  fen: string
  pieces: PieceOnBoard[]
  status: GameStatus
  selected: Square | null
  legalTargets: LegalTarget[]
  lastMove: { from: Square; to: Square } | null
  history: string[]
  pendingPromotion: PendingPromotion | null
  motion: PieceMotion | null
  /** Incrementa con cada acción para que la interfaz pueda reaccionar. */
  revision: number
}
