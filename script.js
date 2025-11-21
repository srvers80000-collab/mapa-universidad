// ==================== INTRO CINEMÁTICA ====================
const introOverlay = document.getElementById('intro-overlay');
const startBtn = document.getElementById('startIntro');
const skipBtn  = document.getElementById('skipIntro');

// Función para iniciar el mapa
function iniciarMapa() {
    introOverlay.style.display = 'none'; // Oculta overlay
    map.invalidateSize();               // Redibuja mapa correctamente
}

// Botones de intro
startBtn.addEventListener('click', iniciarMapa);
skipBtn.addEventListener('click', iniciarMapa);

// ==================== DATOS DE LOS PUNTOS ====================
const puntos = {
    biblioteca: { coords: [12.126227,-86.269451], text: "📚 Biblioteca", height:'h2'},
    neysis: { coords: [12.125805,-86.269951], text:"🏬 Edificio Neysis Ríos", height:'h2'},
    gimnasio: { coords: [12.126287,-86.270978], text:"🏋️ Gimnasio", height:'h3'},
    museo: { coords:[12.125237,-86.270986], text:"🏛 Museo Héroes y Mártires", height:'h1'},
    aula_magna:{ coords:[12.126479,-86.270218], text:"🎓 Aula Magna César Jerez", height:'h3'},
    foodpark:{ coords:[12.125315,-86.272077], text:"🍔 FoodPark", height:'h1'},
    facultad_cyt:{ coords:[12.126220,-86.271329], text:"🔬 Facultad de Ciencias y Tecnología", height:'h2'}
};

// Instrucciones paso a paso
const instrucciones = {
    biblioteca: "1. Avanza recto y gira a la izquierda rodeando el area deportiva.\n2. gira a la derecha y camina recto hasta ver el gran edificio de biblioteca. \n3. La Biblioteca estará a tu izquierda.",
    neysis: "1. Sigue el camino principal recto hasta la plaza.\n2. Toma el sendero hacia la izquierda.\n3. Continúa 40 metros; el Edificio Neysis Ríos estará a tu derecha.",
    gimnasio: "1. Avanza recto desde el porton hasta subir las escaleras. \n2. Gira a la derecha por el sendero más amplio.\n3. Avanza 100 metros hasta el gimnasio, al fondo.",
    museo: "1. Camina recto rodeando el edificio N cruzando el bosque. \n2. gira a la izquierda camina y sube las escaleras. \n3. gira a la derecha camiando pocos pasos y el museo estara a la derecha.",
    aula_magna: "1. Avanza hasta la plaza central.\n2. Gira a la derecha.\n3. Camina 50 metros; el Aula Magna estará a tu izquierda.",
    foodpark: "1. Avanza recto hasta la plaza.\n2. Gira completamente a la izquierda.\n3. Sigue el sendero oeste 150 metros; el FoodPark estará al final.",
    facultad_cyt: "1. Avanza recto hasta la plaza central.\n2. Gira suavemente a la derecha por el sendero principal.\n3. Avanza 90 metros; la Facultad estará a tu derecha."
};

// ==================== BOUNDS DEL CAMPUS ====================
function calcBounds(obj,pad=0.001){ 
    const lats = Object.values(obj).map(p=>p.coords[0]); 
    const lngs = Object.values(obj).map(p=>p.coords[1]);
    return [[Math.min(...lats)-pad, Math.min(...lngs)-pad],[Math.max(...lats)+pad, Math.max(...lngs)+pad]]; 
}
const campusBounds = calcBounds(puntos);

// ==================== INICIALIZAR MAPA ====================
const centroCampus = [12.1260, -86.2705]; 

const map = L.map('map',{ minZoom:16, maxZoom:20, zoomControl:true, attributionControl:false }).setView(centroCampus, 17);
map.fitBounds(campusBounds);

// Tiles
const lightTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20});
const darkTiles  = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:20});

