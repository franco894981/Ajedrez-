import type { ReactNode } from 'react'

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }
  switch (name) {
    case 'play':
      return (
        <svg {...common}>
          <path d="M8 5.5 19 12 8 18.5Z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.11a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.11A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8.96 4.6 1.7 1.7 0 0 0 10 3.05V3a2 2 0 1 1 4 0v.11a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 8.9c.24.61.82 1.03 1.48 1.06H21a2 2 0 1 1 0 4h-.11a1.7 1.7 0 0 0-1.49 1.04Z" />
        </svg>
      )
    case 'restart':
      return (
        <svg {...common}>
          <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
          <path d="M3.2 4.5v4.2H7.4" />
        </svg>
      )
    case 'home':
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1Z" />
        </svg>
      )
    case 'close':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      )
    case 'music':
      return (
        <svg {...common}>
          <path d="M9 18V6l10-2v12" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="16.5" cy="16" r="2.5" />
        </svg>
      )
    case 'sound':
      return (
        <svg {...common}>
          <path d="M4 9.5h3l4-3.5v12l-4-3.5H4Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18 6a8.5 8.5 0 0 1 0 12" />
        </svg>
      )
    case 'motion':
      return (
        <svg {...common}>
          <path d="M3 8h9M3 12h13M3 16h7" />
          <path d="M17 6v12l4-6Z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5.5c0 4 2.9 7.6 7 9.5 4.1-1.9 7-5.5 7-9.5V6Z" />
        </svg>
      )
    case 'sword':
      return (
        <svg {...common}>
          <path d="M20 4 10 14l-2-2L18 2h2Z" />
          <path d="m8 12-4 4 4 4 4-4" />
          <path d="M4 20l4-4" />
        </svg>
      )
  }
}

export type IconName =
  | 'play'
  | 'settings'
  | 'restart'
  | 'home'
  | 'close'
  | 'music'
  | 'sound'
  | 'motion'
  | 'shield'
  | 'sword'

interface ToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: () => void
  icon?: IconName
}

export function Toggle({ label, description, checked, onChange, icon }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`toggle ${checked ? 'toggle--on' : ''}`}
      onClick={onChange}
    >
      {icon && (
        <span className="toggle__icon" aria-hidden="true">
          <Icon name={icon} />
        </span>
      )}
      <span className="toggle__text">
        <span className="toggle__label">{label}</span>
        {description && <span className="toggle__desc">{description}</span>}
      </span>
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
    </button>
  )
}

interface ModalProps {
  title: string
  children: ReactNode
  onClose?: () => void
  variant?: 'default' | 'result'
  closeLabel?: string
}

export function Modal({ title, children, onClose, variant = 'default', closeLabel = 'Cerrar' }: ModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className={`modal ${variant === 'result' ? 'modal--result' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal__head">
          <h2 className="modal__title">{title}</h2>
          {onClose && (
            <button className="icon-button" type="button" onClick={onClose} aria-label={closeLabel}>
              <Icon name="close" />
            </button>
          )}
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
