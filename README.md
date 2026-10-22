# The Last Checkmate: Ashen Warfare

Prototipo jugable (etapa 1) de un ajedrez clásico contra la computadora con
presentación de guerra apocalíptica. **Las armas son decorativas**: no cambian
movimientos, capturas ni ninguna regla del ajedrez.

- Jugador con **blancas**, IA con **negras**.
- Una dificultad: **Prototipo**.
- Un escenario: **Ciudad de Ceniza**.
- Interfaz completa en español (el título se mantiene en inglés).
- 100 % local: sin servidor, sin cuentas, sin claves de API y sin conexión
  necesaria después de cargar la página.

Arte previo de las piezas: `docs/pieces-preview.png`.
Lista de comprobación para el teléfono: `docs/pruebas-en-telefono.md`.

---

## Cómo ejecutarlo

Requiere Node 20 o superior.

```bash
npm install
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build      # comprobación de tipos + paquete en dist/
npm run preview    # sirve dist/ para probar el paquete final
npm test           # pruebas automatizadas
```

Para probarlo en el teléfono durante el desarrollo: ejecuta `npm run dev` y abre
la dirección `Network` que imprime Vite (por ejemplo `http://192.168.1.20:5173`)
en el navegador del teléfono, con el teléfono en la misma red Wi-Fi.

En la vista previa de este entorno, el servidor escucha en `0.0.0.0` y acepta
cualquier host, de modo que el proxy de la vista previa puede mostrarlo.

---

## Cómo se juega

1. Pantalla inicial → **Jugar**.
2. Toca una pieza propia: aparecen sus movimientos legales.
   - Punto claro = movimiento normal.
   - Marco de brasa = captura legal.
3. Toca la casilla destino. Si es una captura, se reproduce el efecto del arma
   de tu pieza y al terminar la pieza atacante ocupa la casilla.
4. La IA responde automáticamente. Mientras se resuelve una jugada (animación o
   pensamiento de la IA) el tablero está bloqueado para impedir jugadas
   duplicadas.
5. Al promocionar, aparece un selector con reina, torre, alfil y caballo.
6. **Nueva partida** pide confirmación si hay una partida en curso.

Controles adicionales: ajustes de música, efectos y **animaciones reducidas**;
botón de inicio; panel de resultado con **Nueva partida**.

---

## Reglas implementadas

La lógica vive en `src/game/engine.ts` y delega en **chess.js 1.4.0**
(BSD-2-Clause), una biblioteca mantenida. No hay reglas "improvisadas".

| Regla | Estado |
| --- | --- |
| Posición inicial y turnos alternos | ✅ `chess.js` |
| Movimientos legales de todas las piezas | ✅ `chess.js` |
| Capturas normales | ✅ |
| Prohibición de dejar al propio rey en jaque (incluidas clavadas) | ✅ |
| Jaque y jaque mate (la partida termina; el rey nunca se captura) | ✅ |
| Enroque corto y largo con todas sus restricciones | ✅ |
| Captura al paso | ✅ |
| Promoción con elección de reina, torre, alfil o caballo | ✅ |
| Ahogado | ✅ automático |
| Material insuficiente | ✅ automático |
| Regla de 75 movimientos (150 semijugadas) | ✅ automático |
| Repetición quíntuple | ✅ automático |
| Triple repetición (FIDE 9.2) | ⚠️ **reclamable**: aparece el botón «Triple repetición» cuando el jugador tiene el turno |
| Regla de 50 movimientos (FIDE 9.3) | ⚠️ **reclamable**: aparece el botón «Regla de 50 movimientos» |
| Tablas por acuerdo | ⛔ no aplica (un solo jugador humano) |

`chess.js` no distingue condiciones automáticas de reclamables; el motor del
juego las separa en `GameSession.getStatus()`:

- **Automáticas** (`automatic: true`): ahogado, material insuficiente, 75
  movimientos, repetición quíntuple, jaque mate.
