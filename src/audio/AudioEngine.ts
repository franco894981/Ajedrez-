/**
 * Audio original del prototipo, generado en tiempo real con Web Audio.
 *
 * - No usa canciones ni samples de terceros: todos los sonidos y la música se
 *   sintetizan aquí, así que la licencia es la del propio proyecto.
 * - El contexto de audio solo se crea tras una interacción del usuario
 *   (botón "Jugar" o primer toque), como exigen los navegadores móviles.
 * - Estructura preparada para sustituir la síntesis por archivos propios:
 *   basta con asignar buffers en `loadSamples()` y mantener la misma API.
 */
export type SfxKind =
  | 'ui'
  | 'select'
  | 'move'
  | 'capture-pawn'
  | 'capture-rook'
  | 'capture-bishop'
  | 'capture-knight'
  | 'capture-queen'
  | 'capture-king'
  | 'check'
  | 'promotion'
  | 'win'
  | 'lose'
  | 'draw'

export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicBus: GainNode | null = null
  private sfxBus: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private musicTimer: number | null = null
  private musicNodes: { stop: () => void } | null = null
  private nextBeat = 0
  private beatIndex = 0
  private musicEnabled = true
  private sfxEnabled = true
  private unlocked = false

  get isUnlocked(): boolean {
    return this.unlocked
  }

  /** Debe llamarse desde un gesto del usuario. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      this.unlocked = true
      return
    }
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = 0.6
    this.master.connect(ctx.destination)

    this.musicBus = ctx.createGain()
    this.musicBus.gain.value = this.musicEnabled ? 0.22 : 0
    this.musicBus.connect(this.master)

    this.sfxBus = ctx.createGain()
    this.sfxBus.gain.value = this.sfxEnabled ? 0.55 : 0
    this.sfxBus.connect(this.master)

    const length = Math.floor(ctx.sampleRate * 1.2)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1
      // Ruido ligeramente "marronizado": más cuerpo y menos siseo.
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
    this.noiseBuffer = buffer
    this.unlocked = true
    if (ctx.state === 'suspended') void ctx.resume()
    if (this.musicEnabled) this.startMusic()
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled
    if (!this.ctx || !this.musicBus) return
    const now = this.ctx.currentTime
    this.musicBus.gain.cancelScheduledValues(now)
    this.musicBus.gain.setTargetAtTime(enabled ? 0.22 : 0, now, 0.25)
    if (enabled && !this.musicTimer) this.startMusic()
    if (!enabled) this.stopMusicNodes()
  }

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled
    if (!this.ctx || !this.sfxBus) return
    const now = this.ctx.currentTime
    this.sfxBus.gain.cancelScheduledValues(now)
    this.sfxBus.gain.setTargetAtTime(enabled ? 0.55 : 0, now, 0.05)
  }

  suspend(): void {
    if (this.ctx?.state === 'running') void this.ctx.suspend()
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') void this.ctx.resume()
  }

  // -------------------------------------------------------------------
  // Efectos
  // -------------------------------------------------------------------

  play(kind: SfxKind): void {
    const ctx = this.ctx
    const bus = this.sfxBus
    if (!ctx || !bus || !this.sfxEnabled || ctx.state !== 'running') return
    const t = ctx.currentTime + 0.01
    switch (kind) {
      case 'ui':
        this.tone(t, 420, 0.06, 0.12, 'triangle', 700)
        break
      case 'select':
        this.tone(t, 320, 0.09, 0.16, 'sine', 480)
        break
      case 'move':
        this.noise(t, 0.12, 0.22, 900, 'lowpass')
        this.tone(t, 130, 0.12, 0.16, 'sine', 90)
        break
      case 'capture-pawn':
        this.noise(t, 0.16, 0.3, 3200, 'highpass')
        this.tone(t + 0.02, 900, 0.18, 0.12, 'sawtooth', 300)
        break
      case 'capture-rook':
        this.noise(t, 0.5, 0.5, 550, 'lowpass')
        this.tone(t, 90, 0.55, 0.35, 'sine', 38)
        this.tone(t + 0.03, 160, 0.25, 0.12, 'square', 60)
        break
      case 'capture-bishop':
        this.noise(t, 0.18, 0.35, 2600, 'highpass')
        this.tone(t, 1500, 0.1, 0.1, 'square', 500)
        break
      case 'capture-knight':
        this.noise(t, 0.28, 0.45, 1400, 'lowpass')
        this.tone(t, 120, 0.2, 0.3, 'triangle', 55)
        break
      case 'capture-queen':
        this.tone(t, 1100, 0.35, 0.32, 'sawtooth', 180)
        this.tone(t + 0.02, 550, 0.4, 0.2, 'square', 120)
        this.noise(t, 0.3, 0.22, 3000, 'highpass')
        break
      case 'capture-king':
        this.noise(t, 0.3, 0.4, 2000, 'highpass')
        this.tone(t, 200, 0.3, 0.24, 'square', 70)
        break
      case 'check':
        this.tone(t, 196, 0.5, 0.2, 'sawtooth', 185)
        this.tone(t + 0.18, 147, 0.7, 0.16, 'sine', 140)
        break
      case 'promotion':
        this.tone(t, 392, 0.18, 0.2, 'triangle')
        this.tone(t + 0.12, 523, 0.28, 0.2, 'triangle')
        this.tone(t + 0.24, 784, 0.4, 0.16, 'sine')
        break
      case 'win':
        this.tone(t, 262, 0.3, 0.26, 'triangle')
        this.tone(t + 0.22, 392, 0.35, 0.24, 'triangle')
        this.tone(t + 0.46, 523, 0.9, 0.22, 'sine')
        break
      case 'lose':
        this.tone(t, 220, 0.5, 0.26, 'sawtooth', 110)
        this.tone(t + 0.3, 147, 1.1, 0.22, 'sine', 98)
        break
      case 'draw':
        this.tone(t, 262, 0.7, 0.2, 'sine')
        this.tone(t + 0.1, 311, 0.8, 0.16, 'sine')
        break
    }
  }

  // -------------------------------------------------------------------
  // Música generativa (ambiente oscuro, sin muestras externas)
  // -------------------------------------------------------------------

  startMusic(): void {
    const ctx = this.ctx
    if (!ctx || !this.musicBus || this.musicNodes) return
    const bus = this.musicBus

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 360
    filter.Q.value = 1.2

    const droneGain = ctx.createGain()
    droneGain.gain.value = 0.0
    droneGain.gain.setTargetAtTime(0.55, ctx.currentTime, 2)

    const oscA = ctx.createOscillator()
    oscA.type = 'sawtooth'
    oscA.frequency.value = 73.42 // D2
    const oscB = ctx.createOscillator()
    oscB.type = 'sine'
    oscB.frequency.value = 110 // A2
    const oscC = ctx.createOscillator()
    oscC.type = 'triangle'
    oscC.frequency.value = 146.83 // D3
    oscC.detune.value = -7

    const gainA = ctx.createGain()
    gainA.gain.value = 0.35
    const gainB = ctx.createGain()
    gainB.gain.value = 0.22
    const gainC = ctx.createGain()
    gainC.gain.value = 0.1

    oscA.connect(gainA).connect(filter)
    oscB.connect(gainB).connect(filter)
    oscC.connect(gainC).connect(filter)
    filter.connect(droneGain).connect(bus)

    // LFO muy lento sobre el filtro para que el drone respire.
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.045
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 130
    lfo.connect(lfoGain).connect(filter.frequency)

    // Viento de fondo.
    const wind = ctx.createBufferSource()
    wind.buffer = this.noiseBuffer
    wind.loop = true
    const windFilter = ctx.createBiquadFilter()
    windFilter.type = 'bandpass'
    windFilter.frequency.value = 520
    windFilter.Q.value = 0.6
    const windGain = ctx.createGain()
    windGain.gain.value = 0.05
    wind.connect(windFilter).connect(windGain).connect(bus)

    oscA.start()
    oscB.start()
    oscC.start()
    lfo.start()
    wind.start()

    this.musicNodes = {
      stop: () => {
        const now = ctx.currentTime
        droneGain.gain.setTargetAtTime(0, now, 0.3)
        windGain.gain.setTargetAtTime(0, now, 0.3)
        setTimeout(() => {
          try {
            oscA.stop()
            oscB.stop()
            oscC.stop()
            lfo.stop()
            wind.stop()
          } catch {
            /* ya detenidos */
          }
          droneGain.disconnect()
          windGain.disconnect()
        }, 900)
      },
    }

    this.nextBeat = ctx.currentTime + 0.5
    this.beatIndex = 0
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 240)
  }

  private stopMusicNodes(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer)
      this.musicTimer = null
    }
    this.musicNodes?.stop()
    this.musicNodes = null
  }

  private scheduleMusic(): void {
    const ctx = this.ctx
    const bus = this.musicBus
    if (!ctx || !bus) return
    const horizon = ctx.currentTime + 0.8
    while (this.nextBeat < horizon) {
      const t = this.nextBeat
      const beat = this.beatIndex
      // Pulso grave cada dos tiempos, campana lejana cada ocho.
      if (beat % 2 === 0) this.musicThump(t)
      if (beat % 8 === 4) this.musicBell(t, 587.33) // D5
      if (beat % 8 === 6) this.musicBell(t, 466.16) // Bb4
      this.nextBeat += 1.8
      this.beatIndex = (beat + 1) % 64
    }
  }

  private musicThump(t: number): void {
    const ctx = this.ctx
    const bus = this.musicBus
    if (!ctx || !bus) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(58, t)
    osc.frequency.exponentialRampToValueAtTime(34, t + 0.5)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.5, t + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
    osc.connect(gain).connect(bus)
    osc.start(t)
    osc.stop(t + 1)
  }

  private musicBell(t: number, freq: number): void {
    const ctx = this.ctx
    const bus = this.musicBus
    if (!ctx || !bus) return
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.09, t + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.4)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1800
    osc.connect(filter).connect(gain).connect(bus)
    osc.start(t)
    osc.stop(t + 3.6)
  }

  // -------------------------------------------------------------------
  // Primitivas
  // -------------------------------------------------------------------

  private tone(
    t: number,
    freq: number,
    duration: number,
    volume: number,
    type: OscillatorType = 'sine',
    endFreq?: number,
  ): void {
    const ctx = this.ctx
    const bus = this.sfxBus
    if (!ctx || !bus) return
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + duration)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.connect(gain).connect(bus)
    osc.start(t)
    osc.stop(t + duration + 0.05)
  }

  private noise(
    t: number,
    duration: number,
    volume: number,
    cutoff: number,
    type: BiquadFilterType,
  ): void {
    const ctx = this.ctx
    const bus = this.sfxBus
    if (!ctx || !bus || !this.noiseBuffer) return
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.setValueAtTime(cutoff, t)
    if (type === 'lowpass') {
      filter.frequency.exponentialRampToValueAtTime(Math.max(80, cutoff * 0.25), t + duration)
    }
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    src.connect(filter).connect(gain).connect(bus)
    src.start(t, Math.random() * 0.4, duration + 0.1)
  }
}

export const audio = new AudioEngine()
