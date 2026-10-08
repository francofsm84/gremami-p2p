import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp, CURRENT_CADET_ID } from '../context/AppContext';
import MotorcycleIcon from './MotorcycleIcon';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, LayerGroup, useMap } from 'react-leaflet';
import { 
  MapPin, 
  Footprints, 
  Bike, 
  Car, 
  Truck,
  Store, 
  Star, 
  MessageSquare, 
  ZoomIn, 
  ZoomOut, 
  Locate, 
  X, 
  ArrowLeft,
  ShieldCheck, 
  ArrowRight, 
  Wallet, 
  Sparkles, 
  Compass, 
  Bell, 
  Send, 
  ShieldAlert, 
  UserX, 
  UserCheck,
  PlusCircle, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Clock, 
  Navigation,
  ThumbsUp,
  AlertTriangle,
  Flag,
  Shield,
  Eye,
  EyeOff,
  ExternalLink,
  Package,
  Gavel,
  Calendar,
  Lock,
  Maximize2,
  Minimize2,
  ChevronUp
} from 'lucide-react';
import { getPeerSocials, getSocialLink, getModalityInfo, SERVICE_MODALITIES } from '../data/mockData';

// Vista Panorámica Nacional — Argentina (Córdoba + Buenos Aires)
const NATIONAL_CENTER = [-34.0, -62.0];
const NATIONAL_ZOOM = 5;

// Centro del Corredor Gran Córdoba — flyTo local
const METRO_CORRIDOR_CENTER = [-31.5500, -64.3000];
const ALTA_GRACIA_CENTER = [-31.6529, -64.4283];

// Monumentos e Hitos Históricos del Gran Córdoba y Valle de Paravachasca
const LANDMARKS = [
  // Alta Gracia
  { id: 'reloj', title: 'Reloj Público', subtitle: 'Torre Cívica 1938 • Alta Gracia', emoji: '🏛️', pos: [-31.6529, -64.4283] },
  { id: 'tajamar', title: 'El Tajamar', subtitle: 'Dique Jesuítico 1643 • Alta Gracia', emoji: '🌊', pos: [-31.6538, -64.4270] },
  { id: 'sierras-hotel', title: 'Sierras Hotel & Casino', subtitle: 'Casino 1908 • Alta Gracia', emoji: '🎰', pos: [-31.6465, -64.4230] },
  { id: 'estancia', title: 'Plaza Solares & Estancia', subtitle: 'Patrimonio UNESCO • Alta Gracia', emoji: '⛪', pos: [-31.6520, -64.4305] },
  { id: 'crucero', title: 'Rotonda El Crucero', subtitle: 'Acceso Ruta 5 & C45', emoji: '⭕', pos: [-31.6610, -64.4395] },
  { id: 'che', title: 'Casa del Che Guevara', subtitle: 'Villa Nydia 1932 • Alta Gracia', emoji: '🏍️', pos: [-31.6480, -64.4190] },

  // Localidades Intermedias
  { id: 'santa-ana', title: 'Villa Parque Santa Ana', subtitle: 'Ruta 5 Km 18 • Paravachasca', emoji: '🏡', pos: [-31.5720, -64.3580] },
  { id: 'malagueno', title: 'Malagueño', subtitle: 'Autopista Córdoba - C. Paz', emoji: '⛰️', pos: [-31.4650, -64.3320] },
  { id: 'bouwer', title: 'Bouwer', subtitle: 'Ruta 36 Sur', emoji: '🌾', pos: [-31.5620, -64.1950] },
  { id: 'toledo', title: 'Toledo', subtitle: 'Ruta 9 Sur', emoji: '🏭', pos: [-31.5550, -64.0850] },

  // Córdoba Capital (Zona Sur, Centro, Nueva Córdoba, Güemes)
  { id: 'cba-centro', title: 'Córdoba Centro', subtitle: 'Plaza San Martín & Cabildo', emoji: '🏙️', pos: [-31.4165, -64.1835] },
  { id: 'nueva-cba', title: 'Nueva Córdoba', subtitle: 'Buen Pastor & Plaza España', emoji: '🏛️', pos: [-31.4280, -64.1880] },
  { id: 'guemes', title: 'Barrio Güemes', subtitle: 'Paseo de las Artes & La Cañada', emoji: '🎨', pos: [-31.4245, -64.1925] },
  { id: 'cba-sur', title: 'Córdoba Zona Sur', subtitle: 'Ciudad Universitaria & B° Jardín', emoji: '🎓', pos: [-31.4550, -64.2050] },

  // Valle de Paravachasca
  { id: 'anisacate', title: 'Anisacate', subtitle: 'Ruta 5 & Río Anisacate', emoji: '🌲', pos: [-31.7125, -64.4085] },
  { id: 'la-bolsa', title: 'Villa La Bolsa', subtitle: 'Balneario El Hornito', emoji: '🏖️', pos: [-31.7220, -64.4410] },
  { id: 'valle-anisacate', title: 'Valle de Anisacate', subtitle: 'Ruta 5 Km 36', emoji: '🌄', pos: [-31.7320, -64.4120] },
  { id: 'dique-chico', title: 'Dique Chico', subtitle: 'Costanera del Río & Camping', emoji: '⛺', pos: [-31.7425, -64.3825] },
  { id: 'la-serranita', title: 'La Serranita', subtitle: 'Puente & Balneario Municipal', emoji: '🌉', pos: [-31.7525, -64.4540] }
];