- **Reclamables** (`automatic: false`): triple repetición y 50 movimientos, solo
  cuando el jugador tiene el turno, tal como indican los artículos 9.2 y 9.3.

### Limitaciones de reglas conocidas

- La reclamación de tablas **solo está disponible para el jugador humano**: la
  IA nunca reclama. En una posición donde la IA pudiera reclamar, la partida
  sigue hasta una condición automática. Es una simplificación de esta etapa.
- No se admiten tablas por acuerdo ni por posición muerta declarada por el
  árbitro (no aplica en un juego local de un jugador).
- No hay detección de "posición de mate imposible" más allá de lo que cubre
  `chess.js` (`isInsufficientMaterial`).
- No hay historial de jugadas navegable, deshacer ni guardado de partidas.

---

## Inteligencia artificial

Archivos: `src/game/ai/search.ts`, `evaluate.ts`, `ai.worker.ts`, `aiClient.ts`.

- **Negamax con poda alfa-beta**, profundidad 2 + búsqueda de capturas
  (quiescence) y ordenación de jugadas, con presupuesto de tiempo de ~1,1 s y
  profundización iterativa.
- **Evaluación**: material, tablas posicionales por pieza, seguridad del rey
  (escudo de peones, rey alejado de su fila), pareja de alfiles, peones doblados
  y aislados, y amenazas inmediatas (piezas valiosas atacadas por cada bando).
- **Web Worker** (`ai.worker.ts`): el cálculo no bloquea la interfaz. Si el
  navegador no puede crear el worker, `aiClient` cae a cálculo en el hilo
  principal cediendo el control antes de empezar.
- La IA mueve con el turno que corresponde y **solo movimientos legales**: la
  propuesta del worker se valida de nuevo con `chess.js` al aplicarla. Si algo
  fallara, existe un respaldo con una jugada legal aleatoria.
- Hay un desempate aleatorio (semilla) entre jugadas de valor equivalente para
  que las partidas no sean idénticas.

**Nivel real:** es un rival sencillo, de aficionado. No tiene aperturas ni
finales, no ve más de dos jugadas de profundidad y no se ha medido con partidas
contra otros motores ni con rating Elo. La etiqueta «Prototipo» es deliberada:
**no** se afirma un nivel de ajedrez concreto.

---

## Dirección artística y animaciones

- Paleta de ceniza, metal, óxido y brasas; el tablero es el elemento con más
  contraste y el fondo queda atenuado (`src/styles/backdrop.css`).
- Escenario 1: **Ciudad de Ceniza** — ruinas lejanas, humo, brasas y resplandor
  bajo. Definido en `src/theme/scenarios/ashenCity.ts`.
- Los escenarios son solo datos (`ScenarioTheme`): paleta + tipo de fondo. Para
  añadir otro escenario basta con crear un archivo en `src/theme/scenarios/`,
  registrarlo en `index.ts` y pasar la variable CSS correspondiente.
- Bandos diferenciados por color **y** por forma: blancas en marfil y acero,
  negras en metal ennegrecido y óxido, con ojos de brasa.
- Armas por pieza: peón espada oxidada · torre bazuca · alfil rifle de
  francotirador · caballo escopeta · dama rifle de energía · rey revólver
  pesado. Se dibujan detrás/entre la silueta para no tapar la pieza.

Efectos de captura (`src/ui/effects/`), breves y distintos:

| Atacante | Efecto |
| --- | --- |
| Peón | Corte de espada (dos trazos) |
| Torre | Proyectil y explosión localizada |
| Alfil | Línea de disparo de precisión e impacto |
| Caballo | Salto en arco + fogonazo de escopeta al capturar |
| Dama | Rayo de energía |
| Rey | Fogonazo de revólver y trazadora |

Los destellos son de escala local (aprox. una casilla, con una expansión breve)
y se dibujan por debajo de las piezas para no ocultar sus siluetas. Las
explosiones son solo visuales: nunca eliminan piezas adicionales. No hay
disparos independientes del movimiento, daño de área, fuego amigo, munición ni
vida.

