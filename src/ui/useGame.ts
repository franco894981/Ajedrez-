/**
 * Controlador de la partida para la interfaz.
 *
 * - La lógica (`GameSession`) es la única fuente de verdad; aquí solo se
 *   orquestan bloqueos, animaciones, sonido y turnos.
 * - Durante una animación la sesión queda bloqueada: no se pueden duplicar
 *   movimientos ni adelantar el turno de la IA.
 * - La IA piensa en un Web Worker y su propuesta se valida otra vez al aplicarla.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { GameSession } from '../game/engine'
import { AIClient } from '../game/ai/aiClient'
import type { AppliedMove, Color, MoveOutcome, PieceMotion, PieceType, Square } from '../game/types'
import { audio } from '../audio/AudioEngine'
import type { Settings } from './settings'
import { moveDuration } from './effects/motion'

export type Screen = 'inicio' | 'partida'
export type ConfirmKind = 'restart' | 'menu'

export interface ActiveMove {
  key: number
  motion: PieceMotion
  applied: AppliedMove
}

const HUMAN_COLOR: Color = 'w'
const AI_COLOR: Color = 'b'

/** La IA completa cualquier promoción automática con una dama. */
export function resolveAIPromotion(promotion?: PieceType): PieceType | undefined {
  return promotion ? 'q' : undefined
}

