// @vitest-environment jsdom
/**
 * Pruebas de componentes con instantáneas reales del motor (sin partida larga):
 * tablero, diálogo de promoción y panel de resultado.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Backdrop } from '../src/ui/components/Backdrop'
import { Board } from '../src/ui/components/Board'
import { GameScreen } from '../src/ui/components/GameScreen'
import { PromotionDialog } from '../src/ui/components/PromotionDialog'
import { ResultPanel } from '../src/ui/components/ResultPanel'
import { GameSession, START_FEN } from '../src/game/engine'
import type { Square } from '../src/game/types'
import type { ActiveMove, useGame } from '../src/ui/useGame'
import { MoveEffects } from '../src/ui/effects/MoveEffects'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function sessionWithSelection(fen: string, square: string) {
  const session = new GameSession(fen, { humanColor: 'w' })
  session.tapSquare(square as Square)
  return session
}

function visualCapture(pieceType: 'k' | 'n'): ActiveMove {
  const from: Square = pieceType === 'n' ? 'g1' : 'e1'
  const to: Square = 'e2'
  return {
    key: 1,
    motion: {
      pieceId: 1,
      from,
      to,
      pieceType,
      color: 'w',
      captured: true,
      capturedPieceType: 'p',
      castling: null,
      enPassant: false,
    },
    applied: {
      from,
      to,
      color: 'w',
      piece: pieceType,
      captured: { type: 'p', square: to, id: 2 },
      castling: null,
      enPassant: false,
      san: pieceType === 'n' ? 'Nxe2' : 'Kxe2',
      check: false,
      checkmate: false,
    },
  }
}

function gameView(session: GameSession, activeMove: ActiveMove | null = null, busy = false) {
  const snapshot = session.getSnapshot()
  return {
    screen: 'partida',
    snapshot,
    activeMove,
    busy,
    aiThinking: false,
    settingsOpen: false,
    confirm: null,
    notice: null,
    humanInCheck: snapshot.status.inCheck && snapshot.status.turn === 'w' && !snapshot.status.isOver,
    aiInCheck: snapshot.status.inCheck && snapshot.status.turn === 'b' && !snapshot.status.isOver,
    setSettingsOpen: () => {},
    startNewGame: () => {},
    requestRestart: () => {},
    requestMenu: () => {},
    confirmAction: () => {},
    cancelConfirm: () => {},
    handleSquareTap: () => {},
    choosePromotion: () => {},
    cancelPromotion: () => {},
    claimDraw: () => false,
    dismissNotice: () => {},
  } as unknown as ReturnType<typeof useGame>
}

describe('fondo Ciudad de Ceniza', () => {
  it('renderiza ceniza descendente ligera y resplandor en los bordes', () => {
    const { container } = render(<Backdrop />)
    expect(container.querySelectorAll('.backdrop__ash-particle')).toHaveLength(22)
    expect(container.querySelector('.backdrop__edge-glow')).toBeTruthy()
  })
})

describe('tablero', () => {
  it('marca movimientos normales y capturas de forma distinta', () => {
    const session = sessionWithSelection('4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1', 'e4')
    const onTap = vi.fn()
    render(
      <Board
        snapshot={session.getSnapshot()}
        activeMove={null}
        busy={false}
        reducedMotion={false}
        humanColor="w"
        onSquareTap={onTap}
      />,
    )

    expect(document.querySelectorAll('.square--light')).toHaveLength(32)
    expect(document.querySelectorAll('.square--dark')).toHaveLength(32)
    expect(document.querySelectorAll('.board__ash-particle')).toHaveLength(10)
    expect(document.querySelectorAll('.square--move').length).toBeGreaterThan(0)
    expect(document.querySelectorAll('.square--capture').length).toBe(1)
    expect(document.querySelector('.square--selected')?.getAttribute('data-square')).toBe('e4')

    fireEvent.click(document.querySelector('[data-square="d5"]') as HTMLElement)
    expect(onTap).toHaveBeenCalledWith('d5')
  })

  it('muestra el rayo energético de la reina y disuelve la víctima capturada', () => {
    const session = new GameSession('8/4k3/8/3r4/3Q4/8/8/4K3 w - - 0 1', {
      humanColor: 'w',
    })
    const outcome = session.applyMove({ from: 'd4', to: 'd5' }, 'w')
    expect(outcome.ok).toBe(true)
    const snapshot = session.getSnapshot()
    const activeMove: ActiveMove = {
      key: 1,
      motion: snapshot.motion!,
      applied: outcome.move!,
    }

    render(
      <Board
        snapshot={snapshot}
        activeMove={activeMove}
        busy
        reducedMotion={false}
        humanColor="w"
        onSquareTap={() => {}}
      />,
    )

    expect(document.querySelector('.piece--ghost-energy')).toBeTruthy()
    expect(document.querySelector('.fx--q .fx__beam--energy')).toBeTruthy()
    expect(document.querySelector('.fx--q .fx__impact--energy')).toBeTruthy()
  })

  it('deshabilita el tablero mientras se resuelve un movimiento', () => {
    const session = new GameSession(START_FEN, { humanColor: 'w' })
    render(
      <Board
        snapshot={session.getSnapshot()}
        activeMove={null}
        busy
        reducedMotion
        humanColor="w"
        onSquareTap={() => {}}
      />,
    )
    const squares = document.querySelectorAll('.square') as NodeListOf<HTMLButtonElement>
    expect(squares).toHaveLength(64)
    expect(Array.from(squares).every((square) => square.disabled)).toBe(true)
  })

  it('resalta al rey en jaque y el último movimiento', () => {
    const session = new GameSession('4k3/8/8/8/8/8/8/4K2R w - - 0 1', { humanColor: 'w' })
    session.applyMove({ from: 'h1', to: 'h8' }, 'w')
    render(
      <Board
        snapshot={session.getSnapshot()}
        activeMove={null}
        busy={false}
        reducedMotion={false}
        humanColor="w"
        onSquareTap={() => {}}
      />,
    )
    expect(document.querySelectorAll('.square--check')).toHaveLength(1)
    expect(document.querySelector('.square--check')?.getAttribute('data-square')).toBe('e8')
    expect(document.querySelectorAll('.square--last').length).toBe(2)
  })
})

describe('impactos de pantalla y jaque', () => {
  it('sacude el juego al capturar, salvo con animaciones reducidas', () => {
    const session = new GameSession('8/4k3/8/3r4/3Q4/8/8/4K3 w - - 0 1', {
      humanColor: 'w',
    })
    const outcome = session.applyMove({ from: 'd4', to: 'd5' }, 'w')
    expect(outcome.ok).toBe(true)
    const snapshot = session.getSnapshot()
    const activeMove: ActiveMove = {
      key: 8,
      motion: snapshot.motion!,
      applied: outcome.move!,
    }
    const game = gameView(session, activeMove, true)
    const props = {
      game,
      onToggleMusic: () => {},
      onToggleSfx: () => {},
      onToggleReducedMotion: () => {},
    }
    const { container, rerender } = render(
      <GameScreen {...props} settings={{ music: false, sfx: false, reducedMotion: false }} />,
    )

    expect(container.querySelector('.game')?.classList.contains('game--capture-hit')).toBe(true)
    rerender(<GameScreen {...props} settings={{ music: false, sfx: false, reducedMotion: true }} />)
    expect(container.querySelector('.game')?.classList.contains('game--capture-hit')).toBe(false)
  })

  it('muestra ¡JAQUE! y lo retira a los dos segundos', () => {
    vi.useFakeTimers()
    const session = new GameSession('4k3/8/8/8/8/8/8/4K2R w - - 0 1', { humanColor: 'w' })
    expect(session.applyMove({ from: 'h1', to: 'h8' }, 'w').ok).toBe(true)
    const props = {
      game: gameView(session),
      settings: { music: false, sfx: false, reducedMotion: false },
      onToggleMusic: () => {},
      onToggleSfx: () => {},
      onToggleReducedMotion: () => {},
    }
    const { queryByText } = render(<GameScreen {...props} />)

    expect(screen.getByText('¡JAQUE!')).toBeTruthy()
    act(() => vi.advanceTimersByTime(1999))
    expect(screen.getByText('¡JAQUE!')).toBeTruthy()
    act(() => vi.advanceTimersByTime(1))
    expect(queryByText('¡JAQUE!')).toBeNull()
  })
})

describe('efectos de captura', () => {
  it('dispara el fogonazo de escopeta al aterrizar el caballo', () => {
    const { container } = render(<MoveEffects activeMove={visualCapture('n')} reducedMotion={false} />)
    const flash = container.querySelector('.fx__flash--shotgun') as HTMLElement
    expect(flash).toBeTruthy()
    expect(flash.style.animationDelay).toBe('360ms')
  })

  it('añade una pequeña estela de humo al revólver del rey', () => {
    const { container } = render(<MoveEffects activeMove={visualCapture('k')} reducedMotion={false} />)
    expect(container.querySelector('.fx__flash')).toBeTruthy()
    expect(container.querySelector('.fx__smoke--revolver')).toBeTruthy()
  })

  it('sitúa el corte del peón en la víctima al capturar al paso', () => {
    const activeMove: ActiveMove = {
      key: 2,
      motion: {
        pieceId: 1,
        from: 'e5',
        to: 'd6',
        pieceType: 'p',
        color: 'w',
        captured: true,
        capturedPieceType: 'p',
        castling: null,
        enPassant: true,
      },
      applied: {
        from: 'e5',
        to: 'd6',
        color: 'w',
        piece: 'p',
        captured: { type: 'p', square: 'd5', id: 2 },
        castling: null,
        enPassant: true,
        san: 'exd6',
        check: false,
        checkmate: false,
      },
    }
    const { container } = render(<MoveEffects activeMove={activeMove} reducedMotion={false} />)
    const slash = container.querySelector('.fx__slash') as HTMLElement
    const flash = container.querySelector('.fx__capture-flash') as HTMLElement
    expect(slash.style.left).toBe('43.75%')
    expect(slash.style.top).toBe('43.75%')
    expect(flash.style.left).toBe('43.75%')
    expect(flash.style.top).toBe('43.75%')
    expect(flash.style.animationDelay).toBe('240ms')
  })
})

describe('diálogo de promoción', () => {
  it('ofrece reina, torre, alfil y caballo y avisa de la elección', () => {
    const onChoose = vi.fn()
    const onCancel = vi.fn()
    render(
      <PromotionDialog
        pending={{ from: 'a7', to: 'a8', color: 'w', choices: ['q', 'r', 'b', 'n'] }}
        humanColor="w"
        onChoose={onChoose}
        onCancel={onCancel}
      />,
    )
    const dialog = screen.getByRole('dialog')
    for (const name of ['Reina', 'Torre', 'Alfil', 'Caballo']) {
      expect(within(dialog).getByText(name)).toBeTruthy()
    }
    const buttons = within(dialog).getAllByRole('button')
    // 4 piezas + cerrar + cancelar
    expect(buttons.length).toBe(6)
    fireEvent.click(within(dialog).getByText('Caballo').closest('button') as HTMLElement)
    expect(onChoose).toHaveBeenCalledWith('n')
  })
})

describe('panel de resultado', () => {
  it('muestra derrota con jaque mate y permite empezar otra partida', () => {
    const onNewGame = vi.fn()
    render(
      <ResultPanel
        end={{ result: '0-1', reason: 'checkmate', winner: 'b', automatic: true }}
        humanColor="w"
        onNewGame={onNewGame}
        onMenu={() => {}}
      />,
    )
    expect(screen.getByText('Derrota')).toBeTruthy()
    expect(screen.getByText('Jaque mate')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /nueva partida/i }))
    expect(onNewGame).toHaveBeenCalled()
  })

  it('muestra tablas por ahogado de forma distinta al jaque mate', () => {
    render(
      <ResultPanel
        end={{ result: '1/2-1/2', reason: 'stalemate', winner: null, automatic: true }}
        humanColor="w"
        onNewGame={() => {}}
        onMenu={() => {}}
      />,
    )
    // «Tablas» aparece como título y como marcador; el motivo es inequívoco.
    expect(screen.getAllByText('Tablas').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Ahogado')).toBeTruthy()
    expect(screen.queryByText('Derrota')).toBeNull()
  })
})
