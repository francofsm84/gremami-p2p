import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Locate, Navigation, Crosshair, MapPin, Compass, AlertCircle, ShieldCheck, Check } from 'lucide-react';

// Coordenadas predeterminadas (Alta Gracia & Valle de Paravachasca, Córdoba)
export const ALTA_GRACIA_CENTER = [-31.6529, -64.4283];

// Generador de Icono Leaflet Personalizado para la Posición GPS del Usuario con Radar Animado
export const createLiveGpsIcon = ({ isDark = true, label = 'Mi Ubicación', accuracy = null } = {}) => {
  return L.divIcon({
    className: 'gremami-live-gps-pin',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -50%); pointer-events:auto; cursor:pointer;">
        <!-- Ondas de Radar Radiante (Animate Ping) -->
        <div style="position:absolute; width:48px; height:48px; border-radius:9999px; background:rgba(37,99,235,0.35); animation:radar-pulse 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:absolute; width:28px; height:28px; border-radius:9999px; background:rgba(59,130,246,0.45); border:1.5px solid rgba(147,197,253,0.8);"></div>
        
        <!-- Núcleo Central del Pin GPS -->
        <div style="position:relative; width:18px; height:18px; border-radius:9999px; background:#2563EB; border:3px solid #FFFFFF; box-shadow:0 0 16px rgba(37,99,235,0.9), 0 2px 6px rgba(0,0,0,0.5); z-index:2;">
          <div style="width:6px; height:6px; margin:3px auto; border-radius:9999px; background:#FFFFFF;"></div>
        </div>

        <!-- Etiqueta Flotante con Lat/Lng y Estado -->
        <div style="margin-top:4px; background:${isDark ? '#0B132B' : '#FFFFFF'}; color:${isDark ? '#93C5FD' : '#1D4ED8'}; border:1px solid #3B82F6; border-radius:9999px; padding:2px 8px; font-size:9px; font-weight:800; white-space:nowrap; box-shadow:0 4px 10px rgba(0,0,0,0.35); display:flex; align-items:center; gap:4px; z-index:3;">
          <span style="display:inline-block; width:6px; height:6px; border-radius:9999px; background:#10B981; box-shadow:0 0 6px #10B981;"></span>
          <span>${label}</span>
          ${accuracy ? `<span style="font-size:7.5px; opacity:0.8; font-family:monospace;">(±${Math.round(accuracy)}m)</span>` : ''}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

// Generador de Icono para Selector de Ubicación (LocationPicker)
export const createPickerPinIcon = ({ isDark = true, label = 'Punto Seleccionado' } = {}) => {
  return L.divIcon({
    className: 'gremami-picker-pin',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%); pointer-events:auto; cursor:pointer;">
        <!-- Pin SVG estilo gota con gradiente ámbar Gremami -->
        <div style="filter:drop-shadow(0 4px 8px rgba(0,0,0,0.45)); transform:translateY(2px);">
          <svg width="34" height="42" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 30 12 30C12 30 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="url(#pinGradient)"/>
            <circle cx="12" cy="11" r="5" fill="#FFFFFF"/>
            <circle cx="12" cy="11" r="2.5" fill="#F7931A"/>
            <defs>
              <linearGradient id="pinGradient" x1="0" y1="0" x2="24" y2="30" gradientUnits="userSpaceOnUse">
                <stop stop-color="#F7931A"/>
                <stop offset="1" stop-color="#EA580C"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <!-- Tooltip -->
        <div style="margin-top:-2px; background:${isDark ? '#0B132B' : '#FFFFFF'}; color:${isDark ? '#FDE68A' : '#B45309'}; border:1px solid #F59E0B; border-radius:6px; padding:2px 8px; font-size:9.5px; font-weight:800; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.3);">
          📍 ${label}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

// Generador de Icono para Cadetes / Nodos en Red
export const createPeerPinIcon = (peer, { isDark = true } = {}) => {
  const isOnline = peer.is_online ?? true;
  const roleEmoji = peer.vehicle_type === 'bicicleta' ? '🚲' :
    peer.vehicle_type === 'caminando' ? '🚶' :
    peer.vehicle_type === 'auto' ? '🚗' :
    peer.vehicle_type === 'flete' ? '🚚' : '🏍️';

  return L.divIcon({
    className: 'gremami-peer-pin',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -50%); cursor:pointer;">
        <div style="background:${isDark ? '#0F172A' : '#FFFFFF'}; border:2px solid ${isOnline ? '#10B981' : '#64748B'}; border-radius:12px; padding:3px 6px; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(0,0,0,0.35); font-size:14px;">
          ${roleEmoji}
        </div>
        <div style="margin-top:2px; background:${isDark ? '#070C1E' : '#FFFFFF'}; color:${isDark ? '#E2E8F0' : '#1E293B'}; border:1px solid ${isOnline ? '#10B981' : '#94A3B8'}; border-radius:6px; padding:1px 5px; font-size:8.5px; font-weight:800; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.25);">
          ${peer.full_name || peer.name || 'Cadete'}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

// Componente Controlador de Mapa: escucha clicks para selección de posición
function MapEventsHandler({ pickerMode, onSelectLocation }) {
  useMapEvents({
    click(e) {
      if (pickerMode && onSelectLocation) {
        onSelectLocation({
          lat: Number(e.latlng.lat.toFixed(6)),
          lng: Number(e.latlng.lng.toFixed(6))
        });
      }
    }
  });
  return null;
}

// Componente para animar y centrar la vista
function MapFlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.flyTo(center, zoom || map.getZoom(), {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [center, zoom, map]);
  return null;
}

export default function LiveMap({
  center = ALTA_GRACIA_CENTER,
  zoom = 13,
  height = '100%',
  isDark = true,
  pickerMode = false,
  selectedLocation = null,
  onSelectLocation = null,
  onLocationChange = null,
  showUserLocation = true,
  showPeers = true,
  peers = [],
  autoFollowUser = false,
  className = ''
}) {
  const [userLocation, setUserLocation] = useState(null);
  const [userAccuracy, setUserAccuracy] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('prompt'); // 'prompt' | 'locating' | 'active' | 'denied' | 'error'
  const [mapCenter, setMapCenter] = useState(center);
  const [isFollowing, setIsFollowing] = useState(autoFollowUser);
  const [pickedLocation, setPickedLocation] = useState(selectedLocation);
  const watchIdRef = useRef(null);

  // Sincronizar pickedLocation cuando cambia la prop externa
  useEffect(() => {
    if (selectedLocation) {
      setPickedLocation(selectedLocation);
    }
  }, [selectedLocation]);

  // Iniciar seguimiento GPS en tiempo real con watchPosition
  useEffect(() => {
    if (!showUserLocation || typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGpsStatus('denied');
      return;
    }

    setGpsStatus('locating');

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const coords = [Number(latitude.toFixed(6)), Number(longitude.toFixed(6))];

      setUserLocation(coords);
      setUserAccuracy(accuracy);
      setGpsStatus('active');

      if (onLocationChange) {
        onLocationChange({
          lat: coords[0],
          lng: coords[1],
          accuracy,
          timestamp: position.timestamp
        });
      }

      if (isFollowing) {
        setMapCenter(coords);
      }
    };

    const handleError = (error) => {
      console.warn('LiveMap: Aviso de geolocalización:', error.message);
      if (error.code === 1) {
        setGpsStatus('denied');
      } else {
        setGpsStatus('error');
      }
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 4000
    };

    try {
      // Obtener primera lectura rápida
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

      // Activar rastreo continuo en tiempo real
      watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
    } catch (e) {
      console.warn('LiveMap: Excepción al invocar GPS:', e);
      setGpsStatus('denied');
    }

    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          navigator.geolocation.clearWatch(watchIdRef.current);
        } catch (e) {}
      }
    };
  }, [showUserLocation, isFollowing, onLocationChange]);

  // Manejador de click en modo selector
  const handleMapClickLocation = (coords) => {
    setPickedLocation([coords.lat, coords.lng]);
    if (onSelectLocation) {
      onSelectLocation(coords);
    }
  };

  // Centrar en ubicación del usuario
  const handleRecenterUser = () => {
    if (userLocation) {
      setMapCenter([...userLocation]);
      setIsFollowing(true);
    } else if (typeof navigator !== 'undefined' && 'geolocation' in navigator && navigator.geolocation) {
      setGpsStatus('locating');
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = [pos.coords.latitude, pos.coords.longitude];
            setUserLocation(coords);
            setMapCenter(coords);
            setGpsStatus('active');
          },
          () => setGpsStatus('denied'),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } catch (e) {
        setGpsStatus('denied');
      }
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden select-none ${className}`}
      style={{ height, minHeight: '220px' }}
    >
      <style>{`
        @keyframes radar-pulse {
          0% { transform: scale(0.6); opacity: 0.9; }
          70% { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.6); opacity: 0; }
        }
      `}</style>

      {/* Contenedor react-leaflet sobre OpenStreetMap (100% libre de API keys) */}
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />

        {/* Animador de centrado suave */}
        <MapFlyTo center={mapCenter} zoom={zoom} />

        {/* Captura de clicks en modo Picker */}
        <MapEventsHandler pickerMode={pickerMode} onSelectLocation={handleMapClickLocation} />

        {/* Marcador GPS en vivo del usuario actual */}
        {showUserLocation && userLocation && (
          <Marker
            position={userLocation}
            icon={createLiveGpsIcon({ isDark, label: 'Mi Ubicación GPS', accuracy: userAccuracy })}
          >
            <Popup className="gremami-custom-popup">
              <div className="text-xs p-1">
                <p className="font-bold text-blue-500">📍 Tu Ubicación Actual</p>
                <p className="font-mono text-[10px] mt-1">
                  Lat: {userLocation[0].toFixed(5)} <br />
                  Lng: {userLocation[1].toFixed(5)}
                </p>
                {userAccuracy && (
                  <p className="text-[9px] text-slate-400 mt-1">Precisión GPS: ±{Math.round(userAccuracy)} m</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador de Ubicación Seleccionada (en modo Selector) */}
        {pickerMode && pickedLocation && (
          <Marker
            position={pickedLocation}
            icon={createPickerPinIcon({ isDark, label: 'Ubicación Elegida' })}
          />
        )}

        {/* Marcadores de Pares / Cadetes conectados en vivo */}
        {showPeers && peers && peers.length > 0 && peers.map((peer, idx) => {
          const lat = peer.lat || peer.origin_lat;
          const lng = peer.lng || peer.origin_lng;
          if (!lat || !lng) return null;
          return (
            <Marker
              key={peer.id || `peer-${idx}`}
              position={[lat, lng]}
              icon={createPeerPinIcon(peer, { isDark })}
            >
              <Popup>
                <div className="text-xs p-1">
                  <p className="font-bold">{peer.full_name || peer.name || 'Cadete Gremami'}</p>
                  <p className="text-[10px] text-slate-500">
                    {peer.vehicle_type || 'Vehículo'} • {peer.is_online ? 'En Línea 🟢' : 'Desconectado ⚪'}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Barra de Estado GPS Superior Flotante */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2">
        <div className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md border text-[11px] font-bold flex items-center gap-1.5 shadow-lg ${
          gpsStatus === 'active'
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : gpsStatus === 'locating'
            ? 'bg-amber-950/80 border-amber-500/40 text-amber-300 animate-pulse'
            : 'bg-slate-900/80 border-slate-700 text-slate-300'
        }`}>
          {gpsStatus === 'active' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>GPS En Vivo</span>
            </>
          ) : gpsStatus === 'locating' ? (
            <>
              <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Detectando GPS...</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>GPS Inactivo</span>
            </>
          )}
        </div>

        {pickerMode && (
          <div className="px-2.5 py-1.5 rounded-xl backdrop-blur-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold shadow-lg flex items-center gap-1">
            <Crosshair className="w-3 h-3 text-amber-400" />
            <span>Toca el mapa para fijar punto</span>
          </div>
        )}
      </div>

      {/* Botón Flotante para Recentrar en Mi Posición GPS */}
      {showUserLocation && (
        <button
          onClick={handleRecenterUser}
          className={`absolute bottom-4 right-4 z-[400] p-3 rounded-2xl backdrop-blur-md border shadow-xl transition-all active:scale-95 flex items-center justify-center ${
            isDark
              ? 'bg-[#0B132B]/90 border-blue-500/40 text-blue-400 hover:text-white hover:bg-blue-600/30'
              : 'bg-white/95 border-blue-300 text-blue-600 hover:bg-blue-50'
          }`}
          title="Centrar en mi ubicación GPS"
        >
          <Locate className={`w-5 h-5 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}
