import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AudioEngine } from '../src/audio/AudioEngine'

class FakeAudioParam {
  value = 0
  readonly targets: number[] = []

  setValueAtTime(value: number): void {
    this.value = value
  }

  setTargetAtTime(value: number): void {
    this.targets.push(value)
    this.value = value
  }

  exponentialRampToValueAtTime(value: number): void {
    this.value = value
  }

  cancelScheduledValues(): void {}
}

class FakeAudioNode {
  connect<T extends FakeAudioNode | FakeAudioParam>(destination: T): T {
    return destination
  }

  disconnect(): void {}
}

class FakeGainNode extends FakeAudioNode {
  readonly gain = new FakeAudioParam()
}

class FakeOscillatorNode extends FakeAudioNode {
  type: OscillatorType = 'sine'
  readonly frequency = new FakeAudioParam()
  readonly detune = new FakeAudioParam()

  start(): void {}
  stop(): void {}
}

class FakeBiquadFilterNode extends FakeAudioNode {
  type: BiquadFilterType = 'lowpass'
  readonly frequency = new FakeAudioParam()
  readonly Q = new FakeAudioParam()
}

class FakeBufferSourceNode extends FakeAudioNode {
  buffer: FakeAudioBuffer | null = null
  loop = false

  start(): void {}
  stop(): void {}
}

class FakeAudioBuffer {
  private readonly data: Float32Array

  constructor(length: number) {
    this.data = new Float32Array(length)
  }

  getChannelData(): Float32Array {
    return this.data
  }
}

class FakeAudioContext {
  state: AudioContextState = 'running'
  currentTime = 0.1
  readonly sampleRate = 44100
  readonly destination = new FakeAudioNode()
  readonly gains: FakeGainNode[] = []
  readonly oscillators: FakeOscillatorNode[] = []

  createGain(): FakeGainNode {
    const node = new FakeGainNode()
    this.gains.push(node)
    return node
  }

  createOscillator(): FakeOscillatorNode {
    const node = new FakeOscillatorNode()
    this.oscillators.push(node)
    return node
  }

  createBiquadFilter(): FakeBiquadFilterNode {
    return new FakeBiquadFilterNode()
  }

  createBufferSource(): FakeBufferSourceNode {
    return new FakeBufferSourceNode()
  }

  createBuffer(_channels: number, length: number): FakeAudioBuffer {
    return new FakeAudioBuffer(length)
  }

  resume(): Promise<void> {
    this.state = 'running'
    return Promise.resolve()
  }

  suspend(): Promise<void> {
    this.state = 'suspended'
    return Promise.resolve()
  }
}

const timers = {
  setInterval: vi.fn(() => 1),
  clearInterval: vi.fn(),
  setTimeout: vi.fn(() => 1),
}

beforeEach(() => {
  timers.setInterval.mockClear()
  timers.clearInterval.mockClear()
  timers.setTimeout.mockClear()
  vi.stubGlobal('window', {
    AudioContext: FakeAudioContext,
    ...timers,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AudioEngine', () => {
  it('desbloquear Web Audio no inicia la música', () => {
    const engine = new AudioEngine()
    engine.unlock()

    expect(timers.setInterval).not.toHaveBeenCalled()
    expect(timers.setTimeout).not.toHaveBeenCalled()
  })

  it('solo genera música al activarla y atenúa los efectos mientras suena', () => {
    const engine = new AudioEngine()
    engine.unlock()
    const context = (engine as unknown as { ctx: FakeAudioContext }).ctx

    expect(context.oscillators).toHaveLength(0)
    engine.setMusicEnabled(true)

    expect(context.oscillators.length).toBeGreaterThan(0)
    expect(timers.setInterval).toHaveBeenCalledTimes(1)
    expect(context.gains[2]?.gain.targets.at(-1)).toBe(0.4)

    engine.setMusicEnabled(false)

    expect(timers.clearInterval).toHaveBeenCalledTimes(1)
    expect(context.gains[1]?.gain.targets.at(-1)).toBe(0)
    expect(context.gains[2]?.gain.targets.at(-1)).toBe(0.52)
  })
})
