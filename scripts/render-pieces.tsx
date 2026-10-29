import { renderToStaticMarkup } from 'react-dom/server'
import { Resvg } from '@resvg/resvg-js'
import { writeFileSync } from 'node:fs'
import { PieceArt } from '../src/ui/components/PieceArt'
import type { PieceType } from '../src/game/types'

const types: PieceType[] = ['p', 'r', 'n', 'b', 'q', 'k']
const cells: string[] = []
for (const [row, color] of ['w', 'b'].entries()) {
  for (const [col, type] of types.entries()) {
    const x = col * 140 + 10
    const y = row * 166 + 12
    const art = renderToStaticMarkup(<PieceArt type={type} color={color as 'w' | 'b'} />)
    const inner = art.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
    const bg = (row + col) % 2 === 0 ? '#6b6156' : '#332d28'
    cells.push(
      `<g transform="translate(${x} ${y})">
        <rect width="120" height="120" rx="8" fill="${bg}"/>
        ${inner}
        <text x="60" y="146" font-size="14" fill="#f4eee3" text-anchor="middle" font-family="Georgia">${type} · ${color === 'w' ? 'blancas' : 'negras'}</text>
      </g>`,
    )
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="860" height="360" viewBox="0 0 860 360">
  <rect width="860" height="360" fill="#0b0a09"/>
  ${cells.join('\n')}
</svg>`

const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1720 } })
writeFileSync('/home/user/Ajedrez-/docs/pieces-preview.png', resvg.render().asPng())
writeFileSync('/home/user/Ajedrez-/docs/pieces-preview.svg', svg)
console.log('ok')