// Helper para convertir coordenadas relativas (o lat/lng reales) al plano geográfico de Alta Gracia y Paravachasca
const getNodeCoordinates = (node) => {
  if (!node) return ALTA_GRACIA_CENTER;
  if (node.lat && node.lng) return [node.lat, node.lng];
  const lat = -31.6529 - (((node.y ?? 50) - 50) / 100) * 0.100;
  const lng = -64.4283 + (((node.x ?? 50) - 50) / 100) * 0.070;
  return [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
};

// Generador de Icono Leaflet Personalizado para Nodos / Prestadores
const createPeerIcon = (node, isSelected, repStatus, formatDistanceKm, isDark) => {
  if (!node) return L.divIcon({ className: 'custom-peer-marker-empty' });
  const isBlocked = repStatus === 'blocked';
  const isReported = repStatus === 'reported';
  const kmDistance = typeof formatDistanceKm === 'function'
    ? formatDistanceKm(node.distanceMeters || node.distance)
    : '0.5 km';

  let iconEmoji = '🚶';
  if (node.category === 'bicicleta') iconEmoji = '🚲';
  else if (node.category === 'motocicleta') {
    iconEmoji = node.serviceModality === 'pasajeros' ? '🛵' : node.serviceModality === 'envios' ? '📦' : '🏍️';
  } else if (node.category === 'automovil') {
    iconEmoji = node.serviceModality === 'pasajeros' ? '🚖' : node.serviceModality === 'envios' ? '📦' : '🚗';
  } else if (node.category === 'fletes') iconEmoji = '🚚';
  else if (node.category === 'comercio') iconEmoji = '🏪';

  let modalityBadge = '';
  if (node.serviceModality === 'pasajeros') {
    modalityBadge = '<span title="Transporte de Pasajeros">🚖</span>';
  } else if (node.serviceModality === 'envios') {
    modalityBadge = '<span title="Envíos y Paquetes">📦</span>';
  } else if (node.serviceModality === 'mixto') {
    modalityBadge = '<span title="Servicio Mixto">🔄</span>';
  }

  let borderColor = '#10B981';
  let repIcon = '🟢';

  if (isBlocked) {
    borderColor = '#F43F5E';
    repIcon = '🔴';
  } else if (isReported) {
    borderColor = '#F59E0B';
    repIcon = '🟡';
  }

  const bgNode = isDark ? '#0B132B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const scaleStyle = isSelected ? 'transform: scale(1.25); filter: drop-shadow(0 0 8px #F7931A);' : '';

  return L.divIcon({
    className: 'custom-peer-marker',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer; ${scaleStyle}">
        <div style="background:${bgNode}; border:2.5px solid ${borderColor}; border-radius:14px; padding:3px 7px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.3); font-size:16px;">
          ${iconEmoji}
        </div>
        <div style="margin-top:2px; background:${isDark ? '#070C1E' : '#FFFFFF'}; color:${textColor}; border:1px solid ${borderColor}; border-radius:6px; padding:1px 6px; font-size:9.5px; font-weight:800; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.25); display:flex; align-items:center; gap:3px;">
          <span>${repIcon}</span>
          ${modalityBadge ? `<span>${modalityBadge}</span>` : ''}
          <span>${node.name}</span>
          ${node.locality ? `<span style="font-size:8px; opacity:0.9; color:${isDark ? '#38BDF8' : '#0284C7'};">(${node.locality})</span>` : ''}
          <span style="font-family:monospace; color:${isDark ? '#94A3B8' : '#64748B'}; font-size:8.5px;">(${kmDistance})</span>
        </div>
      </div>
    `,
    iconSize: [115, 52],
    iconAnchor: [57, 48]
  });
};

// Generador de Icono Leaflet Distintivo para el Usuario Actual ("📍 Tú / Tu Ubicación")
const createUserIcon = (hasLiveGps, isDark) => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; pointer-events:none;">
        <div style="position:relative; display:flex; align-items:center; justify-content:center;">
          <!-- Halo exterior con pulso animado en CSS (animate-ping) -->
          <div style="position:absolute; width:44px; height:44px; border-radius:9999px; background:rgba(37,99,235,0.45); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <!-- Halo radar secundario -->
          <div style="position:absolute; width:30px; height:30px; border-radius:9999px; background:rgba(59,130,246,0.3); border:1.5px solid rgba(147,197,253,0.6);"></div>
          <!-- Punto azul radiante distintivo -->
          <div style="position:relative; width:22px; height:22px; border-radius:9999px; background:#2563EB; border:3px solid #FFFFFF; display:flex; align-items:center; justify-content:center; color:#FFFFFF; font-size:8px; font-weight:900; box-shadow:0 0 16px rgba(37,99,235,0.95), 0 2px 6px rgba(0,0,0,0.4);">
            <div style="width:7px; height:7px; border-radius:9999px; background:#FFFFFF;"></div>
          </div>
        </div>
        <!-- Tooltip distintivo "📍 Tú / Tu Ubicación" -->
        <div style="margin-top:4px; background:${isDark ? '#0B132B' : '#0F172A'}; color:#60A5FA; border:1.5px solid #3B82F6; border-radius:9999px; padding:2px 9px; font-size:9.5px; font-weight:800; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,0.5); display:flex; align-items:center; gap:4px;">
          <span>📍</span>
          <span style="color:#FFFFFF;">Tú / Tu Ubicación</span>
          <span style="font-size:8px; padding:1px 4px; border-radius:4px; font-weight:900; background:${hasLiveGps ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}; color:${hasLiveGps ? '#34D399' : '#FBBF24'};">
            ${hasLiveGps ? 'GPS EN VIVO' : 'ALTA GRACIA'}
          </span>
        </div>
      </div>
    `,
    iconSize: [140, 56],
    iconAnchor: [70, 48]
  });
};

// Generador de Icono Leaflet Distintivo para Pedidos en Subasta / Clientes Activos (Modo Cadete)
const createAuctionMarkerIcon = (req, isSelected, isDark) => {
  if (!req) return L.divIcon({ className: 'custom-auction-marker-empty' });
  const bgNode = isDark ? '#0B132B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const borderColor = '#F59E0B';
  const offersCount = req.offers?.length || 0;
  const scaleStyle = isSelected ? 'transform: scale(1.22); filter: drop-shadow(0 0 10px #F59E0B);' : '';

  return L.divIcon({
    className: 'custom-auction-marker',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer; ${scaleStyle}">
        <div style="position:relative; display:flex; align-items:center; justify-content:center;">
          <!-- Pulso de radar ámbar animado -->
          <div style="position:absolute; width:36px; height:36px; border-radius:9999px; background:rgba(245,158,11,0.35); animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <!-- Ícono de Paquete P2P Distintivo -->
          <div style="background:${bgNode}; border:2.5px solid ${borderColor}; border-radius:14px; padding:3px 7px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(245,158,11,0.4); font-size:17px; position:relative; z-index:2;">
            📦
          </div>
          ${offersCount > 0 ? `
            <div style="position:absolute; -top:6px; -right:8px; background:#10B981; color:#FFFFFF; font-size:8px; font-weight:900; border-radius:9999px; padding:1px 5px; border:1.5px solid #FFFFFF; z-index:3; box-shadow:0 2px 4px rgba(0,0,0,0.3);">
              ${offersCount} cotiz.
            </div>
          ` : ''}
        </div>
        <div style="margin-top:2px; background:${isDark ? '#070C1E' : '#FFFFFF'}; color:${textColor}; border:1.5px solid ${borderColor}; border-radius:6px; padding:2px 6px; font-size:9.5px; font-weight:800; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.3); display:flex; align-items:center; gap:3px;">
          <span style="color:#F59E0B;">⏰ ${req.scheduledTime || 'Hoy'}</span>
          ${req.locality ? `<span style="font-size:8px; opacity:0.9; color:${isDark ? '#38BDF8' : '#0284C7'}; font-weight:900;">(${req.locality})</span>` : ''}
          <span style="font-family:monospace; color:${isDark ? '#94A3B8' : '#64748B'}; font-size:8.5px;">(${req.distanceKm || '0.5 km'})</span>
          <span>•</span>
          <span style="color:#10B981; font-family:monospace;">$${Number(req.estimatedFeeArs || 0).toLocaleString('es-AR')}</span>
        </div>
      </div>
    `,
    iconSize: [125, 56],
    iconAnchor: [62, 50]
  });
};

// Helper para obtener especificaciones operativas, capacidad y cobertura geográfica local de cada prestador
const getPeerOperationalSpecs = (node) => {
  if (!node) {
    return {
      vehicle: 'Transporte Urbano',
      capacity: 'Cargas estándar',
      coverage: 'Solares, Centro, Sabattini, Pellegrini, La Perla',
      includesHelpers: false
    };
  }

  let vehicle = node.vehicleType || node.vehicle;
  let capacity = node.loadCapacity;
  let coverage = node.coverageArea;

  if (node.category === 'caminando') {
    vehicle = vehicle || 'Cadete a Pie / Mochila Urbana';
    capacity = capacity || 'Mochila Urbana 🎒 - Cargas ligeras hasta 5 kg';
    coverage = coverage || 'Av. Belgrano, Sarmiento, Plaza Solares, Casco Céntrico';
  } else if (node.category === 'bicicleta') {
    vehicle = vehicle || 'Bicicleta de Ruta / Montaña con Parrilla';
    capacity = capacity || 'Mochila Térmica 🎒 - Cargas hasta 12 kg';
    coverage = coverage || 'Ciclovías, Bv. Pellegrini, El Tajamar, Parque del Sierras';
  } else if (node.category === 'motocicleta') {
    vehicle = vehicle || 'Motocicleta 110cc / 150cc con Baúl Sellado';
    capacity = capacity || 'Caja Térmica Sellada 📦 - Envíos hasta 25 kg';
    coverage = coverage || 'Todo Alta Gracia, Rotonda El Crucero, Sabattini, San Martín';
  } else if (node.category === 'automovil') {
    vehicle = vehicle || 'Automóvil Sedán / 5 Puertas';
    capacity = capacity || 'Baúl Amplio 🚗 - Cargas hasta 150 kg';
    coverage = coverage || 'Alta Gracia Urbano, Valle Buena Esperanza, La Paisanita';
  } else if (node.category === 'fletes') {
    vehicle = vehicle || 'Camioneta Utilitario / Pick-up / Furgón';
    capacity = capacity || 'Camioneta Utilitario 🚚 - Fletes pesados / 1.500 kg / 8 m³';
    coverage = coverage || 'Alta Gracia completa, Ruta 5, Córdoba Capital, Falda del Carmen';
  } else if (node.category === 'comercio') {
    vehicle = vehicle || 'Local Comercial con Mostrador Fijo';
    capacity = capacity || 'Stock Inmediato en Mostrador 🏪 - Envíos o Retiro P2P';
    coverage = coverage || 'Eje Comercial Belgrano, Sarmiento, El Tajamar';
  }

  return {
    vehicle: vehicle || 'Vehículo Urbano',
    capacity: capacity || 'Mochila Térmica 🎒 - Cargas hasta 10 kg',
    coverage: coverage || 'Solares, Centro, Sabattini, Pellegrini, La Perla',
    includesHelpers: node.includesHelpers ?? (node.category === 'fletes')
  };
};

// Generador de Icono Leaflet para Hitos Emblemáticos
const createLandmarkIcon = (emoji, title, subtitle, isDark) => {
  return L.divIcon({
    className: 'custom-landmark-marker',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; pointer-events:none;">
        <div style="background:${isDark ? 'rgba(11,19,43,0.92)' : 'rgba(255,255,255,0.95)'}; color:${isDark ? '#F1F5F9' : '#0F172A'}; border:1px solid ${isDark ? '#334155' : '#CBD5E1'}; border-radius:10px; padding:2px 6px; display:flex; align-items:center; gap:4px; box-shadow:0 4px 10px rgba(0,0,0,0.2); white-space:nowrap;">
          <span style="font-size:12px;">${emoji}</span>
          <div style="text-align:left;">
            <div style="font-size:9.5px; font-weight:800; line-height:1.1;">${title}</div>
            <div style="font-size:8px; opacity:0.75; font-family:monospace; line-height:1;">${subtitle}</div>
          </div>
        </div>
      </div>
    `,
    iconSize: [110, 36],
    iconAnchor: [55, 32]
  });
};

// Controlador auxiliar para mover el mapa reactivamente con flyTo / fitBounds
function MapController({ selectedNode, selectedAuction, recenterTrigger, userCoords, expandTrigger, fitBoundsTrigger, fitBoundsCoords }) {
  const map = useMap();

  useEffect(() => {
    if (selectedNode) {
      const [lat, lng] = getNodeCoordinates(selectedNode);
      map.flyTo([lat, lng], 15, { duration: 0.8 });
    } else if (selectedAuction) {
      const coords = selectedAuction.lat && selectedAuction.lng
        ? [selectedAuction.lat, selectedAuction.lng]
        : getNodeCoordinates(selectedAuction);
      map.flyTo(coords, 15, { duration: 0.8 });
    }
  }, [selectedNode, selectedAuction, map]);

  useEffect(() => {
    if (recenterTrigger > 0) {
      const targetCoords = userCoords || ALTA_GRACIA_CENTER;
      map.flyTo(targetCoords, 15, { duration: 0.8 });
    }
  }, [recenterTrigger, map, userCoords]);

  // fitBounds al conjunto de nodos filtrados cuando cambia la categoria
  useEffect(() => {
    if (fitBoundsTrigger === 0) return;
    if (!fitBoundsCoords || fitBoundsCoords.length === 0) {
      // Sin nodos para esa categoria — vista panoramica nacional
      map.flyTo(NATIONAL_CENTER, NATIONAL_ZOOM, { duration: 0.8 });
      return;
    }
    if (fitBoundsCoords.length === 1) {
      map.flyTo(fitBoundsCoords[0], 13, { duration: 0.8 });
      return;
    }
    try {
      const bounds = L.latLngBounds(fitBoundsCoords);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13, animate: true, duration: 0.8 });
    } catch (e) {
      map.flyTo(NATIONAL_CENTER, NATIONAL_ZOOM, { duration: 0.8 });
    }
  }, [fitBoundsTrigger, map]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recalcular tamaño del mapa tras montar
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  // Recalcular cuando cambia el estado de expansion (fullscreen toggle)
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 320);
    return () => clearTimeout(timer);
  }, [expandTrigger, map]);

  return null;
}

