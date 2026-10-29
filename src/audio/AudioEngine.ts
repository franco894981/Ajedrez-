/**
 * Audio original del prototipo, generado en tiempo real con Web Audio.
 *
 * - La música y los efectos se sintetizan en este archivo; no se descargan
 *   pistas ni muestras externas.
 * - El contexto de audio solo se crea tras un gesto del usuario. La música,
 *   además, solo empieza al pulsar "Jugar" o activar el control Música.
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

const MASTER_LEVEL = 0.68
const MUSIC_BUS_LEVEL = 0.32
const SFX_LEVEL = 0.52
const SFX_DUCKED_LEVEL = 0.4
const MUSIC_BEAT_SECONDS = 1.25

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
      this.unlocked = true
      if (this.ctx.state === 'suspended') this.resume()
      return
    }
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = MASTER_LEVEL
    this.master.connect(ctx.destination)

    // El bus de música siempre nace en silencio: desbloquear el audio no inicia
    // la banda sonora. Solo Jugar o activar el interruptor la pone en marcha.
    this.musicBus = ctx.createGain()
    this.musicBus.gain.value = 0
    this.musicBus.connect(this.master)

    this.sfxBus = ctx.createGain()
    this.sfxBus.gain.value = this.sfxEnabled ? SFX_LEVEL : 0
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
    if (ctx.state === 'suspended') this.resume()
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled
    if (!this.ctx || !this.musicBus) return
    const now = this.ctx.currentTime
    this.musicBus.gain.cancelScheduledValues(now)
    this.musicBus.gain.setTargetAtTime(enabled ? MUSIC_BUS_LEVEL : 0, now, enabled ? 0.45 : 0.18)
    if (enabled) this.startMusic()
    else this.stopMusicNodes()
    this.updateSfxBus()
  }

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled
    this.updateSfxBus(0.08)
  }

  suspend(): void {
    const ctx = this.ctx
    if (ctx?.state !== 'running') return
    void ctx.suspend()
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer)
      this.musicTimer = null
    }
  }

  resume(): void {
    const ctx = this.ctx
    if (ctx?.state !== 'suspended') return
    void ctx
      .resume()
      .then(() => this.startMusicScheduler())
      .catch(() => {
        // Algunos navegadores no permiten reanudar hasta un nuevo gesto.
      })
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
    const bus = this.musicBus
    if (!ctx || !bus || !this.musicEnabled || this.musicNodes || !this.noiseBuffer) return

    const now = ctx.currentTime
    const droneFilter = ctx.createBiquadFilter()
    droneFilter.type = 'lowpass'
    droneFilter.frequency.value = 220
    droneFilter.Q.value = 0.7

    const droneGain = ctx.createGain()
    droneGain.gain.setValueAtTime(0.0001, now)
    droneGain.gain.setTargetAtTime(0.55, now, 1.1)

    // Subgrave D1 y dos capas ásperas, filtradas para no castigar el altavoz.
    const droneA = ctx.createOscillator()
    droneA.type = 'sine'
    droneA.frequency.value = 36.71 // D1
    const droneB = ctx.createOscillator()
    droneB.type = 'triangle'
    droneB.frequency.value = 55 // A1
    const droneC = ctx.createOscillator()
    droneC.type = 'sawtooth'
    droneC.frequency.value = 73.42 // D2
    droneC.detune.value = -5
    const tension = ctx.createOscillator()
    tension.type = 'sine'
    tension.frequency.value = 103.83 // G#2: tritono que mantiene la tensión

    const droneGainA = ctx.createGain()
    droneGainA.gain.value = 0.42
    const droneGainB = ctx.createGain()
    droneGainB.gain.value = 0.14
    const droneGainC = ctx.createGain()
    droneGainC.gain.value = 0.075
    const tensionGain = ctx.createGain()
    tensionGain.gain.value = 0.028

    droneA.connect(droneGainA).connect(droneFilter)
    droneB.connect(droneGainB).connect(droneFilter)
    droneC.connect(droneGainC).connect(droneFilter)
    tension.connect(tensionGain).connect(droneFilter)
    droneFilter.connect(droneGain).connect(bus)

    // Movimiento muy lento del filtro y del tono agudo: ambiente vivo sin
    // oscilaciones rápidas ni carga gráfica.
    const filterLfo = ctx.createOscillator()
    filterLfo.frequency.value = 0.055
    const filterLfoGain = ctx.createGain()
    filterLfoGain.gain.value = 68
    filterLfo.connect(filterLfoGain).connect(droneFilter.frequency)

    const tensionLfo = ctx.createOscillator()
    tensionLfo.frequency.value = 0.11
    const tensionLfoGain = ctx.createGain()
    tensionLfoGain.gain.value = 0.012
    tensionLfo.connect(tensionLfoGain).connect(tensionGain.gain)

    // Ruido marrón filtrado: viento distante, no una muestra descargada.
    const wind = ctx.createBufferSource()
    wind.buffer = this.noiseBuffer
    wind.loop = true
    const windFilter = ctx.createBiquadFilter()
    windFilter.type = 'bandpass'
    windFilter.frequency.value = 390
    windFilter.Q.value = 0.55
    const windGain = ctx.createGain()
    windGain.gain.setValueAtTime(0.0001, now)
    windGain.gain.setTargetAtTime(0.07, now, 1.4)
    wind.connect(windFilter).connect(windGain).connect(bus)

    const sources: AudioScheduledSourceNode[] = [droneA, droneB, droneC, tension, filterLfo, tensionLfo, wind]
    const nodes: AudioNode[] = [
      droneFilter,
      droneGain,
      droneGainA,
      droneGainB,
      droneGainC,
      tensionGain,
      filterLfoGain,
      tensionLfoGain,
      windFilter,
      windGain,
    ]
    for (const source of sources) source.start(now)

    this.musicNodes = {
      stop: () => {
        const stopAt = ctx.currentTime
        droneGain.gain.setTargetAtTime(0.0001, stopAt, 0.22)
        windGain.gain.setTargetAtTime(0.0001, stopAt, 0.22)
        tensionGain.gain.setTargetAtTime(0.0001, stopAt, 0.18)
        filterLfoGain.gain.setTargetAtTime(0, stopAt, 0.05)
        tensionLfoGain.gain.setTargetAtTime(0, stopAt, 0.05)
        window.setTimeout(() => {
          for (const source of sources) {
            try {
              source.stop()
            } catch {
              /* ya detenido */
            }
          }
          for (const node of nodes) {
            try {
              node.disconnect()
            } catch {
              /* ya desconectado */
            }
          }
        }, 850)
      },
    }

    this.beatIndex = 0
    this.startMusicScheduler()
    this.updateSfxBus()
  }

  private startMusicScheduler(): void {
    if (!this.ctx || !this.musicNodes || !this.musicEnabled || this.musicTimer !== null) return
    this.nextBeat = this.ctx.currentTime + 0.3
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 150)
  }

  private stopMusicNodes(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer)
      this.musicTimer = null
    }
    this.musicNodes?.stop()
    this.musicNodes = null
    this.updateSfxBus()
  }

  private updateSfxBus(timeConstant = 0.12): void {
    const ctx = this.ctx
    const bus = this.sfxBus
    if (!ctx || !bus) return
    const musicIsPlaying = this.musicEnabled && this.musicNodes !== null
    const level = !this.sfxEnabled ? 0 : musicIsPlaying ? SFX_DUCKED_LEVEL : SFX_LEVEL
    const now = ctx.currentTime
    bus.gain.cancelScheduledValues(now)
    bus.gain.setTargetAtTime(level, now, timeConstant)
  }

  private scheduleMusic(): void {
    const ctx = this.ctx
    if (!ctx || !this.musicBus || !this.musicEnabled || ctx.state !== 'running') return
    const horizon = ctx.currentTime + 0.5
    while (this.nextBeat <= horizon) {
      const t = this.nextBeat
      const beat = this.beatIndex % 8
      if (beat % 2 === 0) {
        this.musicThump(t, beat === 0 || beat === 4 ? 0.56 : 0.4)
      } else {
        this.musicMetalHit(t, beat === 1 || beat === 5 ? 0.48 : 0.36)
      }
      if (beat === 3) this.musicBell(t + 0.16, 293.66, 0.6) // D4
      if (beat === 7) this.musicBell(t + 0.16, 233.08, 0.62) // Bb3
      this.nextBeat += MUSIC_BEAT_SECONDS
      this.beatIndex = (beat + 1) % 8
    }
  }

  private musicThump(t: number, strength: number): void {
    const ctx = this.ctx
    const bus = this.musicBus
    if (!ctx || !bus || !this.noiseBuffer) return

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(62, t)
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.48)
    const body = ctx.createGain()
    body.gain.setValueAtTime(0.0001, t)
    body.gain.exponentialRampToValueAtTime(0.62 * strength, t + 0.025)
    body.gain.exponentialRampToValueAtTime(0.0001, t + 0.68)
    osc.connect(body).connect(bus)
    osc.onended = () => {
      osc.disconnect()
      body.disconnect()
    }
    osc.start(t)
    osc.stop(t + 0.72)

    const grit = ctx.createBufferSource()
    grit.buffer = this.noiseBuffer
    const gritFilter = ctx.createBiquadFilter()
    gritFilter.type = 'lowpass'
    gritFilter.frequency.setValueAtTime(210, t)
    gritFilter.frequency.exponentialRampToValueAtTime(95, t + 0.24)
    const gritGain = ctx.createGain()
    gritGain.gain.setValueAtTime(0.0001, t)
    gritGain.gain.exponentialRampToValueAtTime(0.19 * strength, t + 0.012)
    gritGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.27)
    grit.connect(gritFilter).connect(gritGain).connect(bus)
    grit.onended = () => {
      grit.disconnect()
      gritFilter.disconnect()
      gritGain.disconnect()
    }
    grit.start(t, Math.random() * 0.7, 0.3)
  }

  private musicMetalHit(t: number, strength: number): void {
    const ctx = this.ctx
    const bus = this.musicBus
    if (!ctx || !bus) return

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1500
    filter.Q.value = 0.65
    filter.connect(bus)
    const partials = [
      { frequency: 137, level: 0.34, decay: 0.48 },
      { frequency: 204, level: 0.22, decay: 0.62 },
      { frequency: 319, level: 0.13, decay: 0.78 },
      { frequency: 487, level: 0.07, decay: 0.9 },
    ]
    let remaining = partials.length
    for (const [index, partial] of partials.entries()) {
      const osc = ctx.createOscillator()
      osc.type = index < 2 ? 'triangle' : 'sine'
      osc.frequency.value = partial.frequency
      if (index > 0) osc.detune.value = index % 2 === 0 ? -7 : 5
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(partial.level * strength, t + 0.009)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + partial.decay)
      osc.connect(gain).connect(filter)
      osc.onended = () => {
        osc.disconnect()
        gain.disconnect()
        remaining -= 1
        if (remaining === 0) filter.disconnect()
      }
      osc.start(t)
      osc.stop(t + partial.decay + 0.04)
    }
  }

  private musicBell(t: number, freq: number, strength: number): void {
    const ctx = this.ctx
    const bus = this.musicBus
    if (!ctx || !bus) return
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1500
    filter.Q.value = 0.55
    filter.connect(bus)
    const partials = [
      { ratio: 1, level: 0.15 },
      { ratio: 2.01, level: 0.055 },
      { ratio: 2.76, level: 0.022 },
    ]
    let remaining = partials.length
    for (const [index, partial] of partials.entries()) {
      const osc = ctx.createOscillator()
      osc.type = index === 0 ? 'triangle' : 'sine'
      osc.frequency.value = freq * partial.ratio
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(partial.level * strength, t + 0.045)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.6)
      osc.connect(gain).connect(filter)
      osc.onended = () => {
        osc.disconnect()
        gain.disconnect()
        remaining -= 1
        if (remaining === 0) filter.disconnect()
      }
      osc.start(t)
      osc.stop(t + 2.72)
    }
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
