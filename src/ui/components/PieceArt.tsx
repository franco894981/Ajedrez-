/**
 * Arte de las piezas: silueta de ajedrez + arma característica.
 *
 * Las armas son solo decorativas: no intervienen en las reglas, los movimientos
 * ni las capturas. Cada pieza conserva su forma clásica (corona, mitra, cabeza
 * de caballo, almenas, peón) para que siga siendo reconocible.
 *
 * Los colores se aplican como atributos SVG para que el arte no dependa de
 * hojas de estilo externas.
 */
import type { Color, PieceType } from '../../game/types'
import { paletteFor, type PiecePalette } from '../../theme/piecePalettes'

interface Props {
  type: PieceType
  color: Color
  palette?: PiecePalette
}

export function PieceArt({ type, color, palette }: Props) {
  const p = palette ?? paletteFor(color)
  const stroke = { stroke: p.edge, strokeLinejoin: 'round' as const }
  return (
    <svg
      className={`art art--${type} art--${color}`}
      viewBox="0 0 120 120"
      role="presentation"
      focusable="false"
    >
      <Plinth p={p} stroke={stroke} />

      {/* Armas largas detrás de la silueta: se ven enteras sin tapar la pieza. */}
      {type === 'r' && <Bazooka p={p} stroke={stroke} />}
      {type === 'b' && <Sniper p={p} stroke={stroke} />}
      {type === 'q' && <EnergyRifle p={p} stroke={stroke} />}

      {type === 'p' && <PawnBody p={p} stroke={stroke} />}
      {type === 'r' && <RookBody p={p} stroke={stroke} />}
      {type === 'b' && <BishopBody p={p} stroke={stroke} />}
      {type === 'n' && <KnightBody p={p} stroke={stroke} />}
      {type === 'q' && <QueenBody p={p} stroke={stroke} />}
      {type === 'k' && <KingBody p={p} stroke={stroke} />}

      {/* Armas cortas en primer plano: la pieza las sostiene. */}
      {type === 'p' && <Sword p={p} stroke={stroke} />}
      {type === 'n' && <Shotgun p={p} stroke={stroke} />}
      {type === 'k' && <HeavyRevolver p={p} stroke={stroke} />}
    </svg>
  )
}

type StrokeAttrs = { stroke: string; strokeLinejoin?: 'round' | 'miter' }
type Body = (props: { p: PiecePalette; stroke: StrokeAttrs }) => React.ReactElement

function Plinth({ p, stroke }: { p: PiecePalette; stroke: StrokeAttrs }) {
  return (
    <g className="art__plinth">
      <path d="M33 99 H87 L81 112 H39 Z" fill={p.bodyDark} {...stroke} strokeWidth={2.4} />
      <rect x="37" y="96" width="46" height="6" rx="3" fill={p.body} {...stroke} strokeWidth={2.4} />
    </g>
  )
}

const PawnBody: Body = ({ p, stroke }) => (
  <g className="art__body">
    <path d="M45 99 C45 85 49 77 52 71 H68 C71 77 75 85 75 99 Z" fill={p.body} {...stroke} strokeWidth={2.4} />
    <rect x="47" y="66" width="26" height="8" rx="4" fill={p.body} {...stroke} strokeWidth={2.4} />
    <circle cx="60" cy="50" r="14" fill={p.body} {...stroke} strokeWidth={2.4} />
    <path d="M45 48 H75 L72 57 H48 Z" fill={p.bodyDark} {...stroke} strokeWidth={2.2} />
    <path d="M52 47 H68" stroke={p.edge} strokeWidth={3} strokeLinecap="round" fill="none" />
    <circle className="art__eye" cx="60" cy="52" r="2" fill={p.glow} opacity={0.75} />
  </g>
)

const RookBody: Body = ({ p, stroke }) => (
  <g className="art__body">
    <path
      d="M38 99 V50 H43 V37 H53 V50 H57 V37 H63 V50 H67 V37 H77 V50 H82 V99 Z"
      fill={p.body}
      {...stroke}
      strokeWidth={2.4}
    />
    <path d="M44 61 H76" stroke={p.bodyDark} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M46 80 H74" stroke={p.bodyDark} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M60 54 V75" stroke={p.bodyDark} strokeWidth={2.4} strokeLinecap="round" fill="none" />
  </g>
)

