import { useEffect, useRef, useState } from 'react'
import type { useGame } from '../useGame'
import type { Settings } from '../settings'
import type { ScenarioTheme } from '../../theme/types'
import { DIFFICULTIES } from '../../game/ai/difficulty'
import { travelDuration } from '../effects/motion'
import { Board } from './Board'
import { Icon } from './Common'
import { PromotionDialog } from './PromotionDialog'
import { ResultPanel } from './ResultPanel'
import { SettingsPanel } from './SettingsPanel'
import { ConfirmDialog } from './ConfirmDialog'

type Game = ReturnType<typeof useGame>

interface Props {
  game: Game
  settings: Settings
  scenario: ScenarioTheme
  onToggleMusic: () => void
  onToggleSfx: () => void
  onToggleReducedMotion: () => void
}

export function GameScreen({ game, settings, scenario, onToggleMusic, onToggleSfx, onToggleReducedMotion }: Props) {
  const {
    snapshot,
    activeMove,
    busy,
    aiThinking,
    settingsOpen,
    confirm,
    notice,
    humanInCheck,
    aiInCheck,
    setSettingsOpen,
    startNewGame,
    requestRestart,
    requestMenu,
    confirmAction,
    cancelConfirm,
    handleSquareTap,
    choosePromotion,
    cancelPromotion,
    claimDraw,
    dismissNotice,
  } = game

  const { status, pendingPromotion, history } = snapshot
  const lastSan = history.length > 0 ? history[history.length - 1] : null
  const showResult = status.isOver && !busy && status.end !== null

  const claimThreefold = status.claimable.threefoldRepetition
  const claimFifty = status.claimable.fiftyMoveRule
  const captureShake = Boolean(activeMove?.applied.captured) && !settings.reducedMotion
  const captureShakeDelay = captureShake && activeMove ? `${travelDuration(activeMove.applied.piece, false)}ms` : undefined

  const [checkBannerId, setCheckBannerId] = useState(0)
  const [showCheckBanner, setShowCheckBanner] = useState(false)
  const lastPositionWasCheck = useRef(false)
  const checkBannerTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!status.inCheck) {
      lastPositionWasCheck.current = false
      return
    }
    if (lastPositionWasCheck.current) return

    lastPositionWasCheck.current = true
    setCheckBannerId((id) => id + 1)
    setShowCheckBanner(true)
    if (checkBannerTimer.current !== null) window.clearTimeout(checkBannerTimer.current)
    checkBannerTimer.current = window.setTimeout(() => {
      checkBannerTimer.current = null
      setShowCheckBanner(false)
    }, 2000)
  }, [status.inCheck])

  useEffect(
    () => () => {
      if (checkBannerTimer.current !== null) window.clearTimeout(checkBannerTimer.current)
    },
    [],
  )

  const turnLabel = (() => {
    if (status.isOver) return 'Partida terminada'
    if (busy) return 'Movimiento en curso'
    if (aiThinking) return 'Turno de la IA'
    return 'Tu turno'
  })()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (confirm) {
        cancelConfirm()
        return
      }
      if (settingsOpen) setSettingsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [confirm, settingsOpen, cancelConfirm, setSettingsOpen])

  return (
    <>
      <div
        className={`game ${captureShake ? 'game--capture-hit' : ''}`}
        style={captureShakeDelay ? { animationDelay: captureShakeDelay } : undefined}
        data-scenario={scenario.id}
      >
        <header className="game__top">
          <button
            type="button"
            className="icon-button"
            onClick={requestMenu}
            aria-label="Volver al inicio"
          >
            <Icon name="home" />
          </button>
          <div className="game__brand">
            <span className="game__brand-title">The Last Checkmate</span>
            <span className="game__brand-sub">Ashen Warfare</span>
          </div>
          <div className="game__top-actions">
            <button
              type="button"
              className="icon-button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Ajustes"
            >
              <Icon name="settings" />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={requestRestart}
              aria-label="Nueva partida"
            >
              <Icon name="restart" />
            </button>
          </div>
        </header>

        <section className="status" aria-live="polite">
          <div className={`status__side status__side--${status.turn}`}>
            <span className={`status__token status__token--${status.turn}`} aria-hidden="true" />
            <span className="status__side-text">
              {status.turn === 'w' ? 'Blancas · tú' : 'Negras · IA'}
            </span>
          </div>
          <div className="status__center">
            <span className={`status__turn ${aiThinking ? 'status__turn--thinking' : ''}`}>
              {turnLabel}
              {aiThinking && (
                <span className="thinking-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </span>
            {(humanInCheck || aiInCheck) && (
              <span className="badge badge--check">{humanInCheck ? 'Jaque' : 'Jaque al rival'}</span>
            )}
          </div>
          <span className="chip chip--quiet" aria-label={`Dificultad de la IA: ${DIFFICULTIES[settings.difficulty].label}`}>
            IA <strong>{DIFFICULTIES[settings.difficulty].label}</strong>
          </span>
        </section>

        <div className="board-area">
          <Board
            snapshot={snapshot}
            activeMove={activeMove}
            busy={busy}
            reducedMotion={settings.reducedMotion}
            humanColor="w"
            onSquareTap={handleSquareTap}
          />
        </div>

        <footer className="game__bottom">
          <div className="game__meta">
            <span className="game__scenario">
              <Icon name="shield" size={14} /> {scenario.name}
            </span>
            <span className="game__lastmove">
              {lastSan ? (
                <>
                  Última jugada: <strong>{lastSan}</strong>
                </>
              ) : (
                'Toca una pieza para ver sus movimientos'
              )}
            </span>
          </div>

          {(claimThreefold || claimFifty) && !busy && (
            <div className="claim">
              <span className="claim__text">Puedes reclamar tablas:</span>
              {claimThreefold && (
                <button type="button" className="button button--tiny" onClick={() => claimDraw('threefold')}>
                  Triple repetición
                </button>
              )}
              {claimFifty && (
                <button type="button" className="button button--tiny" onClick={() => claimDraw('fifty-move')}>
                  Regla de 50 movimientos
                </button>
              )}
            </div>
          )}

          <div className="game__actions">
            <button type="button" className="button button--ghost" onClick={requestRestart}>
              <Icon name="restart" size={16} />
              Nueva partida
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setSettingsOpen(true)}
            >
              <Icon name="settings" size={16} />
              Ajustes
            </button>
          </div>
        </footer>

        {pendingPromotion && (
          <PromotionDialog
            pending={pendingPromotion}
            humanColor="w"
            onChoose={choosePromotion}
            onCancel={cancelPromotion}
          />
        )}

        {settingsOpen && (
          <SettingsPanel
            settings={settings}
            onToggleMusic={onToggleMusic}
            onToggleSfx={onToggleSfx}
            onToggleReducedMotion={onToggleReducedMotion}
            onClose={() => setSettingsOpen(false)}
          />
        )}

        {confirm && <ConfirmDialog kind={confirm} onConfirm={confirmAction} onCancel={cancelConfirm} />}

        {showResult && status.end && (
          <ResultPanel
            end={status.end}
            humanColor="w"
            onNewGame={startNewGame}
            onMenu={requestMenu}
          />
        )}

        {notice && (
          <div className="toast" role="alert">
            <span>{notice}</span>
            <button type="button" className="icon-button" onClick={dismissNotice} aria-label="Descartar aviso">
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
      </div>
      {showCheckBanner && (
        <div
          key={checkBannerId}
          className={`check-banner ${settings.reducedMotion ? 'check-banner--reduced' : ''}`}
          role="status"
          aria-live="polite"
        >
          ¡JAQUE!
        </div>
      )}
    </>
  )
}
