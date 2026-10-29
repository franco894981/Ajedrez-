import type { Color, GameEnd } from '../../game/types'
import { describeEnd, SCORE_LABEL } from '../endText'
import { Icon } from './Common'

interface Props {
  end: GameEnd
  humanColor: Color
  onNewGame: () => void
  onMenu: () => void
}

/**
 * Panel de resultado. La animación de victoria/derrota es solo decorativa y no
 * altera el resultado ya decidido por las reglas.
 */
export function ResultPanel({ end, humanColor, onNewGame, onMenu }: Props) {
  const info = describeEnd(end, humanColor)
  return (
    <div className={`result result--${info.tone}`} role="status" aria-live="polite">
      <div className="result__vignette" aria-hidden="true">
        {info.tone === 'loss' && <div className="result__ash" />}
        {info.tone === 'win' && <div className="result__embers" />}
        {info.tone === 'draw' && <div className="result__fog" />}
      </div>
      <div className="result__card">
        <p className="result__kicker">{info.reasonLabel}</p>
        <h2 className="result__title">{info.title}</h2>
        <p className="result__score">{SCORE_LABEL[end.result] ?? end.result}</p>
        <p className="result__detail">{info.detail}</p>
        <div className="result__actions">
          <button type="button" className="button button--primary" onClick={onNewGame} autoFocus>
            <Icon name="restart" />
            Nueva partida
          </button>
          <button type="button" className="button button--ghost" onClick={onMenu}>
            <Icon name="home" />
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  )
}
