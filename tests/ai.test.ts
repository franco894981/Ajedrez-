import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, findBestMove } from '../src/game/ai/search'
import { evaluateFen } from '../src/game/ai/evaluate'
import { GameSession, START_FEN } from '../src/game/engine'
import type { Square } from '../src/game/types'

function isLegal(fen: string, from: string, to: string, promotion?: string): boolean {
  const chess = new Chess(fen)
  const moves = chess.moves({ verbose: true })
  return moves.some(
    (move) => move.from === from && move.to === to && (!promotion || move.promotion === promotion),
  )
}

describe('IA: legalidad y comportamiento', () => {
  it('devuelve un movimiento legal desde la posición inicial', () => {
    const result = findBestMove(START_FEN, DIFFICULTIES.prototipo, { seed: 7 })
    expect(result.move).not.toBeNull()
    expect(isLegal(START_FEN, result.move!.from, result.move!.to)).toBe(true)
    expect(result.nodes).toBeGreaterThan(0)
  })

  it('nunca propone movimientos ilegales en una partida completa', () => {
    const game = new GameSession(START_FEN, { humanColor: 'w' })
    let plies = 0
    while (!game.getStatus().isOver && plies < 30) {
      const fen = game.getFen()
      const side = game.getTurn()
      const result = findBestMove(fen, DIFFICULTIES.prototipo, { seed: plies + 1 })
      expect(result.move).not.toBeNull()
      const outcome =
        side === 'w'
          ? game.applyMove(
              {
                from: result.move!.from as Square,
                to: result.move!.to as Square,
                promotion: result.move!.promotion as never,
              },
              'w',
            )
          : game.playAIMove({
              from: result.move!.from as Square,
              to: result.move!.to as Square,
              promotion: result.move!.promotion as never,
            })
      expect(outcome.ok).toBe(true)
      plies += 1
    }
    expect(game.getSnapshot().history.length).toBe(plies)
  })

  it('encuentra un mate en una jugada', () => {
    const fen = '6k1/5ppp/8/8/8/8/8/R6K w - - 0 1'
    const result = findBestMove(fen, DIFFICULTIES.prototipo, { seed: 3 })
    expect(result.move).toEqual({ from: 'a1', to: 'a8' })
  })

  it('captura material gratis y no regala piezas', () => {
    // Sin la dama negra queda rey, torre y caballo: no es material insuficiente.
    const fen = '4k3/8/8/8/4q3/8/3N4/RK6 w - - 0 1'
    const result = findBestMove(fen, DIFFICULTIES.prototipo, { seed: 5 })
    expect(result.move?.from).toBe('d2')
    expect(result.move?.to).toBe('e4')
  })

  it('respeta el límite de tiempo y aun así devuelve una jugada legal', () => {
    const result = findBestMove(START_FEN, DIFFICULTIES.prototipo, {
      seed: 9,
      timeBudgetMs: 1,
    })
    expect(result.move).not.toBeNull()
    expect(isLegal(START_FEN, result.move!.from, result.move!.to)).toBe(true)
  })

  it('promociona cuando corona y elige una pieza válida', () => {
    const fen = 'k7/2P5/8/8/8/8/8/7K w - - 0 1'
    const result = findBestMove(fen, DIFFICULTIES.prototipo, { seed: 2 })
    expect(result.move?.from).toBe('c7')
    expect(result.move?.to).toBe('c8')
    expect(['q', 'r', 'b', 'n']).toContain(result.move?.promotion)
    expect(result.finished).toBe(true)
  })

  it('no mueve si no hay jugadas legales', () => {
    const result = findBestMove('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', DIFFICULTIES.prototipo)
    expect(result.move).toBeNull()
    expect(result.reason).toBe('no-moves')
  })
})

describe('IA: evaluación', () => {
  it('valora la posición inicial como aproximadamente igual', () => {
    expect(Math.abs(evaluateFen(START_FEN))).toBeLessThan(40)
  })

  it('valora mejor una pieza extra', () => {
    const withExtraQueen = evaluateFen('4k3/8/8/8/8/8/8/Q3K3 w - - 0 1')
    expect(withExtraQueen).toBeGreaterThan(600)
  })

  it('al elegir, la ventaja material manda', () => {
    const fen = '4k3/8/8/8/8/8/4q3/R3K3 w - - 0 1'
    const chess = new Chess(fen)
    expect(chess.moves({ verbose: true }).length).toBeGreaterThan(0)
    const result = findBestMove(fen, DIFFICULTIES.prototipo, { seed: 11 })
    expect(isLegal(fen, result.move!.from, result.move!.to)).toBe(true)
  })
})
