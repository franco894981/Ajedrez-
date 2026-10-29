/**
 * Búsqueda de la IA local: negamax con poda alfa-beta, ordenación de jugadas,
 * búsqueda de capturas (quiescence) y profundización iterativa con límite de
 * tiempo. Todos los movimientos salen de `chess.js`, por lo que son legales por
 * construcción.
 *
 * "Prototipo" usa profundidad 2 y "Veterano" profundiza hasta 3; ambos perfiles
 * comparten el mismo motor y evaluación, con presupuesto de tiempo acotado.
 * Ninguno tiene tablas de aperturas o finales, ni evaluación medida con partidas.
 */
import { Chess, type Move } from 'chess.js'
import { evaluatePosition, PIECE_VALUE } from './evaluate'
import { DIFFICULTIES } from './difficulty'
import type { DifficultyConfig } from './difficulty'

export { DIFFICULTIES } from './difficulty'
export type { DifficultyConfig, DifficultyId } from './difficulty'

export interface AIMove {
  from: string
  to: string
  promotion?: string
}

export interface SearchResult {
  move: AIMove | null
  score: number
  depth: number
  nodes: number
  elapsedMs: number
  finished: boolean
  reason?: 'no-moves' | 'time'
}

const MATE_SCORE = 100000

class SearchTimeout extends Error {}

interface SearchState {
  nodes: number
  deadline: number
  quiescenceDepth: number
}

function checkTime(state: SearchState): void {
  state.nodes += 1
  if ((state.nodes & 511) === 0 && Date.now() > state.deadline) {
    throw new SearchTimeout('time')
  }
}

function moveOrderScore(move: Move): number {
  let score = 0
  if (move.captured) {
    score += 1000 + PIECE_VALUE[move.captured as keyof typeof PIECE_VALUE] - PIECE_VALUE[move.piece as keyof typeof PIECE_VALUE] / 10
  }
  if (move.promotion) score += 800
  if (move.san.includes('#')) score += 500
  else if (move.san.includes('+')) score += 120
  if (move.isKingsideCastle() || move.isQueensideCastle()) score += 40
  return score
}

function orderedMoves(chess: Chess): Move[] {
  const moves = chess.moves({ verbose: true })
  return moves.sort((a, b) => moveOrderScore(b) - moveOrderScore(a))
}

function evaluateForSideToMove(chess: Chess): number {
  const score = evaluatePosition(chess).total
  return chess.turn() === 'w' ? score : -score
}

function quiescence(chess: Chess, alpha: number, beta: number, depth: number, state: SearchState): number {
  checkTime(state)
  const standPat = evaluateForSideToMove(chess)
  if (depth <= 0) return standPat
  if (standPat >= beta) return beta
  let best = alpha > standPat ? alpha : standPat

  const captures = chess
    .moves({ verbose: true })
    .filter((move) => move.isCapture() || move.isPromotion())
    .sort((a, b) => moveOrderScore(b) - moveOrderScore(a))

  for (const move of captures) {
    chess.move(move)
    const score = -quiescence(chess, -beta, -best, depth - 1, state)
    chess.undo()
    if (score >= beta) return beta
    if (score > best) best = score
  }
  return best
}

function negamax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  state: SearchState,
): number {
  checkTime(state)

  if (chess.isCheckmate()) return -MATE_SCORE + ply
  if (chess.isDraw() || chess.isStalemate()) return 0
  if (depth <= 0) return quiescence(chess, alpha, beta, state.quiescenceDepth, state)

  let best = -Infinity
  for (const move of orderedMoves(chess)) {
    chess.move(move)
    const score = -negamax(chess, depth - 1, -beta, -alpha, ply + 1, state)
    chess.undo()
    if (score > best) best = score
    if (best > alpha) alpha = best
    if (alpha >= beta) break
  }
  return best
}

/** Generador pseudoaleatorio determinista (xorshift32) para variar partidas. */
export function createRng(seed: number): () => number {
  let state = seed || 0x9e3779b9
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 1_000_000) / 1_000_000
  }
}

export function findBestMove(
  fen: string,
  config: DifficultyConfig = DIFFICULTIES.prototipo,
  options: { seed?: number; timeBudgetMs?: number; now?: () => number } = {},
): SearchResult {
  const now = options.now ?? (() => Date.now())
  const startedAt = now()
  const chess = new Chess(fen)
  const rootMoves = orderedMoves(chess)
  if (rootMoves.length === 0) {
    return { move: null, score: 0, depth: 0, nodes: 0, elapsedMs: 0, finished: true, reason: 'no-moves' }
  }

  const budget = options.timeBudgetMs ?? config.timeBudgetMs
  const state: SearchState = {
    nodes: 0,
    deadline: startedAt + budget,
    quiescenceDepth: config.quiescenceDepth,
  }
  const rng = createRng(options.seed ?? 12345)

  let bestMove: Move = rootMoves[0]
  let bestScore = -Infinity
  let completedDepth = 0
  let finished = true

  let rootOrder = rootMoves
  for (let depth = 1; depth <= config.maxDepth; depth += 1) {
    try {
      // Puntuaciones exactas solo para las jugadas que pueden ser la mejor.
      // Las que fallan contra alfa devuelven una cota y se descartan.
      const exactScores: { move: Move; score: number }[] = []
      let bestForDepth = -Infinity
      let candidates: Move[] = []

      for (const move of rootOrder) {
        chess.move(move)
        let score: number
        let exact = false
        if (candidates.length === 0) {
          score = -negamax(chess, depth - 1, -Infinity, Infinity, 1, state)
          exact = true
        } else {
          score = -negamax(chess, depth - 1, -Infinity, -bestForDepth, 1, state)
          if (score > bestForDepth) {
            // Nueva mejor jugada: repetimos con ventana completa para tener
            // una puntuación exacta y poder desempatar.
            score = -negamax(chess, depth - 1, -Infinity, Infinity, 1, state)
            exact = true
          }
        }
        chess.undo()
        if (!exact) continue
        exactScores.push({ move, score })
        if (score > bestForDepth) {
          bestForDepth = score
          candidates = [move]
        } else if (score === bestForDepth) {
          candidates.push(move)
        }
      }

      if (candidates.length > 0) {
        // Desempate aleatorio entre jugadas exactamente equivalentes.
        bestMove = candidates[Math.floor(rng() * candidates.length)] ?? candidates[0]
        bestScore = bestForDepth
      }
      completedDepth = depth
      // Reordena para la siguiente iteración (mejores primero).
      exactScores.sort((a, b) => b.score - a.score)
      const orderedExact = exactScores.map((entry) => entry.move)
      const rest = rootOrder.filter((move) => !orderedExact.includes(move))
      rootOrder = [...orderedExact, ...rest]
      if (Math.abs(bestScore) > MATE_SCORE - 100) break
    } catch (error) {
      if (error instanceof SearchTimeout) {
        finished = false
        break
      }
      throw error
    }
  }

  return {
    move: {
      from: bestMove.from,
      to: bestMove.to,
      ...(bestMove.promotion ? { promotion: bestMove.promotion } : {}),
    },
    score: bestScore,
    depth: completedDepth,
    nodes: state.nodes,
    elapsedMs: Math.max(0, now() - startedAt),
    finished,
    ...(finished ? {} : { reason: 'time' as const }),
  }
}
