import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.getElementById('scene-container');
const loading = document.getElementById('loading');
const spinButton = document.getElementById('spin-toggle');
const spinLabel = document.getElementById('spin-label');
const textureWidth = 2048;
const textureHeight = 1024;
const globeRadius = 1.55;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#020306');

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0, 6);

let renderer;
try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
} catch (error) {
    loading.textContent = 'Este navegador no pudo iniciar la visualización 3D.';
    loading.classList.add('is-error');
    throw error;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minDistance = 2.15;
controls.maxDistance = 7;

scene.add(new THREE.HemisphereLight('#d8b7a0', '#27100c', 0.62));

const sunlight = new THREE.DirectionalLight('#fff0d9', 3.2);
sunlight.position.set(-4, 3.5, 5);
scene.add(sunlight);

const fillLight = new THREE.PointLight('#c36343', 0.65, 10);
fillLight.position.set(3.5, -2, 2);
scene.add(fillLight);

const planet = new THREE.Group();
planet.position.x = window.innerWidth > 760 ? 1.05 : 0.2;
scene.add(planet);

const planetTexture = createPlanetTexture();
const mars = new THREE.Mesh(
    new THREE.SphereGeometry(globeRadius, 96, 64),
    new THREE.MeshStandardMaterial({
        map: planetTexture,
        bumpMap: planetTexture,
        bumpScale: 0.025,
        roughness: 0.94,
        metalness: 0
    })
);
planet.add(mars);

const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(globeRadius * 1.035, 64, 48),
    new THREE.MeshBasicMaterial({
        color: '#f16b4b',
        transparent: true,
        opacity: 0.07,
        side: THREE.BackSide,
        depthWrite: false
    })
);
planet.add(atmosphere);

const starGeometry = new THREE.BufferGeometry();
const starPositions = [];
for (let index = 0; index < 1300; index += 1) {
    const radius = 8 + Math.random() * 24;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPositions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
scene.add(new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
        color: '#d8d6d1',
        size: 0.018,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.65
    })
));

let isSpinning = true;
const clock = new THREE.Clock();

function resizeScene() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.position.x = width > 760 ? 0 : -0.75;
    camera.updateProjectionMatrix();
    planet.position.x = width > 760 ? 1.05 : 0.2;
    renderer.setSize(width, height);
}

window.addEventListener('resize', resizeScene);
resizeScene();

document.getElementById('zoom-in').addEventListener('click', () => {
    camera.position.multiplyScalar(0.85);
    camera.position.clampLength(controls.minDistance, controls.maxDistance);
    controls.update();
});

document.getElementById('zoom-out').addEventListener('click', () => {
    camera.position.multiplyScalar(1.15);
    camera.position.clampLength(controls.minDistance, controls.maxDistance);
    controls.update();
});

spinButton.addEventListener('click', () => {
    isSpinning = !isSpinning;
    spinButton.setAttribute('aria-pressed', String(isSpinning));
    spinLabel.textContent = isSpinning ? 'PAUSAR GIRO' : 'REANUDAR GIRO';
});

document.getElementById('reset-view').addEventListener('click', () => {
    planet.rotation.set(0, 0, 0);
    camera.position.set(window.innerWidth > 760 ? 0 : -0.75, 0, 6);
    controls.target.set(0, 0, 0);
    controls.update();
    isSpinning = true;
    spinButton.setAttribute('aria-pressed', 'true');
    spinLabel.textContent = 'PAUSAR GIRO';
});

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    if (isSpinning) {
        planet.rotation.y += delta * 0.075;
    }
    controls.update();
    renderer.render(scene, camera);
}

animate();
loadPlanetAssets();

async function loadPlanetAssets() {
    const [imageResult] = await Promise.allSettled([loadPlanetReference()]);
    const image = imageResult.status === 'fulfilled' ? imageResult.value : null;
    const errors = imageResult.status === 'rejected' ? [imageResult.reason] : [];

    errors.forEach((error) => console.error('No se pudo cargar un recurso del planeta:', error));

    if (errors.length > 0) {
        loading.textContent = 'Vista 3D disponible; algunos recursos no se pudieron cargar.';
        loading.classList.add('is-error');
        return;
    }

    const updatedTexture = createPlanetTexture(image);
    mars.material.map.dispose();
    mars.material.map = updatedTexture;
    mars.material.needsUpdate = true;
    loading.classList.add('is-hidden');
}

function loadPlanetReference() {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('No se pudo cargar la imagen de referencia de Marte.'));
        image.src = 'imagenes%20jerazo/marte-referencia.png';
    });
}

