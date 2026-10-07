import React, { useState } from 'react';
import LiveMap, { ALTA_GRACIA_CENTER } from './LiveMap';
import { MapPin, Check, X, Search, Crosshair, Navigation } from 'lucide-react';

export default function LocationPicker({
  isOpen,
  onClose,
  onConfirm,
  initialCoords = ALTA_GRACIA_CENTER,
  initialAddress = '',
  title = 'Seleccionar Ubicación en Alta Gracia',
  isDark = true
}) {
  const [selectedCoords, setSelectedCoords] = useState(initialCoords);
  const [address, setAddress] = useState(initialAddress);
  const [isGeocoding, setIsGeocoding] = useState(false);

  if (!isOpen) return null;

  // Intentar geocodificación inversa con OpenStreetMap Nominatim
  const handleLocationSelect = async (coords) => {
    setSelectedCoords([coords.lat, coords.lng]);
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          const parts = data.display_name.split(',');
          // Tomar calle y barrio o primeros elementos
          const shortAddress = parts.slice(0, 3).join(',').trim();
          setAddress(shortAddress);
        }
      }
    } catch (e) {
      console.warn('Geocodificación inversa no disponible:', e);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm({
        lat: selectedCoords[0],
        lng: selectedCoords[1],
        address: address || `${selectedCoords[0].toFixed(5)}, ${selectedCoords[1].toFixed(5)}`
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
        isDark ? 'bg-[#0B132B] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Encabezado */}
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{title}</h3>
              <p className="text-[11px] text-slate-400">Toca el mapa libre para colocar el marcador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mapa Interactivo con LiveMap */}
        <div className="relative w-full h-72 sm:h-80 bg-slate-950">
          <LiveMap
            center={selectedCoords}
            zoom={15}
            isDark={isDark}
            pickerMode={true}
            selectedLocation={selectedCoords}
            onSelectLocation={handleLocationSelect}
            showUserLocation={true}
            showPeers={false}
          />
        </div>

        {/* Detalles de Posición y Confirmación */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-slate-800">
            <Crosshair className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-mono">
                Lat: {selectedCoords[0]?.toFixed(5)} • Lng: {selectedCoords[1]?.toFixed(5)}
              </p>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Dirección o referencia (ej. Av. Belgrano 250)"
                className="w-full bg-transparent text-xs font-semibold focus:outline-none text-slate-200 placeholder-slate-500"
              />
            </div>
            {isGeocoding && <span className="text-[10px] text-amber-400 animate-pulse">Buscando...</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 hover:brightness-110 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Ubicación</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
