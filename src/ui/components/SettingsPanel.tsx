import type { Settings } from '../settings'
import { Modal, Toggle } from './Common'

interface Props {
  settings: Settings
  onToggleMusic: () => void
  onToggleSfx: () => void
  onToggleReducedMotion: () => void
  onClose: () => void
}

export function SettingsPanel({
  settings,
  onToggleMusic,
  onToggleSfx,
  onToggleReducedMotion,
  onClose,
}: Props) {
  return (
    <Modal title="Ajustes" onClose={onClose}>
      <div className="settings__list">
        <Toggle
          icon="music"
          label="Música"
          description="Ambiente apocalíptico original, sintetizado en el navegador"
          checked={settings.music}
          onChange={onToggleMusic}
        />
        <Toggle
          icon="sound"
          label="Efectos de sonido"
          description="Movimientos, cortes, disparos y explosiones"
          checked={settings.sfx}
          onChange={onToggleSfx}
        />
        <Toggle
          icon="motion"
          label="Animaciones reducidas"
          description="Traslados instantáneos y efectos más breves"
          checked={settings.reducedMotion}
          onChange={onToggleReducedMotion}
        />
      </div>
      <p className="settings__note">
        El audio empieza tras tu primera interacción, como exigen los navegadores móviles. Todo el
        sonido es original y se genera en el dispositivo: no se descarga ninguna pista externa.
      </p>
      <button type="button" className="button button--ghost settings__close" onClick={onClose}>
        Cerrar
      </button>
    </Modal>
  )
}
