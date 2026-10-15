const canvas = document.getElementById('lienzo-entramado');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const contenedorCollage = document.getElementById('contenedor-collage');
const cortinaTransicion = document.getElementById('cortina-transicion');

const canvasEstatico = document.createElement('canvas');
const ctxEstatico = canvasEstatico.getContext('2d');

let dpr = window.devicePixelRatio || 1;
let transicionIniciada = false;
let animacionEntradaFinalizada = false;
let tiempoInicio = null;

// Bloqueo del 50%
let mallaBorradaSuficiente = false;
let contadorRevisionGlobal = 0;

// --- CONFIGURACIÓN DE TIEMPO (4 DÍAS) ---
const FECHA_INICIO = new Date(); 
const URL_SIGUIENTE_WEB = "./mapa/recorrido.html"; 

function obtenerDiaActual() {
  const ahora = new Date();
  const diffDias = (ahora - FECHA_INICIO) / (1000 * 60 * 60 * 24);
  if (diffDias < 0) return 1;
  return Math.min(Math.floor(diffDias) + 1, 4);
}

// --- 1. LISTA E IMÁGENES ---
const indicesPng = [30, 44, 48, 49, 50, 52];
const TOTAL_IMAGENES = 56;
const listaImagenes = [];

for (let i = 1; i <= TOTAL_IMAGENES; i++) {
  const ext = indicesPng.includes(i) ? 'png' : 'jpg';
  listaImagenes.push({ id: i, src: `imagenes/img${i}.${ext}` });
}

const estadoImagenes = [];

function cargarCollage() {
  contenedorCollage.innerHTML = '';
  estadoImagenes.length = 0;

  const w = window.innerWidth;
  const h = window.innerHeight;
  const esMovil = w < h;

  const centroX = w / 2;
  const centroY = h / 2;

  const radioMaxX = esMovil ? w * 0.40 : w * 0.38;
  const radioMaxY = esMovil ? h * 0.38 : h * 0.34;
  const offsetCentro = esMovil ? 35 : 55;

  listaImagenes.forEach((item, index) => {
    const img = document.createElement('img');
    img.src = item.src;
    img.className = 'pieza-movil';
    img.addEventListener('dragstart', (e) => e.preventDefault());

    const phi = 1.6180339887;
    const angulo = index * (2 * Math.PI * phi);
    const factorDistancia = Math.pow(index / (TOTAL_IMAGENES - 1), 0.70);

    const jitterX = (Math.random() - 0.5) * (esMovil ? 20 : 35);
    const jitterY = (Math.random() - 0.5) * (esMovil ? 20 : 35);

    const posX = centroX + (Math.cos(angulo) * radioMaxX * factorDistancia) - offsetCentro + jitterX;
    const posY = centroY + (Math.sin(angulo) * radioMaxY * factorDistancia) - offsetCentro + jitterY;
    
    estadoImagenes.push({
      element: img,
      x: posX,
      y: posY,
      targetX: posX,
      targetY: posY,
      rot: (Math.random() - 0.5) * 18,
      isDragging: false,
      isHovered: false,
      currentScale: 1,      
      escalaIntro: 0,       
      offsetX: 0,
      offsetY: 0,
      phase: index * 0.35,
      delayAnimacion: index * 18
    });

    img.onerror = () => { img.style.display = 'none'; };
    contenedorCollage.appendChild(img);
  });
}

function animarImagenes() {
  const tiempoReloj = Date.now() * 0.0012;

  estadoImagenes.forEach(st => {
    let targetScale = 1;
    if (st.isDragging) targetScale = 1.12;
    else if (st.isHovered) targetScale = 1.05;

    st.currentScale += (targetScale - st.currentScale) * 0.2;

    const floatY = st.isDragging ? 0 : Math.sin(tiempoReloj + st.phase) * 3.5;
    const floatX = st.isDragging ? 0 : Math.cos(tiempoReloj * 0.8 + st.phase) * 2;

    st.x += (st.targetX - st.x) * 0.22;
    st.y += (st.targetY - st.y) * 0.22;

    const scaleFinal = st.currentScale * (animacionEntradaFinalizada ? 1 : st.escalaIntro);

    st.element.style.transform = `translate3d(${st.x + floatX}px, ${st.y + floatY}px, 0px) rotate(${st.rot}deg) scale(${scaleFinal})`;
  });

  requestAnimationFrame(animarImagenes);
}
requestAnimationFrame(animarImagenes);

