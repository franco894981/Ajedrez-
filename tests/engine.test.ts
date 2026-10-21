import { describe, expect, it } from 'vitest'
import { GameSession, START_FEN } from '../src/game/engine'
import type { Square } from '../src/game/types'

function newGame(fen: string = START_FEN) {
  return new GameSession(fen, { humanColor: 'w' })
}

function tapMany(session: GameSession, squares: string[]): boolean {
  let changed = false
  for (const square of squares) {
    changed = session.tapSquare(square as Square) || changed
  }
  return changed
}

describe('posición inicial y turnos', () => {
  it('empieza con 32 piezas y blancas al turno', () => {
    const game = newGame()
    const snapshot = game.getSnapshot()
    expect(snapshot.pieces).toHaveLength(32)
    expect(snapshot.status.turn).toBe('w')
    expect(snapshot.status.isOver).toBe(false)
    expect(game.getFen()).toBe(START_FEN)
  })

  it('alterna turnos tras un movimiento legal', () => {
    const game = newGame()
    expect(tapMany(game, ['e2', 'e4'])).toBe(true)
    expect(game.getTurn()).toBe('b')
    expect(game.getSnapshot().history).toEqual(['e4'])
  })

  it('no permite mover piezas rivales', () => {
    const game = newGame()
    expect(tapMany(game, ['e7', 'e5'])).toBe(false)
    expect(game.getTurn()).toBe('w')
    expect(game.getFen()).toBe(START_FEN)
  })

  it('no permite mover con la IA cuando no es su turno', () => {
    const game = newGame()
    const result = game.playAIMove({ from: 'e7', to: 'e5' })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('not-your-turn')
    expect(game.getFen()).toBe(START_FEN)
  })

  it('rechaza jugadas ilegales de la IA', () => {
    const game = newGame()
    tapMany(game, ['e2', 'e4'])
    expect(game.playAIMove({ from: 'e7', to: 'e4' }).ok).toBe(false)
    expect(game.getTurn()).toBe('b')
  })
})

describe('selección táctil', () => {
  it('muestra movimientos legales y distingue capturas', () => {
    const game = newGame('4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1')
    game.tapSquare('e4')
    const snapshot = game.getSnapshot()
    expect(snapshot.selected).toBe('e4')
    const targets = snapshot.legalTargets.map((target) => target.square)
    expect(targets).toContain('e5')
    expect(targets).toContain('d5')
    expect(snapshot.legalTargets.find((target) => target.square === 'd5')?.capture).toBe(true)
  })

  it('cambiar a otra pieza propia cambia la selección', () => {
    const game = newGame()
    game.tapSquare('e2')
    game.tapSquare('d2')
    expect(game.getSnapshot().selected).toBe('d2')
  })

  it('tocar de nuevo la misma pieza deselecciona', () => {
    const game = newGame()
    game.tapSquare('g1')
    game.tapSquare('g1')
    expect(game.getSnapshot().selected).toBeNull()
    expect(game.getSnapshot().legalTargets).toHaveLength(0)
  })

  it('bloquea nuevas acciones durante la resolución de un movimiento', () => {
    const game = newGame()
    game.tapSquare('e2')
    game.setLocked(true)
    expect(game.tapSquare('e4')).toBe(false)
    expect(game.getFen()).toBe(START_FEN)
    game.setLocked(false)
    expect(game.tapSquare('e4')).toBe(true)
    expect(game.getTurn()).toBe('b')
  })

  it('un mismo destino no se puede jugar dos veces (sin duplicados)', () => {
    const game = newGame()
    game.tapSquare('e2')
    expect(game.tapSquare('e4')).toBe(true)
    // La segunda vez ya no hay selección ni es turno de blancas.
    expect(game.tapSquare('e4')).toBe(false)
    expect(game.getSnapshot().history).toEqual(['e4'])
  })
})

