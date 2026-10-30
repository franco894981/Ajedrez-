import type { AppliedMove, PieceType } from '../../game/types'

/** Deslizamiento uniforme de 0,44 s para todas las piezas y ambos bandos. */
export const TRAVEL_MS: Record<PieceType, number> = {
  p: 440,
  n: 440,
  b: 440,
  r: 440,
  q: 440,
  k: 440,
}

/** Tiempo máximo de los efectos de captura, contado desde que la pieza aterriza. */
export const CAPTURE_FX_MS: Record<PieceType, number> = {
  p: 520,
  n: 520,
  b: 560,
  r: 760,
  q: 680,
  k: 520,
}

/** Desfase entre el inicio del arma y el impacto visible de la víctima. */
export function impactOffset(piece: PieceType, reducedMotion: boolean): number {
  if (reducedMotion) return 0
  switch (piece) {
    case 'b':
      return 100
    case 'r':
      return 260
    case 'q':
      return 250
    default:
      return 0
  }
}

export function travelDuration(piece: PieceType, reducedMotion: boolean): number {
  return reducedMotion ? 0 : TRAVEL_MS[piece] ?? 440
}

export function moveDuration(applied: AppliedMove, reducedMotion: boolean): number {
  if (reducedMotion) return applied.captured ? 200 : 130
  const travel = TRAVEL_MS[applied.piece] ?? 440
  if (!applied.captured) return travel + 80
  const capture = CAPTURE_FX_MS[applied.piece] ?? 520
  // Se serializan deslizamiento e impacto; el pequeño margen evita cortar el último frame.
  return travel + capture + 20
}