// --- 2. CONFIGURACIÓN DEL GRAFITI ---
const texturaEntramado = new Image();
texturaEntramado.src = 'imagenes/Malla organiza.png';
let texturaCargada = false;

function redimensionarCanvas() {
  dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  if (texturaCargada) {
    prepararTexturaEstatica(w, h);
    if (animacionEntradaFinalizada) dibujarEntramadoBase();
  }
}

function prepararTexturaEstatica(w, h) {
  canvasEstatico.width = w * dpr;
  canvasEstatico.height = h * dpr;
  ctxEstatico.scale(dpr, dpr);

  const esMovil = w < h;
  let escala;
  
  ctxEstatico.save();
  ctxEstatico.globalAlpha = 0.75; // Opacidad al 75%

  if (esMovil) {
    // Si es celular, ROTAMOS 90 grados el grafiti para que cubra a lo largo
    const escW = w / texturaEntramado.height;
    const escH = (h * 0.95) / texturaEntramado.width;
    escala = Math.max(escW, escH) * 1.15; // Un poco extra para que desborde bien

    const anchoFinal = texturaEntramado.width * escala;
    const altoFinal = texturaEntramado.height * escala;

    ctxEstatico.translate(w / 2, h / 2);
    ctxEstatico.rotate(Math.PI / 2); // 90 grados
    ctxEstatico.drawImage(texturaEntramado, -anchoFinal / 2, -altoFinal / 2, anchoFinal, altoFinal);
  } else {
    // En PC, orientación horizontal normal
    const escW = (w * 0.98) / texturaEntramado.width;
    const escH = (h * 0.95) / texturaEntramado.height;
    escala = Math.max(escW, escH);

    const anchoFinal = texturaEntramado.width * escala;
    const altoFinal = texturaEntramado.height * escala;
    const xCentrado = (w - anchoFinal) / 2;
    const yCentrado = (h - altoFinal) / 2;

    ctxEstatico.drawImage(texturaEntramado, xCentrado, yCentrado, anchoFinal, altoFinal);
  }

  ctxEstatico.restore(); // Limpiamos la rotación para no afectar los agujeros de erosión

  const dia = obtenerDiaActual();
  if (dia > 1) {
    ctxEstatico.globalCompositeOperation = 'destination-out';
    const agujeros = (dia - 1) * 12;
    for (let i = 0; i < agujeros; i++) {
      const rx = (w * 0.5) + (Math.random() - 0.5) * (w * 0.60);
      const ry = (h * 0.5) + (Math.random() - 0.5) * (h * 0.60);
      const radio = (Math.random() * 20 + 15) * (dia * 0.35);

      ctxEstatico.beginPath();
      ctxEstatico.arc(rx, ry, radio, 0, Math.PI * 2);
      ctxEstatico.fill();

      for (let j = 0; j < 5; j++) {
        const angulo = Math.random() * Math.PI * 2;
        const dist = radio + Math.random() * 15;
        ctxEstatico.beginPath();
        ctxEstatico.arc(rx + Math.cos(angulo) * dist, ry + Math.sin(angulo) * dist, Math.random() * 5 + 2, 0, Math.PI * 2);
        ctxEstatico.fill();
      }
    }
    ctxEstatico.globalCompositeOperation = 'source-over';
  }
}

texturaEntramado.onload = () => {
  texturaCargada = true;
  redimensionarCanvas();
  cargarCollage();
  requestAnimationFrame(bucleMaestroEntrada);
};

// --- 3. BUCLE DE ENTRADA SINCRONIZADA ---
function bucleMaestroEntrada(tiempoActual) {
  if (!tiempoInicio) {
    tiempoInicio = tiempoActual;
    estadoImagenes.forEach(st => {
      setTimeout(() => { if (st.element) st.element.style.opacity = '1'; }, st.delayAnimacion);
    });
  }

  const transcurrido = tiempoActual - tiempoInicio;
  const progresoIntro = Math.min(transcurrido / 2200, 1.0);
  const progresoCaida = 1 - Math.pow(1 - progresoIntro, 3); 

  estadoImagenes.forEach(st => {
    let tiempoImg = Math.max(0, transcurrido - st.delayAnimacion);
    let progresoImg = Math.min(tiempoImg / 500, 1.0);
    st.escalaIntro = 1 - Math.pow(1 - progresoImg, 3);
  });

  if (progresoIntro < 1.0) {
    dibujarCaidaGrafiti(progresoCaida);
    requestAnimationFrame(bucleMaestroEntrada);
  } else {
    animacionEntradaFinalizada = true;
    dibujarEntramadoBase();
  }
}

