import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.getElementById('scene-container');
const loading = document.getElementById('loading');
const spinButton = document.getElementById('spin-toggle');
const spinLabel = document.getElementById('spin-label');
const jezeroCard = document.getElementById('jezero-card');
const routeDialog = document.getElementById('route-dialog');
const routeAlt1Info = "This closed-loop expedition covers a total distance of 55.91 km south of the main base, venturing into an expansive plain dotted with numerous minor impact craters and subtle topographic depressions. The route prioritizes the speed of the pressurized rover to traverse the vast inner basin of the crater, complemented by short extravehicular activities (EVAs) along the rims of the smaller craters to collect regolith and analyze ejected fragments. Operationally, the mission requires a total time of 9 Earth hours and 30 minutes (approximately 9 Martian hours and 15 minutes, or 0.38 sols). The primary challenges of this route consist of navigating around the dense distribution of small craters that obstruct a direct driving line and maintaining the vehicle's thermal stability during peak solar radiation hours in the southern hemisphere of the crater.";
const routeAlt2Info = "This closed-loop expedition covers a total distance of 49.7 km heading north from the base, transitioning from the plains into high-visual-contrast terrain marked by complex morphological fronts, steep scarps, and extensive active aeolian dune fields. The field strategy combines long stretches of technical rover driving with on-foot excursions into sedimentary transition zones to assess dust dynamics and wind interaction with rocky outcrops. The operation requires an execution time of 8 Earth hours and 50 minutes (nearly 8 Martian hours and 35 minutes, or 0.36 sols). Unlike the southern route, the critical factors here are precise navigation to avoid fine sand accumulations that pose a risk of entrapment and constant traction management on steep slopes near the northern boundaries of the crater.";
const routeAlt3Info = "This closed-loop mission covers a total distance of 44.35 km, charting an initial westward course from the base before ascending northward toward the sedimentary lobes of the western delta. The route combines extended driving in a pressurized rover across alluvial plains with rigorous on-foot excursions to analyze stratigraphy and search for potential fossilized microbial biosignatures within fine-grained mudstone strata. The expedition requires a total execution time of 8 Earth hours and 20 minutes (equivalent to 8 Martian hours and 7 minutes, or 0.33 sols). As critical operational factors, the route demands navigating steep elevation changes across the deltaic deposits and depressions containing internal dunes (such as the minor crater visible in the northern sector of the loop), which requires pinpoint navigation accuracy and strict monitoring of the terrain's geomechanical stability due to erosion from ancient water flows.";
const routeAlt4Info = "This long-range expedition covers a total distance of 88.78 km, charting a direct eastward course from the base to traverse the vast expanse of the plain and reach the formations at the center of the crater. It is the most demanding route of the mission, combining hours of continuous high-speed driving in a pressurized rover with on-foot excursions at key waypoints to study deep soil composition and ancient impact traces. Operationally, the mission requires a total execution time of 13 Earth hours and 20 minutes (equivalent to 12 Martian hours and 58 minutes, or 0.53 sols). As critical operational factors, the long distance traveled beyond the safety perimeter imposes severe constraints on the vehicle's energy autonomy, life-support consumable usage, and the need to establish a robust communications relay link due to its remoteness from the base habitat.";
const textureWidth = 2048;
const textureHeight = 1024;
const globeRadius = 1.55;
const jezeroLatitude = 18.4;
const jezeroLongitude = 77.7;

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

scene.add(new THREE.HemisphereLight('#d8b7a0', '#27100c', 1));
scene.add(new THREE.AmbientLight('#a7755a', 0.65));

const sunlight = new THREE.DirectionalLight('#fff0d9', 2.5);
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

const jezeroMarker = createJezeroMarker();
planet.add(jezeroMarker);

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
let focusAnimation = null;
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

const considerationsMenu = document.getElementById('considerations-menu');
const considerationsToggle = document.getElementById('considerations-toggle');
const considerationsDropdown = document.getElementById('considerations-dropdown');

function setConsiderationsMenuOpen(isOpen) {
    considerationsToggle.setAttribute('aria-expanded', String(isOpen));
    considerationsDropdown.hidden = !isOpen;
    considerationsDropdown.classList.toggle('show', isOpen);
}

