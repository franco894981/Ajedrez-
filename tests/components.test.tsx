// @vitest-environment jsdom
/**
 * Pruebas de componentes con instantáneas reales del motor (sin partida larga):
 * tablero, diálogo de promoción y panel de resultado.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Board } from '../src/ui/components/Board'
import { PromotionDialog } from '../src/ui/components/PromotionDialog'
import { ResultPanel } from '../src/ui/components/ResultPanel'
import { GameSession, START_FEN } from '../src/game/engine'
import type { Square } from '../src/game/types'

afterEach(cleanup)

function sessionWithSelection(fen: string, square: string) {
  const session = new GameSession(fen, { humanColor: 'w' })
  session.tapSquare(square as Square)
  return session
}

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
    expect(document.querySelectorAll('.square--move').length).toBeGreaterThan(0)
    expect(document.querySelectorAll('.square--capture').length).toBe(1)
    expect(document.querySelector('.square--selected')?.getAttribute('data-square')).toBe('e4')

    fireEvent.click(document.querySelector('[data-square="d5"]') as HTMLElement)
    expect(onTap).toHaveBeenCalledWith('d5')
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
