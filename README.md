# The Last Checkmate: Ashen Warfare

Prototipo jugable de ajedrez clásico contra la computadora, con presentación de
guerra apocalíptica y tres escenarios visuales. **Las armas son decorativas**: no cambian
movimientos, capturas ni ninguna regla del ajedrez.

- Jugador con **blancas**, IA con **negras**.
- Dos dificultades locales: **Prototipo** y **Veterano**.
- Tres escenarios visuales seleccionables: **Ciudad de Ceniza**, **Refugio Militar** y
  **Desierto Postapocalíptico**.
- Interfaz completa en español (el título se mantiene en inglés).
- 100 % local: sin servidor, sin cuentas, sin claves de API y sin conexión
  necesaria después de cargar la página.

Arte previo de las piezas: `docs/pieces-preview.png`.
Lista de comprobación para el teléfono: `docs/pruebas-en-telefono.md`.

---

## Cómo ejecutarlo

Requiere Node 20 o superior.

```bash
npm ci
npm run dev -- --host 0.0.0.0  # desarrollo y acceso desde la red local
npm run build      # comprobación de tipos + paquete en dist/
npm run preview    # sirve dist/ para probar el paquete final
npm test           # pruebas automatizadas
```

Para probarlo en el teléfono durante el desarrollo: ejecuta
`npm run dev -- --host 0.0.0.0`, conecta teléfono y computadora a la misma Wi-Fi y
abre en el móvil la dirección `Network` que imprime Vite.

En la vista previa de este entorno, el servidor escucha en `0.0.0.0` y acepta
cualquier host, de modo que el proxy de la vista previa puede mostrarlo.

---

## Cómo se juega

1. En la pantalla inicial elige escenario y dificultad (**Prototipo** o **Veterano**); después pulsa **Jugar**.
2. Toca una pieza propia: aparecen sus movimientos legales.
   - Punto claro = movimiento normal.
   - Marco de brasa = captura legal.
3. Toca la casilla destino. La pieza se desliza en unos 220 ms; si captura, el
   efecto del arma empieza al aterrizar.
4. La IA responde automáticamente en la dificultad elegida. Mientras se resuelve
   una jugada (deslizamiento, efecto o búsqueda) el tablero queda bloqueado.
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

Archivos: `src/game/ai/difficulty.ts`, `search.ts`, `evaluate.ts`, `ai.worker.ts` y `aiClient.ts`.

- **Negamax con poda alfa-beta**, búsqueda de capturas (quiescence), ordenación
  de jugadas y profundización iterativa.
- **Prototipo**: profundidad 2, quiescence 3 y presupuesto de ~1,1 s.
- **Veterano**: hasta profundidad 3, quiescence 4 y presupuesto de ~1,8 s; su
  búsqueda ampliada detecta más amenazas y evita dejar la dama expuesta en las
  respuestas tácticas inmediatas.
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

**Nivel real:** ambos perfiles son rivales locales de aficionado, sin aperturas
ni finales y sin medición Elo. Veterano profundiza una semijugada más que
Prototipo y reduce algunos errores tácticos, pero no garantiza un nivel concreto.

---

## Dirección artística y animaciones

- Paleta de ceniza, metal, óxido y brasas; el tablero es el elemento con más
  contraste y el fondo queda atenuado (`src/styles/backdrop.css`).
- **Ciudad de Ceniza** — ruinas, humo y brasas; `src/theme/scenarios/ashenCity.ts`.
- **Refugio Militar** — paneles metálicos y luces de emergencia tenues;
  `src/theme/scenarios/militaryShelter.ts`.
- **Desierto Postapocalíptico** — dunas y tormenta de polvo ocre;
  `src/theme/scenarios/postApocalypticDesert.ts`.
- Los fondos nuevos se construyen con gradientes CSS y comparten el contrato
  `ScenarioTheme`; el escenario solo cambia presentación y paleta, nunca reglas.
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
| Alfil | Línea láser de precisión verde clara e impacto |
| Caballo | Salto en arco + fogonazo de escopeta al aterrizar |
| Dama | Rayo violeta/cian y desintegración visual de la víctima |
| Rey | Fogonazo de revólver, trazadora y humo breve |

