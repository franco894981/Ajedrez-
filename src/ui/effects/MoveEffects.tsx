/**
 * Capa de efectos de un movimiento.
 *
 * Cada efecto es puramente visual y vive en su propia capa por encima del
 * tablero: nunca sustituye ni retrasa el estado lógico. Las animaciones de
 * captura dependen del arma de la pieza atacante, tal como pide el diseño:
 *   peón = corte de espada · torre = proyectil y explosión localizada ·
 *   alfil = línea de precisión · caballo = fogonazo de escopeta ·
 *   dama = rayo de energía · rey = fogonazo de revólver.
 */
import type { CSSProperties } from 'react'
import type { ActiveMove } from '../useGame'
import type { Square } from '../../game/types'
import { travelDuration } from './motion'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

function center(square: Square): { x: number; y: number } {
  const file = FILES.indexOf(square[0])
  const rank = 8 - Number.parseInt(square[1], 10)
  return { x: (file + 0.5) * 12.5, y: (rank + 0.5) * 12.5 }
}

const pct = (value: number) => `${value.toFixed(3)}%`

interface Props {
  activeMove: ActiveMove
  reducedMotion: boolean
}

export function MoveEffects({ activeMove, reducedMotion }: Props) {
  const { motion, applied } = activeMove
  const from = center(motion.from)
  const to = center(motion.to)
  // En captura al paso la víctima no está en la casilla de llegada del peón.
  const impact = center(applied.captured?.square ?? motion.to)
  const color = motion.color
  const type = motion.pieceType
  const captured = Boolean(applied.captured)
  const landingDelay = travelDuration(applied.piece, reducedMotion)

  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI

  const beamStyle = {
    left: pct(from.x),
    top: pct(from.y),
    width: pct(length),
    '--angle': `${angle.toFixed(2)}deg`,
  } as CSSProperties

  return (
    <div
      className={`fx fx--${color} ${reducedMotion ? 'fx--reduced' : ''} fx--${type}`}
      key={activeMove.key}
      aria-hidden="true"
    >
      {/* Polvo al llegar: feedback discreto también sin captura. */}
      <span className="fx__dust" style={{ left: pct(to.x), top: pct(to.y) }} />
      <span className="fx__step" style={{ left: pct(to.x), top: pct(to.y) }} />

      {captured && type === 'p' && (
        <>
          <span className="fx__slash" style={{ left: pct(impact.x), top: pct(impact.y) }}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <path d="M12 82 C34 66 54 44 88 18" className="fx__slash-a" />
              <path d="M20 90 C46 70 64 50 92 34" className="fx__slash-b" />
            </svg>
          </span>
          <span className="fx__ring fx__ring--sword" style={{ left: pct(impact.x), top: pct(impact.y) }} />
        </>
      )}

      {captured && type === 'r' && (
        <>
          <span
            className="fx__projectile"
            style={
              {
                '--x1': pct(from.x),
                '--y1': pct(from.y),
                '--x2': pct(to.x),
                '--y2': pct(to.y),
              } as CSSProperties
            }
          />
          <span className="fx__boom" style={{ left: pct(to.x), top: pct(to.y) }} />
          <span className="fx__ring fx__ring--wide" style={{ left: pct(to.x), top: pct(to.y) }} />
          <span className="fx__smoke" style={{ left: pct(to.x), top: pct(to.y) }} />
        </>
      )}

      {captured && type === 'b' && (
        <>
          <span className="fx__beam fx__beam--precision" style={beamStyle} />
          <span className="fx__impact" style={{ left: pct(impact.x), top: pct(impact.y) }} />
        </>
      )}

      {captured && type === 'n' && (
        <>
          <span
            className="fx__flash fx__flash--shotgun"
            style={{
              left: pct(impact.x),
              top: pct(impact.y),
              animationDelay: `${landingDelay}ms`,
            }}
          />
          <span
            className="fx__ring fx__ring--shotgun"
            style={{
              left: pct(impact.x),
              top: pct(impact.y),
              animationDelay: `${landingDelay}ms`,
            }}
          />
        </>
      )}

      {captured && type === 'q' && (
        <>
          <span className="fx__beam fx__beam--energy" style={beamStyle} />
          <span className="fx__impact fx__impact--energy" style={{ left: pct(impact.x), top: pct(impact.y) }} />
          <span className="fx__ring fx__ring--energy" style={{ left: pct(impact.x), top: pct(impact.y) }} />
        </>
      )}

      {captured && type === 'k' && (
        <>
          <span className="fx__flash" style={{ left: pct(from.x), top: pct(from.y) }} />
          <span
            className="fx__tracer"
            style={
              {
                left: pct(from.x),
                top: pct(from.y),
                width: pct(length * 0.85),
                '--angle': `${angle.toFixed(2)}deg`,
              } as CSSProperties
            }
          />
          <span className="fx__impact" style={{ left: pct(impact.x), top: pct(impact.y) }} />
          <span className="fx__smoke fx__smoke--revolver" style={{ left: pct(from.x), top: pct(from.y) }} />
        </>
      )}
    </div>
  )
}
