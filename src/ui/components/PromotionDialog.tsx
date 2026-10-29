import type { Color, PendingPromotion, PieceType } from '../../game/types'
import { PieceArt } from './PieceArt'
import { Modal } from './Common'

const CHOICE_LABEL: Record<PieceType, string> = {
  q: 'Reina',
  r: 'Torre',
  b: 'Alfil',
  n: 'Caballo',
  k: 'Rey',
  p: 'Peón',
}

const CHOICE_WEAPON: Record<PieceType, string> = {
  q: 'Rifle de energía',
  r: 'Bazuca',
  b: 'Francotirador',
  n: 'Escopeta',
  k: 'Revólver pesado',
  p: 'Espada',
}

interface Props {
  pending: PendingPromotion
  humanColor: Color
  onChoose: (type: PieceType) => void
  onCancel: () => void
}

export function PromotionDialog({ pending, humanColor, onChoose, onCancel }: Props) {
  return (
    <Modal title="Elige tu promoción" onClose={onCancel} closeLabel="Cancelar promoción">
      <p className="promotion__text">
        Tu peón llega a la última fila. Elige en qué pieza se convierte.
      </p>
      <div className="promotion__grid" role="group" aria-label="Piezas de promoción">
        {pending.choices.map((choice) => (
          <button
            key={choice}
            type="button"
            className="promotion__card"
            aria-label={`Promocionar a ${CHOICE_LABEL[choice]} · ${CHOICE_WEAPON[choice]}`}
            data-promotion-type={choice}
            onClick={() => onChoose(choice)}
            autoFocus={choice === 'q'}
          >
            <span className="promotion__art">
              <PieceArt type={choice} color={humanColor} />
            </span>
            <span className="promotion__name">{CHOICE_LABEL[choice]}</span>
            <span className="promotion__weapon">{CHOICE_WEAPON[choice]}</span>
          </button>
        ))}
      </div>
      <button type="button" className="button button--ghost promotion__cancel" onClick={onCancel}>
        Cancelar movimiento
      </button>
    </Modal>
  )
}
