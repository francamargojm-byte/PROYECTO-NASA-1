# Simulación 3D de Marte

Visor interactivo de Marte. La imagen de referencia se proyecta sobre una esfera 3D y el fondo de cuadritos se descarta durante la proyección.

## Cómo abrir

Abre la carpeta del proyecto con un servidor local, por ejemplo la extensión **Live Server** de VS Code, y visita la dirección que indique. No abras `index.html` directamente como archivo: la simulación carga módulos 3D y recursos usando el servidor local.

Se necesita conexión a internet para cargar Three.js desde jsDelivr.

## Controles

- Arrastra sobre Marte para girarlo; usa la rueda del mouse para acercar o alejar.
- Usa los botones `+` y `−` para ajustar el zoom.
- Pulsa **Pausar giro** para detener la rotación automática o **Restablecer vista** para volver al inicio.
