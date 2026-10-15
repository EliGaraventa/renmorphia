// ====== PUNTOS DEL RECORRIDO ======
const PLAZA_ROCHA = [-34.9214, -57.9603];
const FACULTAD_ARTES = [-34.9156, -57.9478];

const CENTRO = [
    (PLAZA_ROCHA[0] + FACULTAD_ARTES[0]) / 2,
    (PLAZA_ROCHA[1] + FACULTAD_ARTES[1]) / 2
];
const ZOOM_INICIAL = 15;

// ====== CREAR MAPA ======
const map = L.map('map', {
    center: CENTRO,
    zoom: ZOOM_INICIAL,
    zoomControl: true,
    attributionControl: true,
    zoomAnimation: true,
    fadeAnimation: true
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// ====== RECORRIDO CURVO ======
function generarRecorridoCurvo(inicio, fin, cantidadPuntos) {
    const puntos = [];
    for (let i = 0; i <= cantidadPuntos; i++) {
        const t = i / cantidadPuntos;
        const lat = inicio[0] + (fin[0] - inicio[0]) * t;
        const lng = inicio[1] + (fin[1] - inicio[1]) * t;
        const curvatura = Math.sin(t * Math.PI) * 0.0012;
        puntos.push([lat + curvatura, lng - curvatura * 0.5]);
    }
    return puntos;
}

const recorrido = generarRecorridoCurvo(PLAZA_ROCHA, FACULTAD_ARTES, 20);

L.polyline(recorrido, {
    color: '#ff00ff',
    weight: 3,
    opacity: 0,
    className: 'uv-path',
    lineCap: 'round',
    lineJoin: 'round'
}).addTo(map);

// ====== PUNTOS DE INTERÉS ======
const puntosInteres = [
    { coords: PLAZA_ROCHA, label: '01', nombre: 'Plaza Rocha' },
    { coords: FACULTAD_ARTES, label: '02', nombre: 'Facultad de Artes' }
];

puntosInteres.forEach(punto => {
    L.circleMarker(punto.coords, {
        radius: 7,
        color: '#ff00ff',
        fillColor: '#ff00ff',
        fillOpacity: 0,
        weight: 2,
        className: 'uv-point'
    }).addTo(map);

    L.marker(punto.coords, {
        icon: L.divIcon({
            className: 'uv-label',
            html: `<div class="uv-label-text">${punto.label}</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    }).addTo(map);
});

// ====== REFERENCIAS DOM ======
const body = document.body;
const mapContainer = document.getElementById('map');
const overlay = document.getElementById('darkness-overlay');
const halo = document.getElementById('uv-halo');
const btnGyro = document.getElementById('btnGyro');
const gyroText = document.getElementById('gyroText');

// ====== LÓGICA DÍA/NOCHE ======
function setMode(mode) {
    if (mode === 'night') {
        body.classList.remove('day');
        body.classList.add('night');
    } else {
        body.classList.remove('night');
        body.classList.add('day');
    }
}

function detectarModoPorHora() {
    const hora = new Date().getHours();
    // Entre las 19:00 y las 06:59 activa el modo noche
    if (hora >= 19 || hora < 7) {
        setMode('night');
    } else {
        setMode('day');
    }
}

// ====== LINTERNA UV ======
function updateFlashlight(x, y) {
    overlay.style.setProperty('--mouse-x', x + 'px');
    overlay.style.setProperty('--mouse-y', y + 'px');
    halo.style.setProperty('--mouse-x', x + 'px');
    halo.style.setProperty('--mouse-y', y + 'px');
}

mapContainer.addEventListener('mousemove', (e) => {
    const rect = mapContainer.getBoundingClientRect();
    updateFlashlight(e.clientX - rect.left, e.clientY - rect.top);
});

mapContainer.addEventListener('touchmove', (e) => {
    const rect = mapContainer.getBoundingClientRect();
    const touch = e.touches[0];
    updateFlashlight(touch.clientX - rect.left, touch.clientY - rect.top);
}, { passive: true });

mapContainer.addEventListener('mouseenter', (e) => {
    const rect = mapContainer.getBoundingClientRect();
    updateFlashlight(e.clientX - rect.left, e.clientY - rect.top);
});

// ====== PARTÍCULAS UV ======
const particlesContainer = document.getElementById('particles');
function crearParticulas(cantidad) {
    for (let i = 0; i < cantidad; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (8 + Math.random() * 12) + 's';
        p.style.animationDelay = (Math.random() * 10) + 's';
        p.style.opacity = 0.3 + Math.random() * 0.7;
        const size = 1 + Math.random() * 2;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        particlesContainer.appendChild(p);
    }
}
crearParticulas(40);

// ====== ESTRELLAS UV ======
const starsCanvas = document.getElementById('stars');
const starsCtx = starsCanvas.getContext('2d');
let stars = [];
let starsAnimationId = null;

function resizeStarsCanvas() {
    const rect = mapContainer.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    starsCanvas.width = rect.width * dpr;
    starsCanvas.height = rect.height * dpr;
    starsCanvas.style.width = rect.width + 'px';
    starsCanvas.style.height = rect.height + 'px';
    starsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    generarEstrellas(rect.width, rect.height);
}

function generarEstrellas(w, h) {
    stars = [];
    const cantidad = Math.floor((w * h) / 6000);
    for (let i = 0; i < cantidad; i++) {
        stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.4 + 0.3,
            baseAlpha: Math.random() * 0.5 + 0.3,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.006 + 0.0015,
            hue: Math.random() < 0.3 ? 'uv' : 'white'
        });
    }
}

function dibujarEstrellas(tiempo) {
    const rect = mapContainer.getBoundingClientRect();
    starsCtx.clearRect(0, 0, rect.width, rect.height);

    for (const s of stars) {
        const alpha = s.baseAlpha + Math.sin(tiempo * s.speed + s.phase) * 0.22;
        const a = Math.max(0, Math.min(1, alpha));

        if (s.hue === 'uv') {
            starsCtx.fillStyle = `rgba(255, 0, 255, ${a})`;
            starsCtx.shadowColor = 'rgba(255, 0, 255, 0.9)';
            starsCtx.shadowBlur = 8;
        } else {
            starsCtx.fillStyle = `rgba(255, 255, 255, ${a})`;
            starsCtx.shadowColor = 'rgba(200, 180, 255, 0.8)';
            starsCtx.shadowBlur = 6;
        }

        starsCtx.beginPath();
        starsCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        starsCtx.fill();
    }

    starsCtx.shadowBlur = 0;
    starsAnimationId = requestAnimationFrame(dibujarEstrellas);
}

function iniciarEstrellas() {
    resizeStarsCanvas();
    if (!starsAnimationId) {
        starsAnimationId = requestAnimationFrame(dibujarEstrellas);
    }
}

function detenerEstrellas() {
    if (starsAnimationId) {
        cancelAnimationFrame(starsAnimationId);
        starsAnimationId = null;
    }
}

window.addEventListener('resize', resizeStarsCanvas);

const observerModo = new MutationObserver(() => {
    if (body.classList.contains('night')) {
        iniciarEstrellas();
    } else {
        detenerEstrellas();
    }
});
observerModo.observe(body, { attributes: true, attributeFilter: ['class'] });

// ====== GIROSCOPIO ======
const esTactil = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const tieneSensor = typeof window.DeviceOrientationEvent !== 'undefined';

if (esTactil || tieneSensor) {
    btnGyro.classList.add('visible');
}

let gyroActivo = false;
let gyroBase = null;
let gyroTarget = { x: 0, y: 0 };
let gyroCurrent = { x: 0, y: 0 };
let gyroRAF = null;

async function pedirPermisoGiroscopio() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permiso = await DeviceOrientationEvent.requestPermission();
            return permiso === 'granted';
        } catch (err) {
            console.warn('Permiso denegado:', err);
            return false;
        }
    }
    return true;
}

function onDeviceOrientation(e) {
    if (!gyroActivo) return;

    const beta = e.beta;
    const gamma = e.gamma;

    if (beta === null || gamma === null) return;

    if (!gyroBase) {
        gyroBase = { beta, gamma };
        return;
    }

    const deltaBeta = beta - gyroBase.beta;
    const deltaGamma = gamma - gyroBase.gamma;
    const SENSIBILIDAD = 25;

    const rect = mapContainer.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, deltaGamma / SENSIBILIDAD));
    const ny = Math.max(-1, Math.min(1, deltaBeta / SENSIBILIDAD));

    gyroTarget.x = rect.width / 2 + nx * (rect.width / 2 - 40);
    gyroTarget.y = rect.height / 2 + ny * (rect.height / 2 - 40);
}

function gyroLoop() {
    if (!gyroActivo) return;
    const SUAVIZADO = 0.12;
    gyroCurrent.x += (gyroTarget.x - gyroCurrent.x) * SUAVIZADO;
    gyroCurrent.y += (gyroTarget.y - gyroCurrent.y) * SUAVIZADO;
    updateFlashlight(gyroCurrent.x, gyroCurrent.y);
    gyroRAF = requestAnimationFrame(gyroLoop);
}

async function activarGiroscopio() {
    const ok = await pedirPermisoGiroscopio();

    if (!ok) {
        gyroText.textContent = 'Permiso denegado';
        setTimeout(() => { gyroText.textContent = 'Activar giroscopio'; }, 2000);
        return;
    }

    gyroActivo = true;
    gyroBase = null;

    const rect = mapContainer.getBoundingClientRect();
    gyroCurrent.x = rect.width / 2;
    gyroCurrent.y = rect.height / 2;
    gyroTarget.x = rect.width / 2;
    gyroTarget.y = rect.height / 2;

    window.addEventListener('deviceorientation', onDeviceOrientation);
    gyroRAF = requestAnimationFrame(gyroLoop);

    btnGyro.classList.add('active');
    gyroText.textContent = 'Giroscopio activo';
}

function desactivarGiroscopio() {
    gyroActivo = false;
    gyroBase = null;
    window.removeEventListener('deviceorientation', onDeviceOrientation);
    if (gyroRAF) {
        cancelAnimationFrame(gyroRAF);
        gyroRAF = null;
    }
    btnGyro.classList.remove('active');
    gyroText.textContent = 'Activar giroscopio';
}

btnGyro.addEventListener('click', (e) => {
    e.stopPropagation();
    if (gyroActivo) {
        desactivarGiroscopio();
    } else {
        activarGiroscopio();
    }
});

mapContainer.addEventListener('touchstart', (e) => {
    if (gyroActivo && !btnGyro.contains(e.target)) {
        desactivarGiroscopio();
    }
}, { passive: true });

window.addEventListener('resize', () => {
    if (gyroActivo) gyroBase = null;
});

// ====== INICIALIZAR ======
detectarModoPorHora();
setInterval(detectarModoPorHora, 60000); // Revisa la hora cada 60 segundos

if (body.classList.contains('night')) {
    iniciarEstrellas();
}