considerationsMenu.addEventListener('mouseenter', () => setConsiderationsMenuOpen(true));
considerationsMenu.addEventListener('mouseleave', () => {
    if (!considerationsMenu.contains(document.activeElement)) {
        setConsiderationsMenuOpen(false);
    }
});
considerationsMenu.addEventListener('focusin', () => setConsiderationsMenuOpen(true));
considerationsMenu.addEventListener('focusout', (event) => {
    if (!considerationsMenu.contains(event.relatedTarget)) {
        setConsiderationsMenuOpen(false);
    }
});
considerationsToggle.addEventListener('click', (event) => {
    if (event.detail === 0) {
        setConsiderationsMenuOpen(considerationsDropdown.hidden);
    } else {
        setConsiderationsMenuOpen(true);
    }
});
considerationsMenu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        setConsiderationsMenuOpen(false);
        considerationsToggle.focus();
    }
});
considerationsDropdown.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
        setConsiderationsMenuOpen(false);
    }
});

document.getElementById('zoom-in').addEventListener('click', () => {
    focusAnimation = null;
    camera.position.multiplyScalar(0.85);
    camera.position.clampLength(controls.minDistance, controls.maxDistance);
    controls.update();
});

document.getElementById('zoom-out').addEventListener('click', () => {
    focusAnimation = null;
    camera.position.multiplyScalar(1.15);
    camera.position.clampLength(controls.minDistance, controls.maxDistance);
    controls.update();
});

spinButton.addEventListener('click', () => {
    isSpinning = !isSpinning;
    spinButton.setAttribute('aria-pressed', String(isSpinning));
    spinLabel.textContent = isSpinning ? 'STOP TURN' : 'RESUME TURN';
});

document.getElementById('reset-view').addEventListener('click', () => {
    focusAnimation = null;
    if (routeDialog.open) {
        routeDialog.close();
    }
    jezeroCard.hidden = true;
    jezeroCard.classList.remove('is-visible');
    planet.rotation.set(0, 0, 0);
    camera.position.set(window.innerWidth > 760 ? 0 : -0.75, 0, 6);
    controls.target.set(0, 0, 0);
    controls.update();
    isSpinning = true;
    spinButton.setAttribute('aria-pressed', 'true');
    spinLabel.textContent = 'STOP TURN';
});

document.getElementById('jezero-focus').addEventListener('click', () => {
    focusJezero(() => {
        jezeroCard.hidden = false;
        requestAnimationFrame(() => jezeroCard.classList.add('is-visible'));
    });
});

document.getElementById('close-jezero-card').addEventListener('click', () => {
    if (routeDialog.open) {
        routeDialog.close();
    }
    jezeroCard.classList.remove('is-visible');
    jezeroCard.hidden = true;
});

document.getElementById('jezero-info-toggle').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const info = document.getElementById('jezero-info');
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!isExpanded));
    info.hidden = isExpanded;
});

document.querySelectorAll('.route-button').forEach((button) => {
    button.addEventListener('click', () => {
        const routeName = button.dataset.route;
        const routeImage = document.getElementById('route-dialog-image');
        document.getElementById('route-dialog-title').textContent = routeName;
        routeImage.src = button.dataset.image;
        routeImage.alt = `Imagen de ${routeName}`;
        document.querySelector('.route-dialog-info').textContent =
            routeName === 'Region Jezero Mission' ? routeAlt1Info :
                routeName === 'Northwest Region Jezero Mission' ? routeAlt2Info :
                    routeName === 'Western Delta Deposit Mission' ? routeAlt3Info :
                        routeName === 'Center Jezero Crater Mission' ? routeAlt4Info : 'HELLO WORLD';
        routeDialog.showModal();
    });
});

document.getElementById('close-route-dialog').addEventListener('click', () => {
    routeDialog.close();
});

controls.addEventListener('start', () => {
    focusAnimation = null;
});

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    if (isSpinning) {
        planet.rotation.y += delta * 0.075;
    }
    updateFocusAnimation();
    controls.update();
    renderer.render(scene, camera);
}

animate();
loadPlanetAssets();

function createJezeroMarker() {
    const latitude = THREE.MathUtils.degToRad(jezeroLatitude);
    const longitude = THREE.MathUtils.degToRad(jezeroLongitude);
    const normal = new THREE.Vector3(
        -Math.cos(latitude) * Math.cos(longitude),
        Math.sin(latitude),
        Math.cos(latitude) * Math.sin(longitude)
    ).normalize();
    const marker = new THREE.Group();
    marker.position.copy(normal).multiplyScalar(globeRadius + 0.006);
    marker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

    const pin = new THREE.Mesh(
        new THREE.ConeGeometry(0.03, 0.11, 16),
        new THREE.MeshBasicMaterial({ color: '#ff765e' })
    );
    pin.rotation.z = Math.PI;
    pin.position.y = 0.055;
    marker.add(pin);

    const point = new THREE.Mesh(
        new THREE.SphereGeometry(0.034, 16, 12),
        new THREE.MeshBasicMaterial({ color: '#fff0d9' })
    );
    point.position.y = 0.105;
    marker.add(point);

    const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.075, 0.006, 6, 32),
        new THREE.MeshBasicMaterial({ color: '#ff765e' })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.008;
    marker.add(halo);

    return marker;
}

