/**
 * Puente entre la interfaz y la IA. Usa un Web Worker cuando el navegador lo
 * permite y, si no, calcula en el hilo principal tras ceder el control para no
 * congelar la pantalla.
 *
 * El resultado es solo una propuesta: `GameSession.playAIMove` vuelve a validar
 * el movimiento contra las reglas antes de aplicarlo.
 */
import type { DifficultyId } from './search'
import type { AIMove, SearchResult } from './search'
import type { AIWorkerRequest, AIWorkerResponse } from './ai.worker'

export type AIProgress = { thinking: true }

export class AIClient {
  private worker: Worker | null = null
  private workerBroken = false
  private nextId = 1
  private pending = new Map<
    number,
    { resolve: (result: SearchResult) => void; reject: (error: Error) => void }
  >()

  private ensureWorker(): Worker | null {
    if (this.workerBroken) return null
    if (this.worker) return this.worker
    if (typeof Worker === 'undefined') {
      this.workerBroken = true
      return null
    }
    try {
      this.worker = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' })
      this.worker.onmessage = (event: MessageEvent<AIWorkerResponse>) => {
        const data = event.data
        if (!data || data.type !== 'result') return
        const entry = this.pending.get(data.id)
        if (!entry) return
        this.pending.delete(data.id)
        entry.resolve(data.result)
      }
      this.worker.onerror = () => {
        // Si el worker falla (navegador antiguo, CSP), pasamos al modo síncrono.
        this.workerBroken = true
        this.worker?.terminate()
        this.worker = null
        for (const [, entry] of this.pending) entry.reject(new Error('worker-error'))
        this.pending.clear()
      }
      return this.worker
    } catch {
      this.workerBroken = true
      this.worker = null
      return null
    }
  }

  async think(
    fen: string,
    difficulty: DifficultyId,
    options: { seed?: number } = {},
  ): Promise<SearchResult> {
    const worker = this.ensureWorker()
    if (worker) {
      const id = this.nextId++
      const request: AIWorkerRequest = { type: 'search', id, fen, difficulty, seed: options.seed }
      try {
        return await new Promise<SearchResult>((resolve, reject) => {
          this.pending.set(id, { resolve, reject })
          worker.postMessage(request)
        })
      } catch (error) {
        // Una cancelación (reinicio de partida) no debe relanzar el cálculo.
        if (error instanceof Error && error.message === 'cancelled') throw error
        // Cualquier otro fallo del worker: cálculo en el hilo principal.
      }
    }
    return this.thinkInline(fen, difficulty, options)
  }

  private async thinkInline(
    fen: string,
    difficulty: DifficultyId,
    options: { seed?: number },
  ): Promise<SearchResult> {
    const { DIFFICULTIES, findBestMove } = await import('./search')
    const config = DIFFICULTIES[difficulty] ?? DIFFICULTIES.prototipo
    // Deja pintar el estado "pensando" antes de bloquear el hilo.
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 40))
    return findBestMove(fen, config, { seed: options.seed })
  }

  cancelAll(): void {
    for (const [, entry] of this.pending) entry.reject(new Error('cancelled'))
    this.pending.clear()
  }

  dispose(): void {
    this.cancelAll()
    this.worker?.terminate()
    this.worker = null
  }
}

export type { AIMove, SearchResult }