**Animaciones reducidas** (`Ajustes` o `prefers-reduced-motion`): traslados
instantáneos, efectos de ~140 ms y fondo sin brasas ni pulsos.

### Cómo se garantiza que la animación no desincroniza

- `GameSession` aplica la jugada y la registra **antes** de cualquier efecto.
- El tablero se dibuja siempre desde `snapshot.pieces` (estado lógico). La
  animación es un `transform` sobre piezas ya colocadas en su casilla final.
- La pieza capturada se muestra desvaneciéndose como "fantasma" temporal que no
  existe en el estado.
- El bloqueo (`locked`) impide toques y también rechaza movimientos directos
  del motor o de la IA hasta terminar; el temporizador se cancela al reiniciar.

---

## Sonido

- **Todo el audio es original y se sintetiza en el dispositivo** con Web Audio
  (`src/audio/AudioEngine.ts`): drone grave con viento, pulsos y campanas
  lejanas; efectos de movimiento, corte, explosión, disparo, jaque, promoción y
  resultado.
- Se inicia **solo tras una interacción** (botón Jugar o primer toque), como
  exigen los navegadores móviles.
- Controles independientes de música y efectos en la pantalla inicial y en
  Ajustes; se guardan en `localStorage`.
- Se pausa al ocultar la pestaña.
- **Pendiente / mejorable:** no hay pistas musicales grabadas ni mezcla
  dinámica. `AudioEngine` está preparado para sustituir la síntesis por archivos
  propios (bastaría cargar buffers y usar la misma API `play(kind)`).
  *No he podido escuchar el audio en un dispositivo real*: verifica el volumen y
  el equilibrio en tu teléfono.

---

## Estructura del proyecto

```
index.html                  Punto de entrada (viewport móvil, manifiesto, tema)
public/
  icon.svg                  Icono original
  manifest.webmanifest      Manifiesto (instalable en Android)
src/
  main.tsx                  Arranque de React
  App.tsx                   Composición: fondo, pantallas, audio, tema
  game/                     LÓGICA (sin React ni DOM)
    types.ts                Tipos compartidos
    engine.ts               GameSession: reglas, turnos, estado, fin de partida
    ai/
      evaluate.ts           Evaluación estática
      search.ts             Negamax alfa-beta, niveles, aleatoriedad
      ai.worker.ts          Worker de cálculo
      aiClient.ts           Puente worker / respaldo en hilo principal
  ui/                       INTERFAZ
    useGame.ts              Controlador: turnos, bloqueo, animación, IA
    settings.ts             Ajustes persistentes
    endText.ts              Textos de resultado en español
    components/             Board, PieceArt, pantallas, diálogos
    effects/                Movimiento y efectos por arma
  theme/                    ESTILOS POR ESCENARIO
    types.ts                Contrato ScenarioTheme
    scenarios/              ashenCity.ts (escenario 1)
    applyTheme.ts           Paleta → variables CSS
  audio/AudioEngine.ts      AUDIO sintetizado
  styles/                   tokens, base, fondo, tablero, piezas, efectos, UI
tests/
  engine.test.ts            Reglas y estados especiales (28 pruebas)
  ai.test.ts                Legalidad y comportamiento de la IA (10 pruebas)
  ui.flow.test.tsx          Flujo de interfaz y textos de resultado (9 pruebas)
  components.test.tsx       Tablero, promoción y panel de resultado (6 pruebas)
  worker.test.ts            Contrato del worker, respaldo y duraciones (4 pruebas)
scripts/
  render-pieces.tsx         Utilidad: genera docs/pieces-preview.png
docs/
  pieces-preview.png        Vista previa del arte de las piezas
  pruebas-en-telefono.md    Lista de comprobación para probar en Android
```

La separación pedida se respeta: **reglas** (`src/game/`), **IA**
(`src/game/ai/`), **interfaz** (`src/ui/`) y **animaciones**
(`src/ui/effects/`, CSS). El único sentido de dependencia es
`ui → game → chess.js`; `game` nunca importa de `ui`.