function focusJezero(onComplete) {
    planet.updateMatrixWorld(true);
    const targetPosition = jezeroMarker.getWorldPosition(new THREE.Vector3());
    const viewDirection = camera.position.clone().sub(controls.target).normalize();
    const focusDistance = Math.max(
        controls.minDistance,
        camera.position.distanceTo(targetPosition) * 0.9
    );
    const targetCameraPosition = targetPosition.clone().addScaledVector(viewDirection, focusDistance);

    focusAnimation = {
        startTime: performance.now(),
        startCameraPosition: camera.position.clone(),
        startTarget: controls.target.clone(),
        targetCameraPosition,
        targetPosition,
        onComplete
    };
    isSpinning = false;
    spinButton.setAttribute('aria-pressed', 'false');
    spinLabel.textContent = 'RESUME TURN';
}

function updateFocusAnimation() {
    if (!focusAnimation) {
        return;
    }

    const progress = Math.min((performance.now() - focusAnimation.startTime) / 1100, 1);
    const easedProgress = progress * progress * (3 - 2 * progress);
    camera.position.lerpVectors(
        focusAnimation.startCameraPosition,
        focusAnimation.targetCameraPosition,
        easedProgress
    );
    controls.target.lerpVectors(
        focusAnimation.startTarget,
        focusAnimation.targetPosition,
        easedProgress
    );

    if (progress === 1) {
        const onComplete = focusAnimation.onComplete;
        focusAnimation = null;
        onComplete();
    }
}

async function loadPlanetAssets() {
    const results = await Promise.allSettled([
        loadPlanetReference(),
        loadOppositeSideReference()
    ]);
    const frontImage = results[0].status === 'fulfilled' ? results[0].value : null;
    const backImage = results[1].status === 'fulfilled' ? results[1].value : null;
    const errors = results
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason);

    errors.forEach((error) => console.error('No se pudo cargar un recurso del planeta:', error));

    const updatedTexture = createPlanetTexture(frontImage, backImage);
    mars.material.map.dispose();
    mars.material.map = updatedTexture;
    mars.material.needsUpdate = true;

    if (errors.length > 0) {
        loading.textContent = 'Vista 3D disponible; no se pudo cargar una de las imágenes del planeta.';
        loading.classList.add('is-error');
        return;
    }

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

function loadOppositeSideReference() {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('No se pudo cargar la imagen del hemisferio opuesto.'));
        image.src = 'imagenes%20jerazo/marte-reverso.png';
    });
}

