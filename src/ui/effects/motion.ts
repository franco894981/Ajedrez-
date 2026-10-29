import type { AppliedMove, PieceType } from '../../game/types'

/** Duración de la animación de traslado por tipo de pieza (ms). */
export const TRAVEL_MS: Record<PieceType, number> = {
  p: 240,
  n: 360,
  b: 300,
  r: 380,
  q: 340,
  k: 300,
}

/** Duración de los efectos de captura por tipo de atacante (ms). */
export const CAPTURE_FX_MS: Record<PieceType, number> = {
  p: 520,
  n: 520,
  b: 520,
  r: 700,
  q: 620,
  k: 520,
}

export function travelDuration(piece: PieceType, reducedMotion: boolean): number {
  return reducedMotion ? 0 : TRAVEL_MS[piece] ?? 280
}

export function moveDuration(applied: AppliedMove, reducedMotion: boolean): number {
  if (reducedMotion) return applied.captured ? 200 : 130
  const travel = TRAVEL_MS[applied.piece] ?? 280
  const capture = applied.captured ? CAPTURE_FX_MS[applied.piece] ?? 380 : 0
  return Math.max(travel, capture) + 80
}