// Máscara para bloquear fuera del campus
const outer = [[-90,-180],[-90,180],[90,180],[90,-180]];
const mask = L.polygon([outer,[[campusBounds[0][0],campusBounds[0][1]],[campusBounds[0][0],campusBounds[1][1]],[campusBounds[1][0],campusBounds[1][1]],[campusBounds[1][0],campusBounds[0][1]]]], { color:'#000', weight:0, fillColor:'#000', fillOpacity:0.55, interactive:false }).addTo(map);

// ==================== MARCADORES 3D ====================
const markers = {};
for(const key in puntos){
    const p = puntos[key];
    const html = `<div class="extrusion ${p.height}"><div class="column"></div><div class="base"></div></div>`;
    const myIcon = L.divIcon({ className:'custom-div-icon', html: html, iconSize:[24,36], iconAnchor:[12,36] });
    const marker = L.marker(p.coords,{icon:myIcon}).addTo(map).bindPopup(`<strong>${p.text}</strong>`);
    markers[key]=marker;
}

// ==================== PANEL DE INSTRUCCIONES ====================
const panel = document.getElementById('panel-instrucciones');

function mostrarInstrucciones(punto){
    const data = puntos[punto];
    const listaPasos = instrucciones[punto].split('\n').map(step => `<li>${step.trim()}</li>`).join('');

    panel.innerHTML = `<h2>${data.text}</h2>
        <p><strong>Coordenadas:</strong> ${data.coords[0].toFixed(6)}, ${data.coords[1].toFixed(6)}</p>
        <p><strong>Cómo llegar desde la entrada principal:</strong></p>
        <ul>${listaPasos}</ul>
        <button class="cerrar-panel" onclick="cerrarPanel()">Cerrar</button>`;
    panel.style.right='0';
}

function cerrarPanel(){ panel.style.right='-350px'; }

// Click en marcadores abre panel
for(const key in markers){
    markers[key].on('click',()=> mostrarInstrucciones(key));
}

// Función rápida para mover el mapa a punto
function irA(p){ map.flyTo(puntos[p].coords,18); mostrarInstrucciones(p); }

// ==================== RUTAS (Leaflet Routing Machine ready) ====================
let currentRoute = null;
function crearRuta(fromCoords,toCoords){
    if(currentRoute) map.removeControl(currentRoute);
    currentRoute = L.Routing.control({
        waypoints:[L.latLng(...fromCoords), L.latLng(...toCoords)],
        lineOptions: { styles:[{color:'#1e90ff',weight:5}] },
        addWaypoints:false,
        draggableWaypoints:false,
        fitSelectedRoutes:true,
        createMarker:false
    }).addTo(map);
}
document.getElementById('hacerRuta').addEventListener('click',()=>{
    const f = document.getElementById('ruta-from').value;
    const t = document.getElementById('ruta-to').value;
    if(f && t && puntos[f] && puntos[t]) crearRuta(puntos[f].coords,puntos[t].coords);
});
document.getElementById('borraRuta').addEventListener('click',()=>{ if(currentRoute){ map.removeControl(currentRoute); currentRoute=null; } });

// ==================== POPULAR SELECTS ====================
const fromSelect = document.getElementById('ruta-from');
const toSelect   = document.getElementById('ruta-to');
for(const key in puntos){
    const opt1 = document.createElement('option'); opt1.value=key; opt1.text=puntos[key].text; fromSelect.add(opt1);
    const opt2 = document.createElement('option'); opt2.value=key; opt2.text=puntos[key].text; toSelect.add(opt2);
}
// Añadir una opción inicial
const initialOpt = document.createElement('option');
initialOpt.text = "Seleccionar punto...";
initialOpt.value = "";
initialOpt.disabled = true;
initialOpt.selected = true;
fromSelect.prepend(initialOpt.cloneNode(true));
toSelect.prepend(initialOpt.cloneNode(true));

// ==================== FUNCIONES ADICIONALES ====================

// MODO OSCURO / LIGHT
const toggleThemeBtn = document.getElementById('toggleTheme');
let isDarkMode = false;
function toggleTheme(){
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark',isDarkMode);
    toggleThemeBtn.textContent = isDarkMode ? 'Modo Claro' : 'Modo Oscuro';
    if(isDarkMode){
        darkTiles.addTo(map);
        map.removeLayer(lightTiles);
    } else {
        lightTiles.addTo(map);
        map.removeLayer(darkTiles);
    }
}
toggleThemeBtn.addEventListener('click',toggleTheme);
toggleTheme(); // Inicia en modo oscuro (o lo ajusta al valor inicial si lo pones en CSS)

