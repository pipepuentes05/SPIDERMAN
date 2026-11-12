# WEB SHOOTER — Felipe Puentes

Experiencia web estática con dos lanzatelarañas controlados por tus manos. Usa tu fotografía de Spider-Man como escenario, guantes vectoriales, disparos con movimiento, calibración física izquierda/derecha y efectos de hilo e impacto.

## Abrir en Visual Studio Code

1. Descarga y extrae **todo** el ZIP. No ejecutes los archivos desde dentro del ZIP.
2. En Visual Studio Code, elige **File > Open Folder** y abre `web-shooter`.
3. En **Extensions**, instala **Live Server**, de **Ritwick Dey**, desde el marketplace oficial de VS Code.
4. Haz clic derecho en `index.html` y selecciona **Open with Live Server**.
5. Abre la dirección de Live Server en Chrome o Edge. Normalmente comienza por `http://127.0.0.1:5500` o `http://localhost:5500`; el puerto puede ser diferente.
6. Pulsa **ACTIVAR CÁMARA**. Espera la descarga del modelo y acepta el permiso de cámara del navegador.
7. Completa la calibración y comienza a mover las manos.

No necesitas Node, npm, backend ni compilación para usar la página. Necesitas internet para descargar MediaPipe y el modelo. El video se procesa localmente y no se solicita micrófono.

**No abras index.html mediante doble clic.** Los módulos y la webcam necesitan un servidor local como Live Server, o una página servida por HTTPS.

## Tu fotografía ya está incluida

El archivo `index.html` contiene la fotografía adjunta completa como una URL Base64 de tipo `image/png`. No hay que agregar un fondo ni renombrar imágenes.

Se incorporaron exactamente los **3.454.487 bytes** del PNG original, sin convertir, recomprimir ni editar la fotografía. Se comprobó que el contenido decodificado coincide byte por byte con el adjunto.

El fondo usa `object-fit: cover` y una posición que favorece a Spider-Man a la derecha. No se deforma; el recorte varía según la proporción de la pantalla. El sombreado es una capa de interfaz separada, no una modificación de la imagen.

## Calibrar izquierda y derecha

La calibración es obligatoria antes de habilitar los disparos:

1. Levanta **solo tu mano derecha física**, con la palma visible y la otra mano fuera del encuadre.
2. Mantén la mano visible aproximadamente un segundo, hasta que cambie la instrucción.
3. Baja la derecha y levanta **solo tu mano izquierda física**.
4. Mantén esa mano visible hasta completar la confirmación.
5. Aparecerán los indicadores independientes de ambos lanzadores.

No se asigna la mano por el lado de la pantalla. La correspondencia utiliza la clasificación del modelo y tu calibración. El detector recibe imágenes sin espejo; el espejo se aplica únicamente a la visualización y a la proyección de coordenadas. No se invierten etiquetas por defecto de manera arbitraria.

La documentación actual de Hand Landmarker diferencia las manos del sujeto y avisa que reflejar la entrada puede invertir sus categorías. La calibración comprueba la correspondencia de esta webcam y versión del modelo en vez de depender únicamente de esa convención.

Si los indicadores no coinciden con tus manos, usa **INTERCAMBIAR I / D** o **CALIBRAR** de nuevo. Intercambiar reinicia las velocidades para no crear disparos falsos. Si cancelas la calibración, la cámara sigue activa pero los disparos permanecen pausados hasta calibrar.

## Cómo lanzar telarañas

- Mueve una mano con decisión frente a la cámara. No necesitas hacer el gesto de Spider-Man con los dedos.
- El movimiento de la izquierda controla el lanzador izquierdo y el de la derecha, el derecho.
- Puedes lanzar con ambas al mismo tiempo.
- Después de un movimiento, deja descansar brevemente la mano para rearmar ese lanzador.
- Una mano quieta no debe disparar repetidamente.
- Si retiras una mano y la vuelves a introducir, primero se recupera el seguimiento. No se usa el salto de reaparición como un disparo.

Cada lanzador mantiene por separado su velocidad, rearme, última posición y espera mínima de 520 ms entre disparos. Un barrido prolongado no se convierte en un disparo por fotograma.

