/// <reference lib="webworker" />
/**
 * Worker de la IA. Mantiene el cálculo fuera del hilo de la interfaz para que
 * el tablero siga respondiendo en un teléfono mientras la IA piensa.
 */
import { DIFFICULTIES, findBestMove, type DifficultyId, type SearchResult } from './search'

export interface AIWorkerRequest {
  type: 'search'
  id: number
  fen: string
  difficulty: DifficultyId
  seed?: number
}

export interface AIWorkerResponse {
  type: 'result'
  id: number
  result: SearchResult
}

interface WorkerScope {
  postMessage: (message: unknown) => void
  onmessage: ((event: MessageEvent<AIWorkerRequest>) => void) | null
}

const scope = self as unknown as WorkerScope

scope.onmessage = (event: MessageEvent<AIWorkerRequest>) => {
  const data = event.data
  if (!data || data.type !== 'search') return
  const config = DIFFICULTIES[data.difficulty] ?? DIFFICULTIES.prototipo
  try {
    const result = findBestMove(data.fen, config, { seed: data.seed })
    scope.postMessage({ type: 'result', id: data.id, result } satisfies AIWorkerResponse)
  } catch (error) {
    scope.postMessage({
      type: 'result',
      id: data.id,
      result: {
        move: null,
        score: 0,
        depth: 0,
        nodes: 0,
        elapsedMs: 0,
        finished: false,
        error: error instanceof Error ? error.message : String(error),
      },
    })
  }
}