export function useGame(settings: Settings) {
  const sessionRef = useRef<GameSession | null>(null)
  if (!sessionRef.current) {
    sessionRef.current = new GameSession(undefined, { humanColor: HUMAN_COLOR })
  }
  const session = sessionRef.current

  const clientRef = useRef<AIClient | null>(null)
  if (!clientRef.current) clientRef.current = new AIClient()

  const [screen, setScreen] = useState<Screen>('inicio')
  const [snapshot, setSnapshot] = useState(() => session.getSnapshot())
  const [activeMove, setActiveMove] = useState<ActiveMove | null>(null)
  const [busy, setBusy] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const busyRef = useRef(false)
  const aiThinkingRef = useRef(false)
  const aiRequestRef = useRef(0)
  const gameIdRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const effectKeyRef = useRef(0)
  const aliveRef = useRef(true)

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      clientRef.current?.dispose()
    }
  }, [])

  const refresh = useCallback(() => {
    if (!aliveRef.current) return
    setSnapshot(session.getSnapshot())
  }, [session])

  const playEndSound = useCallback((outcome: MoveOutcome | null) => {
    const end = session.getStatus().end
    if (!end) return
    if (end.reason === 'checkmate') {
      audio.play(end.winner === HUMAN_COLOR ? 'win' : 'lose')
    } else {
      audio.play('draw')
    }
    void outcome
  }, [session])

  /** Arranca el bloqueo de animación y lo libera cuando termina. */
  const finishMove = useCallback(
    (applied: AppliedMove) => {
      const nextSnapshot = session.getSnapshot()
      setSnapshot(nextSnapshot)
      const motion = nextSnapshot.motion
      if (!motion) {
        session.setLocked(false)
        return
      }

      effectKeyRef.current += 1
      setActiveMove({ key: effectKeyRef.current, motion, applied })
      busyRef.current = true
      setBusy(true)
      session.setLocked(true)

      if (applied.captured) {
        audio.play(`capture-${applied.captured.type}` as Parameters<typeof audio.play>[0])
      } else {
        audio.play('move')
      }
      if (applied.check && !applied.checkmate) window.setTimeout(() => audio.play('check'), 220)

      const duration = moveDuration(applied, settingsRef.current.reducedMotion)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        if (!aliveRef.current) return
        session.clearMotion()
        session.setLocked(false)
        busyRef.current = false
        setBusy(false)
        setActiveMove(null)
        setSnapshot(session.getSnapshot())
        const status = session.getStatus()
        if (status.isOver) playEndSound(null)
      }, duration)
    },
    [playEndSound, session],
  )

  const handleSquareTap = useCallback(
    (square: Square) => {
      if (screen !== 'partida') return
      if (busyRef.current || aiThinkingRef.current) return
      if (session.getSnapshot().pendingPromotion) return
      const status = session.getStatus()
      if (status.isOver || status.turn !== HUMAN_COLOR) return

      const before = session.getSnapshot()
      const changed = session.tapSquare(square)
      if (!changed) return

      const after = session.getSnapshot()
      if (after.history.length > before.history.length) {
        const applied = session.getLastApplied()
        if (applied) finishMove(applied)
        return
      }
      setSnapshot(after)
      if (after.selected || after.pendingPromotion) audio.play('select')
    },
    [finishMove, screen, session],
  )

  const choosePromotion = useCallback(
    (type: PieceType) => {
      if (busyRef.current) return
      const outcome = session.choosePromotion(type)
      if (outcome.ok && outcome.move) {
        audio.play('promotion')
        finishMove(outcome.move)
      } else {
        refresh()
      }
    },
    [finishMove, refresh, session],
  )

  const cancelPromotion = useCallback(() => {
    session.cancelPromotion()
    refresh()
  }, [refresh, session])

  const startNewGame = useCallback(() => {
    audio.unlock()
    gameIdRef.current += 1
    aiRequestRef.current += 1
    clientRef.current?.cancelAll()
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    session.reset()
    session.setLocked(false)
    aiThinkingRef.current = false
    busyRef.current = false
    setAiThinking(false)
    setBusy(false)
    setActiveMove(null)
    setConfirm(null)
    setNotice(null)
    setScreen('partida')
    setSnapshot(session.getSnapshot())
    audio.play('ui')
  }, [session])

  const requestRestart = useCallback(() => {
    const status = session.getStatus()
    const inProgress = session.getSnapshot().history.length > 0 && !status.isOver
    if (inProgress) setConfirm('restart')
    else startNewGame()
  }, [session, startNewGame])

  const requestMenu = useCallback(() => {
    const status = session.getStatus()
    const inProgress = session.getSnapshot().history.length > 0 && !status.isOver
    if (inProgress) setConfirm('menu')
    else {
      setScreen('inicio')
      setSettingsOpen(false)
      audio.play('ui')
    }
  }, [session])

  const confirmAction = useCallback(() => {
    const action = confirm
    setConfirm(null)
    if (action === 'restart') {
      startNewGame()
    } else if (action === 'menu') {
      gameIdRef.current += 1
      aiRequestRef.current += 1
      clientRef.current?.cancelAll()
      session.reset()
      busyRef.current = false
      aiThinkingRef.current = false
      setBusy(false)
      setAiThinking(false)
      setActiveMove(null)
      setScreen('inicio')
      setSnapshot(session.getSnapshot())
      audio.play('ui')
    }
  }, [confirm, session, startNewGame])

  const cancelConfirm = useCallback(() => setConfirm(null), [])

  const claimDraw = useCallback(
    (kind: 'threefold' | 'fifty-move') => {
      if (session.claimDraw(kind)) {
        refresh()
        window.setTimeout(() => audio.play('draw'), 60)
        return true
      }
      return false
    },
    [refresh, session],
  )

  // ---------------------------------------------------------------
  // Turno de la IA
  // ---------------------------------------------------------------
  useEffect(() => {
    if (screen !== 'partida' || busy || aiThinkingRef.current) return
    if (snapshot.pendingPromotion) return
    if (snapshot.status.isOver || snapshot.status.turn !== AI_COLOR) return

    const requestId = (aiRequestRef.current += 1)
    const gameId = gameIdRef.current
    const fen = snapshot.fen
    const client = clientRef.current
    aiThinkingRef.current = true
    setAiThinking(true)

    const fallback = (): MoveOutcome | null => {
      const legal = session.getAllLegalMoves()
      if (legal.length === 0) return null
      const pick = legal[Math.floor(Math.random() * legal.length)]
      return session.playAIMove({
        from: pick.from,
        to: pick.to,
        promotion: resolveAIPromotion(pick.promotion),
      })
    }

    const isCurrent = () => aliveRef.current && gameId === gameIdRef.current && requestId === aiRequestRef.current

    client
      ?.think(fen, 'prototipo', { seed: (gameId * 7919 + snapshot.status.moveNumber * 131) >>> 0 })
      .then((result) => {
        if (!isCurrent()) return
        let outcome: MoveOutcome | null = null
        if (result?.move) {
          outcome = session.playAIMove({
            from: result.move.from as Square,
            to: result.move.to as Square,
            promotion: resolveAIPromotion(result.move.promotion as PieceType | undefined),
          })
        }
        if (!outcome?.ok) outcome = fallback()
        if (!outcome?.ok || !outcome.move) {
          setNotice('La IA no encontró una jugada válida. Usa «Nueva partida».')
          setAiThinking(false)
          aiThinkingRef.current = false
          return
        }
        finishMove(outcome.move)
      })
      .catch(() => {
        if (!isCurrent()) return
        const outcome = fallback()
        if (outcome?.ok && outcome.move) finishMove(outcome.move)
        else {
          setNotice('La IA no pudo jugar. Usa «Nueva partida».')
        }
      })
      .finally(() => {
        if (gameId !== gameIdRef.current) return
        aiThinkingRef.current = false
        if (aliveRef.current) setAiThinking(false)
      })
  }, [screen, busy, snapshot, session, finishMove])

  // Aviso de jaque con sonido propio (una sola vez por posición).
  const checkNoticeKey = `${snapshot.fen}`
  const lastCheckRef = useRef<string>('')
  useEffect(() => {
    if (snapshot.status.inCheck && !snapshot.status.isOver && lastCheckRef.current !== checkNoticeKey) {
      lastCheckRef.current = checkNoticeKey
      if (snapshot.status.turn === HUMAN_COLOR && !busy) audio.play('check')
    }
  }, [checkNoticeKey, snapshot.status.inCheck, snapshot.status.isOver, snapshot.status.turn, busy])

  const humanInCheck = snapshot.status.inCheck && snapshot.status.turn === HUMAN_COLOR && !snapshot.status.isOver
  const aiInCheck = snapshot.status.inCheck && snapshot.status.turn === AI_COLOR && !snapshot.status.isOver

  return {
    screen,
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
    dismissNotice: () => setNotice(null),
  }
}
