# Dependencias y licencias

Todas las dependencias se instalan desde npm y se incluyen en el paquete final
(no se carga ninguna biblioteca desde una URL remota).

## Dependencias de ejecución

| Paquete | Versión | Licencia | Uso |
| --- | --- | --- | --- |
| [chess.js](https://github.com/jhlywa/chess.js) | 1.4.0 | **BSD-2-Clause** | Reglas de ajedrez: generación de movimientos legales, jaque, jaque mate, ahogado, enroque, captura al paso, promoción, material insuficiente, repetición y regla de 50 movimientos. |
| [react](https://react.dev) | 19.3.1 | **MIT** | Interfaz. |
| [react-dom](https://react.dev) | 19.3.1 | **MIT** | Render de la interfaz en el navegador. |

`chess.js` incluye su aviso de copyright BSD-2-Clause en
`node_modules/chess.js/LICENSE` y en el encabezado de sus tipos. Es compatible
con uso comercial siempre que se conserve el aviso de copyright y la licencia.

## Dependencias de desarrollo (no se envían al jugador)

| Paquete | Versión | Licencia | Uso |
| --- | --- | --- | --- |
| vite | 8.3.5 | MIT | Servidor de desarrollo y empaquetado. |
| @vitejs/plugin-react | 6.1.2 | MIT | Transformación de JSX. |
| typescript | 7.0.2 | Apache-2.0 | Comprobación de tipos. |
| vitest | 5.0.5 | MIT | Pruebas automatizadas. |
| jsdom | 30.1.3 | MIT | DOM simulado para las pruebas de interfaz. |
| @testing-library/react | 16.3.3 | MIT | Pruebas de flujo de interfaz. |
| @testing-library/dom | 10.4.2 | MIT | Utilidades de consulta del DOM. |
| @resvg/resvg-js | 2.6.2 | MPL-2.0 | Solo para generar `docs/pieces-preview.png`. |

## Arte y audio

- **Arte de piezas y fondo** (`src/ui/components/PieceArt.tsx`, `Backdrop.tsx`,
  `public/icon.svg`): dibujado para este proyecto con SVG. No usa imágenes de
  terceros ni emojis.
- **Audio** (`src/audio/AudioEngine.ts`): música y efectos sintetizados en
  tiempo real con Web Audio API. No incluye canciones, samples ni audio de otros
  videojuegos.
- **Fuentes**: se usan pilas de fuentes del sistema (`Iowan Old Style`,
  `Palatino`, `Georgia`, `system-ui`), sin descargar tipografías.

Antes de publicar, decide una licencia para el código del proyecto y añade un
archivo `LICENSE`. El aviso de `chess.js` debe mantenerse.