// MODO 3D
const toggle3DBtn = document.getElementById('toggle3D');
let is3D = false;
function toggle3D(){
    is3D = !is3D;
    document.getElementById('map').classList.toggle('tilted',is3D);
    toggle3DBtn.textContent = is3D ? 'Desactivar 3D' : 'Activar 3D';
}
toggle3DBtn.addEventListener('click',toggle3D);

// DEBUG PANEL (Lógica básica)
const debugPanel = document.getElementById('debug-panel');
const toggleDebugBtn = document.getElementById('toggleDebug');
let isDebugActive = false;
function toggleDebug(){
    isDebugActive = !isDebugActive;
    debugPanel.style.display = isDebugActive ? 'block' : 'none';
    toggleDebugBtn.textContent = isDebugActive ? 'Debug: ON' : 'Debug: OFF';
    
    // Activa la escucha de eventos del mapa solo si el debug está ON
    if(isDebugActive){
        const dbgCenter = document.getElementById('dbg-center');
        const dbgZoom = document.getElementById('dbg-zoom');
        const dbgClick = document.getElementById('dbg-click');
        
        map.on('moveend zoomend',function(){
            const center = map.getCenter();
            dbgCenter.textContent = `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`;
            dbgZoom.textContent = map.getZoom();
        });
        map.on('click',function(e){ dbgClick.textContent = `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`; });
    } else {
         // Quita los listeners si apaga el debug (opcional, pero buena práctica)
         map.off('moveend zoomend');
         map.off('click');
    }
}
toggleDebugBtn.addEventListener('click',toggleDebug);


// BÚSQUEDA (Lógica de autocompletado simple)
const searchInput = document.getElementById('search');
const suggestionsBox = document.getElementById('suggestions');
const searchablePoints = Object.keys(puntos).map(key => ({ key, text: puntos[key].text.toLowerCase() }));

searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();
    suggestionsBox.innerHTML = '';

    if (query.length < 2) {
        suggestionsBox.style.display = 'none';
        return;
    }

    const filtered = searchablePoints.filter(p => p.text.includes(query));

    if (filtered.length > 0) {
        filtered.forEach(p => {
            const item = document.createElement('div');
            item.classList.add('item');
            item.textContent = puntos[p.key].text;
            item.addEventListener('click', () => {
                searchInput.value = puntos[p.key].text;
                suggestionsBox.style.display = 'none';
                irA(p.key);
            });
            suggestionsBox.appendChild(item);
        });
        suggestionsBox.style.display = 'block';
    } else {
        suggestionsBox.style.display = 'none';
    }
});

// Cierra sugerencias al hacer click fuera
document.addEventListener('click', function(e) {
    if (e.target.id !== 'search' && e.target.closest('#suggestions') === null) {
        suggestionsBox.style.display = 'none';
    }
});

// TOUR (Funcionalidad básica de ejemplo)
const tourPoints = ['biblioteca', 'neysis', 'gimnasio', 'museo', 'aula_magna', 'foodpark', 'facultad_cyt'];
let tourInterval;
let tourIndex = 0;
const startTourBtn = document.getElementById('startTour');
const stopTourBtn = document.getElementById('stopTour');

function startTour(){
    stopTourBtn.disabled = false;
    startTourBtn.disabled = true;
    tourIndex = 0;
    irA(tourPoints[tourIndex]);

    tourInterval = setInterval(() => {
        tourIndex = (tourIndex + 1) % tourPoints.length;
        irA(tourPoints[tourIndex]);
    }, 6000); // Cambia cada 6 segundos
}

function stopTour(){
    clearInterval(tourInterval);
    startTourBtn.disabled = false;
    stopTourBtn.disabled = true;
    cerrarPanel();
}

startTourBtn.addEventListener('click', startTour);
stopTourBtn.addEventListener('click', stopTour);