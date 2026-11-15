import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@2.0.0-beta.4/src/Leaflet.js';

const imagePath = 'imagenes%20jerazo/jerazo.png';
const imageWidth = 1080;
const imageHeight = 1080;
const imageAspectRatio = imageWidth / imageHeight;
const imageWorldHeight = 100;
const imageWorldWidth = imageWorldHeight * imageAspectRatio;
const imageBounds = [[0, 0], [imageWorldHeight, imageWorldWidth]];

const map = new L.Map('map', {
  minZoom: -2,
  maxZoom: 10,
  zoomControl: true,
  attributionControl: false
}).setView([imageWorldHeight / 2, imageWorldWidth / 2], 2);

new L.ImageOverlay(imagePath, imageBounds, {
  opacity: 0.9,
  interactive: false
}).addTo(map);

const infoRuta = document.getElementById('info-ruta');

function crearRuta(ruta) {
  const puntos = ruta.coordenadas.map(([lat, lng]) => [lat, lng]);

  const polyline = new L.Polyline(puntos, {
    color: ruta.color || '#00c2ff',
    weight: 4,
    opacity: 0.9
  }).addTo(map);

  const markers = puntos.map(([lat, lng], index) => {
    const marker = new L.Marker([lat, lng]).addTo(map);
    marker.bindPopup(`
      <strong>${ruta.nombre}</strong><br>
      Punto ${index + 1}<br>
      x: ${lat.toFixed(1)}, y: ${lng.toFixed(1)}
    `);
    return marker;
  });

  polyline.bindPopup(`
    <strong>${ruta.nombre}</strong><br>
    ${ruta.descripcion || ''}
  `);

  return { polyline, markers };
}

async function cargarRutas() {
  try {
    const response = await fetch('rutas.json');
    if (!response.ok) {
      throw new Error('No se pudo cargar rutas.json');
    }

    const data = await response.json();
    const rutas = data.rutas || [];

    if (!rutas.length) {
      infoRuta.innerHTML = 'No hay rutas cargadas en el JSON.';
      return;
    }

    const todasLasCoordenadas = rutas.flatMap((ruta) => ruta.coordenadas);
    const routeBounds = new L.LatLngBounds(todasLasCoordenadas);
    const imageBoundsLatLng = new L.LatLngBounds(imageBounds);
    const bounds = routeBounds.extend(imageBoundsLatLng);
    map.fitBounds(bounds, { padding: [24, 24] });

    rutas.forEach((ruta) => {
      const { polyline } = crearRuta(ruta);
      polyline.on('click', () => {
        infoRuta.innerHTML = `
          <strong>${ruta.nombre}</strong><br>
          ${ruta.descripcion}<br>
          <small>${ruta.coordenadas.length} puntos</small>
        `;
      });
    });

    infoRuta.innerHTML = `
      <strong>${rutas.length} rutas cargadas</strong><br>
      ${rutas.map((ruta) => ruta.nombre).join('<br>')}
    `;
  } catch (error) {
    console.error(error);
    infoRuta.innerHTML = 'Hubo un error al cargar las rutas desde el JSON.';
  }
}

cargarRutas();
