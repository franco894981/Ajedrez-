import type { AppliedMove, PieceType } from '../../game/types'

/** Deslizamiento corto y uniforme para que toda pieza llegue en 0,22 s. */
export const TRAVEL_MS: Record<PieceType, number> = {
  p: 220,
  n: 220,
  b: 220,
  r: 220,
  q: 220,
  k: 220,
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
  return reducedMotion ? 0 : TRAVEL_MS[piece] ?? 220
}

export function moveDuration(applied: AppliedMove, reducedMotion: boolean): number {
  if (reducedMotion) return applied.captured ? 200 : 130
  const travel = TRAVEL_MS[applied.piece] ?? 220
  if (!applied.captured) return travel + 80
  const capture = CAPTURE_FX_MS[applied.piece] ?? 520
  // Se serializan deslizamiento e impacto; el pequeño margen evita cortar el último frame.
  return travel + capture + 20
}