Los destellos son de escala local y no cubren casillas vecinas. El atacante se
desliza durante 220 ms; el arma y el impacto esperan a su llegada. La secuencia
visual completa queda por debajo de un segundo. Las explosiones son solo
visuales: nunca eliminan piezas adicionales. No hay daño de área, fuego amigo,
munición ni vida.

**Animaciones reducidas** (`Ajustes` o `prefers-reduced-motion`): traslados
instantáneos, efectos de ~140 ms y fondo sin brasas ni pulsos.

### Cómo se garantiza que la animación no desincroniza

- `GameSession` aplica la jugada y la registra **antes** de cualquier efecto.
- El tablero se dibuja siempre desde `snapshot.pieces` (estado lógico). El
  `transform` suaviza el paso del origen al destino durante 220 ms.
- Los efectos de ataque esperan al aterrizaje; la víctima queda visible hasta
  el impacto y luego se desvanece como "fantasma" temporal fuera del estado.
- El bloqueo (`locked`) impide toques y también rechaza movimientos directos
  del motor o de la IA hasta terminar; el temporizador se cancela al reiniciar.

---

## Sonido

- **Todo el audio es original y se sintetiza en el dispositivo** con Web Audio
  (`src/audio/AudioEngine.ts`): drone grave, viento, percusión industrial lenta,
  capas metálicas y campanas distantes; efectos de movimiento, corte, explosión,
  disparo, jaque, promoción y resultado.
- La música se inicia **solo al pulsar Jugar (si está habilitada) o activar el
  control Música**. Otros gestos desbloquean Web Audio para los efectos, pero no
  arrancan la banda sonora.
- Música, efectos, animaciones reducidas, escenario y dificultad se guardan en
  `localStorage`. Al sonar música, los efectos bajan
  moderadamente de volumen; al apagarla, la música se desvanece y se detiene.
- Se pausa al ocultar la pestaña.
- La composición y los efectos se generan en tiempo real: no se descargan pistas
  ni muestras externas. *No he podido escuchar el audio en un dispositivo real*;
  verifica el volumen y el equilibrio en tu teléfono.

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
      difficulty.ts         Perfiles Prototipo y Veterano
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
    scenarios/              ashenCity.ts, militaryShelter.ts,
                            postApocalypticDesert.ts
    applyTheme.ts           Paleta → variables CSS
  audio/AudioEngine.ts      AUDIO sintetizado
  styles/                   tokens, base, fondo, tablero, piezas, efectos, UI
tests/
  engine.test.ts            Reglas y estados especiales (28 pruebas)
  ai.test.ts                Legalidad y comportamiento de la IA (11 pruebas)
  ui.flow.test.tsx          Flujo de interfaz y textos de resultado (13 pruebas)
  audio.test.ts             Activación explícita, mezcla y atenuación (2 pruebas)
  components.test.tsx       Tablero, escenarios, promoción y efectos (20 pruebas)
  worker.test.ts            Contrato del worker, respaldo y duraciones (6 pruebas)
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
   tipos, empaquetado, las 80 pruebas automatizadas (incluidas pruebas de flujo
   con jsdom) y he servido la app con Vite. El aspecto visual, el tacto y el
   audio deben validarse en tu teléfono.
2. El audio no se ha escuchado en dispositivo: el volumen y el equilibrio
   música/efectos pueden necesitar ajuste.
3. IA de aficionado: Veterano alcanza hasta tres semijugadas (plies), sin
   aperturas ni finales; puede repetir jugadas en posiciones cerradas y no
   reclama tablas. No se ha medido con rating Elo.
4. Los tres escenarios siguen siendo decorativos; escenario y dificultad se
   recuerdan localmente al recargar.
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
2. Ajustar contraste y detalle de los escenarios con pruebas en dispositivos.
3. Animaciones de captura más ricas (partículas, escombros) sin tocar la lógica.
4. Medir el nivel Veterano en dispositivos y ajustar su presupuesto si hace falta.
5. Historial de jugadas y deshacer.
6. Empaquetado con Capacitor y firma del APK cuando se decida.