### Cruces y ambigüedad

El seguimiento combina categorías de lateralidad con continuidad espacial. Cambiar el orden de detección o cruzar la mitad de la pantalla no cambia automáticamente la identidad. Si las palmas se superponen, se acercan demasiado, la confianza baja o las categorías contradicen las trayectorias recientes, los disparos se pausan para evitar asignaciones erróneas.

**Límite práctico:** una webcam monocular y un modelo de visión pueden perder manos durante oclusiones, giros extremos o cruces rápidos. El proyecto no promete seguimiento infalible detrás de otra mano. Si se pausa, sepáralas y vuelve a mostrarlas con buena luz.

### Proyección y dirección

Los guantes son ilustraciones 2D originales con muñeca, lanzador, patrón de telaraña, acentos azules y sombreado. Su postura gráfica es estilizada; no es una reconstrucción 3D exacta de cada dedo.

La muñeca y la orientación de la palma controlan la posición, escala y giro del guante. Se proyecta la entrada en espejo dentro de un área útil del escenario: 6–94% del ancho y 20–80% de la altura, para mantener los guantes alejados de los controles. Su tamaño también está limitado para evitar saltos extremos.

La dirección de cada telaraña responde al vector reciente de movimiento. Cerca de un borde, una dirección que saldría de la pantalla se refleja para mantener el efecto visible. Es una **proyección interactiva 2D**, no una medición real del edificio al que estás apuntando.

El disparo toma la posición de la muñeca virtual visible y congela su origen y trayectoria. Mover el guante después no mueve las telarañas ya lanzadas. Al cambiar el tamaño de pantalla, las coordenadas normalizadas conservan la composición relativa.

## Controles

| Control | Función |
| --- | --- |
| ACTIVAR CÁMARA | Carga el detector y solicita la webcam. |
| DETENER | Termina las pistas de video y el worker. Los efectos ya lanzados pueden terminar. |
| CÁMARA | Muestra u oculta la pequeña vista de webcam; ocultarla no detiene el seguimiento. |
| PUNTOS ON/OFF | Activa u oculta la malla de puntos y líneas en la webcam. |
| LIMPIAR REDES | Quita todas las telarañas activas. |
| SENSIBILIDAD | Suave exige un movimiento más marcado; normal es el valor inicial; intensa responde a movimientos menores. |
| CALIBRAR | Repite la correspondencia física de ambas manos sin reiniciar la webcam. |
| INTERCAMBIAR I / D | Invierte la correspondencia de las categorías ya calibradas. |
| SONIDO ON/OFF | Habilita o silencia un “thwip” sintetizado con Web Audio. Comienza apagado. |
| PANTALLA COMPLETA | Amplía toda la experiencia manteniendo controles. Escape permite salir. |
| ? | Abre las instrucciones y la demostración de efectos sin cámara. |

La demostración está explícitamente marcada: dibuja guantes y cuatro lanzamientos con coordenadas predeterminadas. **No utiliza ni simula detección de tus manos.** Solo está disponible con la webcam detenida.

El modo normal solo genera disparos a partir de detecciones reales que pasan las reglas de calibración, identidad y movimiento.

## Qué hace la animación

Cada disparo tiene un hilo principal curvo, hebras secundarias, borde de contraste y una punta que avanza. En el impacto aparece una red radial con conexiones curvas. Se mantiene brevemente y se desvanece.

Las variaciones se calculan una vez por disparo mediante una semilla; no se vuelve a crear una forma aleatoria en cada fotograma. Las redes no cambian arbitrariamente de posición. Se limita el conjunto a 18 efectos, eliminando los más antiguos si hace falta.

Las preferencias de movimiento reducido eliminan oscilaciones y pulsos decorativos. El lanzamiento y la desaparición permanecen como parte esencial de la interacción. No se usan sacudidas de pantalla ni destellos intensos.

## Archivos

