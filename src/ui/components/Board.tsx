/**
 * Tablero táctil.
 *
 * La posición de cada pieza se calcula siempre desde el estado lógico
 * (`snapshot.pieces`). La interfaz nunca "mueve" una pieza por su cuenta:
 * solo anima el cambio que ya ocurrió en las reglas.
 */
import { useMemo, type CSSProperties } from 'react'
import type { GameSnapshot, PieceType, Square } from '../../game/types'
import type { ActiveMove } from '../useGame'
import { travelDuration } from '../effects/motion'
import { PieceArt } from './PieceArt'
import { MoveEffects } from '../effects/MoveEffects'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const

const PIECE_LABEL: Record<PieceType, string> = {
  p: 'peón',
  n: 'caballo',
  b: 'alfil',
  r: 'torre',
  q: 'dama',
  k: 'rey',
}

const PIECE_WEAPON: Record<PieceType, string> = {
  p: 'espada oxidada',
  n: 'escopeta',
  b: 'rifle de francotirador',
  r: 'bazuca',
  q: 'rifle de energía',
  k: 'revólver pesado',
}

function squareIndex(square: Square): { file: number; rank: number } {
  return { file: FILES.indexOf(square[0] as (typeof FILES)[number]), rank: 8 - Number(square[1]) }
}

interface Props {
  snapshot: GameSnapshot
  activeMove: ActiveMove | null
  busy: boolean
  reducedMotion: boolean
  humanColor: 'w' | 'b'
  onSquareTap: (square: Square) => void
}

export function Board({ snapshot, activeMove, busy, reducedMotion, humanColor, onSquareTap }: Props) {
  const { pieces, status, selected, legalTargets, lastMove, pendingPromotion } = snapshot

  const targetMap = useMemo(() => {
    const map = new Map<Square, { capture: boolean; enPassant: boolean; castling: string | null }>()
    for (const target of legalTargets) map.set(target.square, target)
    return map
  }, [legalTargets])

  const checkedKing = useMemo(() => {
    if (!status.inCheck) return null
    return (
      pieces.find((piece) => piece.type === 'k' && piece.color === status.turn)?.square ?? null
    )
  }, [pieces, status.inCheck, status.turn])

  const capturedInfo = activeMove?.applied.captured ?? null
  const movingPieceId = activeMove?.motion.pieceId ?? null
  const energyCapture = activeMove?.motion.pieceType === 'q' && Boolean(capturedInfo)

  const travel = activeMove ? travelDuration(activeMove.applied.piece, reducedMotion) : 0

  return (
    <div
      className={`board ${reducedMotion ? 'board--reduced' : ''}`}
      style={{ '--travel': `${travel}ms` } as CSSProperties}
      data-busy={busy ? 'true' : 'false'}
    >
      <div className="board__grid" role="grid" aria-label="Tablero de ajedrez">
        {RANKS.map((rank) =>
          FILES.map((file) => {
            const square = `${file}${rank}` as Square
            const index = squareIndex(square)
            const light = (index.file + index.rank) % 2 === 0
            const target = targetMap.get(square)
            const isSelected = selected === square
            const isLast = lastMove?.from === square || lastMove?.to === square
            const isCheck = checkedKing === square
            const isPromotionSquare = pendingPromotion?.to === square
            const piece = pieces.find((candidate) => candidate.square === square)

            const labelParts: string[] = [square]
            if (piece) {
              labelParts.push(
                `${PIECE_LABEL[piece.type]} de las ${piece.color === 'w' ? 'blancas' : 'negras'} (${PIECE_WEAPON[piece.type]})`,
              )
              if (piece.color === humanColor) labelParts.push('tuya')
            } else {
              labelParts.push('vacía')
            }
            if (isSelected) labelParts.push('seleccionada')
            if (target)
              labelParts.push(target.capture ? 'captura legal disponible' : 'movimiento legal disponible')
            if (isLast) labelParts.push('último movimiento')
            if (isCheck) labelParts.push('rey en jaque')

            return (
              <button
                key={square}
                type="button"
                role="gridcell"
                className={[
                  'square',
                  light ? 'square--light' : 'square--dark',
                  isLast ? 'square--last' : '',
                  isSelected ? 'square--selected' : '',
                  isCheck ? 'square--check' : '',
                  isPromotionSquare ? 'square--promotion' : '',
                  target ? (target.capture ? 'square--capture' : 'square--move') : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={labelParts.join(', ')}
                aria-pressed={isSelected}
                data-square={square}
                onClick={() => onSquareTap(square)}
                disabled={busy || status.isOver || Boolean(pendingPromotion)}
              >
                {target && !target.capture && <span className="square__dot" aria-hidden="true" />}
                {target && target.capture && <span className="square__corner" aria-hidden="true" />}
                {isCheck && <span className="square__check-mark" aria-hidden="true" />}
                {file === 'a' && (
                  <span className="coord coord--rank" aria-hidden="true">
                    {rank}
                  </span>
                )}
                {rank === 1 && (
                  <span className="coord coord--file" aria-hidden="true">
                    {file}
                  </span>
                )}
              </button>
            )
          }),
        )}
      </div>

      <div className="board__pieces" aria-hidden="true">
        {pieces.map((piece) => {
          const { file, rank } = squareIndex(piece.square)
          const isHopping =
            activeMove !== null && activeMove.motion.pieceType === 'n' && movingPieceId === piece.id
          return (
            <div
              key={piece.id}
              className={`piece piece--${piece.color} piece--${piece.type}`}
              style={{ transform: `translate(${file * 100}%, ${rank * 100}%)` }}
              data-piece-id={piece.id}
              data-square={piece.square}
            >
              <div className={`piece__inner ${isHopping ? 'piece__inner--hop' : ''}`}>
                <PieceArt type={piece.type} color={piece.color} />
              </div>
            </div>
          )
        })}

        {capturedInfo && activeMove && (
          <div
            key={`ghost-${activeMove.key}`}
            className={`piece piece--ghost ${energyCapture ? 'piece--ghost-energy' : ''}`}
            style={{
              transform: `translate(${squareIndex(capturedInfo.square).file * 100}%, ${
                squareIndex(capturedInfo.square).rank * 100
              }%)`,
            }}
          >
            <div className="piece__inner">
              <PieceArt
                type={capturedInfo.type}
                color={activeMove.applied.color === 'w' ? 'b' : 'w'}
              />
            </div>
          </div>
        )}
      </div>

      {activeMove && <MoveEffects activeMove={activeMove} reducedMotion={reducedMotion} />}
    </div>
  )
}
