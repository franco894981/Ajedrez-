/**
 * Capa de reglas del juego.
 *
 * Toda la lógica de ajedrez vive aquí. La interfaz, las animaciones y la IA
 * consumen esta clase y nunca mueven piezas por su cuenta.
 *
 * Reglas delegadas en `chess.js` (BSD-2-Clause): generación de movimientos
 * legales (incluye enroque, captura al paso, promoción, clavadas y jaque),
 * jaque mate, ahogado y material insuficiente.
 *
 * Sobre las tablas, `chess.js` mezcla condiciones automáticas y reclamables.
 * Aquí se separan explícitamente:
 *   - Automáticas: ahogado, material insuficiente, regla de 75 movimientos
 *     (150 semijugadas) y repetición quíntuple.
 *   - Reclamables por el jugador: triple repetición y regla de 50 movimientos
 *     (100 semijugadas), conforme a los artículos 9.2 y 9.3 de la FIDE.
 */
import { Chess, type Move, type PieceSymbol, type Square as ChessSquare } from 'chess.js'
import {
  ALL_SQUARES,
  type AppliedMove,
  type ClaimableDraws,
  type Color,
  type EndReason,
  type GameEnd,
  type GameResult,
  type GameSnapshot,
  type GameStatus,
  type LegalTarget,
  type MoveInput,
  type MoveOutcome,
  type PendingPromotion,
  type PieceMotion,
  type PieceOnBoard,
  type PieceType,
  type Square,
} from './types'

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const PROMOTION_CHOICES: PieceType[] = ['q', 'r', 'b', 'n']

function isPromotionType(value: string): value is PieceType {
  return value === 'q' || value === 'r' || value === 'b' || value === 'n'
}

function opposite(color: Color): Color {
  return color === 'w' ? 'b' : 'w'
}