```text
web-shooter/
  index.html                Interfaz y fotografía completa incrustada
  styles.css                Diseño, capas y adaptación a pantalla
  script.js                 Cámara, UI, calibración y bucle de renderizado
  hand-tracking.js          Identidad, movimiento, reglas y controlador del worker
  hand-worker.js            MediaPipe Hand Landmarker para dos manos
  gloves.js                 Guantes vectoriales y proyección
  webs.js                   Trayectorias, hilos, impactos y ciclo de vida
  audio.js                  Sonido sintetizado con Web Audio
  LEEME.md                  Estas instrucciones
  package.json              Configuración de pruebas opcionales
  tests/
    logic.test.js           16 pruebas automatizadas
    browser-check.html      Pruebas técnicas de dibujo y modelo, sin webcam
```

Mantén juntos los archivos. El fondo está en el HTML, pero la aplicación carga los módulos locales de JavaScript y estilos de esta carpeta.

## Personalizar

### Sensibilidad y movimiento

En `hand-tracking.js`:

- `SENSITIVITY` contiene los umbrales alto/bajo de los tres modos.
- `CONFIG.cooldown` es la espera mínima por mano: 520 ms.
- `CONFIG.rearmMs` define cuánto tiempo debe permanecer lento el movimiento para rearmarse.
- `CONFIG.warmupMs` impide disparos inmediatamente al adquirir una mano.
- `CONFIG.confidence` controla la confianza mínima para una categoría.
- `CONFIG.maxJump` descarta saltos de posición implausibles.

Las velocidades se calculan con coordenadas normalizadas por segundo, no con una distancia fija en píxeles. El umbral bajo siempre debe ser menor que el alto.

Si modificas sensibilidad desde el menú, se reinician las velocidades para que el propio cambio no dispare.

### Duración y cantidad de redes

Al principio de `webs.js`, `WEB_CONFIG` define:

```js
maxActive: 18,
flightMs: 240,
lifetimeMs: 4500,
fadeMs: 1100
```

`makeWeb()` construye el origen, punto de impacto, curvatura y geometría de la red. `WebField.draw()` controla su extensión, impacto y desvanecimiento.

### Guantes

En `gloves.js`, `drawGlove()` contiene los trazados y materiales. El emisor de muñeca está exactamente en `(0, 0)` del sistema local del guante. `projectSample()` define la proyección al escenario y los límites de tamaño.

### Diseño

Edita `:root` en `styles.css` para colores y los estilos de `.background` para el encuadre. La fotografía original no necesita archivos externos. Cambiar las reglas CSS no modifica sus bytes incrustados.

### Sonido

`audio.js` genera una ráfaga de ruido filtrado con caída rápida y un pequeño paneo según el lado. Limita las voces simultáneas. No hay MP3 externo ni solicitud de micrófono.

## Rendimiento y privacidad

- Un único bucle principal `requestAnimationFrame` para la experiencia.
- Renderizado limitado a una densidad de 1,6×.
- Captura para inferencia reducida a 640 píxeles de ancho, con solicitud aproximadamente cada 85 ms.
- Una sola inferencia pendiente.
- Inferencia síncrona ejecutada fuera de la interfaz, en un worker clásico compatible con el cargador WebAssembly de MediaPipe.
- Hasta dos manos y 18 efectos activos.
- Pausa de trabajo al ocultar la pestaña y descarte de velocidades al regresar.
- Al cambiar de pestaña se limpian las redes para que no regresen disparos viejos o acumulados.
- Al detener la webcam se terminan sus pistas y el worker.
- No se graba ni se guarda video. No se envían imágenes ni puntos de manos por red.
- Se descargan código y modelos desde jsDelivr y Google Storage. El fondo es local, incrustado.

## Requisitos y problemas comunes

Usa Chrome o Edge actuales, una webcam y WebGL disponible. Aunque el dibujo usa Canvas 2D y el modelo usa delegado CPU, la infraestructura de MediaPipe puede necesitar WebGL para introducir los fotogramas en el modelo.

Si hay un error gráfico, revisa la aceleración gráfica del navegador, los controladores de video y reinicia el navegador después de cambiar esa configuración. Algunas políticas de computador bloquean WebGL.

