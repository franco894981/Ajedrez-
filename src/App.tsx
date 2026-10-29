import { useEffect } from 'react'
import { Backdrop } from './ui/components/Backdrop'
import { GameScreen } from './ui/components/GameScreen'
import { StartScreen } from './ui/components/StartScreen'
import { useSettings } from './ui/settings'
import { useGame } from './ui/useGame'
import { audio } from './audio/AudioEngine'
import { DEFAULT_SCENARIO } from './theme/scenarios'
import { applyTheme } from './theme/applyTheme'

export default function App() {
  const { settings, toggleMusic, toggleSfx, toggleReducedMotion } = useSettings()
  const game = useGame(settings)

  // Escenario único de esta etapa: su paleta se vuelca en variables CSS.
  useEffect(() => {
    applyTheme(DEFAULT_SCENARIO)
  }, [])

  // Desbloquea Web Audio para los efectos tras un gesto, sin iniciar música.
  // La banda sonora se activa únicamente desde Jugar o el control Música.
  useEffect(() => {
    const unlock = () => audio.unlock()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    audio.setSfxEnabled(settings.sfx)
  }, [settings.sfx])

  // Si la pestaña pasa a segundo plano, se pausa el audio para ahorrar batería.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) audio.suspend()
      else if (settings.music || settings.sfx) audio.resume()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [settings.music, settings.sfx])

  const handlePlay = () => {
    audio.unlock()
    audio.setMusicEnabled(settings.music)
    game.startNewGame()
  }
  const handleToggleMusic = () => {
    audio.unlock()
    audio.setMusicEnabled(!settings.music)
    toggleMusic()
  }
  const handleToggleSfx = () => {
    audio.unlock()
    toggleSfx()
  }

  return (
    <div className="app" data-screen={game.screen}>
      <Backdrop />
      {game.screen === 'inicio' ? (
        <StartScreen
          settings={settings}
          onPlay={handlePlay}
          onToggleMusic={handleToggleMusic}
          onToggleSfx={handleToggleSfx}
          onToggleReducedMotion={toggleReducedMotion}
        />
      ) : (
        <GameScreen
          game={game}
          settings={settings}
          onToggleMusic={handleToggleMusic}
          onToggleSfx={handleToggleSfx}
          onToggleReducedMotion={toggleReducedMotion}
        />
      )}
    </div>
  )
}
