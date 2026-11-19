# Editor de interfaces móvil (estilo Apple)

## Qué vas a tener
- Lienzo táctil a pantalla completa: arrastrar elementos, pellizcar para hacer zoom, mover el lienzo con dos dedos, cuadrícula y guías de alineación.
- Barra superior: deshacer/rehacer, zoom, vista previa, exportar.
- Botón "+" que abre una hoja inferior (estilo iOS) con elementos: texto, botón, imagen, rectángulo, círculo, icono, campo de texto, interruptor, tarjeta.
- Al tocar un elemento: asas para redimensionar y rotar, y una hoja inferior de propiedades organizada en pestañas:
  - Diseño: X, Y, ancho, alto, rotación, bloquear proporción.
  - Estilo: color de relleno, degradado, opacidad, borde (grosor, color, radio de esquinas), sombra, desenfoque.
  - Texto: contenido, fuente, tamaño, peso, alineación, interlineado, color.
  - Capa: orden (delante/atrás), duplicar, bloquear, ocultar, eliminar.
- Panel de capas para ver y reordenar todos los elementos.
- Elegir tamaño de pantalla (iPhone, Android, tablet).
- Guardado automático en el dispositivo y exportar el diseño como imagen PNG o JSON.

## Diseño visual
Estética iOS: fondo gris claro, hojas translúcidas con desenfoque, esquinas redondeadas, controles tipo slider y segmentados de Apple, tipografía del sistema, modo oscuro.

## Detalles técnicos
- Estado del editor con Zustand + historial para deshacer/rehacer; persistencia en localStorage.
- Gestos con @use-gesture/react; exportación PNG con html-to-image.
- Componentes: Canvas, ElementRenderer, SelectionHandles, BottomSheet, Inspector (pestañas), LayersPanel, Toolbar.
- Todo en la ruta `/`. Sin backend por ahora (se puede añadir guardado en la nube después).
