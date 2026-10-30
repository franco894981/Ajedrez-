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
import type { PieceType, Square } from '../src/game/types'
import type { ActiveMove, useGame } from '../src/ui/useGame'
import { resolveAIPromotion } from '../src/ui/useGame'
import { MoveEffects } from '../src/ui/effects/MoveEffects'
import { DEFAULT_SCENARIO, SCENARIO_LIST } from '../src/theme/scenarios'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function sessionWithSelection(fen: string, square: string) {
  const session = new GameSession(fen, { humanColor: 'w' })
  session.tapSquare(square as Square)
  return session
}

function visualCapture(pieceType: PieceType): ActiveMove {
  const fromByType: Record<PieceType, Square> = {
    p: 'd4',
    r: 'a1',
    n: 'g1',
    b: 'c1',
    q: 'd1',
    k: 'e1',
  }
  const from = fromByType[pieceType]
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
      san: `${pieceType.toUpperCase()}xe2`,
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

describe('fondos de escenario', () => {
  it('renderiza ceniza descendente ligera y resplandor en Ciudad de Ceniza', () => {
    const { container } = render(<Backdrop />)
    expect(container.querySelectorAll('.backdrop__ash-particle')).toHaveLength(22)
    expect(container.querySelector('.backdrop__edge-glow')).toBeTruthy()
    expect(container.querySelector('.backdrop__ruins')).toBeTruthy()
  })

  for (const scenario of SCENARIO_LIST) {
    it(`activa el fondo CSS de ${scenario.name}`, () => {
      const { container } = render(<Backdrop scenario={scenario} />)
      const backdrop = container.querySelector('.backdrop')

      expect(backdrop?.getAttribute('data-scenario')).toBe(scenario.id)
      expect(backdrop?.classList.contains(`backdrop--${scenario.backdrop}`)).toBe(true)
      expect(container.querySelectorAll('.backdrop__ash-particle')).toHaveLength(22)

      if (scenario.backdrop === 'military-shelter') {
        expect(container.querySelector('.backdrop__shelter-panels')).toBeTruthy()
      }
      if (scenario.backdrop === 'post-apocalyptic-desert') {
        expect(container.querySelector('.backdrop__desert-dunes')).toBeTruthy()
        expect(container.querySelector('.backdrop__desert-storm')).toBeTruthy()
      }
    })
  }
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

  it('anima la respiración lenta de las piezas cuando están en reposo', () => {
    const session = new GameSession(START_FEN, { humanColor: 'w' })
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

    const breathingPieces = Array.from(document.querySelectorAll('.piece__breath')) as HTMLElement[]
    expect(breathingPieces).toHaveLength(32)
    expect(breathingPieces[0].style.animationDelay).not.toBe(breathingPieces[1].style.animationDelay)
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

    const energyGhost = document.querySelector('.piece--ghost-energy') as HTMLElement
    expect(energyGhost).toBeTruthy()
    expect(energyGhost.classList.contains('piece--ghost-fall')).toBe(true)
    expect(energyGhost.dataset.deathMode).toBe('fall')
    expect(energyGhost.style.animationDelay).toBe('690ms')
    expect(energyGhost.style.getPropertyValue('--death-duration')).toBe('500ms')
    expect((document.querySelector('.board') as HTMLElement).style.getPropertyValue('--travel')).toBe(
      '440ms',
    )
    expect(document.querySelector('.piece--moving')).toBeTruthy()
    const recoil = document.querySelector('.piece--moving .piece__recoil--active') as HTMLElement
    expect(recoil.style.animationDelay).toBe('440ms')
    expect(recoil.style.getPropertyValue('--recoil-y')).toBe('2.5px')
    expect(document.querySelector('.fx--q .fx__beam--energy')).toBeTruthy()
    expect(document.querySelector('.fx--q .fx__impact--energy')).toBeTruthy()
  })

  for (const victimType of ['q', 'k'] as const) {
    it(`da a la víctima mayor ${victimType} un destello de muerte`, () => {
      const session = new GameSession(START_FEN, { humanColor: 'w' })
      const snapshot = session.getSnapshot()
      const attacker = snapshot.pieces.find((piece) => piece.type === 'n' && piece.color === 'w')!
      const activeMove: ActiveMove = {
        key: victimType === 'q' ? 31 : 32,
        motion: {
          pieceId: attacker.id,
          from: 'g1',
          to: 'f3',
          pieceType: 'n',
          color: 'w',
          captured: true,
          capturedPieceType: victimType,
          castling: null,
          enPassant: false,
        },
        applied: {
          from: 'g1',
          to: 'f3',
          color: 'w',
          piece: 'n',
          captured: { type: victimType, square: 'f3', id: 99 },
          castling: null,
          enPassant: false,
          san: 'Nxf3',
          check: false,
          checkmate: false,
        },
      }

      const { container } = render(
        <Board
          snapshot={snapshot}
          activeMove={activeMove}
          busy
          reducedMotion={false}
          humanColor="w"
          onSquareTap={() => {}}
        />,
      )
      const ghost = container.querySelector('.piece--ghost') as HTMLElement
      expect(ghost.classList.contains('piece--ghost-major')).toBe(true)
      expect(ghost.dataset.deathMode).toBe('major')
      expect(ghost.dataset.capturedType).toBe(victimType)
      expect(ghost.style.getPropertyValue('--death-duration')).toBe('500ms')
      expect(ghost.querySelector('.piece__death-body')).toBeTruthy()
    })
  }

  it('aplica el mismo deslizamiento de 440 ms a una jugada de la IA', () => {
    const session = new GameSession(START_FEN, { humanColor: 'w' })
    expect(session.applyMove({ from: 'e2', to: 'e4' }, 'w').ok).toBe(true)
    const outcome = session.playAIMove({ from: 'e7', to: 'e5' })
    expect(outcome.ok).toBe(true)
    const snapshot = session.getSnapshot()
    const activeMove: ActiveMove = {
      key: 4,
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

    const movingBlackPiece = document.querySelector('.piece--b.piece--moving') as HTMLElement
    expect(movingBlackPiece.getAttribute('data-square')).toBe('e5')
    expect((document.querySelector('.board') as HTMLElement).style.getPropertyValue('--travel')).toBe(
      '440ms',
    )
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
      scenario: DEFAULT_SCENARIO,
      onToggleMusic: () => {},
      onToggleSfx: () => {},
      onToggleReducedMotion: () => {},
    }
    const { container, rerender } = render(
      <GameScreen
        {...props}
        settings={{
          music: false,
          sfx: false,
          reducedMotion: false,
          difficulty: 'prototipo',
          scenarioId: DEFAULT_SCENARIO.id,
        }}
      />,
    )

    const gameElement = container.querySelector('.game') as HTMLElement
    expect(gameElement.classList.contains('game--capture-hit')).toBe(true)
    expect(gameElement.style.animationDelay).toBe('440ms')
    rerender(
      <GameScreen
        {...props}
        settings={{
          music: false,
          sfx: false,
          reducedMotion: true,
          difficulty: 'prototipo',
          scenarioId: DEFAULT_SCENARIO.id,
        }}
      />,
    )
    expect(container.querySelector('.game')?.classList.contains('game--capture-hit')).toBe(false)
  })

  it('muestra ¡JAQUE! y lo retira a los dos segundos', () => {
    vi.useFakeTimers()
    const session = new GameSession('4k3/8/8/8/8/8/8/4K2R w - - 0 1', { humanColor: 'w' })
    expect(session.applyMove({ from: 'h1', to: 'h8' }, 'w').ok).toBe(true)
    const props = {
      game: gameView(session),
      scenario: DEFAULT_SCENARIO,
      settings: {
        music: false,
        sfx: false,
        reducedMotion: false,
        difficulty: 'prototipo' as const,
        scenarioId: DEFAULT_SCENARIO.id,
      },
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
  it('lanza una bola de fuego desde la torre y explota con humo en el objetivo', () => {
    const { container } = render(<MoveEffects activeMove={visualCapture('r')} reducedMotion={false} />)
    const projectile = container.querySelector('.fx__projectile') as HTMLElement
    const boom = container.querySelector('.fx__boom') as HTMLElement
    const smoke = container.querySelector('.fx__smoke--bazooka') as HTMLElement

    expect(projectile.style.getPropertyValue('--x1')).toBe('10.625%')
    expect(projectile.style.getPropertyValue('--y1')).toBe('94.583%')
    expect(projectile.style.getPropertyValue('--x2')).toBe('56.250%')
    expect(projectile.style.animationDuration).toBe('260ms')
    expect(projectile.style.animationDelay).toBe('440ms')
    expect(boom.style.animationDelay).toBe('700ms')
    expect(smoke.style.left).toBe('56.25%')
    expect(smoke.style.animationDelay).toBe('700ms')
  })

  it('emite un destello en el arma y una traza que parte hacia la víctima', () => {
    const { container } = render(<MoveEffects activeMove={visualCapture('r')} reducedMotion={false} />)
    const muzzle = container.querySelector('.fx__muzzle-flash') as HTMLElement
    const trail = container.querySelector('.fx__muzzle-trail') as HTMLElement

    expect(muzzle.style.left).toBe('10.625%')
    expect(muzzle.style.top).toBe('94.583%')
    expect(muzzle.style.animationDelay).toBe('440ms')
    expect(trail.style.left).toBe('10.625%')
    expect(trail.style.top).toBe('94.583%')
    expect(trail.style.width).not.toBe('')
    expect(trail.style.getPropertyValue('--angle')).not.toBe('')
    expect(trail.style.animationDelay).toBe('440ms')
  })

  it('dispara el láser instantáneo del alfil con un destello de precisión', () => {
    const { container } = render(<MoveEffects activeMove={visualCapture('b')} reducedMotion={false} />)
    const beam = container.querySelector('.fx__beam--precision') as HTMLElement
    const impact = container.querySelector('.fx__impact--precision') as HTMLElement

    expect(beam.style.left).toBe('28.125%')
    expect(beam.style.top).toBe('90.313%')
    expect(beam.style.getPropertyValue('--angle')).not.toBe('')
    expect(beam.style.animationDelay).toBe('440ms')
    expect(impact.style.left).toBe('56.25%')
    expect(impact.style.top).toBe('81.25%')
    expect(impact.style.animationDelay).toBe('540ms')
  })

  it('sincroniza el rayo púrpura con el impacto de energía de la dama', () => {
    const { container } = render(<MoveEffects activeMove={visualCapture('q')} reducedMotion={false} />)
    expect((container.querySelector('.fx--q .fx__beam--energy') as HTMLElement).style.animationDelay).toBe(
      '440ms',
    )
    expect((container.querySelector('.fx__impact--energy') as HTMLElement).style.animationDelay).toBe(
      '690ms',
    )
    expect((container.querySelector('.fx__ring--energy') as HTMLElement).style.animationDelay).toBe(
      '690ms',
    )
  })

  it('dispara un cono amarillo al aterrizar el caballo', () => {
    const { container } = render(<MoveEffects activeMove={visualCapture('n')} reducedMotion={false} />)
    const flash = container.querySelector('.fx__flash--shotgun') as HTMLElement
    expect(flash).toBeTruthy()
    expect(flash.style.animationDelay).toBe('440ms')
    expect(flash.style.getPropertyValue('--angle')).not.toBe('')
    expect(container.querySelector('.fx__ring--shotgun')).toBeTruthy()
  })

  it('da al rey un fogonazo amarillo y humo blanco en la víctima', () => {
    const { container } = render(<MoveEffects activeMove={visualCapture('k')} reducedMotion={false} />)
    const flash = container.querySelector('.fx__flash--revolver') as HTMLElement
    const tracer = container.querySelector('.fx__tracer') as HTMLElement
    const smoke = container.querySelector('.fx__smoke--revolver') as HTMLElement
    expect(flash.style.animationDelay).toBe('440ms')
    expect(tracer.style.animationDelay).toBe('440ms')
    expect(smoke.style.left).toBe('56.25%')
    expect(smoke.style.top).toBe('81.25%')
    expect(smoke.style.animationDelay).toBe('440ms')
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
    expect(slash.style.animationDelay).toBe('440ms')
    expect(flash.style.left).toBe('43.75%')
    expect(flash.style.top).toBe('43.75%')
    expect(flash.style.animationDelay).toBe('440ms')
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
    for (const [type, label] of [
      ['q', 'Reina'],
      ['r', 'Torre'],
      ['b', 'Alfil'],
      ['n', 'Caballo'],
    ] as const) {
      const choice = within(dialog).getByRole('button', {
        name: new RegExp(`promocionar a ${label}`, 'i'),
      })
      expect(choice.getAttribute('data-promotion-type')).toBe(type)
    }
    const knightChoice = within(dialog).getByRole('button', { name: /promocionar a caballo/i })
    fireEvent.click(knightChoice)
    expect(onChoose).toHaveBeenCalledWith('n')
  })
})

describe('coronación de la IA', () => {
  it('corona automáticamente como dama incluso si la búsqueda propone una subpromoción', () => {
    expect(resolveAIPromotion('n')).toBe('q')
    expect(resolveAIPromotion('r')).toBe('q')
    expect(resolveAIPromotion(undefined)).toBeUndefined()
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
