/**
 * Evaluación estática para la IA local.
 * Devuelve una puntuación en centipeones desde el punto de vista de las blancas
 * (positivo = mejor para blancas).
 *
 * Incluye: material, tablas de posición (desarrollo, centro, avance de peones),
 * seguridad del rey (escudo de peones y rey expuesto), pareja de alfiles,
 * peones doblados/aislados y amenazas inmediatas sencillas.
 */
import { Chess } from 'chess.js'
import type { Color, PieceType } from '../types'

export const PIECE_VALUE: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
}

// Tablas desde la perspectiva de las blancas, fila 0 = rango 8.
// Basadas en valores posicionales clásicos de dominio público (estilo "Simplified Evaluation").
const PAWN_TABLE = [
  0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10,
  25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10,
  10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
]

const KNIGHT_TABLE = [
  -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0,
  -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5,
  -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
]

const BISHOP_TABLE = [
  -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10,
  -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10,
  -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
]

const ROOK_TABLE = [
  0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0,
  0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5,
  5, 0, 0, 0,
]

const QUEEN_TABLE = [
  -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5,
  0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0,
  -10, -20, -10, -10, -5, -5, -10, -10, -20,
]

const KING_MIDDLE_TABLE = [
  -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40,
  -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30,
  -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0,
  10, 30, 20,
]

const KING_END_TABLE = [
  -50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30,
  20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10,
  20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50,
]

/** Convierte una casilla tipo 'e4' en índice 0..63 desde la perspectiva blanca. */
export function squareIndex(square: string): number {
  const file = square.charCodeAt(0) - 97
  const rank = Number.parseInt(square[1], 10)
  return (8 - rank) * 8 + file
}

function tableValue(table: number[], square: string, color: Color): number {
  const index = squareIndex(square)
  return color === 'w' ? table[index] : table[63 - index]
}

export interface EvalBreakdown {
  material: number
  position: number
  kingSafety: number
  threats: number
  total: number
}

export function evaluatePosition(chess: Chess): EvalBreakdown {
  const board = chess.board()
  const piecesList: { type: string; color: Color; square: string }[] = []
  const material: Record<Color, number> = { w: 0, b: 0 }
  const bishops: Record<Color, number> = { w: 0, b: 0 }
  const pawnFiles: Record<Color, number[]> = { w: Array(8).fill(0), b: Array(8).fill(0) }
  const pawnSquares: Record<Color, string[]> = { w: [], b: [] }
  const kings: Record<Color, { square: string; file: number; rank: number } | null> = {
    w: null,
    b: null,
  }
  let positional = 0
  let totalMaterial = 0

  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue
      const { color, type, square } = cell
      piecesList.push({ type, color, square })
      const value = PIECE_VALUE[type as PieceType]
      material[color] += value
      totalMaterial += value
      if (type === 'b') bishops[color] += 1
      if (type === 'p') {
        const file = square.charCodeAt(0) - 97
        pawnFiles[color][file] += 1
        pawnSquares[color].push(square)
      }
      if (type === 'k') {
        kings[color] = {
          square,
          file: square.charCodeAt(0) - 97,
          rank: Number.parseInt(square[1], 10),
        }
      }

      let pst = 0
      switch (type) {
        case 'p':
          pst = tableValue(PAWN_TABLE, square, color)
          break
        case 'n':
          pst = tableValue(KNIGHT_TABLE, square, color)
          break
        case 'b':
          pst = tableValue(BISHOP_TABLE, square, color)
          break
        case 'r':
          pst = tableValue(ROOK_TABLE, square, color)
          break
        case 'q':
          pst = tableValue(QUEEN_TABLE, square, color)
          break
        case 'k':
          pst = tableValue(
            totalMaterial > 2800 ? KING_MIDDLE_TABLE : KING_END_TABLE,
            square,
            color,
          )
          break
      }
      positional += color === 'w' ? pst : -pst
    }
  }

  const sign = (color: Color) => (color === 'w' ? 1 : -1)

  // Pareja de alfiles
  for (const color of ['w', 'b'] as const) {
    if (bishops[color] >= 2) positional += sign(color) * 30
  }

  // Peones doblados y aislados
  for (const color of ['w', 'b'] as const) {
    for (let file = 0; file < 8; file += 1) {
      const count = pawnFiles[color][file]
      if (count > 1) positional -= sign(color) * 15 * (count - 1)
      if (count > 0) {
        const left = file > 0 ? pawnFiles[color][file - 1] : 0
        const right = file < 7 ? pawnFiles[color][file + 1] : 0
        if (left === 0 && right === 0) positional -= sign(color) * 12
      }
    }
  }

  // Seguridad del rey y amenazas inmediatas
  let kingSafety = 0
  let threats = 0

  for (const color of ['w', 'b'] as const) {
    const enemy: Color = color === 'w' ? 'b' : 'w'
    const king = kings[color]
    if (!king) continue
    const forward = color === 'w' ? 1 : -1
    let shield = 0
    for (let dx = -1; dx <= 1; dx += 1) {
      const file = king.file + dx
      const rank = king.rank + forward
      if (file < 0 || file > 7 || rank < 1 || rank > 8) continue
      const square = `${String.fromCharCode(97 + file)}${rank}`
      if (chess.get(square as never)) {
        const piece = chess.get(square as never)
        if (piece && piece.color === color && piece.type === 'p') shield += 1
      }
    }
    // Escudo completo vale ~ +20; sin escudo y rey adelantado, penaliza.
    let safety = shield * 8
    const homeRank = color === 'w' ? 1 : 8
    if (king.rank !== homeRank) safety -= 16
    if (king.file >= 3 && king.file <= 4 && totalMaterial > 2800) safety -= 12
    kingSafety += sign(color) * safety

    // Amenazas: piezas enemigas valiosas atacadas por nosotros (y nuestras
    // piezas valiosas atacadas por el rival). Es una aproximación barata de
    // "amenazas inmediatas", no una búsqueda de capturas.
    for (const cell of piecesList) {
      if (cell.color !== enemy) continue
      if (cell.type === 'p' || cell.type === 'k') continue
      const value = PIECE_VALUE[cell.type as PieceType]
      if (value < 320) continue
      if (chess.isAttacked(cell.square as never, color)) {
        threats += sign(color) * (cell.type === 'q' ? 45 : 22)
      }
      if (chess.isAttacked(cell.square as never, enemy)) {
        threats -= sign(color) * (cell.type === 'q' ? 30 : 15)
      }
    }
  }

  const materialScore = material.w - material.b
  const total = materialScore * 1 + positional + kingSafety + threats
  return { material: materialScore, position: positional, kingSafety, threats, total }
}

export function evaluateFen(fen: string): number {
  return evaluatePosition(new Chess(fen)).total
}