const BishopBody: Body = ({ p, stroke }) => (
  <g className="art__body">
    <path
      d="M42 99 C40 85 46 75 50 69 V59 H70 V69 C74 75 80 85 78 99 Z"
      fill={p.body}
      {...stroke}
      strokeWidth={2.4}
    />
    <rect x="46" y="55" width="28" height="8" rx="4" fill={p.body} {...stroke} strokeWidth={2.4} />
    <path
      d="M60 12 C72 25 78 38 72 50 C68 58 52 58 48 50 C42 38 48 25 60 12 Z"
      fill={p.body}
      {...stroke}
      strokeWidth={2.4}
    />
    <path d="M60 25 V43" stroke={p.edge} strokeWidth={3.4} strokeLinecap="round" fill="none" />
    <circle className="art__eye" cx="60" cy="47" r="2.4" fill={p.glow} />
    <path d="M48 78 H72" stroke={p.bodyDark} strokeWidth={3} strokeLinecap="round" fill="none" />
  </g>
)

const KnightBody: Body = ({ p, stroke }) => (
  <g className="art__body">
    <path
      d="M56 100 V76 C48 70 40 64 36 57 L25 53 L23 44 L35 39 C41 31 48 25 58 21
         L60 8 L68 21 L76 10 L80 27 C88 35 92 50 90 63 C88 75 86 87 86 100 Z"
      fill={p.body}
      {...stroke}
      strokeWidth={2.4}
    />
    {/* Crin dentada y correaje */}
    <path
      d="M79 28 L89 35 L83 41 L93 49 L85 55 L93 65 L85 73"
      fill="none"
      stroke={p.edge}
      strokeWidth={2}
      strokeLinejoin="round"
      opacity={0.55}
    />
    <path
      d="M44 36 L54 43 L46 50"
      fill="none"
      stroke={p.bodyDark}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
    <path d="M28 51 L32 51" stroke={p.edge} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    <circle className="art__eye" cx="47" cy="42" r="2.6" fill={p.glow} />
  </g>
)

const QueenBody: Body = ({ p, stroke }) => (
  <g className="art__body">
    <path
      d="M38 99 C34 83 42 73 48 67 V55 H72 V67 C78 73 86 83 82 99 Z"
      fill={p.body}
      {...stroke}
      strokeWidth={2.4}
    />
    <rect x="45" y="51" width="30" height="8" rx="4" fill={p.body} {...stroke} strokeWidth={2.4} />
    <path d="M42 49 L45 29 L52 39 L60 21 L68 39 L75 29 L78 49 Z" fill={p.body} {...stroke} strokeWidth={2.4} />
    <circle cx="45" cy="27" r="3.2" fill={p.accent} stroke={p.edge} strokeWidth={1.6} />
    <circle cx="60" cy="19" r="3.6" fill={p.accent} stroke={p.edge} strokeWidth={1.6} />
    <circle cx="75" cy="27" r="3.2" fill={p.accent} stroke={p.edge} strokeWidth={1.6} />
    <path d="M48 73 H72" stroke={p.bodyDark} strokeWidth={3} strokeLinecap="round" fill="none" />
  </g>
)

const KingBody: Body = ({ p, stroke }) => (
  <g className="art__body">
    <path
      d="M38 99 V64 C38 56 44 52 48 50 V38 H72 V50 C76 52 82 56 82 64 V99 Z"
      fill={p.body}
      {...stroke}
      strokeWidth={2.4}
    />
    <rect x="44" y="33" width="32" height="8" rx="3" fill={p.body} {...stroke} strokeWidth={2.4} />
    <rect x="57" y="9" width="6" height="26" rx="2" fill={p.body} {...stroke} strokeWidth={2.4} />
    <rect x="48" y="16" width="24" height="6" rx="2" fill={p.body} {...stroke} strokeWidth={2.4} />
    <path d="M46 69 H74 M46 81 H74" stroke={p.bodyDark} strokeWidth={3} strokeLinecap="round" fill="none" />
  </g>
)

/* ------------------------------------------------------------------ */
/* Armas (decorativas)                                                */
/* ------------------------------------------------------------------ */

const Sword: Body = ({ p, stroke }) => (
  <g className="art__weapon art__weapon--sword" transform="translate(76 95) rotate(28)">
    <rect x="-4" y="-16" width="8" height="16" rx="2" fill={p.weaponDark} {...stroke} strokeWidth={1.8} />
    <circle cx="0" cy="2" r="4" fill={p.weaponDark} {...stroke} strokeWidth={1.8} />
    <rect x="-13" y="-21" width="26" height="6" rx="2" fill={p.weaponDark} {...stroke} strokeWidth={1.8} />
    <path d="M-4 -21 H4 L3 -57 L0 -70 L-3 -57 Z" fill={p.weapon} {...stroke} strokeWidth={2} />
    <path d="M-3 -40 L1 -45 L3 -38 L5 -42 L4 -33 Z" fill={p.accent} opacity={0.85} />
  </g>
)

