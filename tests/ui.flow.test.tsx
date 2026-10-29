// @vitest-environment jsdom
/**
 * Pruebas de flujo de la interfaz sin navegador real:
 * inicio → jugar → mover → turno de la IA → reinicio con confirmación.
 *
 * Nota: jsdom no reproduce animaciones ni audio. Estas pruebas comprueban el
 * estado lógico y el DOM, no el aspecto visual ni el sonido.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { audio } from '../src/audio/AudioEngine'
import App from '../src/App'

function clickSquare(square: string) {
  const button = document.querySelector(`[data-square="${square}"]`) as HTMLButtonElement | null
  if (!button) throw new Error(`No existe la casilla ${square}`)
  fireEvent.click(button)
}

function pieceOn(square: string): Element | undefined {
  return Array.from(document.querySelectorAll('.board__pieces .piece')).find(
    (element) => element.getAttribute('data-square') === square,
  )
}

async function startGame() {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /jugar/i }))
  await screen.findByText('Tu turno')
}

describe('flujo de la interfaz', () => {
  beforeEach(() => {
    window.localStorage.clear()
    // jsdom no implementa matchMedia.
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('muestra el título y el botón Jugar', () => {
    render(<App />)
    expect(screen.getByText(/the last/i)).toBeTruthy()
    expect(screen.getByText(/checkmate/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /jugar/i })).toBeTruthy()
  })

  it('empieza la partida con 32 piezas y el turno del jugador', async () => {
    await startGame()
    expect(document.querySelectorAll('.board__pieces .piece')).toHaveLength(32)
    expect(screen.getByText('Blancas · tú')).toBeTruthy()
    expect(pieceOn('e2')).toBeTruthy()
    expect(pieceOn('e7')).toBeTruthy()
  })

  it('al tocar una pieza propia se marcan sus movimientos legales', async () => {
    await startGame()
    clickSquare('e2')
    const targets = document.querySelectorAll('.square--move')
    expect(targets.length).toBeGreaterThanOrEqual(2)
    expect(document.querySelector('[data-square="e4"]')?.className).toContain('square--move')
  })

  it('tocar una pieza rival no la selecciona', async () => {
    await startGame()
    clickSquare('e7')
    expect(document.querySelectorAll('.square--selected')).toHaveLength(0)
    expect(pieceOn('e7')?.getAttribute('data-square')).toBe('e7')
  })

  it('mueve una pieza, bloquea dobles jugadas y deja jugar a la IA', async () => {
    await startGame()
    clickSquare('e2')
    clickSquare('e4')

    // Durante la animación no se aceptan nuevas acciones.
    expect(screen.getByText('Movimiento en curso')).toBeTruthy()
    const target = document.querySelector('[data-square="e4"]') as HTMLButtonElement
    expect(target.disabled).toBe(true)

    // La IA responde con negras (la búsqueda real tarda un poco).
    await waitFor(
      () => {
        const blackPiece = document.querySelector('.piece--b')
        expect(blackPiece).toBeTruthy()
        expect(screen.queryByText('Movimiento en curso')).toBeNull()
      },
      { timeout: 8000 },
    )

    await waitFor(
      () => {
        const lastMove = screen.getByText(/última jugada/i)
        expect(lastMove.textContent).toMatch(/[a-h]/)
      },
      { timeout: 8000 },
    )

    // Es de nuevo el turno del jugador y el tablero conserva 31 o 32 piezas.
    await waitFor(() => expect(screen.getByText('Tu turno')).toBeTruthy(), { timeout: 8000 })
    const count = document.querySelectorAll('.board__pieces .piece').length
    expect(count).toBeGreaterThanOrEqual(31)
    expect(pieceOn('e4')).toBeTruthy()
  })

  it('pedir nueva partida a mitad de partida exige confirmación y reinicia', async () => {
    await startGame()
    clickSquare('d2')
    clickSquare('d4')
    await waitFor(() => expect(screen.getByText('Tu turno')).toBeTruthy(), { timeout: 8000 })

    fireEvent.click(screen.getAllByRole('button', { name: /nueva partida/i })[0])
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/reiniciar la partida/i)).toBeTruthy()

    fireEvent.click(within(dialog).getByRole('button', { name: /sí, reiniciar/i }))
    await waitFor(() => {
      expect(document.querySelectorAll('.board__pieces .piece')).toHaveLength(32)
    })
    expect(pieceOn('d2')).toBeTruthy()
    expect(pieceOn('d4')).toBeFalsy()
    expect(screen.getByText('Tu turno')).toBeTruthy()
  })

  it('cancelar la confirmación mantiene la partida en curso', async () => {
    await startGame()
    clickSquare('d2')
    clickSquare('d4')
    await waitFor(() => expect(screen.getByText('Tu turno')).toBeTruthy(), { timeout: 8000 })

    fireEvent.click(screen.getAllByRole('button', { name: /nueva partida/i })[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /seguir jugando/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(pieceOn('d4')).toBeTruthy()
  })

  it('no inicia música al cargar ni tocar otros controles; Jugar la activa si está habilitada', () => {
    const setMusicEnabled = vi.spyOn(audio, 'setMusicEnabled')
    render(<App />)
    expect(setMusicEnabled).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('switch', { name: /disparos/i }))
    expect(setMusicEnabled).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /jugar/i }))
    expect(setMusicEnabled).toHaveBeenCalledWith(true)
  })

  it('respeta el ajuste Música apagado al tocar Jugar', () => {
    window.localStorage.setItem(
      'tlc.settings.v1',
      JSON.stringify({ music: false, sfx: true, reducedMotion: false }),
    )
    const setMusicEnabled = vi.spyOn(audio, 'setMusicEnabled')
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /jugar/i }))

    expect(setMusicEnabled).toHaveBeenCalledWith(false)
  })

  it('permite activar y detener la música y cambiar las demás preferencias', async () => {
    const setMusicEnabled = vi.spyOn(audio, 'setMusicEnabled')
    render(<App />)
    const music = screen.getByRole('switch', { name: /música/i })
    expect(music.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(music)
    expect(music.getAttribute('aria-checked')).toBe('false')
    expect(setMusicEnabled).toHaveBeenLastCalledWith(false)
    fireEvent.click(music)
    expect(music.getAttribute('aria-checked')).toBe('true')
    expect(setMusicEnabled).toHaveBeenLastCalledWith(true)

    const reduced = screen.getByRole('switch', { name: /animaciones reducidas/i })
    fireEvent.click(reduced)
    expect(reduced.getAttribute('aria-checked')).toBe('true')
    expect(document.documentElement.dataset.reducedMotion).toBe('true')
  })
})

describe('textos de resultado', () => {
  it('distingue jaque mate, ahogado y tablas reclamadas', async () => {
    const { describeEnd } = await import('../src/ui/endText')

    const mate = describeEnd(
      { result: '0-1', reason: 'checkmate', winner: 'b', automatic: true },
      'w',
    )
    const stalemate = describeEnd(
      { result: '1/2-1/2', reason: 'stalemate', winner: null, automatic: true },
      'w',
    )
    const claimed = describeEnd(
      { result: '1/2-1/2', reason: 'claim-threefold', winner: null, automatic: false },
      'w',
    )

    expect(mate.tone).toBe('loss')
    expect(mate.title).toBe('Derrota')
    expect(mate.reasonLabel).toBe('Jaque mate')
    expect(stalemate.tone).toBe('draw')
    expect(stalemate.reasonLabel).toBe('Ahogado')
    expect(claimed.reasonLabel).toMatch(/reclamadas/i)

    const win = describeEnd({ result: '1-0', reason: 'checkmate', winner: 'w', automatic: true }, 'w')
    expect(win.title).toBe('Victoria')
    expect(win.tone).toBe('win')
  })
})