function createPlanetTexture(frontImage = null, backImage = null) {
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

    if (frontImage || backImage) {
        const target = context.getImageData(0, 0, textureWidth, textureHeight);
        const front = frontImage ? analyzePlanetImage(frontImage) : null;
        const back = backImage ? analyzePlanetImage(backImage) : null;
        const images = [front, back].filter(Boolean);
        const commonTone = {
            mean: images.reduce((sum, image) => sum + image.mean, 0) / images.length,
            deviation: images.reduce((sum, image) => sum + image.deviation, 0) / images.length
        };

        if (frontImage) {
            projectReferenceGlobe(target, front, 'front', commonTone);
        }
        if (backImage) {
            projectReferenceGlobe(target, back, 'back', commonTone);
        }
        context.putImageData(target, 0, 0);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
}

function analyzePlanetImage(image) {
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = image.width;
    sourceCanvas.height = image.height;
    const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
    sourceContext.drawImage(image, 0, 0);

    const pixels = sourceContext.getImageData(0, 0, image.width, image.height).data;
    const centerX = image.width / 2;
    const centerY = image.height / 2;
    const radius = findPlanetImageRadius(pixels, image.width, image.height, centerX, centerY);
    const radiusSquared = radius * radius;
    let luminanceSum = 0;
    let luminanceSquaredSum = 0;
    let sampleCount = 0;

    for (let y = Math.floor(centerY - radius); y < centerY + radius; y += 1) {
        for (let x = Math.floor(centerX - radius); x < centerX + radius; x += 1) {
            const dx = x - centerX;
            const dy = y - centerY;
            if (dx * dx + dy * dy > radiusSquared) {
                continue;
            }

            const index = (y * image.width + x) * 4;
            if (isCheckerboardPixel(pixels, index)) {
                continue;
            }

            const luminance = getLuminance(pixels[index], pixels[index + 1], pixels[index + 2]);
            luminanceSum += luminance;
            luminanceSquaredSum += luminance * luminance;
            sampleCount += 1;
        }
    }

    const mean = luminanceSum / sampleCount;
    const variance = Math.max(0, luminanceSquaredSum / sampleCount - mean * mean);
    return {
        pixels,
        width: image.width,
        height: image.height,
        centerX,
        centerY,
        radius,
        mean,
        deviation: Math.max(1, Math.sqrt(variance))
    };
}

function projectReferenceGlobe(target, source, hemisphere, commonTone) {
    const { pixels, width, height, centerX, centerY, radius, mean, deviation } = source;
    const isFront = hemisphere === 'front';

    for (let x = 0; x < textureWidth; x += 1) {
        const longitude = (x / textureWidth) * Math.PI * 2;
        const sinLongitude = Math.sin(longitude);
        const cosLongitude = Math.cos(longitude);

        for (let y = 0; y < textureHeight; y += 1) {
            const latitude = (0.5 - y / textureHeight) * Math.PI;
            const cosLatitude = Math.cos(latitude);
            const visible = sinLongitude * cosLatitude * (isFront ? 1 : -1);
            if (visible <= 0.08) {
                continue;
            }

            const horizontal = cosLongitude * cosLatitude * radius * (isFront ? -1 : 1);
            const sourceX = centerX + horizontal;
            const sourceY = centerY - Math.sin(latitude) * radius;
            const x0 = Math.floor(sourceX);
            const y0 = Math.floor(sourceY);
            if (x0 < 0 || y0 < 0 || x0 + 1 >= width || y0 + 1 >= height) {
                continue;
            }

            const nearest = (Math.round(sourceY) * width + Math.round(sourceX)) * 4;
            if (isCheckerboardPixel(pixels, nearest)) {
                continue;
            }

            const blend = smoothStep(0.08, 0.3, visible);
            const xWeight = sourceX - x0;
            const yWeight = sourceY - y0;
            const topLeft = (y0 * width + x0) * 4;
            const topRight = topLeft + 4;
            const bottomLeft = topLeft + width * 4;
            const bottomRight = bottomLeft + 4;
            const targetIndex = (y * textureWidth + x) * 4;

            const redTop = pixels[topLeft] * (1 - xWeight) + pixels[topRight] * xWeight;
            const greenTop = pixels[topLeft + 1] * (1 - xWeight) + pixels[topRight + 1] * xWeight;
            const blueTop = pixels[topLeft + 2] * (1 - xWeight) + pixels[topRight + 2] * xWeight;
            const redBottom = pixels[bottomLeft] * (1 - xWeight) + pixels[bottomRight] * xWeight;
            const greenBottom = pixels[bottomLeft + 1] * (1 - xWeight) + pixels[bottomRight + 1] * xWeight;
            const blueBottom = pixels[bottomLeft + 2] * (1 - xWeight) + pixels[bottomRight + 2] * xWeight;
            const red = redTop * (1 - yWeight) + redBottom * yWeight;
            const green = greenTop * (1 - yWeight) + greenBottom * yWeight;
            const blue = blueTop * (1 - yWeight) + blueBottom * yWeight;
            const normalizedLuminance = commonTone.mean +
                (getLuminance(red, green, blue) - mean) *
                (commonTone.deviation / deviation);
            const intensity = Math.max(0, Math.min(1, (normalizedLuminance - 18) / 220));
            target.data[targetIndex] = target.data[targetIndex] * (1 - blend) +
                (66 + intensity * 160) * blend;
            target.data[targetIndex + 1] = target.data[targetIndex + 1] * (1 - blend) +
                (24 + intensity * 71) * blend;
            target.data[targetIndex + 2] = target.data[targetIndex + 2] * (1 - blend) +
                (17 + intensity * 44) * blend;
        }
    }
}

function getLuminance(red, green, blue) {
    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function findPlanetImageRadius(pixels, width, height, centerX, centerY) {
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const radii = directions.map(([deltaX, deltaY]) => {
        const limit = deltaX === 0 ? height : width;
        for (let distance = 1; distance < limit / 2; distance += 1) {
            const x = Math.round(centerX + deltaX * distance);
            const y = Math.round(centerY + deltaY * distance);
            const index = (y * width + x) * 4;
            if (isCheckerboardPixel(pixels, index)) {
                return distance;
            }
        }
        return Math.min(width, height) * 0.45;
    });
    return Math.min(...radii) * 0.99;
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