function createPlanetTexture(referenceImage = null) {
    const canvas = document.createElement('canvas');
    canvas.width = textureWidth;
    canvas.height = textureHeight;
    const context = canvas.getContext('2d');

    const base = context.createLinearGradient(0, 0, textureWidth, textureHeight);
    base.addColorStop(0, '#854333');
    base.addColorStop(0.46, '#a9583d');
    base.addColorStop(1, '#733a30');
    context.fillStyle = base;
    context.fillRect(0, 0, textureWidth, textureHeight);

    const random = createRandom(1729);
    for (let index = 0; index < 90; index += 1) {
        const x = random() * textureWidth;
        const y = random() * textureHeight;
        const radius = 5 + random() * 30;
        context.save();
        context.translate(x, y);
        context.rotate(random() * Math.PI);
        context.scale(1, 0.6 + random() * 0.55);
        const crater = context.createRadialGradient(
            -radius * 0.16,
            -radius * 0.18,
            radius * 0.12,
            0,
            0,
            radius
        );
        crater.addColorStop(0, 'rgba(79, 37, 31, 0.2)');
        crater.addColorStop(0.68, 'rgba(106, 49, 37, 0.1)');
        crater.addColorStop(0.84, 'rgba(229, 145, 98, 0.12)');
        crater.addColorStop(0.94, 'rgba(67, 31, 28, 0.13)');
        crater.addColorStop(1, 'rgba(92, 40, 31, 0)');
        context.fillStyle = crater;
        context.beginPath();
        context.ellipse(0, 0, radius, radius, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }

    const terrainNoise = context.createImageData(512, 256);
    for (let index = 0; index < terrainNoise.data.length; index += 4) {
        const shade = random();
        terrainNoise.data[index] = 92 + Math.floor(shade * 105);
        terrainNoise.data[index + 1] = 38 + Math.floor(shade * 63);
        terrainNoise.data[index + 2] = 28 + Math.floor(shade * 46);
        terrainNoise.data[index + 3] = 52;
    }
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 512;
    noiseCanvas.height = 256;
    noiseCanvas.getContext('2d').putImageData(terrainNoise, 0, 0);
    context.drawImage(noiseCanvas, 0, 0, textureWidth, textureHeight);

    if (referenceImage) {
        projectReferenceGlobe(context, referenceImage);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
}

function projectReferenceGlobe(context, image) {
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = image.width;
    sourceCanvas.height = image.height;
    const sourceContext = sourceCanvas.getContext('2d');
    sourceContext.drawImage(image, 0, 0);

    const source = sourceContext.getImageData(0, 0, image.width, image.height);
    const target = context.getImageData(0, 0, textureWidth, textureHeight);
    const centerX = image.width / 2;
    const centerY = image.height / 2;
    const radius = Math.min(image.width, image.height) * 0.464;

    for (let x = 0; x < textureWidth; x += 1) {
        const longitude = (x / textureWidth) * Math.PI * 2;
        const sinLongitude = Math.sin(longitude);
        const cosLongitude = Math.cos(longitude);

        for (let y = 0; y < textureHeight; y += 1) {
            const latitude = (0.5 - y / textureHeight) * Math.PI;
            const cosLatitude = Math.cos(latitude);
            const visible = sinLongitude * cosLatitude;
            if (visible <= 0.08) {
                continue;
            }

            const sourceX = centerX - cosLongitude * cosLatitude * radius;
            const sourceY = centerY - Math.sin(latitude) * radius;
            const x0 = Math.floor(sourceX);
            const y0 = Math.floor(sourceY);
            if (x0 < 0 || y0 < 0 || x0 + 1 >= image.width || y0 + 1 >= image.height) {
                continue;
            }

            const nearest = (Math.round(sourceY) * image.width + Math.round(sourceX)) * 4;
            if (isCheckerboardPixel(source.data, nearest)) {
                continue;
            }

            const blend = smoothStep(0.08, 0.3, visible);
            const xWeight = sourceX - x0;
            const yWeight = sourceY - y0;
            const topLeft = (y0 * image.width + x0) * 4;
            const topRight = topLeft + 4;
            const bottomLeft = topLeft + image.width * 4;
            const bottomRight = bottomLeft + 4;
            const targetIndex = (y * textureWidth + x) * 4;

            for (let channel = 0; channel < 3; channel += 1) {
                const top = source.data[topLeft + channel] * (1 - xWeight) +
                    source.data[topRight + channel] * xWeight;
                const bottom = source.data[bottomLeft + channel] * (1 - xWeight) +
                    source.data[bottomRight + channel] * xWeight;
                const color = top * (1 - yWeight) + bottom * yWeight;
                target.data[targetIndex + channel] =
                    target.data[targetIndex + channel] * (1 - blend) + color * blend;
            }
        }
    }

    context.putImageData(target, 0, 0);
}

function isCheckerboardPixel(pixels, index) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    return red > 215 &&
        green > 215 &&
        blue > 215 &&
        Math.max(red, green, blue) - Math.min(red, green, blue) < 18;
}

function smoothStep(edge0, edge1, value) {
    const amount = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
    return amount * amount * (3 - 2 * amount);
}

function createRandom(seed) {
    let value = seed;
    return () => {
        value = (value * 16807) % 2147483647;
        return (value - 1) / 2147483646;
    };
}
