import { Modal } from './Common'

interface Props {
  kind: 'restart' | 'menu'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ kind, onConfirm, onCancel }: Props) {
  const restart = kind === 'restart'
  return (
    <Modal title={restart ? '¿Reiniciar la partida?' : '¿Salir al inicio?'} onClose={onCancel}>
      <p className="confirm__text">
        {restart
          ? 'La partida en curso se perderá y el tablero volverá a la posición inicial.'
          : 'La partida en curso se perderá. Podrás empezar otra desde el inicio.'}
      </p>
      <div className="confirm__actions">
        <button type="button" className="button button--primary" onClick={onConfirm} autoFocus>
          {restart ? 'Sí, reiniciar' : 'Sí, salir'}
        </button>
        <button type="button" className="button button--ghost" onClick={onCancel}>
          Seguir jugando
        </button>
      </div>
    </Modal>
  )
}
