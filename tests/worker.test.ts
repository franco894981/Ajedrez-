import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { START_FEN } from '../src/game/engine'
import { AIClient } from '../src/game/ai/aiClient'
import { moveDuration, TRAVEL_MS } from '../src/ui/effects/motion'

interface Posted {
  type: string
  id: number
  result: { move: { from: string; to: string; promotion?: string } | null; depth: number }
}

describe('worker de la IA', () => {
  const posted: Posted[] = []
  let handler: ((event: { data: unknown }) => void) | null = null

  beforeAll(async () => {
    // Simula el contexto de un Web Worker en Node.
    ;(globalThis as unknown as { self: unknown }).self = {
      postMessage: (message: Posted) => posted.push(message),
      onmessage: null as unknown,
    }
    await import('../src/game/ai/ai.worker')
    handler = (globalThis as unknown as { self: { onmessage: (event: { data: unknown }) => void } })
      .self.onmessage
  })

  afterAll(() => {
    delete (globalThis as unknown as { self?: unknown }).self
  })

  it('responde con un movimiento legal a una petición de búsqueda', () => {
    expect(handler).toBeTypeOf('function')
    handler?.({ data: { type: 'search', id: 42, fen: START_FEN, difficulty: 'prototipo', seed: 3 } })

    const response = posted.find((entry) => entry.id === 42)
    expect(response).toBeDefined()
    expect(response?.type).toBe('result')
    expect(response?.result.move).not.toBeNull()

    const chess = new Chess(START_FEN)
    const legal = chess
      .moves({ verbose: true })
      .some(
        (move) =>
          move.from === response?.result.move?.from &&
          move.to === response?.result.move?.to &&
          (!response?.result.move?.promotion || move.promotion === response.result.move.promotion),
      )
    expect(legal).toBe(true)
  })

  it('ignora mensajes que no son de búsqueda', () => {
    const before = posted.length
    handler?.({ data: { type: 'otro' } })
    expect(posted.length).toBe(before)
  })
})

describe('cliente de la IA sin Web Worker (respaldo en el hilo principal)', () => {
  it('devuelve una jugada legal', async () => {
    const client = new AIClient()
    const result = await client.think(START_FEN, 'prototipo', { seed: 5 })
    expect(result.move).not.toBeNull()
    const chess = new Chess(START_FEN)
    expect(
      chess
        .moves({ verbose: true })
        .some((move) => move.from === result.move?.from && move.to === result.move?.to),
    ).toBe(true)
    client.dispose()
  })
})

describe('duración de animaciones', () => {
  it('desliza cada pieza en un intervalo de 0,2 a 0,3 segundos', () => {
    for (const duration of Object.values(TRAVEL_MS)) {
      expect(duration).toBeGreaterThanOrEqual(200)
      expect(duration).toBeLessThanOrEqual(300)
    }
  })

  it('cada captura dura entre medio segundo y un segundo', () => {
    const baseCapture = {
      from: 'e4' as const,
      to: 'd5' as const,
      color: 'w' as const,
      piece: 'p' as const,
      captured: { type: 'p' as const, square: 'd5' as const, id: 1 },
      castling: null,
      enPassant: false,
      san: 'exd5',
      check: false,
      checkmate: false,
    }

    for (const piece of ['p', 'n', 'b', 'r', 'q', 'k'] as const) {
      const duration = moveDuration({ ...baseCapture, piece }, false)
      expect(duration).toBeGreaterThanOrEqual(500)
      expect(duration).toBeLessThanOrEqual(1000)
    }
  })

  it('con animaciones reducidas es más corta y siempre hay espera mínima', () => {
    const pawnCapture = {
      from: 'e4' as const,
      to: 'd5' as const,
      color: 'w' as const,
      piece: 'p' as const,
      captured: { type: 'p' as const, square: 'd5' as const, id: 1 },
      castling: null,
      enPassant: false,
      san: 'exd5',
      check: false,
      checkmate: false,
    }
    expect(moveDuration(pawnCapture, false)).toBeGreaterThan(moveDuration(pawnCapture, true))
    expect(moveDuration(pawnCapture, true)).toBeGreaterThan(0)
  })
})
