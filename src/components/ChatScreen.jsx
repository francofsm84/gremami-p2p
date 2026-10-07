import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Send,
  DollarSign,
  Zap,
  QrCode,
  ShieldCheck,
  CheckCheck,
  Clock,
  MapPin,
  Star,
  Copy,
  Check,
  ChevronLeft,
  X,
  Sparkles,
  ExternalLink,
  Lock,
  AlertCircle,
  Calculator,
  Percent,
  Key,
  ShieldAlert,
  CheckCircle2,
  TrendingDown,
  RefreshCw,
  Hash,
  UserX,
  UserCheck,
  ThumbsUp,
  AlertTriangle,
  Eye,
  EyeOff,
  FileText,
  BadgeCheck,
  ArrowRight
} from 'lucide-react';
import CelebrationModal from './CelebrationModal';
import { getPeerSocials, getSocialLink } from '../data/mockData';

export default function ChatScreen() {
  const {
    peers,
    activeChatPeerId,
    setActiveChatPeerId,
    messages,
    sendTextMessage,
    agreeCashPayment,
    sendValensTip,
    balance,
    requestFaucet,
    showToast,
    role,
    orderPin,
    pinStatus,
    generateNewPin,
    verifyPin,
    pinFailedAttempts,
    isPinLocked,
    celebrationData,
    completeDeliveryWithPin,
    resendPinViaChat,
    contactCommunitySupport,
    resetPinAttempts,
    closeCelebrationModal,
    setActiveTab,
    theme,
    formatDistanceKm,
    unlockChatConnection,
    isChatUnlocked,
    blockUser,
    unblockUser,
    isUserBlocked,
    recommendPeer,
    reportPeer,
    getPeerReputation,
    shareWhatsappWithPeer,
    isWhatsappSharedWithPeer,
    sharedWhatsappChats
  } = useApp();

  const isDark = theme === 'dark';
  const isCadete = role === 'cadete';

  const [inputText, setInputText] = useState('');
  const [showPeerList, setShowPeerList] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showQrTipModal, setShowQrTipModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportChatModal, setShowReportChatModal] = useState(false);
  const [reportChatReason, setReportChatReason] = useState('Cobro engañoso / Sobreprecio indebido');
  const [cashNote, setCashNote] = useState('Sobre de documentos y llaves en Alta Gracia');
  const [cadetePinInput, setCadetePinInput] = useState('');
  const [calculatorFee, setCalculatorFee] = useState(3500);

  const messagesEndRef = useRef(null);

  // Filter peers that are not blocked for the switcher
  const availablePeers = peers.filter((p) => !isUserBlocked(p.id));
  const currentPeer = peers.find((p) => p.id === activeChatPeerId) || availablePeers[0] || peers[0];
  const chatMessages = messages[currentPeer?.id] || [];

  const isBlocked = currentPeer ? isUserBlocked(currentPeer.id) : false;
  const isUnlocked = currentPeer ? isChatUnlocked(currentPeer.id) : false;
  const kmDistance = currentPeer ? formatDistanceKm(currentPeer.distanceMeters || currentPeer.distance) : '0.0 km';

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isUnlocked]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!currentPeer || !inputText.trim()) return;
    sendTextMessage(currentPeer.id, inputText);
    setInputText('');
  };

  const confirmCashAgreement = () => {
    if (!currentPeer) return;
    agreeCashPayment(currentPeer.id, { 
      note: `${cashNote} (Tarifa P2P: $${calculatorFee.toLocaleString('es-AR')} ARS)` 
    });
    setShowCashModal(false);
  };

  const confirmQrTip = () => {
    if (!currentPeer) return;
    const res = sendValensTip(currentPeer.id, 1.0);
    if (res.success) {
      setShowQrTipModal(false);
    }
  };

  // Cadete submitting pin verification with reward transfer and security handling
  const handleVerifyPinSubmit = (e) => {
    e?.preventDefault();
    if (!currentPeer) return;
    if (cadetePinInput.length !== 4) {
      showToast('⚠️ El código PIN debe tener exactamente 4 dígitos', 'warning');
      return;
    }
    const res = completeDeliveryWithPin(cadetePinInput, currentPeer.id, 1.0);
    if (res.success) {
      setCadetePinInput('');
    }
  };

  const handleConfirmBlock = () => {
    if (!currentPeer) return;
    blockUser(currentPeer.id);
    setShowBlockModal(false);
  };

  // Calculations for Fair Fee Calculator
  const traditionalFee = calculatorFee + Math.round(calculatorFee * 0.42); // 42% overcharge in traditional apps
  const customerSavings = traditionalFee - calculatorFee;
  const savingsPercent = Math.round((customerSavings / traditionalFee) * 100);

  if (!currentPeer) {
    return (
      <div className={`relative w-full h-[calc(100vh-135px)] flex flex-col items-center justify-center p-6 text-center animate-fadeIn ${
        isDark ? 'bg-[#0A1128] text-white' : 'bg-[#F8FAFC] text-slate-900'
      }`}>
        <p className="text-sm font-bold text-slate-400">No hay contactos disponibles en este momento.</p>
        <p className="text-xs text-slate-500 mt-1">Explora el Mapa P2P para encontrar prestadores activos en Alta Gracia.</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-[calc(100vh-135px)] flex flex-col overflow-hidden animate-fadeIn transition-colors duration-200 ${
      isDark ? 'bg-[#0A1128] text-white' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* 1. Chat Header */}
      <div className={`border-b px-3.5 py-2.5 flex items-center justify-between shadow-xs z-10 flex-shrink-0 ${
        isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center space-x-2.5 min-w-0">
          {/* Peer Selector Button */}
          <button
            onClick={() => setShowPeerList(!showPeerList)}
            className={`flex items-center space-x-2 p-1 rounded-xl transition-colors text-left min-w-0 ${
              isDark ? 'hover:bg-[#18243C]' : 'hover:bg-slate-100'
            }`}
            title="Cambiar chat"
          >
            <div className="relative flex-shrink-0">
              <img
                src={currentPeer.avatar}
                alt={currentPeer.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#F7931A]"
              />
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                isBlocked
                  ? 'bg-rose-500'
                  : getPeerReputation(currentPeer.id) === 'reported'
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              } ${isDark ? 'border-[#121B2D]' : 'border-white'}`} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h2 className={`text-xs font-bold leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {currentPeer.name}
                </h2>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>▼</span>
              </div>
              <div className={`flex items-center space-x-1.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className="text-[#F7931A] font-mono font-bold">{kmDistance}</span>
                <span>•</span>
                <span className="text-emerald-500 font-medium flex items-center truncate">
                  <ShieldCheck className="w-3 h-3 mr-0.5 inline flex-shrink-0" />
                  Alta Gracia
                </span>
                <span>•</span>
                <span className="text-[10px] font-bold">
                  {isBlocked ? '🔴' : getPeerReputation(currentPeer.id) === 'reported' ? '🟡' : '🟢'}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Right Header Actions: Rating, Recommend, Report & Block */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <div className={`flex items-center text-amber-500 font-mono text-[11px] px-2 py-1 rounded-xl border ${
            isDark ? 'bg-[#070C1E] border-[#1F2D48]' : 'bg-amber-50 border-amber-200'
          }`}>
            <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
            <span className="font-bold">{currentPeer.rating}</span>
          </div>

          {/* 👍 Recomendar */}
          <button
            onClick={() => recommendPeer(currentPeer.id)}
            title="Recomendar Usuario (+1 Reputación)"
            className="p-1.5 rounded-xl border text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 active:scale-95 transition-all flex items-center justify-center"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>

          {/* ⚠️ Denunciar */}
          <button
            onClick={() => setShowReportChatModal(true)}
            title="Denunciar Usuario"
            className="p-1.5 rounded-xl border text-amber-400 border-amber-500/30 hover:bg-amber-500/10 active:scale-95 transition-all flex items-center justify-center"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </button>

          {/* 🚫 Bloquear */}
          <button
            onClick={() => setShowBlockModal(true)}
            title="Bloquear / Restringir Usuario"
            className="p-1.5 rounded-xl border text-rose-500 border-rose-500/30 hover:bg-rose-500/10 active:scale-95 transition-all flex items-center justify-center"
          >
            <UserX className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Peer Switcher Dropdown Drawer (100% Sólido sin transparencias) */}
      {showPeerList && (
        <div className={`absolute top-14 left-2 right-2 z-40 border rounded-2xl shadow-2xl p-2.5 animate-fadeIn max-h-72 overflow-y-auto ring-1 ring-black/20 ${
          isDark ? 'bg-[#0B132B] border-[#1F2D48] text-white' : 'bg-white border-slate-300 text-slate-900'
        }`}>
          <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Prestadores en Alta Gracia</span>
            <button
              onClick={() => setShowPeerList(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {availablePeers.slice(0, 15).map((peer) => {
              const peerKm = formatDistanceKm(peer.distanceMeters || peer.distance);
              const unlocked = isChatUnlocked(peer.id);

              return (
                <button
                  key={peer.id}
                  onClick={() => {
                    setActiveChatPeerId(peer.id);
                    setShowPeerList(false);
                  }}
                  className={`w-full flex items-center space-x-2.5 p-2 rounded-xl transition-all ${
                    peer.id === currentPeer.id
                      ? isDark ? 'bg-[#18243C] border border-[#F7931A]' : 'bg-amber-100 border border-amber-400'
                      : isDark ? 'hover:bg-[#18243C]/60 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <img
                    src={peer.avatar}
                    alt={peer.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {peer.name}
                      </span>
                      <span className="text-[10px] text-[#F7931A] font-mono font-bold">
                        {peerKm}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                      <span className="truncate">{peer.role || peer.category}</span>
                      <span className={unlocked ? 'text-emerald-500 font-bold' : 'text-amber-500'}>
                        {unlocked ? '✓ Conectado' : '🔒 Requiere Aceptar'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CASO A: USUARIO BLOQUEADO */}
      {isBlocked ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-500 flex items-center justify-center mb-3 border border-rose-500/30">
            <UserX size={32} />
          </div>
          <h3 className="text-base font-bold">Usuario Bloqueado</h3>
          <p className={`text-xs max-w-xs mt-1.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Has bloqueado a <strong>{currentPeer.name}</strong>. Su ubicación no aparece en el mapa y la sala de mensajería está restringida.
          </p>
          <button
            onClick={() => unblockUser(currentPeer.id)}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-emerald-500/40 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <UserCheck size={14} />
            <span>Desbloquear Contacto</span>
          </button>
        </div>
      ) : !isUnlocked ? (
        /* CASO B: PERFIL PÚBLICO TRANSPARENTE (CHAT BLOQUEADO HASTA ACEPTACIÓN PREVIA) */
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Card de Aviso de Seguridad */}
          <div className={`p-3.5 rounded-2xl border text-center ${
            isDark ? 'bg-[#0B132B] border-amber-500/40 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1">
              <Lock size={14} className="text-[#F7931A]" />
              <span>Chat P2P Protegido - Esperando Aceptación Mutua</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              Los perfiles y calificaciones son públicos y transparentes para que consultes la reputación previa antes de conectar. El chat privado se habilitará cuando presiones <strong>"Aceptar Propuesta / Conectar"</strong>.
            </p>
          </div>

          {/* Tarjeta del Perfil Público Transparente */}
          <div className={`p-4 rounded-2xl border shadow-lg ${
            isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-start gap-3.5">
              <img
                src={currentPeer.avatar}
                alt={currentPeer.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#F7931A]"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base truncate">{currentPeer.name}</h3>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  <p className="text-xs text-[#F7931A] font-semibold">{currentPeer.role || currentPeer.category}</p>
                  {currentPeer.serviceModality && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full border shadow-xs ${
                      currentPeer.serviceModality === 'pasajeros'
                        ? 'bg-amber-500/20 text-[#F7931A] border-amber-500/40'
                        : currentPeer.serviceModality === 'envios'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {currentPeer.serviceModality === 'pasajeros' ? '🚖 Pasajeros (Taxi)' : currentPeer.serviceModality === 'envios' ? '📦 Envíos / Paquetes' : '🔄 Mixto (Ambos)'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs mt-1 text-slate-400">
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star size={13} className="fill-amber-400 text-amber-500" />
                    {currentPeer.rating} ({currentPeer.reviewsCount || 45} reseñas)
                  </span>
                  <span>•</span>
                  <span className="font-mono text-emerald-400 font-bold">{kmDistance}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] text-slate-400 block">Vehículo / Logística:</span>
                <span className="font-semibold block truncate">{currentPeer.vehicle || 'Bicicleta Urbana'}</span>
              </div>
              <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] text-slate-400 block">Tarifa Sugerida:</span>
                <span className="font-semibold text-emerald-400 font-mono block truncate">{currentPeer.baseFee || '$1.500 ARS'}</span>
              </div>
            </div>

            {currentPeer.description && (
              <p className={`text-xs mt-3 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                "{currentPeer.description}"
              </p>
            )}

            {/* Reseñas Públicas Recíprocas */}
            {currentPeer.recentReviews && currentPeer.recentReviews.length > 0 && (
              <div className="mt-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F7931A] block">
                  Reseñas Recíprocas de la Comunidad:
                </span>
                {currentPeer.recentReviews.map((rev, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border text-[11px] ${
                      isDark ? 'bg-[#070C1E] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-0.5">
                      <span>{rev.author}</span>
                      <span className="text-amber-500">★★★★★</span>
                    </div>
                    <p className="italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            )}

            {/* Botón Principal: Aceptar Propuesta / Conectar */}
            <div className="mt-4 pt-3 border-t border-slate-700/60 space-y-2">
              <button
                onClick={() => unlockChatConnection(currentPeer.id)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-glow-green flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <CheckCircle2 size={16} />
                <span>Aceptar Propuesta / Conectar Chat P2P</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* CASO C: CHAT DESBLOQUEADO Y ACTIVO */
        <>
          {/* 2. Barra de Acciones Rápidas (Pago Local, Calculadora y QR Tip) */}
          <div className={`border-b px-2.5 py-1.5 flex items-center justify-between gap-1.5 flex-shrink-0 ${
            isDark ? 'bg-[#0F1726] border-[#1F2D48]' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setShowCashModal(true)}
              type="button"
              className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-xl border text-xs font-bold transition-all shadow-xs active:scale-[0.98] ${
                isDark
                  ? 'bg-[#070C1E] border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/20'
                  : 'bg-white border-emerald-400 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
              <span className="truncate">Acordar Pago ($ ARS)</span>
            </button>

            <button
              onClick={() => setShowCalculatorModal(true)}
              type="button"
              className={`flex items-center justify-center space-x-1 py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs active:scale-[0.98] ${
                isDark
                  ? 'bg-[#121B2D] border-amber-500/40 text-[#F7931A] hover:bg-amber-500/10'
                  : 'bg-white border-amber-400 text-amber-700 hover:bg-amber-50'
              }`}
              title="Ver comparativa de ahorro vs apps tradicionales"
            >
              <Calculator className="w-3.5 h-3.5 text-[#F7931A]" />
              <span className="hidden xs:inline">Tarifa Justa</span>
            </button>

            <button
              onClick={() => shareWhatsappWithPeer(currentPeer.id)}
              type="button"
              disabled={isWhatsappSharedWithPeer?.(currentPeer.id)}
              className={`flex items-center justify-center space-x-1 py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs active:scale-[0.98] ${
                isWhatsappSharedWithPeer?.(currentPeer.id)
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 cursor-default'
                  : 'bg-[#25D366]/15 hover:bg-[#25D366]/25 border-[#25D366]/40 text-[#25D366]'
              }`}
              title={
                isWhatsappSharedWithPeer?.(currentPeer.id)
                  ? 'Contacto de WhatsApp ya compartido'
                  : 'Compartir mi WhatsApp con esta contraparte con consentimiento mutuo'
              }
            >
              <span>📱</span>
              <span className="hidden sm:inline">
                {isWhatsappSharedWithPeer?.(currentPeer.id) ? 'WhatsApp Compartido ✓' : 'Compartir WhatsApp'}
              </span>
              <span className="sm:hidden">
                {isWhatsappSharedWithPeer?.(currentPeer.id) ? 'WA ✓' : 'WA'}
              </span>
            </button>

            <button
              onClick={() => setShowQrTipModal(true)}
              type="button"
              className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-[#F7931A] to-[#E07D09] hover:from-[#F0B90B] hover:to-[#F7931A] text-black font-black text-xs shadow-glow-orange transition-all active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5 fill-black stroke-black" />
              <span className="truncate">Entregar Recompensa (1 VAL)</span>
            </button>
          </div>

          {/* 3. SISTEMA DE CONFIRMACIÓN ANTIFRAUDE Y PAGO FÍSICO CON PIN P2P */}
          <div className={`p-3 border-b transition-colors flex-shrink-0 ${
            isDark ? 'bg-[#080E24] border-[#1F2D48]' : 'bg-amber-50/90 border-amber-200'
          }`}>
            <div className="max-w-md mx-auto">
              {!isCadete ? (
                /* VISTA DEL CLIENTE: PIN Antifraude para Entrega Física en Mano */
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-[#F7931A]/20 text-[#F7931A] flex-shrink-0">
                        <Key className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Tu PIN Antifraude:
                          </span>
                          <span className="font-mono text-base font-black text-[#F7931A] tracking-widest px-2.5 py-0.5 rounded-lg bg-black/40 border border-amber-500/50 shadow-inner">
                            {orderPin}
                          </span>
                        </div>
                        <p className={`text-[10px] mt-0.5 leading-tight ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          El PIN valida el intercambio físico y libera la transferencia del Token ValensCoin. Entrégaselo en mano al cadete al pagar en efectivo.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      {pinStatus === 'verified' ? (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1 shadow-glow-green">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verificado ✓</span>
                        </span>
                      ) : (
                        <button
                          onClick={generateNewPin}
                          title="Regenerar PIN aleatorio"
                          className="p-1.5 text-xs text-[#F7931A] hover:bg-amber-500/10 rounded-lg border border-amber-500/30 active:scale-95 flex items-center gap-1 transition-all"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span className="text-[10px] font-semibold">Nuevo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Acciones del Cliente para Compartir / Probar el PIN */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-700/40 text-[10px]">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(orderPin);
                        showToast('🔐 PIN copiado al portapapeles', 'success');
                      }}
                      className={`px-2 py-1 rounded-lg border flex items-center gap-1 transition-all ${
                        isDark ? 'bg-[#121B2D] border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Copy size={11} />
                      <span>Copiar</span>
                    </button>

                    <button
                      onClick={() => resendPinViaChat(currentPeer.id)}
                      className={`px-2 py-1 rounded-lg border flex items-center gap-1 transition-all ${
                        isDark ? 'bg-[#121B2D] border-slate-700 text-[#F7931A] hover:bg-slate-800' : 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50'
                      }`}
                      title="Enviar código al chat"
                    >
                      <Send size={11} />
                      <span>Enviar al Chat</span>
                    </button>

                    <button
                      onClick={() => completeDeliveryWithPin(orderPin, currentPeer.id, 1.0)}
                      className="ml-auto px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 font-bold flex items-center gap-1 active:scale-95 transition-all"
                      title="Simular validación del cadete para ver la recompensa"
                    >
                      <Sparkles size={11} />
                      <span>Simular Entrega</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* VISTA DEL CADETE: Validación de Entrega con Manejo de PIN y Bloqueo Antifraude */
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-[11px] font-bold block leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Validar Pago Físico & Entrega en Mano
                        </span>
                        <span className={`text-[10px] truncate block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          El PIN valida el intercambio físico y libera la transferencia del Token ValensCoin.
                        </span>
                      </div>
                    </div>

                    {pinStatus === 'verified' && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1 shadow-glow-green flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Entrega Completada</span>
                      </span>
                    )}
                  </div>

                  {pinStatus !== 'verified' && (
                    <>
                      {/* Caso A: PIN Bloqueado por 3 Intentos Erreros */}
                      {isPinLocked ? (
                        <div className={`p-2.5 rounded-xl border text-xs space-y-2 animate-fadeIn ${
                          isDark ? 'bg-rose-950/40 border-rose-500/60 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-900'
                        }`}>
                          <div className="flex items-center gap-1.5 font-bold text-rose-400 text-[11px]">
                            <ShieldAlert size={14} />
                            <span>Seguridad P2P: Campo Bloqueado tras 3 Intentos Erróneos</span>
                          </div>
                          <p className="text-[10px] leading-tight">
                            Para evitar errores de tipeo o bloqueos accidentales, usa las siguientes opciones:
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {/* Botón 1: Reenviar PIN por Chat P2P */}
                            <button
                              type="button"
                              onClick={() => resendPinViaChat(currentPeer.id)}
                              className="py-1 px-2.5 rounded-lg bg-[#F7931A] text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                            >
                              <Send size={11} />
                              <span>Reenviar PIN por Chat P2P</span>
                            </button>

                            {/* Botón 2: Contactar Soporte Comunitario */}
                            <button
                              type="button"
                              onClick={contactCommunitySupport}
                              className={`py-1 px-2.5 rounded-lg border font-bold text-[10px] flex items-center gap-1 active:scale-95 transition-all ${
                                isDark ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                              }`}
                            >
                              <ShieldCheck size={11} />
                              <span>Contactar Soporte Comunitario</span>
                            </button>

                            {/* Reintentar Tipeo */}
                            <button
                              type="button"
                              onClick={resetPinAttempts}
                              className="py-1 px-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-semibold active:scale-95 transition-all"
                            >
                              Desbloquear y Reintentar
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Caso B: Campo de Entrada Activo */
                        <form onSubmit={handleVerifyPinSubmit} className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              maxLength={4}
                              value={cadetePinInput}
                              onChange={(e) => setCadetePinInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="PIN 4 dígitos"
                              className={`w-28 px-2.5 py-1.5 rounded-xl text-xs font-mono font-black tracking-widest text-center border focus:outline-none focus:border-[#F7931A] ${
                                pinFailedAttempts > 0
                                  ? 'border-rose-500 bg-rose-950/20 text-rose-300'
                                  : isDark ? 'bg-[#070C1E] border-[#1F2D48] text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                            <button
                              type="submit"
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-glow-green active:scale-95 transition-all"
                            >
                              Validar Entrega
                            </button>
                          </div>

                          {pinFailedAttempts > 0 && (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30">
                              Fallido ({pinFailedAttempts}/3)
                            </span>
                          )}
                        </form>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            <div className={`border rounded-xl p-2.5 text-center text-[11px] max-w-sm mx-auto ${
              isDark ? 'bg-[#121B2D] border-[#1F2D48] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center justify-center space-x-1 text-[#F7931A] font-medium mb-0.5">
                <Lock className="w-3 h-3 inline" />
                <span>Canal P2P Soberano • Alta Gracia, Córdoba</span>
              </div>
              <span>
                Conexión directa acordada. Acuerdos en efectivo se pagan contra entrega al validar el PIN.
              </span>
            </div>

            {chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';

              if (msg.type === 'cash_agreement') {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className={`border-2 rounded-2xl p-3.5 max-w-xs w-full shadow-xl ${
                      isDark ? 'bg-[#0A2218] border-emerald-500/70' : 'bg-emerald-50 border-emerald-400'
                    }`}>
                      <div className="flex items-center space-x-2 text-emerald-400 mb-1.5">
                        <DollarSign className="w-4 h-4 stroke-[3]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                          Acuerdo P2P en Efectivo
                        </span>
                      </div>
                      <div className={`text-base font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {msg.amount || '$1.500 ARS'}
                      </div>
                      <p className={`text-[11px] mt-1 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        "{msg.note}"
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-emerald-500/30 flex items-center justify-between text-[10px] text-emerald-500 font-medium">
                        <span>💵 Pago contra entrega con PIN</span>
                        <span className="font-mono">{msg.timestamp}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (msg.type === 'valens_tip') {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className={`border-2 rounded-2xl p-3.5 max-w-xs w-full shadow-xl ${
                      isDark ? 'bg-[#241A0B] border-[#F7931A]/70' : 'bg-amber-50 border-amber-400'
                    }`}>
                      <div className="flex items-center space-x-2 text-[#F7931A] mb-1.5">
                        <Zap className="w-4 h-4 fill-[#F7931A]" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Propina ValensCoin On-Chain
                        </span>
                      </div>
                      <div className="text-lg font-black font-mono text-[#F0B90B]">
                        {msg.amount}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                        Hash: {msg.txHash}
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-[#F7931A]/30 flex items-center justify-between text-[10px] text-[#F0B90B]">
                        <span>✓ Liquidado en Layer 1</span>
                        <span className="font-mono">{msg.timestamp}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (msg.type === 'delivery_completed') {
                return (
                  <div key={msg.id} className="flex justify-center my-2 animate-fadeIn">
                    <div className={`border-2 rounded-2xl p-3.5 max-w-xs w-full shadow-xl text-center ${
                      isDark ? 'bg-[#0A2218] border-emerald-500/80 shadow-glow-green' : 'bg-emerald-50 border-emerald-400'
                    }`}>
                      <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5 border border-emerald-500/40">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block">
                        ¡Entrega Verificada & Cashback P2P!
                      </span>
                      <div className="text-xl font-black font-mono text-[#F0B90B] mt-1">
                        +{msg.rewardAmount || 1.0} VALENS
                      </div>
                      <p className={`text-[11px] mt-1 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {msg.text}
                      </p>
                      {msg.txHash && (
                        <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                          Hash: {msg.txHash}
                        </div>
                      )}
                      <div className="mt-2.5 pt-2 border-t border-emerald-500/30 flex items-center justify-between text-[10px] text-emerald-400 font-medium">
                        <span>💵 Pago físico verificado con PIN</span>
                        <span className="font-mono">{msg.timestamp}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (msg.type === 'pin_reminder') {
                return (
                  <div key={msg.id} className="flex justify-center my-2 animate-fadeIn">
                    <div className={`border rounded-2xl p-3 max-w-xs w-full text-center ${
                      isDark ? 'bg-[#1F180B] border-amber-500/60 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-950'
                    }`}>
                      <div className="flex items-center justify-center gap-1.5 font-bold text-xs text-[#F7931A] mb-1">
                        <Key size={14} />
                        <span>Recordatorio de PIN Antifraude</span>
                      </div>
                      <p className="text-[11px] leading-snug">{msg.text}</p>
                      <span className="text-[9px] opacity-75 font-mono mt-1.5 block">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              }

              if (msg.type === 'whatsapp_shared') {
                return (
                  <div key={msg.id} className="flex justify-center my-2 animate-fadeIn">
                    <div className={`border-2 rounded-2xl p-3.5 max-w-xs w-full shadow-xl ${
                      isDark ? 'bg-[#0B1E17] border-[#25D366]/70 shadow-glow-green' : 'bg-emerald-50 border-emerald-400'
                    }`}>
                      <div className="flex items-center space-x-2 text-[#25D366] mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-[#25D366]/20 flex items-center justify-center font-bold text-xs">
                          📱
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          WhatsApp Compartido
                        </span>
                      </div>
                      
                      <div className={`text-xs font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {msg.senderName}
                      </div>

                      <p className={`text-[11px] leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        "{msg.text}"
                      </p>

                      {msg.phone && (
                        <div className="mt-2.5 pt-2 border-t border-emerald-500/30">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-[10px] text-slate-400 font-semibold">Número verificado:</span>
                            <span className="font-mono font-bold text-[#25D366]">{msg.phone}</span>
                          </div>
                          
                          <a
                            href={getSocialLink('whatsapp', msg.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
                          >
                            <span>💬 Abrir Chat en WhatsApp</span>
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      )}

                      <div className="mt-2 pt-1.5 border-t border-emerald-500/20 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                        <span>✓ Consentimiento mutuo P2P</span>
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-md ${
                      isUser
                        ? 'bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black font-medium rounded-br-xs'
                        : isDark
                        ? 'bg-[#121B2D] text-white border border-[#1F2D48] rounded-bl-xs'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                    }`}
                  >
                    {!isUser && (
                      <p className="text-[10px] font-bold text-[#F7931A] mb-1">
                        {msg.senderName || currentPeer.name}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <div
                      className={`flex items-center justify-end space-x-1 mt-1 text-[9px] ${
                        isUser ? 'text-black/75' : isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isUser && <CheckCheck className="w-3 h-3 inline stroke-[2]" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={handleSend}
            className={`border-t p-2.5 flex items-center space-x-2 flex-shrink-0 ${
              isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-white border-slate-200'
            }`}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Escribe a ${currentPeer.name} en Alta Gracia...`}
              className={`flex-1 border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#F7931A] transition-all ${
                isDark
                  ? 'bg-[#070C1E] border-[#1F2D48] text-white placeholder-slate-500'
                  : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-xl transition-all ${
                inputText.trim()
                  ? 'bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black shadow-glow-orange cursor-pointer hover:scale-105 active:scale-95'
                  : isDark
                  ? 'bg-[#1F2D48] text-gray-500 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4 stroke-[2.2]" />
            </button>
          </form>
        </>
      )}

      {/* MODAL: Bloquear Usuario */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl border max-w-xs w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#121B2D] border-rose-500/50 text-white' : 'bg-white border-rose-300 text-slate-900'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-2">
              <ShieldAlert size={22} />
            </div>
            <h3 className="text-sm font-bold text-center">¿Bloquear a {currentPeer.name}?</h3>
            <p className={`text-xs text-center mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Este usuario ya no aparecerá en el mapa de Alta Gracia y no podrá enviarte propuestas ni mensajes. Podrás desbloquearlo desde tu Perfil.
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm active:scale-95"
              >
                Bloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Calculadora de Tarifa Justa */}
      {showCalculatorModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className={`border rounded-2xl max-w-sm w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#121B2D] border-[#1F2D48] text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <button
              onClick={() => setShowCalculatorModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 text-[#F7931A] mb-3">
              <Calculator className="w-5 h-5" />
              <h3 className="text-sm font-bold">Calculadora de Tarifa Justa P2P</h3>
            </div>

            <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Compara cuánto cobra una plataforma corporativa frente a un acuerdo P2P soberano en Alta Gracia:
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Simular Tarifa de Entrega:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[2000, 3500, 5000, 7500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCalculatorFee(val)}
                    className={`py-1.5 px-1 rounded-xl text-xs font-mono font-bold transition-all ${
                      calculatorFee === val
                        ? 'bg-[#F7931A] text-black shadow-glow-orange'
                        : isDark
                        ? 'bg-[#070C1E] border border-[#1F2D48] text-slate-300'
                        : 'bg-slate-100 border border-slate-200 text-slate-700'
                    }`}
                  >
                    ${val.toLocaleString('es-AR')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 my-3">
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#2D0A11]/60 border-rose-500/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span>❌ App Tradicional Centralizada:</span>
                  <span className="font-mono text-sm">${traditionalFee.toLocaleString('es-AR')} ARS</span>
                </div>
                <p className="text-[10px] opacity-80 leading-tight">
                  Tarifa inflada con cargos ocultos y comisiones bancarias del 30% al 45%. El cadete cobra solo una fracción.
                </p>
              </div>

              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#0A2218] border-emerald-500/60 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span>⚡ Trato P2P Directo en Gremami:</span>
                  <span className="font-mono text-base font-black text-emerald-400">
                    ${calculatorFee.toLocaleString('es-AR')} ARS
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold mt-1 text-emerald-400">
                  <span>Ahorro Inmediato:</span>
                  <span className="font-mono">+${customerSavings.toLocaleString('es-AR')} ARS ({savingsPercent}%)</span>
                </div>
                <p className="text-[10px] opacity-80 leading-tight mt-1">
                  El 100% va directo al bolsillo del cadete en efectivo o ValensCoin. Cero intermediarios en Alta Gracia.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCalculatorModal(false);
                setShowCashModal(true);
              }}
              className="w-full min-h-[44px] mt-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-xs font-bold shadow-glow-green active:scale-95"
            >
              Acordar Esta Tarifa Justa (${calculatorFee.toLocaleString('es-AR')} ARS)
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Acordar Pago en Efectivo */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className={`border rounded-2xl max-w-sm w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#121B2D] border-[#1F2D48] text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <button
              onClick={() => setShowCashModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5 text-emerald-400 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Acuerdo de Pago P2P</h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Entrega en Alta Gracia sin intermediarios</p>
              </div>
            </div>

            <div className="space-y-3.5 my-4">
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#070C1E] border-[#1F2D48]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between items-center text-xs">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Tarifa fija acordada:</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono">
                    ${calculatorFee.toLocaleString('es-AR')} ARS
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] mt-1">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Receptor:</span>
                  <span className="font-semibold">{currentPeer.name}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] mt-1">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Seguridad:</span>
                  <span className="text-amber-500 font-bold font-mono">PIN {orderPin} en mano</span>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                  Descripción de la entrega:
                </label>
                <input
                  type="text"
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  placeholder="Ej. Sobre urgente, compras, comida..."
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-[#070C1E] border-[#1F2D48] text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowCashModal(false)}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-800 text-gray-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmCashAgreement}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-xs font-bold shadow-glow-green"
              >
                Confirmar Acuerdo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Propina ValensCoin QR */}
      {showQrTipModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className={`border rounded-2xl max-w-sm w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#121B2D] border-[#1F2D48] text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <button
              onClick={() => setShowQrTipModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5 text-[#F7931A] mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#F7931A]/20 border border-[#F7931A]/40 flex items-center justify-center shadow-glow-orange">
                <Zap className="w-5 h-5 text-[#F7931A] fill-[#F7931A]" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Transferir ValensCoin</h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Micropago Testnet de Agradecimiento</p>
              </div>
            </div>

            <div className="my-3 flex flex-col items-center">
              <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-[#F7931A]">
                <svg width="140" height="140" viewBox="0 0 100 100" className="w-32 h-32">
                  <rect x="5" y="5" width="26" height="26" fill="#0A1128" rx="4" />
                  <rect x="9" y="9" width="18" height="18" fill="white" rx="2" />
                  <rect x="13" y="13" width="10" height="10" fill="#0A1128" rx="1" />
                  <rect x="69" y="5" width="26" height="26" fill="#0A1128" rx="4" />
                  <rect x="73" y="9" width="18" height="18" fill="white" rx="2" />
                  <rect x="77" y="13" width="10" height="10" fill="#0A1128" rx="1" />
                  <rect x="5" y="69" width="26" height="26" fill="#0A1128" rx="4" />
                  <rect x="9" y="73" width="18" height="18" fill="white" rx="2" />
                  <rect x="13" y="77" width="10" height="10" fill="#0A1128" rx="1" />
                  <rect x="36" y="8" width="8" height="8" fill="#0A1128" />
                  <rect x="48" y="14" width="8" height="8" fill="#0A1128" />
                  <rect x="36" y="24" width="12" height="6" fill="#0A1128" />
                  <rect x="54" y="24" width="8" height="12" fill="#0A1128" />
                  <rect x="8" y="38" width="6" height="12" fill="#0A1128" />
                  <rect x="20" y="42" width="14" height="6" fill="#0A1128" />
                  <rect x="38" y="38" width="12" height="12" fill="#0A1128" />
                  <rect x="56" y="42" width="10" height="8" fill="#0A1128" />
                  <rect x="74" y="38" width="18" height="6" fill="#0A1128" />
                  <circle cx="50" cy="50" r="14" fill="#F7931A" stroke="#FFFFFF" strokeWidth="2" />
                  <text x="50" y="55" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    ₿
                  </text>
                </svg>
              </div>
              <span className={`text-[10px] font-mono mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {currentPeer.address?.slice(0, 16)}...{currentPeer.address?.slice(-6)}
              </span>
            </div>

            <div className={`p-3 rounded-xl border my-3 ${
              isDark ? 'bg-[#070C1E] border-[#1F2D48]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center text-xs">
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Monto de propina:</span>
                <span className="text-base font-extrabold text-[#F0B90B] font-mono">1.00 VALENS</span>
              </div>
              <div className="flex justify-between items-center text-[11px] mt-1">
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Tu saldo disponible:</span>
                <span className="font-mono font-semibold text-emerald-500">{balance.toFixed(2)} VAL</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowQrTipModal(false)}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-800 text-gray-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={balance < 1.0}
                onClick={confirmQrTip}
                className={`flex-1 min-h-[44px] py-2.5 rounded-xl text-xs font-bold transition-all shadow-glow-orange flex items-center justify-center space-x-1.5 ${
                  balance >= 1.0
                    ? 'bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black active:scale-[0.98]'
                    : 'bg-slate-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>Enviar 1 VAL</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Denunciar Usuario desde el Chat (100% Sólido sin transparencias) */}
      {showReportChatModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl border max-w-sm w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#0B132B] border-amber-500/50 text-white' : 'bg-white border-amber-300 text-slate-900'
          }`}>
            <button
              onClick={() => setShowReportChatModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <AlertTriangle size={20} />
              <h3 className="text-sm font-bold">Denunciar a {currentPeer.name}</h3>
            </div>
            <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Este reporte se registrará en la red y actualizará su reputación a Advertencia (🟡).
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                reportPeer(currentPeer.id, { reason: reportChatReason, details: 'Reportado desde la sala de chat' });
                setShowReportChatModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-400">Motivo del reporte:</label>
                <select
                  value={reportChatReason}
                  onChange={(e) => setReportChatReason(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-medium ${
                    isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Cobro engañoso / Sobreprecio indebido">Cobro engañoso / Sobreprecio indebido</option>
                  <option value="Incumplimiento de entrega / Paquete dañado">Incumplimiento de entrega / Paquete dañado</option>
                  <option value="Conducta inapropiada / Falta de respeto">Conducta inapropiada / Falta de respeto</option>
                  <option value="Perfil o vehículo falso">Perfil o vehículo falso</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportChatModal(false)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 font-bold text-xs shadow-md active:scale-95"
                >
                  Confirmar Denuncia (🟡)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal de Celebración e Impacto Visual (Dopamina P2P) */}
      <CelebrationModal
        isOpen={Boolean(celebrationData?.open)}
        onClose={closeCelebrationModal}
        rewardAmount={celebrationData?.rewardAmount || 1.0}
        peerName={celebrationData?.peerName || currentPeer?.name}
        isCadete={role === 'cadete'}
        txHash={celebrationData?.txHash}
        isDark={isDark}
        balance={balance}
        onGoToDex={() => setActiveTab('dex')}
      />
    </div>
  );
}