describe('jaque y jaque mate', () => {
  it('detecta el jaque y lo expone en el estado', () => {
    const game = newGame('4k3/8/8/8/8/8/8/4K2R w - - 0 1')
    expect(game.applyMove({ from: 'h1', to: 'h8' }, 'w').ok).toBe(true)
    const status = game.getStatus()
    expect(status.inCheck).toBe(true)
    expect(status.isOver).toBe(false)
  })

  it('prohíbe mover una pieza clavada que deja el rey en jaque', () => {
    const game = newGame('4k3/8/8/8/8/4r3/4N3/4K3 w - - 0 1')
    // El caballo de e2 está clavado por la torre negra de e3 contra el rey de e1.
    game.tapSquare('e2')
    expect(game.getSnapshot().legalTargets).toHaveLength(0)
    // Tocar la torre solo deselecciona: no se produce ninguna captura.
    game.tapSquare('e3')
    expect(game.getSnapshot().selected).toBeNull()
    expect(game.getFen()).toBe('4k3/8/8/8/8/4r3/4N3/4K3 w - - 0 1')
  })

  it('rechaza cualquier jugada que deje al rey en jaque', () => {
    // Las torres negras controlan la columna d y la fila 2: solo f1 es segura.
    const game = newGame('3rk3/8/8/8/8/8/3r4/4K3 w - - 0 1')
    expect(game.tapSquare('e1')).toBe(true)
    const targets = game.getSnapshot().legalTargets.map((target) => target.square)
    expect(targets).toEqual(['f1'])
    game.tapSquare('e2')
    expect(game.getTurn()).toBe('w')
    expect(game.getFen()).toBe('3rk3/8/8/8/8/8/3r4/4K3 w - - 0 1')
  })

  it('el jaque mate termina la partida y no captura al rey', () => {
    const game = newGame('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3')
    const status = game.getStatus()
    expect(status.inCheck).toBe(true)
    expect(status.isOver).toBe(true)
    expect(status.end?.reason).toBe('checkmate')
    expect(status.end?.winner).toBe('b')
    expect(status.end?.result).toBe('0-1')
    const king = game.getSnapshot().pieces.find((piece) => piece.type === 'k' && piece.color === 'w')
    expect(king).toBeDefined()
  })
})

describe('movimientos especiales', () => {
  it('permite el enroque corto y mueve también la torre', () => {
    const game = newGame('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')
    const snapshot = game.getSnapshot()
    expect(snapshot.legalTargets).toHaveLength(0)
    game.tapSquare('e1')
    const targets = game.getSnapshot().legalTargets.map((target) => target.square)
    expect(targets).toEqual(expect.arrayContaining(['g1', 'c1']))
    game.tapSquare('g1')
    const pieces = game.getSnapshot().pieces
    expect(pieces.find((piece) => piece.type === 'k' && piece.color === 'w')?.square).toBe('g1')
    expect(pieces.find((piece) => piece.square === 'f1')?.type).toBe('r')
  })

  it('no permite enrocar a través de una casilla atacada', () => {
    const game = newGame('r3k2r/8/8/8/8/8/6q1/R3K2R w KQkq - 0 1')
    game.tapSquare('e1')
    const targets = game.getSnapshot().legalTargets.map((target) => target.square)
    expect(targets).not.toContain('g1')
    expect(targets).toContain('c1')
  })

  it('realiza captura al paso y retira el peón capturado', () => {
    const game = newGame('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2')
    game.tapSquare('e5')
    const target = game.getSnapshot().legalTargets.find((item) => item.square === 'd6')
    expect(target?.enPassant).toBe(true)
    game.tapSquare('d6')
    const pieces = game.getSnapshot().pieces
    expect(pieces.find((piece) => piece.square === 'd6' && piece.type === 'p')?.color).toBe('w')
    expect(pieces.find((piece) => piece.square === 'd5')).toBeUndefined()
    expect(game.getSnapshot().history).toEqual(['exd6'])
  })

  it('exige elegir pieza al promocionar y respeta la elección', () => {
    const game = newGame('4k3/P7/8/8/8/8/8/4K3 w - - 0 1')
    game.tapSquare('a7')
    expect(game.tapSquare('a8')).toBe(true)
    const pending = game.getSnapshot().pendingPromotion
    expect(pending).not.toBeNull()
    expect(pending?.choices).toEqual(['q', 'r', 'b', 'n'])
    // Con la promoción pendiente no se aceptan más toques.
    expect(game.tapSquare('e1')).toBe(false)
    const outcome = game.choosePromotion('n')
    expect(outcome.ok).toBe(true)
    expect(outcome.move?.promotion).toBe('n')
    const pieces = game.getSnapshot().pieces
    expect(pieces.find((piece) => piece.square === 'a8')?.type).toBe('n')
  })

  it('produce dama cuando se elige dama', () => {
    const game = newGame('4k3/P7/8/8/8/8/8/4K3 w - - 0 1')
    expect(game.applyMove({ from: 'a7', to: 'a8', promotion: 'q' }, 'w').ok).toBe(true)
    expect(game.getSnapshot().pieces.find((piece) => piece.square === 'a8')?.type).toBe('q')
  })
})