Si no se autoriza la cámara, modifica el permiso desde el icono junto a la dirección. Si está ocupada, cierra otras aplicaciones como Zoom o Teams. Si falla la carga, comprueba acceso a `cdn.jsdelivr.net` y `storage.googleapis.com` y vuelve a intentar; hay un tiempo máximo de espera de 90 segundos.

Para mejorar seguimiento: buena luz frontal, palmas visibles, manos completas dentro del cuadro y movimientos moderados. Si un cruce las oculta, sepáralas un instante.

## Verificaciones realizadas

Se ejecutaron **16 pruebas automatizadas** correctas:

1. Mano quieta y ruido leve no generan disparos.
2. Movimiento izquierdo y disparo simultáneo independiente de ambas manos.
3. Movimiento únicamente derecho no activa la izquierda.
4. Movimiento sostenido no dispara en cada fotograma.
5. Reposo rearma y la espera mínima sobrevive a una pérdida de detección.
6. Reaparición, saltos temporales y desplazamientos imposibles no disparan.
7. Cruce de manos y cambio de orden de detecciones conservan la identidad de categorías.
8. Proximidad ambigua o categorías duplicadas pausan los disparos.
9. Transferencia repentina a la posición de la otra mano se rechaza.
10. Baja confianza no activa disparos.
11. Calibración de derecha e izquierda establece la inversión necesaria.
12. Calibración rechaza dos manos y reinicia confirmación si cambia la categoría.
13. Intercambiar reinicia movimiento y aplica espejo una sola vez.
14. El origen y la trayectoria ya lanzados no cambian al mover el objeto de entrada.
15. Aleatoriedad determinista, límite de efectos y retirada al expirar.
16. El HTML contiene un PNG Base64 completo, sin marcador incompleto.

Además:

- Comparación byte por byte entre el fondo incrustado y el archivo original: idénticos.
- Comprobación HTTP 200 del JavaScript, cargador WASM, binario WASM y modelo Hand Landmarker utilizados.
- Revisión visual de la interfaz y del fondo dentro del navegador.
- Render real de dos guantes y dos telarañas en Canvas 2D, con comprobación de píxeles y expiración.
- Inicialización real del modelo Hand Landmarker con `numHands: 2`.
- Prueba de integración de la interfaz con video y detecciones sintéticos, en una copia de pruebas separada que no forma parte del código entregado.
- Revisión sintáctica de los módulos.

**Limitación importante de las pruebas:** el navegador remoto de verificación tiene WebGL desactivado y no tiene acceso a tu webcam. El modelo se descargó e inicializó, pero la inferencia sobre una imagen de prueba falló al intentar acceder al contexto gráfico (`activeTexture`). Por ello **no se afirma haber verificado el seguimiento con manos reales**. La calibración, categorías y movimiento se probaron con datos sintéticos. Comprueba el recorrido con tu webcam en tu computador siguiendo estas instrucciones.

### Repetir pruebas opcionales

Si tienes Node instalado, abre una terminal en la carpeta y ejecuta:

```sh
npm test
```

No requiere instalar paquetes npm. Para verificar dibujos en navegador, abre `tests/browser-check.html` con Live Server y pulsa **COMPROBAR GUANTES Y REDES**. El otro botón prueba el modelo con una imagen sintética, sin solicitar webcam.

Para la comprobación real: calibra ambas manos, prueba cada una por separado, prueba ambas, crúzalas, retíralas y vuélvelas a mostrar. Confirma que la cámara se apaga al pulsar DETENER y que no hay disparos automáticos al volver de otra pestaña.

## Dependencias y referencia

- MediaPipe Tasks Vision **0.10.21**, licencia Apache-2.0, desde jsDelivr.
- Modelo oficial Hand Landmarker **float16/1**, desde Google Storage.
- Canvas 2D y Web Audio para guantes y efectos, sin bibliotecas adicionales.
- Fotografía facilitada por el usuario e incluida sin modificaciones.

Documentación oficial consultada:

- https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker
- https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js
- https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/tasks/web/vision/hand_landmarker/hand_landmarker.ts
