import type { Settings } from '../settings'
import { SCENARIO_LIST } from '../../theme/scenarios'
import { DIFFICULTIES, DIFFICULTY_LIST } from '../../game/ai/difficulty'
import type { ScenarioTheme } from '../../theme/types'
import { PieceArt } from './PieceArt'
import { Icon, Toggle } from './Common'
import type { PieceType } from '../../game/types'

interface Props {
  settings: Settings
  scenario: ScenarioTheme
  onSelectScenario: (id: string) => void
  onSelectDifficulty: (difficulty: Settings['difficulty']) => void
  onPlay: () => void
  onToggleMusic: () => void
  onToggleSfx: () => void
  onToggleReducedMotion: () => void
}

const PARADE: PieceType[] = ['p', 'r', 'n', 'b', 'q', 'k']

export function StartScreen({
  settings,
  scenario,
  onSelectScenario,
  onSelectDifficulty,
  onPlay,
  onToggleMusic,
  onToggleSfx,
  onToggleReducedMotion,
}: Props) {
  return (
    <main className="start">
      <div className="start__crest" aria-hidden="true">
        <svg viewBox="0 0 120 70">
          <path
            className="crest__shield"
            d="M60 4 16 15v22c0 15 18 26 44 32 26-6 44-17 44-32V15Z"
          />
          <path className="crest__crack" d="M60 10 56 26 64 34 58 48 62 60" />
          <path className="crest__sword" d="M18 62 44 36M26 34l8-2 2 8-8 2zM76 62 102 36" />
        </svg>
      </div>

      <p className="start__kicker">Ajedrez · Guerra apocalíptica</p>
      <h1 className="start__title">
        <span className="start__title-line">THE LAST</span>
        <span className="start__title-line start__title-line--accent">CHECKMATE</span>
      </h1>
      <p className="start__subtitle">Ashen Warfare</p>

      <div className="start__parade" aria-hidden="true">
        {PARADE.map((type) => (
          <span key={type} className="start__parade-piece">
            <PieceArt type={type} color="w" />
          </span>
        ))}
      </div>

      <section className="start__panel" aria-label="Inicio de partida">
        <div className="start__info">
          <div className="start__info-row">
            <span className="start__info-label">Escenario activo</span>
            <span className="start__info-value">{scenario.name}</span>
          </div>
          <div className="start__info-row">
            <span className="start__info-label">Dificultad</span>
            <span className="start__info-value">
              <span className="chip chip--ember">{DIFFICULTIES[settings.difficulty].label}</span>
            </span>
          </div>
          <p className="start__info-tagline">{scenario.tagline}</p>
        </div>

        <div className="start__scenario-picker">
          <span className="start__scenario-picker-label">Elige tu campo de batalla</span>
          <div className="start__scenario-choices" role="group" aria-label="Seleccionar escenario">
            {SCENARIO_LIST.map((option) => (
              <button
                key={option.id}
                type="button"
                className="start__scenario-choice"
                aria-label={`Seleccionar escenario ${option.name}`}
                aria-pressed={scenario.id === option.id}
                onClick={() => onSelectScenario(option.id)}
              >
                <span
                  className={`start__scenario-preview start__scenario-preview--${option.backdrop}`}
                  aria-hidden="true"
                />
                <span className="start__scenario-choice-name">{option.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="start__difficulty-picker">
          <span className="start__scenario-picker-label">Elige la dificultad de la IA</span>
          <div className="start__difficulty-choices" role="group" aria-label="Seleccionar dificultad de la IA">
            {DIFFICULTY_LIST.map((option) => (
              <button
                key={option.id}
                type="button"
                className="start__difficulty-choice"
                aria-label={`Elegir dificultad ${option.label}`}
                aria-pressed={settings.difficulty === option.id}
                onClick={() => onSelectDifficulty(option.id)}
              >
                <span className="start__difficulty-choice-name">{option.label}</span>
                <span className="start__difficulty-choice-description">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="button button--primary button--large"
          onClick={onPlay}
          aria-label={`Jugar en ${scenario.name}`}
        >
          <Icon name="play" size={22} />
          <span className="start__play-copy">
            <span>Jugar</span>
            <span className="start__play-scenario">{scenario.name}</span>
          </span>
        </button>
        <p className="start__hint">
          Juegas con las <strong>blancas</strong> contra la IA. Toca una pieza y después una casilla
          resaltada.
        </p>

        <div className="start__toggles">
          <Toggle
            icon="music"
            label="Música"
            description="Ambiente oscuro original"
            checked={settings.music}
            onChange={onToggleMusic}
          />
          <Toggle
            icon="sound"
            label="Efectos"
            description="Disparos, cortes y explosiones"
            checked={settings.sfx}
            onChange={onToggleSfx}
          />
          <Toggle
            icon="motion"
            label="Animaciones reducidas"
            description="Menos movimiento y efectos"
            checked={settings.reducedMotion}
            onChange={onToggleReducedMotion}
          />
        </div>
      </section>

      <footer className="start__footer">
        <Icon name="sword" size={14} />
        <span>Las armas son decorativas: se juega al ajedrez clásico.</span>
      </footer>
    </main>
  )
}