describe('final de partida', () => {
  it('distingue ahogado de jaque mate', () => {
    const stalemate = newGame('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')
    const stalemateStatus = stalemate.getStatus()
    expect(stalemateStatus.isOver).toBe(true)
    expect(stalemateStatus.end?.reason).toBe('stalemate')
    expect(stalemateStatus.end?.result).toBe('1/2-1/2')
    expect(stalemateStatus.inCheck).toBe(false)

    const mate = newGame('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1')
    const mateStatus = mate.getStatus()
    expect(mateStatus.isOver).toBe(true)
    expect(mateStatus.end?.reason).toBe('checkmate')
    expect(mateStatus.end?.result).toBe('1-0')
    expect(mateStatus.inCheck).toBe(true)
  })

  it('declara tablas por material insuficiente', () => {
    const game = newGame('4k3/8/8/8/8/8/8/4KB2 w - - 0 1')
    const status = game.getStatus()
    expect(status.isOver).toBe(true)
    expect(status.end?.reason).toBe('insufficient-material')
  })

  it('aplica la regla de 75 movimientos automáticamente', () => {
    const game = newGame('4k3/8/8/8/8/8/8/R3K3 w - - 149 100')
    expect(game.applyMove({ from: 'e1', to: 'e2' }, 'w').ok).toBe(true)
    const status = game.getStatus()
    expect(status.halfmoveClock).toBe(150)
    expect(status.isOver).toBe(true)
    expect(status.end?.reason).toBe('seventy-five-move')
    expect(status.end?.automatic).toBe(true)
  })

  it('permite reclamar tablas por la regla de 50 movimientos', () => {
    // Con 100 semijugadas sin capturas ni peones, blancas (al turno) pueden reclamar.
    const game = newGame('4k3/8/8/8/8/8/8/R3K3 w - - 100 60')
    const status = game.getStatus()
    expect(status.isOver).toBe(false)
    expect(status.claimable.fiftyMoveRule).toBe(true)
    expect(game.claimDraw('fifty-move')).toBe(true)
    const after = game.getStatus()
    expect(after.isOver).toBe(true)
    expect(after.end?.reason).toBe('claim-fifty-move')
    expect(after.end?.automatic).toBe(false)
  })

  it('permite reclamar tablas por triple repetición', () => {
    const game = newGame()
    const loop: Array<[string, string, 'w' | 'b']> = [
      ['g1', 'f3', 'w'],
      ['g8', 'f6', 'b'],
      ['f3', 'g1', 'w'],
      ['f6', 'g8', 'b'],
      ['g1', 'f3', 'w'],
      ['g8', 'f6', 'b'],
      ['f3', 'g1', 'w'],
      ['f6', 'g8', 'b'],
    ]
    for (const [from, to, color] of loop) {
      const result = game.applyMove({ from: from as Square, to: to as Square }, color)
      expect(result.ok).toBe(true)
    }
    const status = game.getStatus()
    expect(status.isOver).toBe(false)
    expect(status.claimable.threefoldRepetition).toBe(true)
    expect(game.claimDraw('threefold')).toBe(true)
    expect(game.getStatus().end?.reason).toBe('claim-threefold')
  })

  it('no permite reclamar tablas si no corresponde', () => {
    const game = newGame()
    expect(game.claimDraw('threefold')).toBe(false)
    expect(game.claimDraw('fifty-move')).toBe(false)
  })

  it('reiniciar devuelve la posición inicial', () => {
    const game = newGame()
    tapMany(game, ['e2', 'e4'])
    game.applyMove({ from: 'c7', to: 'c5' }, 'b')
    game.reset()
    expect(game.getFen()).toBe(START_FEN)
    expect(game.getSnapshot().history).toEqual([])
    expect(game.getTurn()).toBe('w')
    expect(game.getSnapshot().pieces).toHaveLength(32)
    expect(game.isLocked()).toBe(false)
  })
})

describe('promociones de la IA', () => {
  it('la IA puede promocionar y elige una pieza válida', () => {
    const game = newGame('4k3/8/8/8/8/8/p7/4K3 b - - 0 1')
    const outcome = game.playAIMove({ from: 'a2', to: 'a1', promotion: 'q' })
    expect(outcome.ok).toBe(true)
    const promoted = game.getSnapshot().pieces.find((piece) => piece.square === 'a1')
    expect(promoted?.color).toBe('b')
    expect(promoted?.type).toBe('q')
  })
})