// Controles personalizados flotantes del mapa Leaflet
function CustomMapControls({ onRecenter, userCoords, hasLiveGps, isDark }) {
  const map = useMap();

  return (
    <div className="absolute right-3 bottom-6 z-[1000] flex flex-col gap-2 pointer-events-auto">
      {/* Botón Recentrar en Mi Ubicación en Alta Gracia (Transición suave flyTo) */}
      <button
        type="button"
        onClick={() => {
          const targetCoords = userCoords || ALTA_GRACIA_CENTER;
          map.flyTo(targetCoords, 15, { duration: 0.8 });
          if (onRecenter) onRecenter();
        }}
        className={`p-2.5 rounded-xl border shadow-xl transition-all active:scale-95 flex items-center justify-center relative ${
          hasLiveGps
            ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 ring-2 ring-blue-400/40'
            : isDark
            ? 'bg-[#121B2D] hover:bg-slate-800 text-blue-400 border-slate-700'
            : 'bg-white hover:bg-slate-50 text-blue-600 border-slate-300'
        }`}
        title={hasLiveGps ? "Centrar suavemente en Mi Ubicación en Vivo (GPS)" : "Centrar suavemente en Mi Ubicación (Alta Gracia)"}
      >
        <Locate size={18} className={hasLiveGps ? "animate-pulse" : ""} />
        {hasLiveGps && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></span>
        )}
      </button>

      {/* Controles de Zoom (+ / -) */}
      <div className={`flex flex-col rounded-xl border shadow-xl overflow-hidden ${
        isDark ? 'bg-[#121B2D] border-slate-700' : 'bg-white border-slate-300'
      }`}>
        <button
          type="button"
          onClick={() => map.zoomIn()}
          className={`p-2.5 border-b transition-colors active:scale-95 flex items-center justify-center ${
            isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800' : 'text-slate-700 hover:bg-slate-100 border-slate-200'
          }`}
          title="Acercar mapa"
        >
          <ZoomIn size={18} />
        </button>
        <button
          type="button"
          onClick={() => map.zoomOut()}
          className={`p-2.5 transition-colors active:scale-95 flex items-center justify-center ${
            isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Alejar mapa"
        >
          <ZoomOut size={18} />
        </button>
      </div>

      {/* Indicador de proveedor OpenStreetMap gratuito */}
      <div
        className={`px-2.5 py-1 rounded-xl border shadow-md text-[9px] font-bold flex items-center gap-1.5 ${
          isDark
            ? 'bg-[#121B2D] text-slate-300 border-slate-700'
            : 'bg-white text-slate-700 border-slate-300'
        }`}
        title="Proveedor OpenStreetMap (OSM) Estándar y Gratuito"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>OpenStreetMap</span>
      </div>
    </div>
  );
}

export default function MapaP2P(props) {
  const {
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    setActiveTab,
    goBack,
    startChatWithPeer,
    role,
    peers,
    theme,
    formatDistanceKm,
    activeAlert,
    dismissAlert,
    sendFeeProposal,
    acceptServiceRequest,
    createServiceRequest,
    triggerAlertTest,
    playAlertSound,
    unlockChatConnection,
    isChatUnlocked,
    blockUser,
    unblockUser,
    isUserBlocked,
    recommendPeer,
    reportPeer,
    getPeerReputation,
    isOnline,
    requestDniVerification,
    getDniVerificationStatus,
    setActiveChatPeerId,
    liveRequests,
    createAuctionRequest,
    submitCadeteQuote,
    awardAuctionOffer,
    userGpsCoords,
    hasLiveGps: appHasLiveGps,
    user
  } = useApp();

  const isDark = theme === 'dark';
  const isCadete = role === 'cadete';

  // Filtro de categorías con estado sincronizado reactivo
  const [internalCategory, setInternalCategory] = useState(
    props.selectedCategory !== undefined ? props.selectedCategory : (selectedCategoryFilter || 'all')
  );

  useEffect(() => {
    if (props.selectedCategory !== undefined) {
      setInternalCategory(props.selectedCategory);
    } else if (selectedCategoryFilter !== undefined) {
      setInternalCategory(selectedCategoryFilter);
    }
  }, [props.selectedCategory, selectedCategoryFilter]);

  const selectedCategory = props.selectedCategory !== undefined ? props.selectedCategory : internalCategory;

  const handleSelectCategory = (catId) => {
    setInternalCategory(catId);
    if (props.setSelectedCategory) props.setSelectedCategory(catId);
    if (setSelectedCategoryFilter) setSelectedCategoryFilter(catId);
    setSelectedNode(null);
    setSelectedAuction(null);
    // Disparar fitBounds al nuevo grupo de nodos tras aplicar el filtro
    setFitBoundsTrigger((prev) => prev + 1);
  };

  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [selectedModalityFilter, setSelectedModalityFilter] = useState('all');
  const [showCompetitorBids, setShowCompetitorBids] = useState(true);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  // fitBounds trigger: incrementar para hacer zoom al grupo de marcadores filtrado
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);

  // Estado de pantalla completa del mapa (colapsar/expandir controles superpuestos)
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [expandTrigger, setExpandTrigger] = useState(0);

  const handleToggleMapExpand = () => {
    setIsMapExpanded((prev) => !prev);
    setExpandTrigger((prev) => prev + 1);
    // Si había bottom sheets abiertos los cerramos para una vista limpia
    if (!isMapExpanded) {
      setSelectedNode(null);
      setSelectedAuction(null);
    }
  };

  // Sincronizar el pedido en subasta seleccionado con el estado reactivo global de liveRequests
  const activeAuction = selectedAuction
    ? ((liveRequests || []).find((r) => r.id === selectedAuction.id) || selectedAuction)
    : null;

  // Modales del Sistema de Subasta P2P y Envíos Programados
  const [showNewAuctionModal, setShowNewAuctionModal] = useState(false);
  const [showAuctionQuotesModal, setShowAuctionQuotesModal] = useState(false);
  const [showQuoteSubmitModal, setShowQuoteSubmitModal] = useState(false);
  const [quoteTargetAuction, setQuoteTargetAuction] = useState(null);

  // Form states para "Publicar Envío Programado" (Modo Cliente)
  const [auctionOrigin, setAuctionOrigin] = useState('Av. Belgrano 180 (Farmacia Central)');
  const [auctionDestination, setAuctionDestination] = useState('Bv. Pellegrini 320, Alta Gracia');
  const [auctionCategory, setAuctionCategory] = useState('bicicleta');
  const [auctionDescription, setAuctionDescription] = useState('Retiro de medicamentos urgentes y paquete sellado');
  const [auctionTime, setAuctionTime] = useState('Hoy 17:00 hs');
  const [auctionFeeArs, setAuctionFeeArs] = useState(2500);

  // Form states para Cotización de Cadete / Prestador (Modo Cadete)
  const [cadeteQuoteFeeArs, setCadeteQuoteFeeArs] = useState(2200);
  const [cadeteQuoteNote, setCadeteQuoteNote] = useState('Llego puntual en 15 min en bici, tengo mochila térmica sellada.');

  // 1. Geolocalización en Vivo del Usuario (GPS) con Fallback a Plaza Solares / Av. Belgrano
  const [userCoords, setUserCoords] = useState(userGpsCoords || ALTA_GRACIA_CENTER);
  const [hasLiveGps, setHasLiveGps] = useState(appHasLiveGps || false);

  // Sincronizar reactivamente con el rastreador en tiempo real (watchPosition)
  useEffect(() => {
    if (userGpsCoords && Array.isArray(userGpsCoords) && userGpsCoords.length === 2) {
      setUserCoords(userGpsCoords);
    }
    if (appHasLiveGps) {
      setHasLiveGps(true);
    }
  }, [userGpsCoords, appHasLiveGps]);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'geolocation' in navigator && navigator.geolocation) {
      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserCoords([latitude, longitude]);
            setHasLiveGps(true);
          },
          (error) => {
            console.warn('Geolocalización no disponible o permiso denegado:', error.message);
            if (!userGpsCoords) {
              setUserCoords(ALTA_GRACIA_CENTER);
            }
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
        );
      } catch (e) {
        console.warn('Error capturando GPS en MapaP2P:', e);
      }
    }
  }, []);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(true);

  // Form states for "Denunciar Usuario"
  const [reportReason, setReportReason] = useState('Cobro engañoso / Sobreprecio indebido');
  const [reportDetails, setReportDetails] = useState('');

  // Form states for "Solicitar Servicio Cercano"
  const [requestCategory, setRequestCategory] = useState('bicicleta');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestOrigin, setRequestOrigin] = useState('Av. Belgrano 180 (Farmacia Central)');
  const [requestDestination, setRequestDestination] = useState('Bv. Pellegrini 320');

  // Form states for Cadete "Propuesta de Tarifa Directa"
  const [proposalFeeArs, setProposalFeeArs] = useState(3200);
  const [proposalFeeValens, setProposalFeeValens] = useState(1.2);

  // ── ENUM de Movilidad Normalizado ────────────────────────────────────────────
  // Convierte variantes del campo 'category' al enum canónico:
  // 'caminando' | 'bicicleta' | 'motocicleta' | 'automovil' | 'fletes'
  const normalizeMobility = useCallback((cat) => {
    if (!cat) return 'caminando';
    const c = String(cat).toLowerCase().trim();
    if (c === 'caminando' || c === 'pie' || c === 'peatonal') return 'caminando';
    if (c === 'bicicleta' || c === 'bici' || c === 'bike') return 'bicicleta';
    if (c === 'motocicleta' || c === 'moto' || c === 'scooter') return 'motocicleta';
    if (c === 'automovil' || c === 'auto' || c === 'remis' || c === 'taxi' || c === 'sedan' || c === 'car') return 'automovil';
    if (c === 'fletes' || c === 'flete' || c === 'carga' || c === 'truck' || c === 'camion') return 'fletes';
    return c;
  }, []);

  // ── FILTRADO REACTIVO REAL CON useMemo ──────────────────────────────────────
  // Nodos (cadetes) visibles segun categoria + modalidad + bloqueados
  const visibleNodes = useMemo(() => {
    return peers.filter((node) => {
      const isBlocked = isUserBlocked(node.id);
      if (isBlocked && !showBlockedUsers) return false;

      // Filtro por categoria principal (enum normalizado)
      if (selectedCategory !== 'all') {
        const nodeCategory = normalizeMobility(node.category);
        const filterCategory = normalizeMobility(selectedCategory);
        if (nodeCategory !== filterCategory) return false;
      }

      // Filtro por modalidad de servicio (Pasajeros / Envios / Mixto)
      if (selectedModalityFilter !== 'all') {
        if (selectedModalityFilter === 'pasajeros') {
          if (node.serviceModality !== 'pasajeros' && node.serviceModality !== 'mixto') return false;
        } else if (selectedModalityFilter === 'envios') {
          if (node.serviceModality === 'pasajeros') return false;
        } else if (selectedModalityFilter === 'mixto') {
          if (node.serviceModality !== 'mixto') return false;
        }
      }

      return true;
    });
  }, [peers, selectedCategory, selectedModalityFilter, showBlockedUsers, isUserBlocked, normalizeMobility]);

  // Coordenadas de los nodos visibles para fitBounds (se recalcula con visibleNodes)
  const fitBoundsCoords = useMemo(() => {
    return visibleNodes
      .map((n) => getNodeCoordinates(n))
      .filter(([lat, lng]) => lat && lng && !isNaN(lat) && !isNaN(lng));
  }, [visibleNodes]);

  // Flag de estado vacio para la categoria activa
  const isCategoryEmpty = !isCadete && visibleNodes.length === 0 && selectedCategory !== 'all';


  // Helper de filtrado estricto por categoría y tipo de vehículo para Modo Cadete
  const matchesAuctionCategory = (req, targetCategory) => {
    if (!targetCategory || targetCategory === 'all') return true;
    const cat = String(req.category || '').toLowerCase().trim();
    const vType = String(req.vehicleType || req.vehicle || '').toLowerCase().trim();
    const target = String(targetCategory).toLowerCase().trim();

    // 1. Coincidencia directa exacta
    if (cat === target || vType === target) return true;

    // 2. Coincidencia por alias semánticos de transporte
    if (target === 'caminando') {
      return cat === 'caminando' || cat === 'pie' || cat === 'peatonal' || vType.includes('pie') || vType.includes('camin') || vType.includes('mochila');
    }
    if (target === 'bicicleta') {
      return cat === 'bicicleta' || cat === 'bici' || vType.includes('bici') || vType.includes('bike');
    }
    if (target === 'motocicleta') {
      return cat === 'motocicleta' || cat === 'moto' || vType.includes('moto') || vType.includes('scooter');
    }
    if (target === 'automovil') {
      return cat === 'automovil' || cat === 'auto' || cat === 'remis' || cat === 'taxi' || vType.includes('auto') || vType.includes('car') || vType.includes('sedan') || vType.includes('sedán') || vType.includes('remis') || vType.includes('taxi');
    }
    if (target === 'fletes') {
      return cat === 'fletes' || cat === 'flete' || cat === 'carga' || vType.includes('flete') || vType.includes('carga') || vType.includes('camion') || vType.includes('camión') || vType.includes('truck');
    }

    return false;
  };

  // Filtrado Estricto de Subastas y Pedidos de Clientes (Modo Cadete / Prestador)
  const openAuctionRequests = (liveRequests || []).filter((r) => r.status === 'open');
  const visibleAuctions = openAuctionRequests.filter((r) => matchesAuctionCategory(r, selectedCategory));

  // Subastas del cliente y conteo de ofertas recibidas en tiempo real
  const clientAuctions = liveRequests || [];
  const totalOffersCount = clientAuctions.reduce((acc, curr) => acc + (curr.offers?.length || 0), 0);

  // Estadísticas de Reputación en Alta Gracia
  const recommendedCount = peers.filter((p) => getPeerReputation(p.id) === 'recommended').length;
  const reportedCount = peers.filter((p) => getPeerReputation(p.id) === 'reported').length;
  const blockedCount = peers.filter((p) => isUserBlocked(p.id)).length;

  const handleRecenter = () => {
    // Al presionar la mira GPS, intenta refrescar la posición real del usuario si es posible
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'geolocation' in navigator && navigator.geolocation) {
      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserCoords([latitude, longitude]);
            setHasLiveGps(true);
          },
          () => {}
        );
      } catch (e) {}
    }
    setRecenterTrigger((prev) => prev + 1);
  };

  const handleStartChatOrConnect = (node) => {
    if (!isChatUnlocked(node.id)) {
      unlockChatConnection(node.id);
    }
    startChatWithPeer(node);
  };

  const handleBlockToggleSelectedNode = () => {
    if (selectedNode) {
      if (isUserBlocked(selectedNode.id)) {
        unblockUser(selectedNode.id);
      } else {
        blockUser(selectedNode.id);
      }
      setShowBlockConfirm(false);
    }
  };

  const handleRecommendSelectedNode = () => {
    if (selectedNode) {
      recommendPeer(selectedNode.id);
    }
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (selectedNode) {
      reportPeer(selectedNode.id, {
        reason: reportReason,
        details: reportDetails
      });
      setShowReportModal(false);
      setReportDetails('');
    }
  };

  const handleCreateRequestSubmit = (e) => {
    e.preventDefault();
    if (!requestDescription.trim()) return;
    createServiceRequest({
      category: requestCategory,
      description: requestDescription,
      origin: requestOrigin,
      destination: requestDestination
    });
    setRequestDescription('');
    setShowRequestModal(false);
  };

  const handleSendProposalSubmit = (e) => {
    e.preventDefault();
    if (activeAlert?.request) {
      sendFeeProposal(activeAlert.request.id, proposalFeeArs, proposalFeeValens);
      setShowProposalModal(false);
    }
  };

  const handlePublishAuctionSubmit = (e) => {
    e.preventDefault();
    if (!auctionDescription.trim()) return;
    createAuctionRequest({
      origin: auctionOrigin,
      destination: auctionDestination,
      category: auctionCategory,
      description: auctionDescription,
      scheduledTime: auctionTime,
      estimatedFeeArs: auctionFeeArs
    });
    setAuctionDescription('');
    setShowNewAuctionModal(false);
  };

  const handleOpenQuoteModal = (auction) => {
    setQuoteTargetAuction(auction);
    const existingOffer = (auction?.offers || []).find(
      (o) => o.cadeteId === CURRENT_CADET_ID || o.cadeteId === 'current-user-cadete' || o.isOwnOffer === true
    );
    if (existingOffer) {
      setCadeteQuoteFeeArs(existingOffer.feeArs || auction.estimatedFeeArs || 2400);
      setCadeteQuoteNote(existingOffer.note || 'Llego puntual con vehículo verificado y entrega directa.');
    } else {
      setCadeteQuoteFeeArs(auction.estimatedFeeArs || 2400);
      setCadeteQuoteNote('Llego puntual con vehículo verificado y entrega directa.');
    }
    setShowQuoteSubmitModal(true);
  };

  const handleCadeteQuoteSubmit = async (e) => {
    e.preventDefault();
    if (!quoteTargetAuction) return;
    await submitCadeteQuote(quoteTargetAuction.id, {
      feeArs: cadeteQuoteFeeArs,
      note: cadeteQuoteNote
    });
    setShowQuoteSubmitModal(false);
  };

  const handleAwardOffer = (requestId, offerId) => {
    awardAuctionOffer(requestId, offerId);
  };

  // Fuente activa para los contadores superiores según el Modo Activo (Cliente: prestadores / Cadete: demandas y subastas)
  const activeSource = isCadete ? (liveRequests || []) : (peers || []);
  const countByCategory = (catId) => activeSource.filter((item) => {
    if (isCadete) {
      return matchesAuctionCategory(item, catId);
    }
    return item.category === catId;
  }).length;

  // 5 Categorías Principales con contadores dinámicos y "🌟 TODAS" (250 Nodos / 250 Solicitudes)
  const categoriesList = [
    { id: 'all', label: `🌟 TODAS (${activeSource.length})`, icon: Sparkles },
    { id: 'caminando', label: `🚶 Caminando (${countByCategory('caminando')})`, icon: Footprints },
    { id: 'bicicleta', label: `🚲 Bicicleta (${countByCategory('bicicleta')})`, icon: Bike },
    { id: 'motocicleta', label: `🏍️ Motos (${countByCategory('motocicleta')})`, icon: MotorcycleIcon },
    { id: 'automovil', label: `🚗 Autos (${countByCategory('automovil')})`, icon: Car },
    { id: 'fletes', label: `🚚 Fletes / Cargas (${countByCategory('fletes')})`, icon: Truck }
  ];

  return (
    <div className={`flex-1 flex flex-col min-h-0 relative overflow-hidden transition-colors duration-200 select-none ${
      isDark ? 'bg-[#0A1128] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* 1. Barra Superior de Categorías — colapsable cuando el mapa está expandido */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isMapExpanded ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-64 opacity-100'
      }`}>
      <div className={`p-2.5 border-b z-20 transition-colors shadow-xs ${
        isDark ? 'bg-[#0B132B] border-[#1F2D48]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => (goBack ? goBack() : setActiveTab('home'))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex-shrink-0 ${
              isDark
                ? 'bg-[#18243C] text-slate-200 border-[#2A3B5C] hover:bg-[#233555] hover:text-white'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 shadow-xs'
            }`}
            title="Volver a la pantalla anterior"
          >
            <ArrowLeft size={14} />
            <span>Volver</span>
          </button>
          {categoriesList.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#F7931A] text-slate-950 shadow-md font-bold'
                    : isDark
                    ? 'bg-[#121B2D] text-slate-300 hover:text-white border border-[#1F2D48]'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Icon size={14} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Sub-barra de Filtro por Modalidad (Pasajeros vs Envíos vs Mixto) */}
        {!isCadete && (
          <div className="flex items-center gap-1.5 pt-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-extrabold text-slate-400 whitespace-nowrap pl-1">
              Modalidad:
            </span>
            {SERVICE_MODALITIES.map((mod) => {
              const isModSelected = selectedModalityFilter === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => {
                    setSelectedModalityFilter(mod.id);
                    setSelectedNode(null);
                    setFitBoundsTrigger((prev) => prev + 1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold whitespace-nowrap transition-all border ${
                    isModSelected
                      ? mod.id === 'pasajeros'
                        ? 'bg-amber-500/25 text-[#F7931A] border-[#F7931A] shadow-xs'
                        : mod.id === 'envios'
                        ? 'bg-blue-500/25 text-blue-400 border-blue-500 shadow-xs'
                        : mod.id === 'mixto'
                        ? 'bg-emerald-500/25 text-emerald-400 border-emerald-500 shadow-xs'
                        : 'bg-slate-700 text-white border-slate-500 shadow-xs'
                      : isDark
                      ? 'bg-[#121B2D]/70 text-slate-400 border-[#1F2D48] hover:text-slate-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`}
                  title={mod.description}
                >
                  {mod.shortLabel}
                </button>
              );
            })}
          </div>
        )}

        {/* 2. Barra de Control según Modo Activo (Cliente vs Cadete) */}
        {isCadete ? (
          <div className="flex flex-wrap justify-between items-center mt-2 px-1 text-[11px] gap-2 pt-1 border-t border-slate-700/30">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[#F7931A] font-extrabold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F7931A] shadow-glow-gold animate-pulse" />
                <span>📦 Modo Cadete: Logística Descentralizada • Gran Córdoba & Valle de Paravachasca ({visibleAuctions.length} Solicitudes)</span>
              </span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Pines de otros cadetes ocultos</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={triggerAlertTest}
                title="Probar Alarma P2P en Vivo"
                className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 text-[11px] font-bold transition-all ${
                  isDark ? 'bg-[#121B2D] border-slate-700 text-[#F7931A] hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-amber-700 hover:bg-slate-200'
                }`}
              >
                <Volume2 size={13} />
                <span>Alarma P2P</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-between items-center mt-2 px-1 text-[11px] gap-2 pt-1 border-t border-slate-700/30">
            {/* Leyenda Comunitaria de Reputación y Cobertura Gran Córdoba */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black text-[#F7931A] hidden lg:inline tracking-tight">
                Logística Descentralizada • Gran Córdoba & Valle de Paravachasca ({peers.length} Nodos)
              </span>
              <span className="text-slate-500 hidden lg:inline">•</span>
              <span className="flex items-center gap-1 text-emerald-500 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow-green" />
                <span>🟢 {recommendedCount} Recomendados</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="flex items-center gap-1 text-amber-500 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-glow-gold" />
                <span>🟡 {reportedCount} Denunciados</span>
              </span>
              {blockedCount > 0 && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center gap-1 text-rose-500 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-glow-raven" />
                    <span>🔴 {blockedCount} Bloqueados</span>
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Toggle para mostrar/ocultar usuarios bloqueados en el mapa */}
              {blockedCount > 0 && (
                <button
                  onClick={() => setShowBlockedUsers(!showBlockedUsers)}
                  className={`px-2 py-0.5 rounded-lg border text-[10px] flex items-center gap-1 transition-all ${
                    showBlockedUsers
                      ? isDark ? 'bg-rose-950/40 border-rose-500/50 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-800'
                      : isDark ? 'bg-[#121B2D] border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
                  }`}
                  title="Mostrar u ocultar usuarios bloqueados en el mapa"
                >
                  {showBlockedUsers ? <Eye size={11} /> : <EyeOff size={11} />}
                  <span>Bloqueados</span>
                </button>
              )}

              {/* Botón: Publicar Envío Programado (Subasta P2P) */}
              <button
                onClick={() => setShowNewAuctionModal(true)}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#F7931A] to-[#E07D09] hover:from-[#F0B90B] hover:to-[#F7931A] text-slate-950 font-black text-[11px] shadow-sm flex items-center gap-1 active:scale-95 transition-all"
                title="Publicar pedido programado para recibir cotizaciones de cadetes"
              >
                <PlusCircle size={13} />
                <span>Publicar Envío Programado</span>
              </button>

              {/* Botón: Comparador de Ofertas y Subastas */}
              <button
                onClick={() => setShowAuctionQuotesModal(true)}
                className={`px-2.5 py-1 rounded-xl border font-bold text-[11px] flex items-center gap-1.5 active:scale-95 transition-all relative ${
                  totalOffersCount > 0
                    ? 'bg-amber-500/20 border-[#F7931A] text-[#F7931A]'
                    : isDark ? 'bg-[#121B2D] border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}
                title="Ver cotizaciones de cadetes recibidas para adjudicar"
              >
                <Gavel size={13} />
                <span>Mis Subastas</span>
                {totalOffersCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] animate-pulse">
                    {totalOffersCount} cotiz.
                  </span>
                )}
              </button>

              {/* Test de alarma auditiva en vivo */}
              <button
                onClick={triggerAlertTest}
                title="Probar Alarma P2P en Vivo"
                className={`p-1 rounded-xl border flex items-center justify-center transition-all ${
                  isDark ? 'bg-[#121B2D] border-slate-700 text-[#F7931A] hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-amber-700 hover:bg-slate-200'
                }`}
              >
                <Volume2 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>{/* /collapsible top bar wrapper */}

      {/* 3. Banner Flotante de Alerta en Vivo (Modo Cadete / Prestador) */}
      {activeAlert && (
        <div className={`mx-2.5 mt-2 p-2.5 rounded-2xl border z-20 shadow-xl animate-in slide-in-from-top duration-200 flex items-center justify-between gap-2.5 ${
          isDark 
            ? 'bg-gradient-to-r from-[#1E1128] via-[#121B2D] to-[#0A1A2F] border-amber-500/60 text-white' 
            : 'bg-amber-50 border-amber-400 text-slate-900 shadow-md'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E02424] to-[#F7931A] flex items-center justify-center text-black font-bold">
                <Bell size={16} className="text-black" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-black text-[#F7931A] truncate">
                  {activeAlert.title}
                </p>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-[#F7931A] px-1.5 py-0.2 rounded border border-amber-500/40">
                  {activeAlert.request?.distanceKm || '0.5 km'}
                </span>
              </div>
              <p className={`text-[10px] truncate leading-tight ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {activeAlert.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setShowProposalModal(true)}
              className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] shadow-sm active:scale-95"
            >
              Cotizar Tarifa
            </button>
            <button
              onClick={dismissAlert}
              className={`p-1 rounded-lg ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              title="Cerrar alerta"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 4. Mapa Interactivo Vectorial react-leaflet con CartoDB Positron (Alta Gracia, Córdoba) */}
      <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden select-none">
        {/* Botón flotante de colapsar/expandir el mapa (Toggle Fullscreen) */}
        <button
          onClick={handleToggleMapExpand}
          title={isMapExpanded ? 'Restaurar vista con controles' : 'Expandir mapa a pantalla completa'}
          className={`absolute top-3 left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shadow-lg text-[11px] font-bold transition-all duration-200 active:scale-95 ${
            isDark
              ? 'bg-[#0B132B]/90 text-slate-200 border-[#2A3B5C] hover:bg-[#18243C] hover:text-white backdrop-blur-sm'
              : 'bg-white/90 text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 backdrop-blur-sm shadow-md'
          }`}
        >
          {isMapExpanded ? (
            <>
              <Minimize2 size={13} />
              <span>Restaurar</span>
            </>
          ) : (
            <>
              <Maximize2 size={13} />
              <span>Pantalla completa</span>
            </>
          )}
        </button>

        {/* Banner de estado vacio: categoria sin nodos */}
        {isCategoryEmpty && (
          <div className={`absolute top-14 left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-lg text-[12px] font-bold whitespace-nowrap pointer-events-none ${
            isDark
              ? 'bg-[#0B132B]/95 text-amber-400 border-amber-500/40 backdrop-blur-sm'
              : 'bg-white/95 text-amber-700 border-amber-300 backdrop-blur-sm'
          }`}>
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span>Sin prestadores en esta categoria</span>
          </div>
        )}

        <MapContainer
          center={NATIONAL_CENTER}
          zoom={NATIONAL_ZOOM}
          minZoom={4}
          maxZoom={18}
          zoomControl={false}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          touchZoom={true}
          dragging={true}
          inertia={true}
          inertiaDeceleration={3000}
          className="w-full h-full"
        >
          {/* Capa de Mapa Estándar y Gratuita de OpenStreetMap (OSM) */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />

          {/* Controlador reactivo: centrado, vuelo suave, fitBounds por categoria y recalculo de tamanio */}
          <MapController 
            selectedNode={selectedNode} 
            selectedAuction={selectedAuction}
            recenterTrigger={recenterTrigger}
            userCoords={userCoords}
            expandTrigger={expandTrigger}
            fitBoundsTrigger={fitBoundsTrigger}
            fitBoundsCoords={fitBoundsCoords}
          />

          {/* Controles flotantes de Zoom (+/-) y Recentrar suavemente en Mi Ubicación (GPS) */}
          <CustomMapControls 
            onRecenter={handleRecenter} 
            userCoords={userCoords}
            hasLiveGps={hasLiveGps}
            isDark={isDark} 
          />

          {/* Hitos Emblemáticos de Alta Gracia (Reloj Público, Tajamar, Sierras Hotel, etc.) */}
          {LANDMARKS.map((lm) => (
            <Marker
              key={lm.id}
              position={lm.pos}
              icon={createLandmarkIcon(lm.emoji, lm.title, lm.subtitle, isDark)}
            />
          ))}

          {/* Marcador GPS Distintivo de "Mi Ubicación" (Punto azul radiante + halo animate-ping) */}
          <Marker
            position={userCoords}
            icon={createUserIcon(hasLiveGps, isDark)}
          />

          {/* Marcadores Dinámicos: En Modo Cadete oculta los otros cadetes y muestra ÚNICAMENTE solicitudes y pedidos en subasta 📦 */}
          {isCadete ? (
            <LayerGroup key={`cadete-auctions-layer-${selectedCategory}`}>
              {visibleAuctions.map((req) => {
                const coords = req.lat && req.lng ? [req.lat, req.lng] : getNodeCoordinates(req);
                const isSelected = selectedAuction?.id === req.id;
                const icon = createAuctionMarkerIcon(req, isSelected, isDark);

                return (
                  <Marker
                    key={`auction-marker-${req.id}-${selectedCategory}`}
                    position={coords}
                    icon={icon}
                    eventHandlers={{
                      click: () => {
                        setSelectedAuction(req);
                        setSelectedNode(null);
                      }
                    }}
                  />
                );
              })}
            </LayerGroup>
          ) : (
            /* Modo Cliente: Muestra exclusivamente los pines de Prestadores/Cadetes/Comercios disponibles */
            <LayerGroup key={`cliente-peers-layer-${selectedCategory}-${selectedModalityFilter}-${showBlockedUsers}`}>
              {visibleNodes.map((node) => {
                const [lat, lng] = getNodeCoordinates(node);
                const repStatus = getPeerReputation(node.id);
                const isSelected = selectedNode?.id === node.id;
                const icon = createPeerIcon(node, isSelected, repStatus, formatDistanceKm, isDark);

                return (
                  <Marker
                    key={`peer-marker-${node.id}-${selectedCategory}`}
                    position={[lat, lng]}
                    icon={icon}
                    eventHandlers={{
                      click: () => {
                        setSelectedNode(node);
                        setSelectedAuction(null);
                      }
                    }}
                  />
                );
              })}
            </LayerGroup>
          )}
        </MapContainer>
      </div>

      {/* 7. Bottom Sheet del Nodo con Perfil Público y Ficha Técnica Detallada */}
      {selectedNode && (
        <div className={`absolute bottom-0 left-0 right-0 z-[1050] max-h-[85dvh] pb-8 overflow-y-auto border-t p-4 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-200 ${
          isDark
            ? 'bg-[#0B132B] border-slate-800 text-white'
            : 'bg-white border-slate-300 text-slate-900 shadow-2xl'
        }`}>
          {/* Top Bar with Return Button & Reputation Badge */}
          <div className="flex items-center justify-between mb-2.5 gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <button
                onClick={() => setSelectedNode(null)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex-shrink-0 ${
                  isDark
                    ? 'bg-slate-800/90 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-200'
                }`}
                title="Volver al mapa"
              >
                <ArrowLeft size={14} />
                <span>Volver</span>
              </button>

              {getPeerReputation(selectedNode.id) === 'blocked' ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1">
                  🔴 Usuario Bloqueado por ti
                </span>
              ) : getPeerReputation(selectedNode.id) === 'reported' ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  🟡 Advertencia: {selectedNode.reportsCount || 1} denuncia(s) en la red
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  🟢 Reputación: {selectedNode.recommendations || 24}
                </span>
              )}
            </div>

            <button
              onClick={() => setSelectedNode(null)}
              className={`p-1.5 rounded-full flex-shrink-0 ${
                isDark ? 'text-slate-400 hover:text-white bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
              title="Cerrar ficha"
            >
              <X size={16} />
            </button>
          </div>

          {/* User Card Content */}
          <div className="flex items-start gap-3.5">
            <div className="relative flex-shrink-0">
              <img
                src={selectedNode.avatar}
                alt={selectedNode.name}
                className={`w-14 h-14 rounded-2xl object-cover border-2 ${
                  isUserBlocked(selectedNode.id)
                    ? 'border-rose-500 ring-2 ring-rose-500/40'
                    : getPeerReputation(selectedNode.id) === 'reported'
                    ? 'border-amber-400 ring-2 ring-amber-400/40'
                    : 'border-emerald-500 ring-2 ring-emerald-500/40'
                }`}
              />
              <span className={`absolute -bottom-1 -right-1 text-xs px-1 rounded-full border ${
                isDark ? 'bg-black border-slate-700' : 'bg-white border-slate-300'
              }`}>
                {isUserBlocked(selectedNode.id) ? '🔴' : getPeerReputation(selectedNode.id) === 'reported' ? '🟡' : '🟢'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Nombre + Insignia destacada "Identidad Validada P2P 🛡️" + "Redes Sociales Públicas Disponibles 🌐" */}
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="font-bold text-base truncate">{selectedNode.name}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                  <span>Identidad Validada P2P</span>
                  <span>🛡️</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                  <span>Redes Sociales Públicas Disponibles</span>
                  <span>🌐</span>
                </span>
                <span className="text-[10px] bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/30 font-medium truncate">
                  {selectedNode.role || selectedNode.category}
                </span>
                {selectedNode.serviceModality && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-xs flex items-center gap-1 ${
                    selectedNode.serviceModality === 'pasajeros'
                      ? 'bg-amber-500/20 text-[#F7931A] border-amber-500/40'
                      : selectedNode.serviceModality === 'envios'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}>
                    <span>{selectedNode.serviceModality === 'pasajeros' ? '🚖' : selectedNode.serviceModality === 'envios' ? '📦' : '🔄'}</span>
                    <span>
                      {selectedNode.serviceModality === 'pasajeros'
                        ? 'Pasajeros (Taxi)'
                        : selectedNode.serviceModality === 'envios'
                        ? 'Envíos / Delivery'
                        : 'Servicio Mixto'}
                    </span>
                  </span>
                )}
              </div>

              {/* Métricas: Rating, Distancia y Contador de Operaciones Auditadas con PIN */}
              <div className={`flex flex-wrap items-center gap-2 text-xs mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className="flex items-center gap-1 text-amber-500 font-semibold">
                  <Star size={13} className="fill-amber-400 text-amber-500" />
                  {selectedNode.rating} ({selectedNode.reviewsCount})
                </span>
                <span>•</span>
                <span>Distancia: <strong>{formatDistanceKm(selectedNode.distanceMeters || selectedNode.distance)}</strong></span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/25 text-[10.5px]">
                  <span>🤝</span>
                  <span>{selectedNode.completedDeliveries || 45} Entregas Antifraude Completadas con PIN</span>
                </span>
              </div>

              {selectedNode.locationLabel && (
                <p className={`text-[11px] mt-1 font-medium flex items-center gap-1 truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <MapPin size={11} className="text-[#F7931A]" />
                  {selectedNode.locationLabel}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs mt-1.5">
                <span className="font-mono text-emerald-500 font-bold">
                  {selectedNode.baseFee || '$1.500 ARS'}
                </span>
                <span className={`flex items-center gap-1 font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <Wallet size={12} className="text-amber-500" />
                  {selectedNode.valensBalance || 10.0} VALENS
                </span>
              </div>
            </div>
          </div>

          {/* Ficha Técnica: Capacidad Operativa, Transporte y Cobertura Geográfica Local */}
          {(() => {
            const specs = getPeerOperationalSpecs(selectedNode);
            return (
              <div className={`mt-3 p-2.5 rounded-2xl border text-[11px] grid grid-cols-2 gap-2 shadow-xs ${
                isDark ? 'bg-[#070C1E] border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold flex items-center gap-1">
                    <span>🚗</span> Medio de Transporte:
                  </span>
                  <span className="font-bold text-[#F7931A] truncate block mt-0.5">
                    {specs.vehicle}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold flex items-center gap-1">
                    <span>⚖️</span> Capacidad Operativa:
                  </span>
                  <span className="font-bold text-emerald-400 truncate block mt-0.5">
                    {specs.capacity}
                  </span>
                </div>
                <div className="col-span-2 pt-1.5 border-t border-slate-700/40">
                  <span className="text-[10px] text-slate-400 block font-semibold flex items-center gap-1">
                    <span>📍</span> Cobertura Geográfica Local:
                  </span>
                  <span className={`font-semibold block mt-0.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Barrios de Alta Gracia: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{specs.coverage}</strong>
                  </span>
                </div>
                {selectedNode.category === 'fletes' && (
                  <div className="col-span-2 pt-1 border-t border-slate-700/40 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Servicio de Peones (Carga/Descarga):</span>
                    <span className={`font-bold ${specs.includesHelpers ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {specs.includesHelpers ? '✅ Incluye Peón' : '❌ Chofer solo'}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}


          {/* 1. Redes Sociales y Mensajería — acceso según sesión */}
          {(() => {
            const socials = getPeerSocials(selectedNode);
            const isAuth = !!user;
            return (
              <div className={`mt-3 p-3 rounded-2xl border space-y-2 shadow-xs ${
                isDark ? 'bg-[#070C1E] border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold flex items-center gap-1.5 text-cyan-400">
                    <ExternalLink size={13} />
                    <span>Redes Sociales y Mensajería:</span>
                  </span>
                  <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold border ${
                    isAuth
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {isAuth ? 'Canales Publicos' : 'Requiere sesion'}
                  </span>
                </div>

                {isAuth ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Instagram */}
                      <a
                        href={getSocialLink('instagram', socials.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl border flex items-center justify-between gap-1.5 bg-[#E1306C]/10 hover:bg-[#E1306C]/20 border-[#E1306C]/30 text-[#E1306C] transition-all active:scale-95 group shadow-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                          <div className="min-w-0">
                            <span className="text-[9.5px] text-slate-400 block leading-tight">Instagram</span>
                            <span className="text-[11px] font-bold truncate block">{socials.instagram}</span>
                          </div>
                        </div>
                        <ExternalLink size={12} className="opacity-70 group-hover:opacity-100 flex-shrink-0" />
                      </a>

                      {/* WhatsApp privado via Chat P2P */}
                      <div className={`p-2 rounded-xl border flex items-center justify-between gap-1.5 ${
                        isDark ? 'bg-slate-800/40 border-slate-700/80 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-400 flex-shrink-0">
                            <Lock size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9.5px] text-slate-400 block leading-tight">WhatsApp P2P</span>
                            <span className="text-[10px] font-bold text-slate-400 truncate block">Via Chat P2P</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">Seguro</span>
                      </div>

                      {/* X (Twitter) */}
                      <a
                        href={getSocialLink('twitter', socials.twitter)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl border flex items-center justify-between gap-1.5 bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-400 transition-all active:scale-95 group shadow-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                          <div className="min-w-0">
                            <span className="text-[9.5px] text-slate-400 block leading-tight">X (Twitter)</span>
                            <span className="text-[11px] font-bold truncate block">{socials.twitter}</span>
                          </div>
                        </div>
                        <ExternalLink size={12} className="opacity-70 group-hover:opacity-100 flex-shrink-0" />
                      </a>

                      {/* Facebook */}
                      <a
                        href={getSocialLink('facebook', socials.facebook)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl border flex items-center justify-between gap-1.5 bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/30 text-blue-400 transition-all active:scale-95 group shadow-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                          <div className="min-w-0">
                            <span className="text-[9.5px] text-slate-400 block leading-tight">Facebook</span>
                            <span className="text-[11px] font-bold truncate block">{socials.facebook}</span>
                          </div>
                        </div>
                        <ExternalLink size={12} className="opacity-70 group-hover:opacity-100 flex-shrink-0" />
                      </a>
                    </div>

                    <div className={`mt-2 p-2 rounded-xl border flex items-center gap-2 text-[10px] ${
                      isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      <Lock size={12} className="text-[#F7931A] flex-shrink-0" />
                      <span>WhatsApp permanece <strong>privado</strong>. Se intercambia mediante el Chat P2P.</span>
                    </div>
                  </>
                ) : (
                  /* No autenticado: bloqueo con CTA de login */
                  <div className={`rounded-xl border p-4 flex flex-col items-center gap-3 text-center ${
                    isDark ? 'bg-[#0B132B]/80 border-amber-500/30' : 'bg-amber-50/80 border-amber-300'
                  }`}>
                    <div className="flex items-center gap-3 opacity-40 pointer-events-none">
                      <div className="w-9 h-9 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </div>
                      <Lock size={22} className="text-slate-400" />
                      <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </div>
                    </div>
                    <div>
                      <p className={`text-xs font-black mb-0.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        <Lock size={12} className="inline mr-1" />
                        Datos de Contacto Privados
                      </p>
                      <p className={`text-[10.5px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Inicia sesion para ver redes sociales y contactar al prestador P2P.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('home')}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                    >
                      <ArrowRight size={14} />
                      Ingresar para ver contacto
                    </button>
                  </div>
                )}
              </div>
            );
          })()}


          {/* 2. Solicitud P2P de Imagen de DNI (Intercambio Voluntario) */}
          <div className={`mt-3 p-3 rounded-2xl border shadow-xs ${
            isDark ? 'bg-gradient-to-r from-[#0C1B33] to-[#121B2D] border-blue-500/40 text-white' : 'bg-blue-50/80 border-blue-200 text-slate-900'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🪪</span>
                  <h4 className="text-xs font-black tracking-tight text-blue-400">
                    Solicitud P2P de Imagen de DNI (Intercambio Voluntario)
                  </h4>
                </div>
                <p className={`text-[10px] mt-1 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Solicita al prestador la comprobación voluntaria de su DNI precargado. Al aceptar, se habilita temporalmente en la sala de chat entre Cliente y Prestador durante la transacción activa.
                </p>
              </div>
            </div>

            <div className="mt-2.5">
              {getDniVerificationStatus(selectedNode.id) === 'accepted' ? (
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs">
                  <span className="font-bold flex items-center gap-1.5">
                    <ShieldCheck size={15} />
                    <span>DNI Verificado y Compartido en el Chat Activo 🛡️</span>
                  </span>
                  <button
                    onClick={() => {
                      if (setActiveChatPeerId) setActiveChatPeerId(selectedNode.id);
                      setActiveTab('chat');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10.5px] shadow-xs active:scale-95"
                  >
                    Ver en Chat 💬
                  </button>
                </div>
              ) : getDniVerificationStatus(selectedNode.id) === 'pending' ? (
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs">
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Solicitud enviada • Esperando confirmación del prestador...</span>
                  </span>
                  <button
                    onClick={() => {
                      if (setActiveChatPeerId) setActiveChatPeerId(selectedNode.id);
                      setActiveTab('chat');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10.5px] active:scale-95"
                  >
                    Abrir Chat 💬
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    requestDniVerification(selectedNode.id);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                  title="Enviar solicitud voluntaria de DNI por el Chat P2P"
                >
                  <span>🪪</span>
                  <span>Solicitar Verificación de DNI P2P</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>

          {/* 3 Botones de Acción Directa: 👍 Recomendar, ⚠️ Denunciar, 🚫 Bloquear */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {/* a) Recomendar */}
            <button
              onClick={handleRecommendSelectedNode}
              className="py-1.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
              title="Sumar recomendación comunitaria"
            >
              <ThumbsUp size={13} />
              <span>Recomendar (+1)</span>
            </button>

            {/* b) Denunciar */}
            <button
              onClick={() => setShowReportModal(true)}
              className="py-1.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
              title="Abrir formulario de denuncia"
            >
              <AlertTriangle size={13} />
              <span>Denunciar</span>
            </button>

            {/* c) Bloquear / Desbloquear */}
            <button
              onClick={() => setShowBlockConfirm(true)}
              className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all ${
                isUserBlocked(selectedNode.id)
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-400'
              }`}
              title="Bloquear o desbloquear usuario"
            >
              <UserX size={13} />
              <span>{isUserBlocked(selectedNode.id) ? 'Desbloquear' : 'Bloquear'}</span>
            </button>
          </div>

          {/* Distintivo Destacado: Recompensa P2P con ValensCoin */}
          <div className={`mt-2.5 px-3 py-2 rounded-2xl border flex items-center justify-between shadow-xs ${
            isDark
              ? 'bg-gradient-to-r from-[#1A1305] via-[#121B2D] to-[#1A1305] border-[#F7931A]/50 text-[#F0B90B]'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <div className="flex items-center space-x-2.5">
              <span className="text-lg">🪙</span>
              <div>
                <p className="text-xs font-black tracking-tight leading-none">
                  Premia tus envíos con ValensCoin 🪙
                </p>
                <p className={`text-[10px] mt-0.5 leading-tight ${isDark ? 'text-amber-200/80' : 'text-amber-800'}`}>
                  Recibe cashback/recompensa directa en tokens al validar tu entrega con PIN
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border bg-[#F7931A]/20 border-[#F7931A]/40 text-[#F7931A]">
              +1.0 VAL
            </span>
          </div>

          {/* Reseñas Post-Servicio Públicas y Transparentes */}
          {selectedNode.recentReviews && selectedNode.recentReviews.length > 0 && (
            <div className={`mt-2.5 p-2.5 rounded-xl border text-xs ${
              isDark ? 'bg-[#121B2D] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="text-[10px] text-[#F7931A] font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} /> Reseña verificada post-servicio
                </span>
                <span className="font-mono text-amber-400">⭐⭐⭐⭐⭐ 5.0</span>
              </div>
              <p className="italic text-[11px]">
                "{selectedNode.recentReviews[0].comment}" — <span className="font-semibold">{selectedNode.recentReviews[0].author}</span>
              </p>
            </div>
          )}

          {/* Habilitación Condicional del Chat P2P */}
          <div className="mt-3">
            {isUserBlocked(selectedNode.id) ? (
              <div className="p-2 rounded-xl border text-center text-xs bg-rose-500/10 border-rose-500/30 text-rose-300">
                🚫 Usuario bloqueado. Desbloquéalo para reanudar el contacto.
              </div>
            ) : !isChatUnlocked(selectedNode.id) ? (
              <div className="space-y-2">
                <div className={`p-2 rounded-xl border text-[11px] text-center ${
                  isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                  🔒 <strong>Chat P2P Protegido:</strong> Revisa el perfil y calificaciones antes de conectar. Al presionar el botón habilitarás la sala privada.
                </div>
                <button
                  onClick={() => handleStartChatOrConnect(selectedNode)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                >
                  <CheckCircle2 size={16} />
                  Aceptar Propuesta y Habilitar Chat P2P
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleStartChatOrConnect(selectedNode)}
                className="w-full bg-gradient-to-r from-[#F7931A] to-[#E07D09] hover:from-[#F0B90B] hover:to-[#F7931A] text-slate-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
              >
                <MessageSquare size={16} />
                Abrir Chat P2P Directo (Conexión Activa)
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 7.5. Bottom Sheet para Pedidos en Subasta / Solicitudes de Clientes (Modo Cadete / Prestador) */}
      {activeAuction && (() => {
        const myOffer = (activeAuction.offers || []).find(
          (o) => o.cadeteId === CURRENT_CADET_ID || o.cadeteId === 'current-user-cadete' || o.isOwnOffer === true
        );
        const offersList = activeAuction.offers || [];

        return (
          <div className={`absolute bottom-0 left-0 right-0 z-[1050] max-h-[85dvh] pb-8 overflow-y-auto border-t p-4 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-200 ${
            isDark
              ? 'bg-[#0B132B] border-slate-800 text-white'
              : 'bg-white border-slate-300 text-slate-900 shadow-2xl'
          }`}>
            {/* Header with Return Button */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <button
                  onClick={() => setSelectedAuction(null)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex-shrink-0 ${
                    isDark
                      ? 'bg-slate-800/90 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-200'
                  }`}
                  title="Volver al mapa"
                >
                  <ArrowLeft size={14} />
                  <span>Volver</span>
                </button>

                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-[#F7931A] border border-amber-500/40 flex items-center gap-1">
                  📦 Solicitud P2P
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  {activeAuction.categoryLabel || 'Transporte'}
                </span>
                <span className="text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                  <MapPin size={11} />
                  {activeAuction.locationLabel || `${activeAuction.locality || 'Alta Gracia'} (${activeAuction.distanceKm || '0.5 km'})`}
                </span>
              </div>
              <button
                onClick={() => setSelectedAuction(null)}
                className={`p-1.5 rounded-full flex-shrink-0 ${
                  isDark ? 'text-slate-400 hover:text-white bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
                title="Cerrar solicitud"
              >
                <X size={16} />
              </button>
            </div>

            {/* Client & Request Details Card */}
            <div className="flex items-start gap-3.5 mb-3">
              <img
                src={activeAuction.clientAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"}
                alt={activeAuction.clientName}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500/50 shadow-md flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm truncate">{activeAuction.clientName}</h3>
                  <span className="flex items-center text-amber-400 text-xs font-bold">
                    <Star size={11} className="fill-amber-400 mr-0.5" />
                    {activeAuction.clientRating || '5.0'}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 font-medium leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {activeAuction.description}
                </p>
              </div>
            </div>

            {/* Route & Timing Box */}
            <div className={`p-3 rounded-2xl border mb-3 space-y-2 text-xs ${
              isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Clock size={13} className="text-[#F7931A]" /> Horario de Retiro/Entrega:
                </span>
                <span className="font-bold text-[#F7931A] font-mono">{activeAuction.scheduledTime || 'Hoy'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <MapPin size={13} className="text-emerald-400" /> Origen:
                </span>
                <span className="font-semibold text-right truncate max-w-[200px]">{activeAuction.origin}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Navigation size={13} className="text-blue-400" /> Destino:
                </span>
                <span className="font-semibold text-right truncate max-w-[200px]">{activeAuction.destination}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Compass size={13} className="text-cyan-400" /> Ubicación y Distancia:
                </span>
                <span className="font-bold text-cyan-400 font-mono text-right truncate max-w-[200px]">
                  {activeAuction.locationLabel || `${activeAuction.locality || 'Alta Gracia'} (${activeAuction.distanceKm || '0.5 km'})`}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-700/40">
                <span className="text-slate-400 text-[11px]">Tarifa Base Estimada por Cliente:</span>
                <span className="font-black text-emerald-400 text-sm font-mono">
                  ${Number(activeAuction.estimatedFeeArs || 0).toLocaleString('es-AR')} ARS
                  <span className="text-[10px] text-slate-400 font-normal ml-1">({activeAuction.estimatedFeeValens || 1.0} VAL)</span>
                </span>
              </div>
            </div>

            {/* 2. & 3. DESGLOSE ANÓNIMO DE COMPETENCIA Y OFERTA PROPIA (VISTA CADETE) */}
            <div className={`rounded-2xl border p-3 mb-3.5 ${
              isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div
                onClick={() => setShowCompetitorBids(!showCompetitorBids)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black flex items-center gap-1.5 text-[#F7931A]">
                    <span>📊 Cotizaciones de la Competencia</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-[#F7931A] border border-amber-500/30">
                    {offersList.length} cotización(es) recibida(s)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold hover:text-white transition-colors">
                  {showCompetitorBids ? '▲ Ocultar' : '▼ Ver desglose anónimo'}
                </span>
              </div>

              {showCompetitorBids && (
                <div className="mt-2.5 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {offersList.length === 0 ? (
                    <div className="p-3 text-center text-[11px] text-slate-400 border border-dashed rounded-xl border-slate-700/60">
                      Aún no hay cotizaciones para este pedido. ¡Sé el primero en enviar tu oferta económica!
                    </div>
                  ) : (
                    offersList.map((offer, idx) => {
                      const isOwn = offer.cadeteId === CURRENT_CADET_ID || offer.cadeteId === 'current-user-cadete' || offer.isOwnOffer === true;

                      if (isOwn) {
                        return (
                          /* Identificación de Oferta Propia Resaltada */
                          <div
                            key={offer.id || `own-${idx}`}
                            className="p-2.5 rounded-xl border-2 bg-gradient-to-r from-amber-500/15 via-[#1A1305] to-amber-500/15 border-[#F7931A] shadow-md transition-all"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                  <span>⭐</span>
                                  <span>Tu Oferta</span>
                                </span>
                                <span className="text-[9.5px] text-emerald-400 font-mono font-bold">
                                  Guardada en Supabase (tabla bids)
                                </span>
                              </div>
                              <span className="text-sm font-black font-mono text-[#F0B90B]">
                                ${Number(offer.feeArs || 0).toLocaleString('es-AR')} ARS
                              </span>
                            </div>
                            <p className={`text-[11px] italic font-medium ${isDark ? 'text-amber-200/90' : 'text-amber-900'}`}>
                              "{offer.note || 'Sin nota aclaratoria.'}"
                            </p>
                            <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1.5 pt-1 border-t border-amber-500/20 font-mono">
                              <span>Equivalente estimado: ~{((offer.feeArs || 0) / 2400).toFixed(1)} VALENS</span>
                              <span>{offer.timestamp || 'Recién'}</span>
                            </div>
                          </div>
                        );
                      }

                      /* Desglose Anónimo de Competencia: Monto y Nota exclusivamente (Sin foto, nombre, reputación ni vehículo) */
                      return (
                        <div
                          key={offer.id || `comp-${idx}`}
                          className={`p-2.5 rounded-xl border transition-all ${
                            isDark ? 'bg-[#0B132B] border-slate-700/70 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                              <Lock size={10} className="text-slate-400" />
                              <span>Cotización Competidora #{idx + 1}</span>
                              <span className="text-[8.5px] text-slate-400 font-normal">(Anónimo)</span>
                            </span>
                            <span className="text-xs font-black font-mono text-emerald-400">
                              ${Number(offer.feeArs || 0).toLocaleString('es-AR')} ARS
                            </span>
                          </div>
                          <p className={`text-[11px] leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            "{offer.note || 'Propuesta de entrega recibida.'}"
                          </p>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1.5 pt-1 border-t border-slate-800/60 font-mono">
                            <span className="italic">Datos de usuario competidor restringidos por privacidad</span>
                            <span>{offer.timestamp || 'Reciente'}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons: Dinámico según si ya se envió oferta propia */}
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenQuoteModal(activeAuction)}
                className={`flex-1 min-h-[44px] py-3 px-4 rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${
                  myOffer
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-glow-green'
                    : 'bg-gradient-to-r from-[#F7931A] to-[#E07D09] hover:from-[#F0B90B] hover:to-[#F7931A] text-slate-950'
                }`}
              >
                <Gavel size={15} />
                <span>{myOffer ? 'Editar / Re-cotizar Oferta 📝' : 'Cotizar / Enviar Oferta Económica 📨'}</span>
              </button>
              <button
                onClick={() => setSelectedAuction(null)}
                className={`min-h-[44px] py-3 px-4 rounded-xl border text-xs font-semibold ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}

      {/* 8. MODAL: Formulario de Denuncia Comunitaria (100% Sólido sin transparencias) */}
      {showReportModal && selectedNode && (
        <div className="fixed inset-0 z-[2000] bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl border max-w-sm w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#0B132B] border-amber-500/50 text-white' : 'bg-white border-amber-300 text-slate-900'
          }`}>
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
              title="Cerrar"
            >
              <X size={18} />
            </button>
            <button
              onClick={() => setShowReportModal(false)}
              className={`flex items-center gap-1.5 text-xs font-semibold mb-3 transition-colors ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Volver"
            >
              <ArrowLeft size={15} />
              <span>Volver</span>
            </button>

            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <AlertTriangle size={20} />
              <h3 className="text-sm font-bold">Denunciar a {selectedNode.name}</h3>
            </div>
            <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              El reporte se registrará en el sistema de reputación descentralizada de Alta Gracia.
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-400">Motivo del reporte:</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-medium ${
                    isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Cobro engañoso / Sobreprecio indebido">Cobro engañoso / Sobreprecio indebido</option>
                  <option value="Incumplimiento de entrega / Paquete dañado">Incumplimiento de entrega / Paquete dañado</option>
                  <option value="Conducta inapropiada / Falta de respeto">Conducta inapropiada / Falta de respeto</option>
                  <option value="Perfil o vehículo falso">Perfil o vehículo falso</option>
                  <option value="Cancelación reiterada sin aviso">Cancelación reiterada sin aviso</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-400">Detalles adicionales (opcional):</label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Describe brevemente lo ocurrido para conocimiento de la comunidad..."
                  className={`w-full border rounded-xl px-3 py-2 text-xs ${
                    isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 font-bold text-xs shadow-md active:scale-95"
                >
                  Registrar Denuncia (🟡)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL: Solicitar Servicio Cercano (Modo Cliente) */}
      {showRequestModal && (
        <div className="fixed inset-0 z-[2000] bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl border max-w-sm w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#0B132B] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <button
              onClick={() => setShowRequestModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
              title="Cerrar"
            >
              <X size={18} />
            </button>
            <button
              onClick={() => setShowRequestModal(false)}
              className={`flex items-center gap-1.5 text-xs font-semibold mb-3 transition-colors ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Volver"
            >
              <ArrowLeft size={15} />
              <span>Volver</span>
            </button>

            <div className="flex items-center gap-2 text-[#F7931A] mb-2">
              <PlusCircle size={20} />
              <h3 className="text-sm font-bold">Solicitar Servicio Cercano</h3>
            </div>
            <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Emite una alarma P2P a todos los prestadores activos en Alta Gracia:
            </p>

            <form onSubmit={handleCreateRequestSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-400">Categoría requerida:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'caminando', label: '🚶 A Pie' },
                    { id: 'bicicleta', label: '🚲 Bici' },
                    { id: 'motocicleta', label: '🏍️ Moto' },
                    { id: 'automovil', label: '🚗 Auto' },
                    { id: 'fletes', label: '🚚 Flete' },
                    { id: 'comercio', label: '🏪 Negocio' }
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setRequestCategory(c.id)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        requestCategory === c.id
                          ? 'bg-[#F7931A] text-slate-950 border-amber-400 font-bold'
                          : isDark
                          ? 'bg-[#121B2D] border-slate-800 text-slate-300'
                          : 'bg-slate-100 border-slate-300 text-slate-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-400">¿Qué necesitas enviar o retirar?</label>
                <input
                  type="text"
                  required
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="Ej. Retirar recetas en farmacia de Av. Belgrano"
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#F7931A] ${
                    isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Punto de retiro:</label>
                  <input
                    type="text"
                    value={requestOrigin}
                    onChange={(e) => setRequestOrigin(e.target.value)}
                    className={`w-full border rounded-xl px-2.5 py-1.5 text-[11px] ${
                      isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Destino entrega:</label>
                  <input
                    type="text"
                    value={requestDestination}
                    onChange={(e) => setRequestDestination(e.target.value)}
                    className={`w-full border rounded-xl px-2.5 py-1.5 text-[11px] ${
                      isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-slate-950 font-bold text-xs shadow-md active:scale-95"
                >
                  🚀 Publicar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL: Propuesta de Tarifa Directa (Modo Cadete) */}
      {showProposalModal && activeAlert && (
        <div className="fixed inset-0 z-[2000] bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl border max-w-sm w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#0B132B] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <button
              onClick={() => setShowProposalModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
              title="Cerrar"
            >
              <X size={18} />
            </button>
            <button
              onClick={() => setShowProposalModal(false)}
              className={`flex items-center gap-1.5 text-xs font-semibold mb-3 transition-colors ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Volver"
            >
              <ArrowLeft size={15} />
              <span>Volver</span>
            </button>

            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Send size={18} />
              <h3 className="text-sm font-bold">Enviar Propuesta de Tarifa Directa</h3>
            </div>

            <div className={`p-2.5 rounded-xl border text-xs mb-3 ${
              isDark ? 'bg-[#070C1E] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <p className="font-bold text-[#F7931A]">{activeAlert.title}</p>
              <p className="text-[11px] mt-1">{activeAlert.subtitle}</p>
              <p className="text-[10px] text-slate-500 mt-1">Distancia: {activeAlert.request?.distanceKm || '0.5 km'}</p>
            </div>

            <form onSubmit={handleSendProposalSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Tu tarifa propuesta en Efectivo ($ ARS):</label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={proposalFeeArs}
                  onChange={(e) => setProposalFeeArs(Number(e.target.value))}
                  className={`w-full border rounded-xl px-3 py-2 text-sm font-mono font-bold ${
                    isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Equivalente ValensCoin (Opcional):</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.1"
                  value={proposalFeeValens}
                  onChange={(e) => setProposalFeeValens(Number(e.target.value))}
                  className={`w-full border rounded-xl px-3 py-2 text-sm font-mono font-bold ${
                    isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowProposalModal(false)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md active:scale-95"
                >
                  Enviar al Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. MODAL DE CONFIRMACIÓN: Bloquear / Desbloquear Usuario */}
      {showBlockConfirm && selectedNode && (
        <div className="fixed inset-0 z-[2000] bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl border max-w-xs w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#0B132B] border-rose-500/50 text-white' : 'bg-white border-rose-300 text-slate-900'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-2">
              <ShieldAlert size={22} />
            </div>
            <h3 className="text-sm font-bold text-center">
              {isUserBlocked(selectedNode.id)
                ? `¿Desbloquear a ${selectedNode.name}?`
                : `¿Bloquear a ${selectedNode.name}?`}
            </h3>
            <p className={`text-xs text-center mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isUserBlocked(selectedNode.id)
                ? 'Este usuario volverá a estar habilitado en tu mapa y podrás interactuar normalmente.'
                : 'Este usuario se marcará en rojo (🔴) en tu red y no podrá enviarte propuestas ni mensajes.'}
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 min-h-[44px] py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBlockToggleSelectedNode}
                className={`flex-1 min-h-[44px] py-2 rounded-xl font-bold text-xs shadow-sm active:scale-95 ${
                  isUserBlocked(selectedNode.id)
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {isUserBlocked(selectedNode.id) ? 'Confirmar Desbloqueo' : 'Confirmar Bloqueo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. MODAL: Cotizar Envío Programado (Modo Cadete / Prestador) */}
      {showQuoteSubmitModal && quoteTargetAuction && (
        <div className="fixed inset-0 z-[2000] bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl border max-w-sm w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#0B132B] border-amber-500/50 text-white' : 'bg-white border-amber-300 text-slate-900'
          }`}>
            <button
              onClick={() => setShowQuoteSubmitModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
              title="Cerrar"
            >
              <X size={18} />
            </button>
            <button
              onClick={() => setShowQuoteSubmitModal(false)}
              className={`flex items-center gap-1.5 text-xs font-semibold mb-3 transition-colors ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Volver"
            >
              <ArrowLeft size={15} />
              <span>Volver</span>
            </button>

            {(() => {
              const isEditQuote = quoteTargetAuction?.offers?.some(
                (o) => o.cadeteId === CURRENT_CADET_ID || o.cadeteId === 'current-user-cadete' || o.isOwnOffer === true
              );

              return (
                <>
                  <div className="flex items-center gap-2 text-[#F7931A] mb-2">
                    <Gavel size={20} />
                    <h3 className="text-sm font-bold">
                      {isEditQuote ? 'Editar / Re-cotizar Oferta 📝' : 'Cotizar Pedido en Subasta 📨'}
                    </h3>
                  </div>
                  <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {isEditQuote
                      ? `Modifica tu propuesta previa para ${quoteTargetAuction.clientName}. Se sincronizará en la tabla bids de Supabase:`
                      : `Envía tu propuesta económica para ${quoteTargetAuction.clientName}. Se registrará en la tabla bids de Supabase:`}
                  </p>

                  {/* Resumen del pedido */}
                  <div className={`p-2.5 rounded-xl border mb-3 text-[11px] space-y-1 ${
                    isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="text-slate-400 truncate"><strong>Ruta:</strong> {quoteTargetAuction.origin} ➔ {quoteTargetAuction.destination}</div>
                    <div className="text-slate-400"><strong>Horario:</strong> <span className="text-[#F7931A] font-mono">{quoteTargetAuction.scheduledTime}</span></div>
                    <div className="text-slate-400"><strong>Tarifa Base Cliente:</strong> ${Number(quoteTargetAuction.estimatedFeeArs).toLocaleString('es-AR')} ARS</div>
                  </div>

                  <form onSubmit={handleCadeteQuoteSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Tu Tarifa Propuesta en Efectivo ($ ARS):
                      </label>
                      <input
                        type="number"
                        min="500"
                        step="100"
                        value={cadeteQuoteFeeArs}
                        onChange={(e) => setCadeteQuoteFeeArs(Number(e.target.value))}
                        className={`w-full border rounded-xl px-3 py-2 text-sm font-mono font-bold ${
                          isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                        }`}
                        required
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                        Equivalente estimado: ~{(cadeteQuoteFeeArs / 2400).toFixed(1)} VALENS
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Nota aclaratoria para el cliente:
                      </label>
                      <textarea
                        rows={2}
                        value={cadeteQuoteNote}
                        onChange={(e) => setCadeteQuoteNote(e.target.value)}
                        placeholder="Ej: Llego puntual en bici, tengo mochila térmica..."
                        className={`w-full border rounded-xl px-3 py-2 text-xs ${
                          isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                        }`}
                        required
                      />
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowQuoteSubmitModal(false)}
                        className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className={`flex-1 min-h-[44px] py-2.5 rounded-xl font-black text-xs shadow-md active:scale-95 text-slate-950 ${
                          isEditQuote
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-glow-green'
                            : 'bg-gradient-to-r from-[#F7931A] to-[#E07D09]'
                        }`}
                      >
                        {isEditQuote ? 'Actualizar Oferta 📝' : 'Enviar a Supabase 📨'}
                      </button>
                    </div>
                  </form>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* 13. MODAL: Publicar Envío Programado (Subasta P2P - Vista Cliente) */}
      {showNewAuctionModal && (
        <div className="fixed inset-0 z-[2000] bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl border max-w-md w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#0B132B] border-amber-500/50 text-white' : 'bg-white border-amber-300 text-slate-900'
          }`}>
            <button
              onClick={() => setShowNewAuctionModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
              title="Cerrar"
            >
              <X size={18} />
            </button>
            <button
              onClick={() => setShowNewAuctionModal(false)}
              className={`flex items-center gap-1.5 text-xs font-semibold mb-3 transition-colors ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Volver"
            >
              <ArrowLeft size={15} />
              <span>Volver</span>
            </button>

            <div className="flex items-center gap-2 text-[#F7931A] mb-1">
              <PlusCircle size={20} />
              <h3 className="text-sm font-bold">Publicar Envío Programado en Subasta P2P</h3>
            </div>
            <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Tu pedido aparecerá como un pin distintivo (📦) en el mapa para los cadetes de Alta Gracia. Recibirás cotizaciones directas para comparar y adjudicar.
            </p>

            <form onSubmit={handlePublishAuctionSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Categoría de transporte:</label>
                <select
                  value={auctionCategory}
                  onChange={(e) => setAuctionCategory(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-medium ${
                    isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="bicicleta">🚲 Bicicleta (Envíos ligeros, ciclovías)</option>
                  <option value="motocicleta">🏍️ Motocicleta (Envíos express, viandas)</option>
                  <option value="automovil">🚗 Automóvil (Cajas grandes, clima adverso)</option>
                  <option value="fletes">🚚 Fletes y Cargas Pesadas (Mudanzas, obra)</option>
                  <option value="caminando">🚶 Caminando (Trámites cortos centro)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Punto de Retiro (Origen en Alta Gracia):</label>
                <input
                  type="text"
                  value={auctionOrigin}
                  onChange={(e) => setAuctionOrigin(e.target.value)}
                  placeholder="Ej: Av. Belgrano 180 (Farmacia Central)"
                  className={`w-full border rounded-xl px-3 py-2 text-xs ${
                    isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Punto de Entrega (Destino en Alta Gracia):</label>
                <input
                  type="text"
                  value={auctionDestination}
                  onChange={(e) => setAuctionDestination(e.target.value)}
                  placeholder="Ej: Bv. Pellegrini 320, B° Pellegrini"
                  className={`w-full border rounded-xl px-3 py-2 text-xs ${
                    isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Hora Programada:</label>
                  <input
                    type="text"
                    value={auctionTime}
                    onChange={(e) => setAuctionTime(e.target.value)}
                    placeholder="Ej: Hoy 17:00 hs"
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold ${
                      isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Tarifa Base Estimada ($ ARS):</label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    value={auctionFeeArs}
                    onChange={(e) => setAuctionFeeArs(Number(e.target.value))}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold ${
                      isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Descripción del paquete / encomienda:</label>
                <textarea
                  rows={2}
                  value={auctionDescription}
                  onChange={(e) => setAuctionDescription(e.target.value)}
                  placeholder="Detalla qué se traslada (ej: medicamento urgente, llaves, vianda caliente...)"
                  className={`w-full border rounded-xl px-3 py-2 text-xs ${
                    isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewAuctionModal(false)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-slate-950 font-black text-xs shadow-md active:scale-95"
                >
                  Publicar en Subasta 📢
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 14. MODAL: Comparador y Adjudicación P2P (Vista Cliente) */}
      {showAuctionQuotesModal && (
        <div className="fixed inset-0 z-[2000] bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl border max-w-lg w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#0B132B] border-amber-500/50 text-white' : 'bg-white border-amber-300 text-slate-900'
          }`}>
            <button
              onClick={() => setShowAuctionQuotesModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
              title="Cerrar"
            >
              <X size={18} />
            </button>
            <button
              onClick={() => setShowAuctionQuotesModal(false)}
              className={`flex items-center gap-1.5 text-xs font-semibold mb-3 transition-colors ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Volver"
            >
              <ArrowLeft size={15} />
              <span>Volver</span>
            </button>

            <div className="flex items-center gap-2 text-[#F7931A] mb-1">
              <Gavel size={20} />
              <h3 className="text-sm font-bold">Comparador de Ofertas y Subastas P2P</h3>
            </div>
            <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Revisa en tiempo real las cotizaciones recibidas de los cadetes de Alta Gracia para tus solicitudes y adjudica la mejor oferta con un clic.
            </p>

            <div className="space-y-4">
              {clientAuctions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No tienes solicitudes publicadas en este momento.
                </div>
              ) : (
                clientAuctions.map((req) => {
                  const isAwarded = req.status === 'awarded';
                  const offers = req.offers || [];

                  return (
                    <div
                      key={req.id}
                      className={`p-3.5 rounded-2xl border space-y-3 ${
                        isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {/* Cabecera del pedido */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-700/40 pb-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs text-[#F7931A]">
                              ⏰ {req.scheduledTime || 'Hoy'}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-300">
                              {req.categoryLabel || 'Transporte'}
                            </span>
                            {isAwarded ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                🤝 Adjudicada
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                ⏳ Subasta Abierta
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold mt-1">
                            {req.origin} ➔ {req.destination}
                          </p>
                          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {req.description}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] text-slate-400 block">Tarifa Base:</span>
                          <span className="font-mono font-bold text-xs text-emerald-400">
                            ${Number(req.estimatedFeeArs).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>

                      {/* Lista de Cotizaciones Recibidas */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300">
                            Cotizaciones Recibidas ({offers.length}):
                          </span>
                          {!isAwarded && offers.length > 0 && (
                            <span className="text-emerald-400 text-[10px] font-semibold">
                              Selecciona la mejor propuesta
                            </span>
                          )}
                        </div>

                        {offers.length === 0 ? (
                          <div className={`p-3 rounded-xl border text-center text-xs ${
                            isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                          }`}>
                            ⏳ Esperando cotizaciones de cadetes cercanos en el mapa...
                          </div>
                        ) : (
                          offers.map((offer) => {
                            const isChosen = req.awardedOfferId === offer.id;

                            return (
                              <div
                                key={offer.id}
                                className={`p-3 rounded-xl border transition-all ${
                                  isChosen
                                    ? isDark
                                      ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/50'
                                      : 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400'
                                    : isDark
                                    ? 'bg-[#0B132B] border-slate-800'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2.5">
                                    <img
                                      src={offer.cadeteAvatar}
                                      alt={offer.cadeteName}
                                      className="w-10 h-10 rounded-xl object-cover border border-amber-500/40 flex-shrink-0"
                                    />
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <h4 className="font-bold text-xs">{offer.cadeteName}</h4>
                                        <span className="flex items-center text-amber-400 text-[10px] font-bold">
                                          <Star size={10} className="fill-amber-400 mr-0.5" />
                                          {offer.cadeteRating || '4.9'}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-400 font-medium">
                                        {offer.vehicle}
                                      </p>
                                      <p className={`text-[11px] mt-1 font-sans italic ${
                                        isDark ? 'text-slate-300' : 'text-slate-700'
                                      }`}>
                                        "{offer.note}"
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right flex-shrink-0">
                                    <span className="font-black text-sm text-emerald-400 font-mono block">
                                      ${Number(offer.feeArs).toLocaleString('es-AR')}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-mono block">
                                      {offer.feeValens || 1.0} VALENS
                                    </span>
                                  </div>
                                </div>

                                {/* Botón de Adjudicación o Estado de Ganador */}
                                <div className="mt-2.5 pt-2 border-t border-slate-700/30 flex items-center justify-between">
                                  <span className="text-[10px] text-slate-400">
                                    {offer.timestamp || 'Recién'}
                                  </span>

                                  {isChosen ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                                        🏆 Oferta Adjudicada
                                      </span>
                                      <button
                                        onClick={() => {
                                          setActiveChatPeerId(offer.cadeteId);
                                          setActiveTab('chat');
                                          setShowAuctionQuotesModal(false);
                                        }}
                                        className="min-h-[44px] px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] shadow-sm flex items-center gap-1 active:scale-95"
                                      >
                                        <MessageSquare size={12} />
                                        <span>Ir al Chat P2P</span>
                                      </button>
                                    </div>
                                  ) : isAwarded ? (
                                    <span className="text-[10px] text-slate-500">
                                      Subasta cerrada
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleAwardOffer(req.id, offer.id)}
                                      className="min-h-[44px] px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-[11px] shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                                    >
                                      <span>Aceptar Oferta y Adjudicar 🤝</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-2 border-t border-slate-700/40">
              <button
                type="button"
                onClick={() => setShowAuctionQuotesModal(false)}
                className={`w-full min-h-[44px] py-2.5 rounded-xl border text-xs font-semibold ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Cerrar Comparador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