function dibujarCaidaGrafiti(p) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = 'black';
  ctx.beginPath();
  const limiteY = h * 1.25 * p;
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, limiteY);

  const pasosX = 30;
  for (let x = w; x >= 0; x -= pasosX) {
    const onda = Math.sin((x * 0.015) + (p * 8)) * 30;
    ctx.lineTo(x, limiteY + onda);
  }
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 15; i++) {
    const px = (w / 15) * i + Math.sin(i * 3 + p * 8) * 25;
    const radioDot = Math.sin(p * Math.PI) * 20 + 5;
    const offsetY = Math.sin(i * 2 + p * 7) * 40;
    ctx.beginPath();
    ctx.arc(px, limiteY + offsetY, Math.max(0, radioDot), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-in';
  ctx.drawImage(canvasEstatico, 0, 0, canvasEstatico.width, canvasEstatico.height, 0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

function dibujarEntramadoBase() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(canvasEstatico, 0, 0, canvasEstatico.width, canvasEstatico.height, 0, 0, w, h);
}

// Reseteo limpio al rotar el celular o cambiar tamaño de ventana
window.addEventListener('resize', () => {
  redimensionarCanvas();
  if (animacionEntradaFinalizada) {
    cargarCollage();
    estadoImagenes.forEach(st => {
      st.element.style.opacity = '1';
      st.escalaIntro = 1;
    });
  }
});

// --- 4. CÁLCULO DE RENDIMIENTO UX (50% Meta) ---
function verificarBorradoGlobal() {
  if (mallaBorradaSuficiente) return;

  const w = canvasEstatico.width;
  const h = canvasEstatico.height;
  const imgData = ctxEstatico.getImageData(0, 0, w, h).data;

  let transparentes = 0;
  let total = 0;
  const step = 4 * 40; // Escaneo optimizado

  for (let i = 3; i < imgData.length; i += step) {
    if (imgData[i] < 30) transparentes++;
    total++;
  }

  if ((transparentes / total) >= 0.50) {
    mallaBorradaSuficiente = true;
  }
}

// --- 5. INTERACCIÓN ADAPTATIVA (Touch vs Hover) ---
function hayTelaEn(x, y) {
  if (!animacionEntradaFinalizada) return false;
  const pixel = ctx.getImageData(Math.floor(x * dpr), Math.floor(y * dpr), 1, 1).data;
  return pixel[3] > 30;
}

function rasgarBocado(x, y, radio) {
  ctxEstatico.save();
  ctxEstatico.globalCompositeOperation = 'destination-out';

  ctxEstatico.beginPath();
  ctxEstatico.arc(x, y, radio, 0, Math.PI * 2);
  ctxEstatico.fill();

  const esMovil = window.innerWidth < window.innerHeight;
  for (let i = 0; i < 5; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const distancia = radio + Math.random() * (esMovil ? 10 : 16);
    ctxEstatico.beginPath();
    ctxEstatico.arc(x + Math.cos(angulo) * distancia, y + Math.sin(angulo) * distancia, Math.random() * (esMovil ? 6 : 8) + 2, 0, Math.PI * 2);
    ctxEstatico.fill();
  }
  ctxEstatico.restore();
  dibujarEntramadoBase();
}

let ultimoPunto = null;
function rasgarTrazo(x, y) {
  const esMovil = window.innerWidth < window.innerHeight;
  const radio = esMovil ? 20 : 28; 

  rasgarBocado(x, y, radio);

  if (ultimoPunto) {
    ctxEstatico.save();
    ctxEstatico.globalCompositeOperation = 'destination-out';
    ctxEstatico.beginPath();
    ctxEstatico.lineWidth = radio * 1.6;
    ctxEstatico.lineCap = 'round';
    ctxEstatico.moveTo(ultimoPunto.x, ultimoPunto.y);
    ctxEstatico.lineTo(x, y);
    ctxEstatico.stroke();
    ctxEstatico.restore();
    dibujarEntramadoBase();
  }
  ultimoPunto = { x, y };
  
  contadorRevisionGlobal++;
  if (contadorRevisionGlobal % 12 === 0) {
    verificarBorradoGlobal();
  }
  
  verificarTextoDescubierto();
}

// --- 6. GESTIÓN DEL PUNTERO ---
let estadoArrastreActivo = null;
let nivelZ = 10;

canvas.addEventListener('pointermove', (e) => {
  if (!animacionEntradaFinalizada) return;

  const x = e.clientX;
  const y = e.clientY;

  if (estadoArrastreActivo) {
    estadoArrastreActivo.targetX = x - estadoArrastreActivo.offsetX;
    estadoArrastreActivo.targetY = y - estadoArrastreActivo.offsetY;
    verificarTextoDescubierto();
    return;
  }

  const tela = hayTelaEn(x, y);
  
  const esTouch = (e.pointerType === 'touch' || e.pointerType === 'pen');
  const interactuando = esTouch ? e.buttons > 0 : true;

  estadoImagenes.forEach(st => st.isHovered = false);
  let mostrarManito = false;

  if (interactuando && tela) {
    rasgarTrazo(x, y);
  } else {
    ultimoPunto = null;
    
    if (!tela && mallaBorradaSuficiente) {
      canvas.style.pointerEvents = 'none';
      const el = document.elementFromPoint(x, y);
      canvas.style.pointerEvents = 'auto';

      if (el && el.classList.contains('pieza-movil')) {
        mostrarManito = true;
        const imgUnder = estadoImagenes.find(item => item.element === el);
        if (imgUnder) imgUnder.isHovered = true;
      }
    }
  }

  canvas.style.cursor = mostrarManito ? 'grab' : 'default';
});

canvas.addEventListener('pointerdown', (e) => {
  if (!animacionEntradaFinalizada) return;

  const x = e.clientX;
  const y = e.clientY;
  const tela = hayTelaEn(x, y);

  if (tela) {
    ultimoPunto = { x, y };
    rasgarTrazo(x, y);
    canvas.setPointerCapture(e.pointerId);
  } else if (mallaBorradaSuficiente) {
    canvas.style.pointerEvents = 'none';
    const el = document.elementFromPoint(x, y);
    canvas.style.pointerEvents = 'auto';

    if (el && el.classList.contains('pieza-movil')) {
      const st = estadoImagenes.find(item => item.element === el);
      if (st) {
        estadoArrastreActivo = st;
        st.isDragging = true;
        nivelZ++;
        el.style.zIndex = nivelZ;
        st.offsetX = x - st.x;
        st.offsetY = y - st.y;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
      }
    }
  }
});

const soltarInteraccion = (e) => {
  if (estadoArrastreActivo) {
    estadoArrastreActivo.isDragging = false;
    estadoArrastreActivo = null;
    verificarTextoDescubierto();
  }
  ultimoPunto = null;
  canvas.style.cursor = 'default';
  if (canvas.hasPointerCapture(e.pointerId)) {
    canvas.releasePointerCapture(e.pointerId);
  }
};

canvas.addEventListener('pointerup', soltarInteraccion);
canvas.addEventListener('pointercancel', soltarInteraccion);

// --- 7. REVISIÓN DE ESCAPE (Transición Final) ---
function verificarTextoDescubierto() {
  if (transicionIniciada || !animacionEntradaFinalizada) return;

  const textoEl = document.getElementById('texto-central');
  if (!textoEl) return;

  const rectTexto = textoEl.getBoundingClientRect();
  if (rectTexto.width === 0 || rectTexto.height === 0) return;

  let imagenesEncima = 0;
  estadoImagenes.forEach(st => {
    const imgW = st.element.offsetWidth || 90;
    const imgH = st.element.offsetHeight || 90;

    const overlap = !(
      (st.x + imgW) < rectTexto.left ||
      st.x > rectTexto.right ||
      (st.y + imgH) < rectTexto.top ||
      st.y > rectTexto.bottom
    );
    if (overlap) imagenesEncima++;
  });

  if (imagenesEncima > 2) return;

  const muestraX = Math.floor(rectTexto.left * dpr);
  const muestraY = Math.floor(rectTexto.top * dpr);
  const muestraW = Math.floor(rectTexto.width * dpr);
  const muestraH = Math.floor(rectTexto.height * dpr);

  if (muestraW <= 0 || muestraH <= 0) return;

  const imgData = ctx.getImageData(muestraX, muestraY, muestraW, muestraH).data;
  let pixelesTransparentes = 0;
  const totalPixeles = imgData.length / 4;

  for (let i = 3; i < imgData.length; i += 4) {
    if (imgData[i] < 35) pixelesTransparentes++;
  }

  const porcentajeLimpio = pixelesTransparentes / totalPixeles;

  if (porcentajeLimpio > 0.70) {
    transicionIniciada = true;
    cortinaTransicion.classList.add('activa');
    setTimeout(() => { window.location.href = URL_SIGUIENTE_WEB; }, 1850);
  }
}
