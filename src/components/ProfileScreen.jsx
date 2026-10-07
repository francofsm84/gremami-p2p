import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ARGENTINE_FIAT_PROVIDERS } from '../data/mockData';
import LiveMap, { ALTA_GRACIA_CENTER } from './LiveMap';
import { profileService } from '../lib/supabaseClient';
import {
  User,
  Star,
  ShieldCheck,
  Key,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  History,
  Award,
  Sparkles,
  Download,
  Settings,
  ChevronRight,
  ExternalLink,
  X,
  RefreshCw,
  ArrowLeft,
  DollarSign,
  Coins,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  MapPin,
  Locate,
  Navigation,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldAlert,
  UserX,
  Camera,
  Upload,
  Share2,
  Phone,
  MessageCircle,
  Truck,
  Car,
  Bike,
  Footprints,
  FileText,
  BadgeCheck,
  CheckSquare,
  Square,
  Radio,
  Wallet,
  CreditCard,
  Building2,
  LogIn,
  LogOut
} from 'lucide-react';

export default function ProfileScreen() {
  const {
    userName,
    setUserName,
    userPublicKey,
    role,
    setRole,
    balance,
    seedWords,
    showToast,
    setActiveTab,
    ordersHistory,
    theme,
    blockedUserIds,
    unblockUser,
    peers,
    isOnline,
    toggleOnlineStatus,
    userProfile,
    updateUserProfile,
    uploadAvatar,
    uploadIdDocument,
    toggleIdVerification,
    copyReferralLink,
    shareMilestones,
    updateFiatPaymentConfig,
    currentUser,
    openAuthModal,
    logout,
    userGpsCoords,
    setUserGpsCoords,
    userGpsAccuracy,
    hasLiveGps
  } = useApp();

  const isDark = theme === 'dark';

  // Forzar actualización GPS manual y sincronización en Supabase
  const handleForceGpsSync = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = [Number(pos.coords.latitude.toFixed(6)), Number(pos.coords.longitude.toFixed(6))];
          if (setUserGpsCoords) setUserGpsCoords(coords);
          if (currentUser?.id) {
            await profileService.updateLocation(currentUser.id, {
              lat: coords[0],
              lng: coords[1]
            }).catch(() => {});
          }
          showToast(`📍 Posición GPS sincronizada: ${coords[0]}, ${coords[1]}`, 'success');
        },
        (err) => {
          showToast(`Error al obtener señal GPS: ${err.message}`, 'error');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // Internal Dashboard tabs: 'profile' (Datos y Vehículo), 'metrics' (Métricas y Finanzas), 'milestones' (Hitos y Referidos)
  const [activeSection, setActiveSection] = useState('profile');

  // Pestañas de Historial: "Mis Solicitudes (Cliente)" vs "Mis Entregas (Cadete)"
  const [dashboardTab, setDashboardTab] = useState(role === 'cadete' ? 'cadete' : 'cliente');

  // Modals state
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [seedPin, setSeedPin] = useState('');
  const [isSeedUnlocked, setIsSeedUnlocked] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [pinError, setPinError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  // File input refs
  const avatarInputRef = useRef(null);
  const idDocInputRef = useRef(null);

  // Profile Form state
  const [formName, setFormName] = useState(userProfile?.name || userName || 'SatoshiDev');
  const [formBio, setFormBio] = useState(userProfile?.bio || '');
  const [formWorkZone, setFormWorkZone] = useState(userProfile?.workZone || 'Alta Gracia, Córdoba capital y Valle de Paravachasca');
  const [formCategory, setFormCategory] = useState(userProfile?.vehicleCategory || 'fletes');
  const [formVehicleType, setFormVehicleType] = useState(userProfile?.vehicleType || 'Camioneta Pick-up');
  const [formLoadCapacity, setFormLoadCapacity] = useState(userProfile?.loadCapacity || '1.500 kg / 8 m³');
  const [formIncludesHelpers, setFormIncludesHelpers] = useState(userProfile?.includesHelpers ?? true);
  const [formInstagram, setFormInstagram] = useState(userProfile?.socials?.instagram || '@gremami.p2p');
  const [formTwitter, setFormTwitter] = useState(userProfile?.socials?.twitter || '@gremamip2p');
  const [formWhatsapp, setFormWhatsapp] = useState(userProfile?.socials?.whatsapp || '+5493547123456');
  const [formFacebook, setFormFacebook] = useState(userProfile?.socials?.facebook || 'Gremami P2P Alta Gracia');
  const [formAliasCbu, setFormAliasCbu] = useState(userProfile?.aliasCbu || 'cadete.gremami.mp');
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Estados para Billeteras Virtuales Argentinas ($ ARS)
  const [formFiatProvider, setFormFiatProvider] = useState(userProfile?.fiatProvider || 'Mercado Pago');
  const [formFiatAlias, setFormFiatAlias] = useState(userProfile?.fiatAlias || userProfile?.aliasCbu || 'cadete.gremami.mp');
  const [formFiatCbuCvu, setFormFiatCbuCvu] = useState(userProfile?.fiatCbuCvu || '0000003100049281729384');
  const [formFiatHolderName, setFormFiatHolderName] = useState(userProfile?.fiatHolderName || 'Satoshi Dev Nakamoto');
  const [formFiatCuit, setFormFiatCuit] = useState(userProfile?.fiatCuit || '20-38492019-4');
  const [isSavingFiat, setIsSavingFiat] = useState(false);

  // Active list from orders history
  const activeOrders = ordersHistory[dashboardTab] || [];

  // Métricas Multimoneda Calculadas Dinámicamente
  const totalTrips = activeOrders.length;
  const totalArs = activeOrders.reduce((acc, curr) => acc + (curr.amountArs || 0), 0);
  const totalUsd = activeOrders.reduce((acc, curr) => acc + (curr.amountUsd || 0), 0);
  const totalValens = activeOrders.reduce((acc, curr) => acc + (curr.valensReward || curr.valensEarned || 0), 0);
  const totalSavingsArs = activeOrders.reduce((acc, curr) => acc + (curr.savingsArs || curr.commissionSavedArs || 0), 0);

  // Copy Alias / CBU helper
  const handleCopyAlias = () => {
    const aliasToCopy = formFiatAlias.trim() || formAliasCbu.trim() || userProfile?.aliasCbu || 'cadete.gremami.mp';
    navigator.clipboard.writeText(aliasToCopy);
    setCopiedAlias(true);
    showToast(`💳 Alias (${formFiatProvider}) copiado: ${aliasToCopy}`, 'success');
    setTimeout(() => setCopiedAlias(false), 2500);
  };

  // Guardado directo de Métodos de Cobro FIAT
  const handleSaveFiatPaymentConfig = async (e) => {
    e?.preventDefault();
    setIsSavingFiat(true);
    try {
      const aliasFinal = formFiatAlias.trim() || formAliasCbu.trim() || 'cadete.gremami.mp';
      updateFiatPaymentConfig({
        fiatProvider: formFiatProvider,
        fiatAlias: aliasFinal,
        fiatCbuCvu: formFiatCbuCvu.trim(),
        fiatHolderName: formFiatHolderName.trim(),
        fiatCuit: formFiatCuit.trim()
      });
      setFormAliasCbu(aliasFinal);
      setFormFiatAlias(aliasFinal);
    } finally {
      setIsSavingFiat(false);
    }
  };

  // Handle Avatar image file upload
  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('⚠️ La imagen no debe superar los 5MB', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        uploadAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle ID Document file upload
  const handleIdDocFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('⚠️ El documento no debe superar los 5MB', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        uploadIdDocument(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Profile Form submit
  const handleSaveProfile = (e) => {
    e.preventDefault();
    const aliasFinal = formFiatAlias.trim() || formAliasCbu.trim() || 'cadete.gremami.mp';
    updateUserProfile({
      name: formName,
      bio: formBio,
      aliasCbu: aliasFinal,
      fiatProvider: formFiatProvider,
      fiatAlias: aliasFinal,
      fiatCbuCvu: formFiatCbuCvu.trim(),
      fiatHolderName: formFiatHolderName.trim(),
      fiatCuit: formFiatCuit.trim(),
      workZone: formWorkZone,
      vehicleCategory: formCategory,
      vehicleType: formVehicleType,
      loadCapacity: formLoadCapacity,
      includesHelpers: formIncludesHelpers,
      socials: {
        instagram: formInstagram,
        twitter: formTwitter,
        whatsapp: formWhatsapp,
        facebook: formFacebook
      }
    });
    updateFiatPaymentConfig({
      fiatProvider: formFiatProvider,
      fiatAlias: aliasFinal,
      fiatCbuCvu: formFiatCbuCvu.trim(),
      fiatHolderName: formFiatHolderName.trim(),
      fiatCuit: formFiatCuit.trim()
    });
    setUserName(formName);
    setIsEditingProfile(false);
  };

  // Security unlock check for BIP-39 seed phrase
  const handleUnlockSeed = (e) => {
    e?.preventDefault();
    if (seedPin.length >= 4) {
      setIsSeedUnlocked(true);
      setPinError('');
    } else {
      setPinError('Ingresa un PIN de seguridad de al menos 4 dígitos (ej. 1234)');
    }
  };

  const handleCopySeed = () => {
    navigator.clipboard.writeText(seedWords.join(' '));
    setCopiedSeed(true);
    showToast('🔐 Frase semilla copiada. ¡Guárdala fuera de línea!', 'success');
    setTimeout(() => setCopiedSeed(false), 2500);
  };

  const closeSeedModal = () => {
    setShowSeedModal(false);
    setIsSeedUnlocked(false);
    setSeedPin('');
    setPinError('');
  };

  // WhatsApp share links
  const referralUrl = `https://gremami.app/ref/${userProfile.referralCode || 'satoshidev'}`;
  const referralWhatsappText = encodeURIComponent(
    `👋 ¡Hola! Te invito a sumarte a Gremami P2P en Alta Gracia. Logística, fletes y envíos directos sin comisiones corporativas. Registrate acá: ${referralUrl}`
  );

  const milestonesText = `🚀 ¡Mis Hitos P2P en Alta Gracia!\n📦 ${userProfile.milestones?.weeklyDeliveries || 12} Entregas/Fletes esta semana\n⭐ ${userProfile.milestones?.positiveRatingPercent || 100}% Calificación Positiva (5.0★)\n💰 $${(userProfile.milestones?.commissionsSavedArs || 48500).toLocaleString('es-AR')} ARS ahorrados en comisiones intermediarias ($0 comisiones abusivas).\n\nConectá con logística soberana: ${referralUrl}`;
  const milestonesWhatsappText = encodeURIComponent(milestonesText);

  return (
    <div className={`w-full min-h-[calc(100vh-135px)] p-4 pb-8 space-y-4 max-w-lg mx-auto animate-fadeIn transition-colors duration-200 select-none ${
      isDark ? 'bg-[#0A1128] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* 1. Header con Botón de Regreso y Título */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex items-center space-x-1.5 text-xs transition-colors ${
            isDark ? 'text-[#8C9BB4] hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Inicio</span>
        </button>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border ${
          isDark
            ? 'text-[#F0B90B] bg-[#121B2D] border-[#1F2D48]'
            : 'text-amber-700 bg-amber-50 border-amber-200 font-bold'
        }`}>
          Perfil y Logística P2P
        </span>
      </div>

      {/* 4. Conmutador de Estado en Tiempo Real (Online / Offline - Disponible para Trabajar) */}
      <div className={`p-3.5 rounded-2xl border shadow-lg transition-all ${
        isOnline
          ? isDark
            ? 'bg-gradient-to-r from-[#0C2419] to-[#121B2D] border-emerald-500/60 shadow-glow-green'
            : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
          : isDark
          ? 'bg-[#121B2D] border-slate-700 text-slate-400'
          : 'bg-slate-100 border-slate-300 text-slate-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className={`animate-radar absolute inline-flex h-full w-full rounded-full ${
                isOnline ? 'bg-emerald-400 opacity-80' : 'bg-slate-400 opacity-20'
              }`} />
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                isOnline ? 'bg-emerald-500' : 'bg-slate-400'
              }`} />
            </span>
            <div>
              <p className={`text-xs font-black ${isOnline ? (isDark ? 'text-white' : 'text-emerald-950') : (isDark ? 'text-slate-300' : 'text-slate-700')}`}>
                {isOnline ? '🟢 DISPONIBLE PARA TRABAJAR (ONLINE)' : '⚪ MODO DESCONECTADO (OFFLINE)'}
              </p>
              <p className={`text-[10px] ${isOnline ? (isDark ? 'text-emerald-300' : 'text-emerald-700') : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                {isOnline
                  ? 'Tu pin está activo en el mapa y recibes alertas de entregas/fletes en Alta Gracia.'
                  : 'Marcador oculto del mapa. Alertas pausadas temporalmente.'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleOnlineStatus}
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
              isOnline
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400'
                : isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300'
            }`}
          >
            {isOnline ? 'Pausar' : 'Conectar'}
          </button>
        </div>
      </div>

      {/* 2. Tarjeta Principal de Identidad, Foto y Verificación Comunitaria */}
      <div className={`rounded-2xl border p-4 shadow-xl relative overflow-hidden transition-colors ${
        isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-start justify-between gap-3">
          {/* Avatar con cargador de imagen */}
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E02424] via-[#F7931A] to-[#F0B90B] p-0.5 shadow-glow-orange overflow-hidden">
              <img
                src={userProfile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt="Avatar"
                className="w-full h-full object-cover rounded-2xl bg-[#0A1128]"
              />
            </div>

            {/* Botón de carga de foto */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-[#F7931A] text-slate-950 border-2 border-[#121B2D] shadow-md hover:bg-[#F0B90B] active:scale-90 transition-all"
              title="Cargar nueva foto o logo de perfil"
            >
              <Camera size={13} strokeWidth={2.5} />
            </button>
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              onChange={handleAvatarFile}
              className="hidden"
            />
          </div>

          {/* Datos Resumidos de Identidad */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {userProfile.name || userName}
              </h2>
              {userProfile.isIdVerified && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1 flex-shrink-0">
                  <BadgeCheck size={11} /> Identidad Validada P2P 🛡️
                </span>
              )}
            </div>

            <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-[#8C9BB4]' : 'text-slate-600'}`}>
              📍 {userProfile.workZone}
            </p>

            <div className="flex items-center space-x-3 mt-1.5 text-xs">
              <div className="flex items-center space-x-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span>4.96 ★</span>
                <span className={`text-[10px] font-normal ${isDark ? 'text-[#8C9BB4]' : 'text-slate-500'}`}>(280 reseñas)</span>
              </div>
              <span className={isDark ? 'text-[#1F2D48]' : 'text-slate-300'}>|</span>
              <span className={`text-[11px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'} font-medium`}>
                100% Sin Comisiones
              </span>
            </div>

            {/* Badge de Billetera y Alias/CBU de Cobro Directo */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1 ${
                isDark
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                <span>💳 {userProfile.fiatProvider || 'Mercado Pago'}:</span>
                <span className="font-extrabold">{userProfile.fiatAlias || userProfile.aliasCbu || 'cadete.gremami.mp'}</span>
              </span>
              {userProfile.fiatCbuCvu && (
                <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded-lg border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}>
                  CBU/CVU: {userProfile.fiatCbuCvu}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Biografía / Resumen de Servicios */}
        {userProfile.bio && (
          <p className={`mt-3 text-xs p-2.5 rounded-xl border leading-relaxed ${
            isDark ? 'bg-[#070C1E] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            "{userProfile.bio}"
          </p>
        )}

        {/* Documento de Identidad (DNI / Cédula) & Verificación Comunitaria */}
        <div className={`mt-3 pt-3 border-t flex items-center justify-between ${
          isDark ? 'border-[#1F2D48]' : 'border-slate-200'
        }`}>
          <div className="flex items-center space-x-2 min-w-0">
            <FileText size={16} className="text-[#F7931A] flex-shrink-0" />
            <div className="min-w-0">
              <p className={`text-[11px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Documento de Identidad (DNI)
              </p>
              <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {userProfile.idDocumentUrl ? 'DNI cargado • Verificación voluntaria' : 'Sin documento adjunto'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => idDocInputRef.current?.click()}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1 active:scale-95 transition-all ${
                isDark
                  ? 'bg-[#18243C] border-slate-700 text-[#F7931A] hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-300 text-amber-700 hover:bg-slate-200'
              }`}
            >
              <Upload size={11} />
              <span>{userProfile.idDocumentUrl ? 'Cambiar DNI' : 'Subir DNI'}</span>
            </button>
            <input
              type="file"
              ref={idDocInputRef}
              accept="image/*"
              onChange={handleIdDocFile}
              className="hidden"
            />

            <button
              onClick={toggleIdVerification}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                userProfile.isIdVerified
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Alternar estado verificado"
            >
              {userProfile.isIdVerified ? 'Validado ✓' : 'Validar'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Tarjeta de Autenticación & Cuenta Google (Supabase Auth) */}
      <div className={`rounded-2xl border p-4 shadow-xl transition-all ${
        isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between border-b pb-2.5 mb-3 border-slate-700/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center p-1 shadow-xs flex-shrink-0">
              <svg className="w-full h-full" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Autenticación & Google OAuth
              </h3>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {currentUser ? 'Sesión en la nube sincronizada con Supabase' : 'Acceso seguro con tu cuenta de Google'}
              </p>
            </div>
          </div>

          {currentUser ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1">
              <CheckCircle2 size={11} /> Conectado
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-[#F7931A] border border-[#F7931A]/30 font-bold">
              Modo Invitado / Local
            </span>
          )}
        </div>

        {currentUser ? (
          <div className="space-y-3">
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center space-x-3 min-w-0">
                <img
                  src={currentUser.user_metadata?.avatar_url || userProfile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt="Google Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400/80 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {currentUser.user_metadata?.full_name || userName}
                  </p>
                  <p className="text-[11px] text-emerald-400 truncate font-mono">
                    {currentUser.email}
                  </p>
                  <p className={`text-[9.5px] truncate font-mono mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    UUID: {currentUser.id}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 transition-all active:scale-95 flex-shrink-0"
              >
                <LogOut size={12} />
                <span>Cerrar Sesión</span>
              </button>
            </div>

            <div className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
              isDark ? 'bg-[#070C1E]/60 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Proveedor de Identidad:</span>
                <span className="font-semibold text-white">Google OAuth (Supabase)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Sincronización de Perfil:</span>
                <span className="font-semibold text-emerald-400">Tiempo Real Activo</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Inicia sesión con tu cuenta de Google para respaldar tus órdenes, configurar tu billetera $ ARS y sincronizar tu actividad en la red de Alta Gracia y Gran Córdoba.
            </p>

            <button
              onClick={openAuthModal}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center space-x-2.5 shadow-md active:scale-98 transition-all border border-slate-300"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continuar con Google / Iniciar Sesión</span>
            </button>
          </div>
        )}
      </div>

      {/* Selector de Pestañas de la Pantalla */}
      <div className={`p-1 rounded-2xl border grid grid-cols-3 gap-1 ${
        isDark ? 'bg-[#0B132B] border-[#1F2D48]' : 'bg-slate-200 border-slate-300'
      }`}>
        <button
          onClick={() => setActiveSection('profile')}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition-all text-center ${
            activeSection === 'profile'
              ? 'bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black shadow-glow-orange'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ⚙️ Servicios y Vehículo
        </button>

        <button
          onClick={() => setActiveSection('milestones')}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition-all text-center ${
            activeSection === 'milestones'
              ? 'bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black shadow-glow-orange'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🚀 Hitos y Referidos
        </button>

        <button
          onClick={() => setActiveSection('metrics')}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition-all text-center ${
            activeSection === 'metrics'
              ? 'bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black shadow-glow-orange'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📊 Métricas y Finanzas
        </button>
      </div>

      {/* SECCIÓN A: SERVICIOS, VEHÍCULO Y COBERTURA (Formulario Completo) */}
      {activeSection === 'profile' && (
        <div className={`p-4 rounded-2xl border space-y-4 shadow-xl transition-colors ${
          isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-700/40">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-[#F7931A]" />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Datos de Servicio, Fletes y Redes Sociales
              </h3>
            </div>
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all ${
                isEditingProfile
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : isDark ? 'bg-[#070C1E] text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {isEditingProfile ? 'Cancelar' : 'Editar Formulario'}
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3.5">
            {/* Nombre o Razón Social */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Nombre o Razón Social:</label>
              <input
                type="text"
                disabled={!isEditingProfile}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#F7931A] disabled:opacity-75 ${
                  isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Módulo: Configurar Métodos de Cobro FIAT ($ ARS) */}
            <div className={`p-4 rounded-2xl border space-y-3 transition-all shadow-md ${
              isDark ? 'bg-[#0B132B] border-emerald-500/40' : 'bg-emerald-50/60 border-emerald-300'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-emerald-400 tracking-tight">
                      Configurar Métodos de Cobro FIAT ($ ARS)
                    </h3>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Billeteras virtuales argentinas y transferencias bancarias 100% directas sin comisiones
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-600/50">
                  0% Retención
                </span>
              </div>

              {/* Selector de Entidades Financieras Argentinas */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                  1. Seleccioná tu Billetera o Banco Preferido para Cobrar:
                </label>
                <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto no-scrollbar pr-0.5">
                  {ARGENTINE_FIAT_PROVIDERS.map((prov) => {
                    const isSelected = formFiatProvider === prov.name;
                    return (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => {
                          setFormFiatProvider(prov.name);
                          if (!formFiatAlias || formFiatAlias === 'cadete.gremami.mp') {
                            setFormFiatAlias(prov.placeholderAlias);
                          }
                        }}
                        className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-400 shadow-sm text-white'
                            : isDark
                            ? 'bg-[#121B2D] border-slate-700/80 text-slate-300 hover:border-slate-500'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-sm">{prov.iconEmoji}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </div>
                        <span className="text-[10.5px] font-bold truncate leading-tight">
                          {prov.shortName}
                        </span>
                        <span className={`text-[8.5px] font-mono truncate mt-0.5 ${
                          isSelected ? 'text-emerald-300 font-semibold' : 'text-slate-400'
                        }`}>
                          {prov.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Formulario de Datos: Entidad, Alias, CBU, Titular, CUIT */}
              <div className="space-y-2.5 pt-1">
                {/* Entidad seleccionada & Alias */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 mb-1">
                      Entidad Seleccionada:
                    </label>
                    <div className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                      isDark ? 'bg-[#121B2D] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                    }`}>
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate">{formFiatProvider}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-emerald-400 mb-1">
                      Alias de Cobro P2P:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={formFiatAlias}
                        onChange={(e) => setFormFiatAlias(e.target.value)}
                        placeholder="ej. cadete.gremami.mp"
                        className={`flex-1 border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-400 ${
                          isDark ? 'bg-[#121B2D] border-slate-700 text-emerald-300' : 'bg-white border-emerald-300 text-emerald-800'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleCopyAlias}
                        className={`min-h-[38px] px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all flex-shrink-0 active:scale-95 ${
                          copiedAlias
                            ? 'bg-emerald-500 text-black border-emerald-400'
                            : isDark
                            ? 'bg-[#18243C] text-slate-200 border-slate-700 hover:text-white'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                        title="Copiar Alias de Cobro"
                      >
                        {copiedAlias ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* CBU / CVU */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 mb-1">
                    CBU o CVU (22 dígitos para transferencias directas):
                  </label>
                  <input
                    type="text"
                    value={formFiatCbuCvu}
                    onChange={(e) => setFormFiatCbuCvu(e.target.value)}
                    placeholder="ej. 0000003100049281729384"
                    maxLength={22}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-400 ${
                      isDark ? 'bg-[#121B2D] border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                {/* Nombre del Titular y CUIT/CUIL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 mb-1">
                      Nombre y Apellido del Titular:
                    </label>
                    <input
                      type="text"
                      value={formFiatHolderName}
                      onChange={(e) => setFormFiatHolderName(e.target.value)}
                      placeholder="ej. Satoshi Dev Nakamoto"
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-400 ${
                        isDark ? 'bg-[#121B2D] border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 mb-1">
                      CUIT o CUIL del Titular:
                    </label>
                    <input
                      type="text"
                      value={formFiatCuit}
                      onChange={(e) => setFormFiatCuit(e.target.value)}
                      placeholder="ej. 20-38492019-4"
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-400 ${
                        isDark ? 'bg-[#121B2D] border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Botón de Guardado del Módulo FIAT */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <p className={`text-[10px] leading-tight flex-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  💡 Se sincroniza con Supabase y se visualiza en tu código QR para cobros inmediatos.
                </p>
                <button
                  type="button"
                  onClick={handleSaveFiatPaymentConfig}
                  disabled={isSavingFiat}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingFiat ? 'Guardando...' : 'Guardar Billetera FIAT'}</span>
                </button>
              </div>
            </div>

            {/* Descripción / Biografía de Servicios */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Descripción / Biografía de Servicios (horarios, capacidades, condiciones):
              </label>
              <textarea
                rows={3}
                disabled={!isEditingProfile}
                value={formBio}
                onChange={(e) => setFormBio(e.target.value)}
                placeholder="Detallá tus especialidades, disponibilidad horaria y condiciones de entrega..."
                className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#F7931A] disabled:opacity-75 leading-relaxed ${
                  isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Zona de Trabajo / Cobertura */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Zona de Trabajo / Cobertura Territorial:
              </label>
              <input
                type="text"
                disabled={!isEditingProfile}
                value={formWorkZone}
                onChange={(e) => setFormWorkZone(e.target.value)}
                placeholder="Ej. Alta Gracia, Anisacate, Valle de Paravachasca y Córdoba Capital"
                className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#F7931A] disabled:opacity-75 ${
                  isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Mapa GPS en Vivo y Posición Satelital */}
            <div className={`p-3 rounded-2xl border space-y-2.5 ${
              isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-blue-400">Ubicación GPS en Tiempo Real</h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {userGpsCoords ? `Lat: ${userGpsCoords[0].toFixed(5)}, Lng: ${userGpsCoords[1].toFixed(5)}` : 'Alta Gracia (-31.6529, -64.4283)'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleForceGpsSync}
                  className="px-2.5 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-[10.5px] font-bold flex items-center gap-1 active:scale-95"
                >
                  <Locate className="w-3 h-3" />
                  <span>Sincronizar GPS</span>
                </button>
              </div>

              {/* Mini Mapa Interactivo OpenStreetMap */}
              <div className="rounded-xl overflow-hidden border border-slate-700/60 h-44 w-full relative">
                <LiveMap
                  center={userGpsCoords || ALTA_GRACIA_CENTER}
                  zoom={15}
                  height="100%"
                  isDark={isDark}
                  showUserLocation={true}
                  showPeers={false}
                />
              </div>
            </div>

            {/* Selector de Vehículo y Fletes */}
            <div className={`p-3 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-[#F7931A]">
                  Categoría y Tipo de Vehículo:
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Mudanzas & Cargas Pesadas</span>
              </div>

              {/* Botones de Selección Rápida de Categoría */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'fletes', label: '🚚 Flete/Cargas' },
                  { id: 'automovil', label: '🚗 Automóvil' },
                  { id: 'motocicleta', label: '🏍️ Motocicleta' },
                  { id: 'bicicleta', label: '🚲 Bicicleta' },
                  { id: 'caminando', label: '🚶 A Pie' },
                  { id: 'comercio', label: '🏪 Comercio' }
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!isEditingProfile}
                    onClick={() => setFormCategory(c.id)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      formCategory === c.id
                        ? 'bg-[#F7931A] text-slate-950 border-amber-400 font-bold shadow-sm'
                        : isDark
                        ? 'bg-[#121B2D] border-slate-700 text-slate-300'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Campos específicos de Fletes / Cargas Pesadas */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Tipo de Vehículo:</label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={formVehicleType}
                    onChange={(e) => setFormVehicleType(e.target.value)}
                    placeholder="Ej. Pick-up / Camión Volcador"
                    className={`w-full border rounded-xl px-2.5 py-1.5 text-xs ${
                      isDark ? 'bg-[#121B2D] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Capacidad de Carga:</label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={formLoadCapacity}
                    onChange={(e) => setFormLoadCapacity(e.target.value)}
                    placeholder="Ej. 1.500 kg / 8 m³"
                    className={`w-full border rounded-xl px-2.5 py-1.5 text-xs ${
                      isDark ? 'bg-[#121B2D] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Checkbox: Servicio de Peones (Carga y Descarga) */}
              <div className="pt-1 flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isEditingProfile}
                    checked={formIncludesHelpers}
                    onChange={(e) => setFormIncludesHelpers(e.target.checked)}
                    className="w-4 h-4 text-[#F7931A] rounded focus:ring-0"
                  />
                  <span>Incluye peones de carga y descarga 🏋️</span>
                </label>
                <span className={`text-[10px] font-bold ${formIncludesHelpers ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {formIncludesHelpers ? 'Servicio Completo' : 'Solo Chofer'}
                </span>
              </div>
            </div>

            {/* Redes Sociales y Contacto Directo */}
            <div className={`p-3 rounded-2xl border space-y-2.5 ${
              isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <label className="block text-[11px] font-bold text-slate-400">
                Vinculación de Redes Sociales y Mensajería:
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">📸 Instagram:</span>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={formInstagram}
                    onChange={(e) => setFormInstagram(e.target.value)}
                    className={`w-full border rounded-xl px-2.5 py-1.5 text-xs ${
                      isDark ? 'bg-[#121B2D] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">💬 WhatsApp:</span>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    className={`w-full border rounded-xl px-2.5 py-1.5 text-xs ${
                      isDark ? 'bg-[#121B2D] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">🐦 X (Twitter):</span>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={formTwitter}
                    onChange={(e) => setFormTwitter(e.target.value)}
                    className={`w-full border rounded-xl px-2.5 py-1.5 text-xs ${
                      isDark ? 'bg-[#121B2D] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">👥 Facebook:</span>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={formFacebook}
                    onChange={(e) => setFormFacebook(e.target.value)}
                    className={`w-full border rounded-xl px-2.5 py-1.5 text-xs ${
                      isDark ? 'bg-[#121B2D] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Botón Guardar */}
            {isEditingProfile && (
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-slate-950 font-bold text-xs shadow-glow-orange active:scale-95 transition-all"
              >
                💾 Guardar Cambios de Perfil
              </button>
            )}
          </form>
        </div>
      )}

      {/* SECCIÓN B: HITOS P2P Y PROGRAMA DE REFERIDOS */}
      {activeSection === 'milestones' && (
        <div className="space-y-4">
          {/* 5. Tarjeta de Hitos P2P ("Mis Hitos P2P") */}
          <div className={`p-4 rounded-2xl border shadow-xl relative overflow-hidden ${
            isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-[#F7931A]" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Mis Hitos P2P • Alta Gracia
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                Impacto Real
              </span>
            </div>

            {/* Grid de 4 Hitos */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-slate-400 block font-semibold">Envíos Semanales:</span>
                <p className="text-xl font-black text-[#F7931A] font-mono mt-0.5">
                  {userProfile.milestones?.weeklyDeliveries || 12}
                </p>
                <span className="text-[9px] text-emerald-400">Entregas y fletes cerrados</span>
              </div>

              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-slate-400 block font-semibold">Calificación Positiva:</span>
                <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                  {userProfile.milestones?.positiveRatingPercent || 100}%
                </p>
                <span className="text-[9px] text-amber-400 font-semibold">⭐⭐⭐⭐⭐ 5.0 Impecable</span>
              </div>

              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-slate-400 block font-semibold">Comisiones Ahorradas:</span>
                <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                  ${(userProfile.milestones?.commissionsSavedArs || 48500).toLocaleString('es-AR')}
                </p>
                <span className="text-[9px] text-slate-400">$0 a corporaciones</span>
              </div>

              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-slate-400 block font-semibold">Total Histórico:</span>
                <p className={`text-xl font-black font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {userProfile.milestones?.totalTripsAllTime || 42}
                </p>
                <span className="text-[9px] text-slate-400">Viajes sin intermediarios</span>
              </div>
            </div>

            {/* Botón de 1-clic: Compartir mis Hitos */}
            <div className="mt-3.5 flex gap-2">
              <button
                onClick={shareMilestones}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#F7931A] to-[#E07D09] hover:from-[#F0B90B] hover:to-[#F7931A] text-slate-950 font-bold text-xs shadow-glow-orange flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Copy size={14} />
                <span>Copiar Tarjeta de Hitos</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${milestonesWhatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                title="Compartir en WhatsApp"
              >
                <Share2 size={14} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* 6. Programa de Enlace de Referidos P2P ("Invita a un Amigo") */}
          <div className={`p-4 rounded-2xl border shadow-xl relative overflow-hidden ${
            isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#F0B90B]" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Programa de Referidos P2P
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F0B90B]/20 text-[#F0B90B] border border-[#F0B90B]/40 font-bold">
                +2.0 VALENS por Amigo
              </span>
            </div>

            <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Invita a otros cadetes, fleteros y clientes de Alta Gracia. Ganás <strong>+2.0 VALENS</strong> por cada nodo activo que se sume con tu enlace.
            </p>

            {/* Enlace Único */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
              isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}>
              <div className="min-w-0 flex-1 font-mono text-xs text-[#F7931A] truncate">
                {referralUrl}
              </div>
              <button
                onClick={copyReferralLink}
                className="px-2.5 py-1 rounded-lg bg-[#F7931A] text-slate-950 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all flex-shrink-0"
              >
                <Copy size={12} />
                <span>Copiar</span>
              </button>
            </div>

            {/* Botón de Compartir Directo por WhatsApp */}
            <div className="mt-3 flex gap-2">
              <a
                href={`https://api.whatsapp.com/send?text=${referralWhatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Share2 size={15} />
                <span>Invitar por WhatsApp Directo</span>
              </a>
            </div>

            {/* Estadísticas de Referidos */}
            <div className={`mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-center ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className={`p-2.5 rounded-xl border ${
                isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-slate-400 block font-semibold">Amigos Invitados:</span>
                <span className={`text-lg font-black font-mono block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {userProfile?.referralsCount || 4} activos
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-slate-400 block font-semibold">Recompensas Ganadas:</span>
                <span className="text-lg font-black font-mono text-[#F0B90B] block">
                  +{userProfile?.referralRewardsValens || 8.0} VALENS
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN C: MÉTRICAS MULTIMONEDA, HISTORIAL Y SEGURIDAD */}
      {activeSection === 'metrics' && (
        <div className="space-y-4">
          {/* Selector de Pestañas Internas del Historial */}
          <div className={`p-1 rounded-2xl border flex items-center justify-between ${
            isDark ? 'bg-[#0B132B] border-[#1F2D48]' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setDashboardTab('cliente')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                dashboardTab === 'cliente'
                  ? 'bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black shadow-glow-orange'
                  : isDark ? 'text-[#8C9BB4] hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>👤 Mis Solicitudes (Cliente)</span>
            </button>

            <button
              onClick={() => setDashboardTab('cadete')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                dashboardTab === 'cadete'
                  ? 'bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black shadow-glow-orange'
                  : isDark ? 'text-[#8C9BB4] hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🛵 Mis Entregas / Fletes (Cadete)</span>
            </button>
          </div>

          {/* Tarjeta 1: Monto Total Operado Multimoneda */}
          <div className={`p-4 rounded-2xl border relative overflow-hidden shadow-lg ${
            isDark
              ? 'bg-gradient-to-br from-[#121B2D] to-[#0A1128] border-[#1F2D48]'
              : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#8C9BB4]' : 'text-slate-500'}`}>
                Monto Total Operado ({dashboardTab === 'cadete' ? 'Ganancias' : 'Envíos'})
              </span>
              <span className="p-1.5 rounded-lg bg-[#F7931A]/20 text-[#F7931A]">
                <Coins className="w-4 h-4" />
              </span>
            </div>

            {/* Valor Principal en Pesos Argentinos ($ ARS) */}
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-black text-[#F7931A] font-mono">
                ${totalArs.toLocaleString('es-AR')} ARS
              </h3>
            </div>

            {/* Conversiones Automáticas en Dólares ($ USD) y ValensCoin (VALENS) */}
            <div className={`mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs ${
              isDark ? 'border-[#1F2D48]' : 'border-slate-100'
            }`}>
              <div className={`p-2 rounded-xl border ${
                isDark ? 'bg-[#070C1E]/80 border-[#1F2D48]' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] block ${isDark ? 'text-[#8C9BB4]' : 'text-slate-500'}`}>
                  Equivalente Ref. (USD)
                </span>
                <span className={`font-mono font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  ${totalUsd.toFixed(2)} USD
                </span>
                <span className="text-[9px] text-[#8C9BB4] block font-mono">1 USD = $1.250 ARS</span>
              </div>

              <div className={`p-2 rounded-xl border ${
                isDark ? 'bg-[#070C1E]/80 border-[#1F2D48]' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] block ${isDark ? 'text-[#8C9BB4]' : 'text-slate-500'}`}>
                  {dashboardTab === 'cadete' ? 'Propinas Recibidas' : 'Propinas Enviadas'}
                </span>
                <span className="font-mono font-bold text-sm text-[#F0B90B]">
                  {totalValens.toFixed(1)} VALENS
                </span>
                <span className="text-[9px] text-[#8C9BB4] block font-mono">1 VAL = 2 USD</span>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Métrica de Impacto P2P (Comisiones Ahorradas) & Total de Viajes */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center space-x-1.5 mb-1 text-slate-400">
                <TrendingUp className="w-3.5 h-3.5 text-[#F7931A]" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Viajes Cerrados</span>
              </div>
              <p className={`text-xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {totalTrips} viajes
              </p>
              <p className={`text-[10px] mt-0.5 ${isDark ? 'text-[#8C9BB4]' : 'text-slate-500'}`}>
                100% verificados con PIN
              </p>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-[#0A2218]/90 border-emerald-500/50 shadow-glow-green' : 'bg-emerald-50 border-emerald-300'
            }`}>
              <div className="flex items-center space-x-1.5 mb-1 text-emerald-400">
                <Percent className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Ahorro P2P (30%)</span>
              </div>
              <p className="text-xl font-black font-mono text-emerald-400">
                +${totalSavingsArs.toLocaleString('es-AR')}
              </p>
              <p className={`text-[10px] mt-0.5 ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>
                Ahorrado en comisiones
              </p>
            </div>
          </div>

          {/* Tabla de Historial Reciente de Servicios en Alta Gracia */}
          <div className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between ${
              isDark ? 'border-[#1F2D48] bg-[#0F1726]' : 'border-slate-100 bg-slate-50'
            }`}>
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-[#F7931A]" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Historial Reciente • Alta Gracia
                </h3>
              </div>
              <span className={`text-[10px] font-mono ${isDark ? 'text-[#8C9BB4]' : 'text-slate-500'}`}>
                {activeOrders.length} registros
              </span>
            </div>

            <div className="divide-y divide-[#1F2D48]/60">
              {activeOrders.map((order) => (
                <div key={order.id} className="p-3 hover:bg-[#18243C]/40 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {order.counterpart}
                        </span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/40 font-bold">
                          ✓ {order.status}
                        </span>
                      </div>
                      <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${isDark ? 'text-[#8C9BB4]' : 'text-slate-600'}`}>
                        <MapPin className="w-3 h-3 text-[#F7931A] inline" />
                        {order.route}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {order.date} • PIN {order.pin}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black font-mono text-[#F7931A] block">
                        ${order.amountArs.toLocaleString('es-AR')} ARS
                      </span>
                      <span className={`text-[10px] font-mono block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        (${order.amountUsd.toFixed(2)} USD)
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold block">
                        +{order.valensReward || order.valensEarned} VAL
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Control de Usuarios Bloqueados */}
          <div className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between ${
              isDark ? 'border-[#1F2D48] bg-[#0F1726]' : 'border-slate-100 bg-slate-50'
            }`}>
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Usuarios Bloqueados ({blockedUserIds.length})
                </h3>
              </div>
              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Control de Privacidad P2P
              </span>
            </div>

            <div className="p-3">
              {blockedUserIds.length === 0 ? (
                <p className={`text-xs text-center py-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  No tienes usuarios bloqueados. Tu red P2P opera con visibilidad total en Alta Gracia.
                </p>
              ) : (
                <div className="space-y-2">
                  {blockedUserIds.map((blockedId) => {
                    const blockedPeer = peers.find((p) => p.id === blockedId) || {
                      id: blockedId,
                      name: 'Contacto Bloqueado',
                      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                      role: 'Restringido'
                    };

                    return (
                      <div
                        key={blockedId}
                        className={`flex items-center justify-between p-2.5 rounded-xl border ${
                          isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <img
                            src={blockedPeer.avatar}
                            alt={blockedPeer.name}
                            className="w-8 h-8 rounded-full object-cover border border-rose-500/50 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {blockedPeer.name}
                            </p>
                            <p className="text-[10px] text-rose-400">Oculto del mapa • Mensajes bloqueados</p>
                          </div>
                        </div>

                        <button
                          onClick={() => unblockUser(blockedId)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-emerald-500/40 active:scale-95 transition-all flex-shrink-0"
                        >
                          Desbloquear
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Autocustodia: Frase Semilla BIP-39 */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#070C1E] border-[#1F2D48]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-[#F7931A]/20 text-[#F7931A] border border-[#F7931A]/40">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Frase Semilla de Respaldo (BIP-39)
                  </h4>
                  <p className={`text-[10px] ${isDark ? 'text-[#8C9BB4]' : 'text-slate-500'}`}>
                    12 palabras secretas de autocustodia
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSeedModal(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black font-bold text-xs shadow-glow-orange active:scale-95"
              >
                Ver Frase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SEGURIDAD: Revelar Frase Semilla con PIN (100% Sólido sin transparencias) */}
      {showSeedModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl border max-w-sm w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#0B132B] border-[#1F2D48] text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <button
              onClick={closeSeedModal}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 text-[#F7931A] mb-3">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-sm font-bold">Seguridad y Respaldo BIP-39</h3>
            </div>

            {!isSeedUnlocked ? (
              <form onSubmit={handleUnlockSeed} className="space-y-3">
                <p className={`text-xs ${isDark ? 'text-[#8C9BB4]' : 'text-slate-600'}`}>
                  Ingresa tu PIN de seguridad de 4 dígitos para desencriptar tu frase semilla en la memoria local:
                </p>
                <input
                  type="password"
                  maxLength={6}
                  value={seedPin}
                  onChange={(e) => setSeedPin(e.target.value)}
                  placeholder="PIN de seguridad (ej. 1234)"
                  className={`w-full border rounded-xl px-3 py-2 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-[#F7931A] ${
                    isDark ? 'bg-[#070C1E] border-[#1F2D48] text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                  autoFocus
                />
                {pinError && <p className="text-rose-400 text-[10px]">{pinError}</p>}
                <button
                  type="submit"
                  className="w-full min-h-[44px] py-2.5 rounded-xl bg-[#F7931A] text-black font-bold text-xs shadow-glow-orange active:scale-95"
                >
                  Desbloquear 12 Palabras
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-xl text-[11px] text-[#F0B90B]">
                  ⚠️ <strong>Alerta:</strong> Jamás compartas estas 12 palabras. Con ellas se puede acceder a tus fondos en cualquier billetera BIP-39.
                </div>

                <div className={`p-3 rounded-xl border grid grid-cols-3 gap-2 font-mono text-xs ${
                  isDark ? 'bg-[#070C1E] border-[#1F2D48]' : 'bg-slate-100 border-slate-300'
                }`}>
                  {seedWords.map((word, index) => (
                    <div key={index} className="p-1 text-center bg-black/20 rounded">
                      <span className="text-[10px] opacity-60 mr-1">{index + 1}.</span>
                      <strong className="text-[#F7931A]">{word}</strong>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopySeed}
                    className="flex-1 min-h-[44px] py-2 rounded-xl bg-[#F7931A] text-black font-bold text-xs flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
                  >
                    {copiedSeed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSeed ? 'Copiada' : 'Copiar Frase'}</span>
                  </button>
                  <button
                    onClick={closeSeedModal}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold active:scale-95 transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