/** Clave de posición para la repetición: tablero, turno, enroque y al paso. */
export function repetitionKey(fen: string): string {
  const parts = fen.trim().split(/\s+/)
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`
}

export class GameSession {
  private chess: Chess
  private readonly initialFen: string
  private pieces: PieceOnBoard[] = []
  private nextPieceId = 1
  private positionCounts = new Map<string, number>()
  private lastMove: { from: Square; to: Square } | null = null
  private history: string[] = []
  private selected: Square | null = null
  private legalTargets: LegalTarget[] = []
  private pendingPromotion: PendingPromotion | null = null
  private motion: PieceMotion | null = null
  private claimedEnd: GameEnd | null = null
  private lastApplied: AppliedMove | null = null
  private revision = 0
  /** Bloqueo de la interfaz durante animaciones; la lógica también lo respeta. */
  private locked = false
  private readonly humanColor: Color

  constructor(fen: string = START_FEN, options: { humanColor?: Color } = {}) {
    this.initialFen = fen
    this.humanColor = options.humanColor ?? 'w'
    this.chess = new Chess(fen)
    this.syncPieces()
    this.registerPosition()
  }

  // ---------------------------------------------------------------------
  // Consultas
  // ---------------------------------------------------------------------

  getSnapshot(): GameSnapshot {
    return {
      fen: this.chess.fen(),
      pieces: this.pieces.map((piece) => ({ ...piece })),
      status: this.getStatus(),
      selected: this.selected,
      legalTargets: this.legalTargets.map((target) => ({ ...target })),
      lastMove: this.lastMove ? { ...this.lastMove } : null,
      history: [...this.history],
      pendingPromotion: this.pendingPromotion ? { ...this.pendingPromotion } : null,
      motion: this.motion ? { ...this.motion } : null,
      revision: this.revision,
    }
  }

  getFen(): string {
    return this.chess.fen()
  }

  /** Último movimiento aplicado, con datos para la interfaz y las animaciones. */
  getLastApplied(): AppliedMove | null {
    return this.lastApplied ? { ...this.lastApplied } : null
  }

  getHumanColor(): Color {
    return this.humanColor
  }

  getTurn(): Color {
    return this.chess.turn()
  }

  isLocked(): boolean {
    return this.locked
  }

  setLocked(value: boolean): void {
    this.locked = value
  }

  /** Limpia la información de animación; la posición lógica no cambia. */
  clearMotion(): void {
    if (this.motion) {
      this.motion = null
      this.revision += 1
    }
  }

  getStatus(): GameStatus {
    const fen = this.chess.fen()
    const halfmoveClock = Number.parseInt(fen.split(' ')[4] ?? '0', 10) || 0
    const moveNumber = Number.parseInt(fen.split(' ')[5] ?? '1', 10) || 1
    const turn = this.chess.turn()
    const key = repetitionKey(fen)
    const repetitions = this.positionCounts.get(key) ?? 1

    const automaticEnd = this.detectAutomaticEnd(repetitions, halfmoveClock)
    const end = this.claimedEnd ?? automaticEnd

    const claimable: ClaimableDraws = end
      ? { threefoldRepetition: false, fiftyMoveRule: false }
      : {
          // Solo se pueden reclamar si el jugador tiene el turno (FIDE 9.2/9.3).
          threefoldRepetition: repetitions >= 3 && turn === this.humanColor,
          fiftyMoveRule: halfmoveClock >= 100 && turn === this.humanColor,
        }

    return {
      turn,
      inCheck: this.chess.inCheck(),
      isOver: end !== null,
      end,
      halfmoveClock,
      claimable,
      moveNumber,
    }
  }

  /** Todos los movimientos legales de una casilla, con metadatos para la UI. */
  getLegalTargets(square: Square): LegalTarget[] {
    const piece = this.chess.get(square as ChessSquare)
    if (!piece) return []
    const moves = this.chess.moves({ square: square as ChessSquare, verbose: true })
    const bySquare = new Map<Square, LegalTarget>()
    for (const move of moves) {
      const target = move.to as Square
      const existing = bySquare.get(target)
      const capture = move.isCapture()
      const isPromotion = move.isPromotion()
      const castling = move.isKingsideCastle() ? 'k' : move.isQueensideCastle() ? 'q' : null
      if (existing) {
        existing.promotion = existing.promotion || isPromotion
        existing.capture = existing.capture || capture
        continue
      }
      bySquare.set(target, {
        square: target,
        capture,
        enPassant: move.isEnPassant(),
        castling,
        promotion: isPromotion,
      })
    }
    return [...bySquare.values()]
  }

  getAllLegalMoves(): AppliedMove[] {
    return this.chess.moves({ verbose: true }).map((move) => ({
      from: move.from as Square,
      to: move.to as Square,
      color: move.color,
      piece: move.piece as PieceType,
      promotion: move.promotion as PieceType | undefined,
      castling: move.isKingsideCastle() ? 'k' : move.isQueensideCastle() ? 'q' : null,
      enPassant: move.isEnPassant(),
      san: move.san,
      check: false,
      checkmate: false,
      ...(move.captured ? { captured: { type: move.captured as PieceType, square: move.to as Square, id: -1 } } : {}),
    }))
  }

  // ---------------------------------------------------------------------
  // Interacción del jugador (blancas)
  // ---------------------------------------------------------------------

  /**
   * Punto de entrada táctil: seleccionar, cambiar de selección o ejecutar un
   * movimiento. Devuelve true si la acción cambió el estado.
   */
  tapSquare(square: Square): boolean {
    if (this.locked || this.pendingPromotion) return false
    const status = this.getStatus()
    if (status.isOver) return false
    if (status.turn !== this.humanColor) return false

    const piece = this.chess.get(square as ChessSquare)

    if (this.selected && square !== this.selected) {
      const target = this.legalTargets.find((candidate) => candidate.square === square)
      if (target) {
        if (target.promotion) {
          this.pendingPromotion = {
            from: this.selected,
            to: square,
            color: this.humanColor,
            choices: [...PROMOTION_CHOICES],
          }
          this.revision += 1
          return true
        }
        return this.applyMove({ from: this.selected, to: square }, this.humanColor).ok
      }
    }

    if (piece && piece.color === this.humanColor) {
      if (this.selected === square) {
        this.clearSelection()
        this.revision += 1
        return true
      }
      this.selected = square
      this.legalTargets = this.getLegalTargets(square)
      this.revision += 1
      return true
    }

    if (this.selected) {
      this.clearSelection()
      this.revision += 1
      return true
    }
    return false
  }

  choosePromotion(type: PieceType): MoveOutcome {
    const pending = this.pendingPromotion
    if (!pending) return { ok: false, error: 'promotion-required' }
    if (!isPromotionType(type)) return { ok: false, error: 'promotion-required' }
    this.pendingPromotion = null
    const outcome = this.applyMove({ from: pending.from, to: pending.to, promotion: type }, pending.color)
    if (!outcome.ok) {
      // Si algo falló, no dejamos la partida bloqueada por un diálogo fantasma.
      this.revision += 1
    }
    return outcome
  }

  cancelPromotion(): void {
    if (!this.pendingPromotion) return
    this.pendingPromotion = null
    this.clearSelection()
    this.revision += 1
  }

  // ---------------------------------------------------------------------
  // Movimientos (jugador o IA), siempre validados por chess.js
  // ---------------------------------------------------------------------

  applyMove(input: MoveInput, byColor: Color): MoveOutcome {
    if (this.getStatus().isOver) return { ok: false, error: 'game-over' }
    if (this.chess.turn() !== byColor) return { ok: false, error: 'not-your-turn' }

    const piece = this.chess.get(input.from as ChessSquare)
    if (!piece) return { ok: false, error: 'no-piece' }
    if (piece.color !== byColor) return { ok: false, error: 'opponent-piece' }

    const legal = this.chess
      .moves({ square: input.from as ChessSquare, verbose: true })
      .filter((move) => move.to === input.to)
    if (legal.length === 0) return { ok: false, error: 'illegal-move' }
    const needsPromotion = legal.some((move) => move.isPromotion())
    const chosen = input.promotion
    if (needsPromotion && !chosen) {
      return { ok: false, error: 'promotion-required' }
    }
    const matched =
      legal.find((move) => (chosen ? move.promotion === chosen : !move.isPromotion())) ?? null
    if (!matched) return { ok: false, error: 'illegal-move' }

    const applied = this.commitMove(matched)
    return { ok: true, move: applied }
  }

  /** La IA solo puede mover negras y solo si es su turno. */
  playAIMove(input: MoveInput): MoveOutcome {
    return this.applyMove(input, opposite(this.humanColor))
  }

  claimDraw(kind: 'threefold' | 'fifty-move'): boolean {
    const status = this.getStatus()
    if (status.isOver) return false
    if (status.turn !== this.humanColor) return false
    if (kind === 'threefold' && !status.claimable.threefoldRepetition) return false
    if (kind === 'fifty-move' && !status.claimable.fiftyMoveRule) return false
    this.claimedEnd = {
      result: '1/2-1/2',
      reason: kind === 'threefold' ? 'claim-threefold' : 'claim-fifty-move',
      winner: null,
      automatic: false,
    }
    this.revision += 1
    return true
  }

  /** Reinicio total: posición inicial, sin selección y sin historial. */
  reset(): void {
    this.chess = new Chess(this.initialFen)
    this.positionCounts.clear()
    this.pieces = []
    this.nextPieceId = 1
    this.lastMove = null
    this.history = []
    this.selected = null
    this.legalTargets = []
    this.pendingPromotion = null
    this.motion = null
    this.claimedEnd = null
    this.lastApplied = null
    this.locked = false
    this.revision += 1
    this.syncPieces()
    this.registerPosition()
  }

  // ---------------------------------------------------------------------
  // Internos
  // ---------------------------------------------------------------------

  private commitMove(move: Move): AppliedMove {
    const moving = this.findPiece(move.from as Square)
    const capturedPiece = this.findCapturedPiece(move)
    this.chess.move({
      from: move.from,
      to: move.to,
      ...(move.promotion ? { promotion: move.promotion } : {}),
    })

    if (!moving) {
      // No debería ocurrir, pero reconstruimos desde el tablero para no
      // desincronizar la lógica con la representación.
      this.pieces = []
      this.nextPieceId = 1
      this.syncPieces()
    } else {
      if (capturedPiece) this.pieces = this.pieces.filter((piece) => piece.id !== capturedPiece.id)
      this.movePieceOnBoard(moving.id, move.to as Square)
      if (move.promotion) {
        const promoted = this.pieces.find((piece) => piece.id === moving.id)
        if (promoted) promoted.type = move.promotion as PieceType
      }
      if (move.isKingsideCastle() || move.isQueensideCastle()) {
        const rank = move.color === 'w' ? '1' : '8'
        const rookFrom = (move.isKingsideCastle() ? `h${rank}` : `a${rank}`) as Square
        const rookTo = (move.isKingsideCastle() ? `f${rank}` : `d${rank}`) as Square
        const rook = this.findPiece(rookFrom)
        if (rook) this.movePieceOnBoard(rook.id, rookTo)
      }
    }

    this.lastMove = { from: move.from as Square, to: move.to as Square }
    this.history.push(move.san)
    this.clearSelection()
    this.pendingPromotion = null
    this.selected = null
    this.legalTargets = []
    this.registerPosition()

    this.motion = {
      pieceId: moving?.id ?? -1,
      from: move.from as Square,
      to: move.to as Square,
      pieceType: moving?.type ?? (move.piece as PieceType),
      color: move.color,
      captured: Boolean(capturedPiece),
      capturedPieceType: capturedPiece?.type ?? null,
      castling: move.isKingsideCastle() ? 'k' : move.isQueensideCastle() ? 'q' : null,
      enPassant: move.isEnPassant(),
    }
    this.revision += 1

    const applied: AppliedMove = {
      from: move.from as Square,
      to: move.to as Square,
      color: move.color,
      piece: move.piece as PieceType,
      ...(capturedPiece
        ? { captured: { type: capturedPiece.type, square: capturedPiece.square, id: capturedPiece.id } }
        : {}),
      ...(move.promotion ? { promotion: move.promotion as PieceType } : {}),
      castling: move.isKingsideCastle() ? 'k' : move.isQueensideCastle() ? 'q' : null,
      enPassant: move.isEnPassant(),
      san: move.san,
      check: this.chess.inCheck(),
      checkmate: this.chess.isCheckmate(),
    }
    this.lastApplied = applied
    return applied
  }

  /** Devuelve la pieza capturada, incluida la del paso (que no está en `to`). */
  private findCapturedPiece(move: Move): PieceOnBoard | null {
    if (move.isEnPassant()) {
      const file = move.to[0]
      const rank = move.from[1]
      return this.findPiece(`${file}${rank}` as Square)
    }
    if (!move.captured) return null
    return this.findPiece(move.to as Square)
  }

  private findPiece(square: Square): PieceOnBoard | null {
    return this.pieces.find((piece) => piece.square === square) ?? null
  }

  private movePieceOnBoard(id: number, square: Square): void {
    const piece = this.pieces.find((candidate) => candidate.id === id)
    if (piece) piece.square = square
  }

  private clearSelection(): void {
    this.selected = null
    this.legalTargets = []
  }

  private registerPosition(): void {
    const key = repetitionKey(this.chess.fen())
    this.positionCounts.set(key, (this.positionCounts.get(key) ?? 0) + 1)
  }

  private syncPieces(): void {
    const board = this.chess.board()
    const pieces: PieceOnBoard[] = []
    for (const row of board) {
      for (const cell of row) {
        if (!cell) continue
        pieces.push({
          id: this.nextPieceId++,
          type: cell.type as PieceType,
          color: cell.color,
          square: cell.square as Square,
        })
      }
    }
    // Orden estable por casilla para ids deterministas.
    pieces.sort((a, b) => ALL_SQUARES.indexOf(a.square) - ALL_SQUARES.indexOf(b.square))
    this.pieces = pieces
  }

  private detectAutomaticEnd(repetitions: number, halfmoveClock: number): GameEnd | null {
    const turn = this.chess.turn()
    const draw = (reason: EndReason): GameEnd => ({
      result: '1/2-1/2',
      reason,
      winner: null,
      automatic: true,
    })
    const win = (winner: Color, reason: EndReason): GameEnd => ({
      result: winner === 'w' ? ('1-0' as GameResult) : ('0-1' as GameResult),
      reason,
      winner,
      automatic: true,
    })

    if (this.chess.isCheckmate()) return win(opposite(turn), 'checkmate')
    if (this.chess.isStalemate()) return draw('stalemate')
    if (this.chess.isInsufficientMaterial()) return draw('insufficient-material')
    if (halfmoveClock >= 150) return draw('seventy-five-move')
    if (repetitions >= 5) return draw('fivefold-repetition')
    return null
  }
}

export const PIECE_NAMES: Record<PieceType, string> = {
  p: 'peón',
  n: 'caballo',
  b: 'alfil',
  r: 'torre',
  q: 'dama',
  k: 'rey',
}

export const PIECE_NAMES_PLURAL: Record<PieceType, string> = {
  p: 'peones',
  n: 'caballos',
  b: 'alfiles',
  r: 'torres',
  q: 'damas',
  k: 'reyes',
}

export type { PieceSymbol }