---

## Pruebas automatizadas

```bash
npm test
```

Cubren, entre otras cosas:

- 32 piezas al inicio, turnos alternos, no poder mover piezas rivales.
- La IA no puede mover fuera de turno ni proponer jugadas ilegales.
- Pieza clavada y jaque: no se permite dejar el propio rey en jaque.
- Jaque mate ≠ ahogado (resultados distintos), material insuficiente.
- Enroque (con casilla atacada), captura al paso, promoción con elección.
- Tablas automáticas (75 movimientos) frente a reclamables (50 movimientos,
  triple repetición).
- Reinicio que devuelve la posición inicial.
- Bloqueo durante la animación: no se duplican jugadas.
- Flujo de interfaz: inicio, selección, movimiento, respuesta de la IA,
  confirmación de reinicio, ajustes.
- Componentes: 32 casillas claras y 32 oscuras, marcas de movimiento y captura,
  rey en jaque, tablero deshabilitado durante la animación, diálogo de promoción
  con las cuatro piezas, textos de resultado.
- Worker de la IA: contrato de mensajes, respaldo sin worker y duración de
  animaciones.

No sustituyen a probar en un teléfono real: jsdom no reproduce animaciones,
audio ni comportamiento táctil del sistema.

---

## Preparado para Android (sin configurar todavía)

- Build estático en `dist/` con rutas relativas (`base: './'`), apto para
  cargarse desde un `WebView` local.
- Manifiesto web (`display: standalone`, icono SVG) y metadatos de app móvil.
  Todavía **no** hay service worker, así que el navegador puede no ofrecer la
  instalación como PWA.
- Sin dependencias de servidor ni de red en tiempo de ejecución.
- Viewport con `viewport-fit=cover` y `env(safe-area-inset-*)` para muescas.

Camino recomendado cuando toque empaquetar (no ejecutado en esta etapa):

```bash
npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/android
npx cap init "The Last Checkmate" com.tu.dominio.lastcheckmate --web-dir=dist
npm run build && npx cap add android && npx cap sync
```

No se ha generado ningún APK, ni anuncios, ni pagos, ni publicación.

---

## Limitaciones y errores conocidos de esta versión

1. **No he podido ver la interfaz en un navegador real ni en un teléfono.**
   Este entorno no tiene navegador gráfico. Sí he ejecutado compilación de
   tipos, empaquetado, las 57 pruebas automatizadas (incluidas pruebas de flujo
   con jsdom) y he servido la app con Vite. El aspecto visual, el tacto y el
   audio deben validarse en tu teléfono.
2. El audio no se ha escuchado en dispositivo: el volumen y el equilibrio
   música/efectos pueden necesitar ajuste.
3. IA de aficionado: no ve más de dos jugadas, no tiene aperturas ni finales y
   puede repetir jugadas en posiciones cerradas. La IA no reclama tablas.
4. Solo un escenario y una dificultad (por diseño en esta etapa).
5. Las animaciones son 2D estilizadas con SVG/CSS; no hay animaciones de
   personajes ni arte rasterizado.
6. Sin guardado de partida: recargar la página vuelve al inicio.
7. En pantallas muy altas el tablero se limita por el ancho y queda espacio
   vertical; en pantallas muy pequeñas (menos de ~560 px de alto) la cabecera y
   el pie se comprimen.
8. Accesibilidad parcial: hay etiquetas ARIA por casilla y foco visible, pero no
   navegación completa por teclado del tablero ni lector de pantalla probado.

---

## Próximos pasos sugeridos

1. Validar en dispositivo y ajustar tamaños, contraste y audio.
2. Escenarios adicionales reutilizando `ScenarioTheme`.
3. Animaciones de captura más ricas (partículas, escombros) sin tocar la lógica.
4. Segundo nivel de IA (profundidad 3 + aperturas ligeras) con medición real.
5. Historial de jugadas y deshacer.
6. Empaquetado con Capacitor y firma del APK cuando se decida.
