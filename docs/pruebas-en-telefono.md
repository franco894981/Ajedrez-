# Lista de pruebas en el teléfono

Lista corta para validar el prototipo en un Android real. Marca cada punto.
No he podido ejecutar estas pruebas en un dispositivo: este entorno no tiene
navegador gráfico ni audio.

## Antes de empezar

1. `npm ci` y `npm run dev -- --host 0.0.0.0` en la computadora (o usa la vista previa).
2. Abre la URL `Network` que imprime Vite desde el teléfono, en la misma Wi-Fi.
3. Orientación recomendada: vertical.

## Escenarios

- [ ] El selector ofrece **Ciudad de Ceniza**, **Refugio Militar** y
      **Desierto Postapocalíptico**; las tarjetas se pueden tocar.
- [ ] Al seleccionar cada tarjeta cambian el nombre, la descripción y el botón
      **Jugar en…**; en móvil se puede deslizar la fila para ver las tres.
- [ ] Al iniciar, el fondo y los tonos del tablero corresponden a la selección;
      el nombre también aparece durante la partida.
- [ ] Ciudad: ruinas y brasas. Refugio: paneles metálicos y luces rojas tenues.
      Desierto: tonos arena/ocre y polvo en el horizonte.
- [ ] Las casillas y piezas siguen siendo claramente legibles; el selector no
      produce scroll horizontal en toda la página.
- [ ] Volver al menú y elegir otro escenario actualiza el fondo de la siguiente
      partida sin perder la selección antes de pulsar **Jugar**.

## Interfaz

- [ ] El título y el botón **Jugar** se ven completos, sin recortes.
- [ ] El tablero es cuadrado, entran las 8 filas y columnas, y no hay scroll
      horizontal.
- [ ] Con el teléfono en horizontal el tablero sigue completo.
- [ ] La barra inferior y el pie no quedan tapados por el gesto del sistema
      (muescas y barra de navegación).
- [ ] Se lee “Tu turno” y, cuando la IA piensa, “Turno de la IA”.

## Toque

- [ ] Tocar un peón blanco marca dos casillas con punto claro.
- [ ] Tocar una pieza negra no la selecciona.
- [ ] Tocar otra pieza propia cambia la selección.
- [ ] Tocar la misma pieza deselecciona.
- [ ] Durante la animación no se puede mover otra pieza (no se duplican jugadas).
- [ ] En ningún momento hace falta arrastrar ni mantener pulsado.

## Reglas

- [ ] La IA responde en menos de ~2 segundos tras tu jugada.
- [ ] No puedes mover una pieza que deje tu rey en jaque: esas casillas no
      aparecen marcadas.
- [ ] El rey en jaque se resalta y aparece la etiqueta “Jaque”.
- [ ] Una captura muestra el efecto del arma y termina con tu pieza en la
      casilla capturada.
- [ ] Peón: corte diagonal blanco sobre la víctima.
- [ ] Torre: proyectil y explosión/humo concentrados en la casilla capturada.
- [ ] Alfil: línea de precisión; caballo: fogonazo al aterrizar.
- [ ] Reina: rayo violeta/cian y desintegración visual; rey: fogonazo con humo.
- [ ] El último movimiento queda resaltado.
- [ ] Enroque: mueve el rey dos casillas y la torre salta al otro lado.
- [ ] Captura al paso: el peón desaparece de su casilla original.
- [ ] Promoción: al llegar a la última fila aparece el selector con Reina,
      Torre, Alfil y Caballo, y la pieza elegida aparece en el tablero.
- [ ] Jaque mate: aparece el panel de resultado y el rey sigue en el tablero.
- [ ] Ahogado: el resultado dice “Tablas · Ahogado”, distinto del jaque mate.

## Animaciones y ajustes

- [ ] **Animaciones reducidas** acorta los efectos y quita las brasas del fondo.
- [ ] Los efectos no ocultan la casilla más de un instante.
- [ ] **Nueva partida** pide confirmación si hay una partida en curso y, al
      confirmar, vuelve a las 32 piezas.
- [ ] Los ajustes se conservan al recargar la página.

## Audio

- [ ] Al cargar, ni al tocar Efectos u otro control, empieza la música.
- [ ] “Jugar” inicia la música cuando el ajuste Música está activado.
- [ ] Activar Música la inicia; apagarla la desvanece y la detiene.
- [ ] Los efectos de movimiento/captura siguen audibles y bajan un poco mientras
      suena la música; su interruptor sigue siendo independiente.
- [ ] Al cambiar de pestaña o bloquear el teléfono el audio se detiene y vuelve.

## Rendimiento

- [ ] Al tocar una pieza la respuesta es inmediata (sin retardo perceptible).
- [ ] La IA no congela la pantalla mientras piensa.
- [ ] Tras 20–30 jugadas no hay tirones ni desincronización entre lo que se ve y
      lo que permite jugar.

## Si algo falla

Anota: modelo de teléfono, navegador y versión, la jugada (notación algebraica
si puedes) y qué esperabas que ocurriera. Con eso se puede reproducir.
