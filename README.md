# Simulación 3D de Marte

Visor interactivo de Marte. Las dos imágenes se armonizan a una tonalidad común y se proyectan sobre hemisferios opuestos de una esfera 3D; sus fondos se descartan durante la proyección.

## Cómo abrir

Abre la carpeta del proyecto con un servidor local, por ejemplo la extensión **Live Server** de VS Code, y visita la dirección que indique. No abras `index.html` directamente como archivo: la simulación carga módulos 3D y recursos usando el servidor local.

Se necesita conexión a internet para cargar Three.js desde jsDelivr.

## Controles

- Arrastra sobre Marte para girarlo; usa la rueda del mouse para acercar o alejar.
- Usa los botones `+` y `−` para ajustar el zoom.
- Pulsa **Pausar giro** para detener la rotación automática o **Restablecer vista** para volver al inicio.