const Bazooka: Body = ({ p, stroke }) => (
  <g className="art__weapon art__weapon--bazooka" transform="translate(60 80) rotate(-16)">
    <path d="M-44 -8 L-58 -14 L-58 14 L-44 8 Z" fill={p.weaponDark} {...stroke} strokeWidth={2} />
    <rect x="-46" y="-8" width="90" height="16" rx="8" fill={p.weapon} {...stroke} strokeWidth={2} />
    <rect x="-22" y="-11" width="7" height="22" rx="3" fill={p.weaponDark} {...stroke} strokeWidth={1.8} />
    <rect x="20" y="-11" width="7" height="22" rx="3" fill={p.weaponDark} {...stroke} strokeWidth={1.8} />
    <rect x="-16" y="7" width="8" height="13" rx="2" fill={p.weaponDark} {...stroke} strokeWidth={1.8} />
    <circle cx="44" cy="0" r="6" fill={p.weaponDark} {...stroke} strokeWidth={1.8} />
    <circle cx="44" cy="0" r="2.4" fill={p.glow} opacity={0.8} />
  </g>
)

const Sniper: Body = ({ p, stroke }) => (
  <g className="art__weapon art__weapon--sniper" transform="translate(74 96) rotate(-32)">
    <path d="M-9 -12 H9 L15 9 H-2 Z" fill={p.weaponDark} {...stroke} strokeWidth={2} />
    <rect x="-5" y="-82" width="8" height="72" rx="2" fill={p.weapon} {...stroke} strokeWidth={2} />
    <rect x="-9" y="-86" width="16" height="8" rx="2" fill={p.weaponDark} {...stroke} strokeWidth={1.8} />
    <rect x="-3" y="-72" width="18" height="6" rx="2" fill={p.weapon} {...stroke} strokeWidth={1.8} />
    <rect x="-15" y="-24" width="10" height="16" rx="2" fill={p.weaponDark} {...stroke} strokeWidth={1.8} />
  </g>
)

const Shotgun: Body = ({ p, stroke }) => (
  <g className="art__weapon art__weapon--shotgun" transform="translate(62 84) rotate(-14)">
    <path d="M30 -6 H44 L52 11 H31 Z" fill={p.weaponDark} {...stroke} strokeWidth={2} />
    <rect x="-52" y="-5" width="84" height="8" rx="3" fill={p.weapon} {...stroke} strokeWidth={2} />
    <rect x="-56" y="-7" width="8" height="12" rx="2" fill={p.weaponDark} {...stroke} strokeWidth={1.8} />
    <rect x="-30" y="2" width="20" height="8" rx="3" fill={p.weaponDark} {...stroke} strokeWidth={1.8} />
    <rect x="4" y="2" width="8" height="9" rx="3" fill={p.weaponDark} {...stroke} strokeWidth={1.8} />
  </g>
)

const EnergyRifle: Body = ({ p, stroke }) => (
  <g className="art__weapon art__weapon--energy" transform="translate(34 98) rotate(-34)">
    <path d="M-7 -8 H8 L12 10 H-4 Z" fill={p.weaponDark} {...stroke} strokeWidth={2} />
    <rect x="-4" y="-82" width="8" height="76" rx="3" fill={p.weapon} {...stroke} strokeWidth={2} />
    <rect x="-9" y="-88" width="18" height="10" rx="3" fill={p.weaponDark} {...stroke} strokeWidth={1.8} />
    <circle cx="0" cy="-85" r="4" fill={p.glow} opacity={0.95} />
    <rect x="-10" y="-52" width="20" height="6" rx="2" fill={p.weaponDark} {...stroke} strokeWidth={1.8} />
    <circle cx="0" cy="-66" r="2.4" fill={p.glow} opacity={0.85} />
    <circle cx="0" cy="-58" r="2.4" fill={p.glow} opacity={0.85} />
    <circle cx="0" cy="-44" r="2.4" fill={p.glow} opacity={0.85} />
  </g>
)

const HeavyRevolver: Body = ({ p, stroke }) => (
  <g className="art__weapon art__weapon--revolver" transform="translate(80 82) rotate(-6)">
    <path d="M-12 6 L2 9 L-6 27 L-18 18 Z" fill={p.weaponDark} {...stroke} strokeWidth={2} />
    <rect x="-8" y="-5" width="42" height="10" rx="3" fill={p.weapon} {...stroke} strokeWidth={2} />
    <rect x="26" y="-6" width="8" height="12" rx="2" fill={p.weaponDark} {...stroke} strokeWidth={1.8} />
    <circle cx="0" cy="0" r="10" fill={p.weaponDark} {...stroke} strokeWidth={2} />
    <circle cx="0" cy="0" r="3" fill={p.glow} opacity={0.9} />
  </g>
)
