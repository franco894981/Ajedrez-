/** Fondos decorativos por escenario. No alteran la partida y no cargan imágenes. */
import type { CSSProperties } from 'react'
import type { ScenarioTheme } from '../../theme/types'
import { DEFAULT_SCENARIO } from '../../theme/scenarios'

const EMBERS = Array.from({ length: 14 }, (_, index) => index)
const FALLING_PARTICLES = Array.from({ length: 22 }, (_, index) => index)

interface Props {
  scenario?: ScenarioTheme
}

export function Backdrop({ scenario = DEFAULT_SCENARIO }: Props) {
  const isCity = scenario.backdrop === 'ashen-city'
  const isShelter = scenario.backdrop === 'military-shelter'
  const isDesert = scenario.backdrop === 'post-apocalyptic-desert'

  return (
    <div
      className={`backdrop backdrop--${scenario.backdrop}`}
      data-scenario={scenario.id}
      aria-hidden="true"
    >
      <div className="backdrop__sky" />

      {isCity && <div className="backdrop__glow" />}
      {isShelter && <div className="backdrop__shelter-panels" />}
      {isDesert && (
        <>
          <div className="backdrop__desert-dunes" />
          <div className="backdrop__desert-storm" />
        </>
      )}

      {isCity && (
        <>
          <svg
            className="backdrop__ruins backdrop__ruins--far"
            viewBox="0 0 800 500"
            preserveAspectRatio="xMidYMax slice"
          >
            <path
              d="M0 500 V334 H24 V302 H38 L46 334 H70 V252 H94 V288 H120 V216 H142 V262 H172 V322
                 H196 V238 H232 V302 H260 V192 L268 178 L284 192 V288 H318 V242 H350 V332 H378 V272
                 H402 V212 H430 V302 H460 V252 H492 V332 H520 V232 H548 V288 H578 V202 H604 V302
                 H636 V252 H670 V322 H700 V242 H734 V302 H764 V262 H800 V500 Z"
            />
            <g className="backdrop__windows">
              <rect x="104" y="238" width="6" height="9" />
              <rect x="222" y="264" width="6" height="9" />
              <rect x="266" y="214" width="5" height="8" />
              <rect x="416" y="232" width="5" height="8" />
              <rect x="584" y="224" width="6" height="9" />
              <rect x="712" y="266" width="5" height="8" />
            </g>
          </svg>

          <svg
            className="backdrop__ruins backdrop__ruins--mid"
            viewBox="0 0 800 500"
            preserveAspectRatio="xMidYMax slice"
          >
            <path
              d="M0 500 V386 H40 V350 H62 V386 H96 V330 H120 V366 H150 V404 H182 V352 H204 V392
                 H238 V310 H252 L266 292 L280 310 V392 H310 V420 H346 V360 H376 V398 H404 V344
                 H438 V402 H470 V372 H500 V336 H520 V376 H552 V410 H586 V358 H612 V396 H646 V330
                 H668 V390 H704 V356 H740 V400 H774 V368 H800 V500 Z"
            />
            <g className="backdrop__struct">
              <path d="M232 392 V300 M256 300 L286 300" />
              <path d="M338 392 V352 L372 356" />
              <path d="M452 396 V336 L470 330" />
            </g>
            <g className="backdrop__smoke">
              <ellipse cx="180" cy="300" rx="90" ry="26" />
              <ellipse cx="470" cy="272" rx="120" ry="30" />
              <ellipse cx="680" cy="316" rx="80" ry="22" />
            </g>
          </svg>
        </>
      )}

      <div className={`backdrop__haze backdrop__haze--${scenario.backdrop}`} />
      <div className="backdrop__embers">
        {EMBERS.map((index) => (
          <span
            key={index}
            className="backdrop__ember"
            style={{
              left: `${6 + ((index * 17) % 88)}%`,
              animationDelay: `${(index * 1.7) % 12}s`,
              animationDuration: `${13 + (index % 5) * 3}s`,
              opacity: 0.25 + ((index % 4) * 0.12),
            }}
          />
        ))}
      </div>
      <div className="backdrop__vignette" />
      <div className="backdrop__edge-glow" />
      <div className="backdrop__ash">
        {FALLING_PARTICLES.map((index) => {
          const duration = isDesert ? 27 + (index % 4) * 3 : isShelter ? 12 + (index % 4) * 2 : 16 + (index % 5) * 2
          const delayRange = isDesert ? 34 : isShelter ? 18 : 26
          const driftMultiplier = isDesert ? 12 : isShelter ? 7 : 5
          return (
            <span
              key={index}
              className="backdrop__ash-particle"
              style={
                {
                  left: `${(index * 37 + 9) % 100}%`,
                  width: index % 6 === 0 ? '2px' : '1px',
                  height: index % 4 === 0 ? '2px' : '1px',
                  animationDelay: `${-(((index * 1.9) + 0.4) % delayRange)}s`,
                  animationDuration: `${duration}s`,
                  '--drift': `${((index % 7) - 3) * driftMultiplier}px`,
                  '--ash-opacity': `${isDesert ? 0.13 + (index % 4) * 0.035 : 0.16 + (index % 4) * 0.04}`,
                } as CSSProperties
              }
            />
          )
        })}
      </div>
    </div>
  )
}
