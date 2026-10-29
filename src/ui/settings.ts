import { useCallback, useEffect, useState } from 'react'

export interface Settings {
  reducedMotion: boolean
  music: boolean
  sfx: boolean
}

const STORAGE_KEY = 'tlc.settings.v1'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function loadSettings(): Settings {
  const defaults: Settings = {
    reducedMotion: prefersReducedMotion(),
    music: true,
    sfx: true,
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : defaults.reducedMotion,
      music: typeof parsed.music === 'boolean' ? parsed.music : true,
      sfx: typeof parsed.sfx === 'boolean' ? parsed.sfx : true,
    }
  } catch {
    return defaults
  }
}

export function saveSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* modo privado o almacenamiento lleno: no es crítico */
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())

  useEffect(() => {
    saveSettings(settings)
    document.documentElement.dataset.reducedMotion = settings.reducedMotion ? 'true' : 'false'
  }, [settings])

  const toggleMusic = useCallback(() => {
    setSettings((current) => ({ ...current, music: !current.music }))
  }, [])

  const toggleSfx = useCallback(() => {
    setSettings((current) => ({ ...current, sfx: !current.sfx }))
  }, [])

  const toggleReducedMotion = useCallback(() => {
    setSettings((current) => ({ ...current, reducedMotion: !current.reducedMotion }))
  }, [])

  return { settings, toggleMusic, toggleSfx, toggleReducedMotion }
}
