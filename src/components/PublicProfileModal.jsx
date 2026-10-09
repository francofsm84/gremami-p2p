import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Star,
  Copy,
  Check,
  MessageSquare,
  Zap,
  ShieldCheck,
  MapPin,
  Bike,
  Coins,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  Award,
  UserCheck
} from 'lucide-react';

export default function PublicProfileModal({ user, isOpen, onClose }) {
  const {
    theme,
    startChatWithPeer,
    transferTokens,
    balance,
    showToast
  } = useApp();

  const isDark = theme === 'dark';

  const [copiedAddr, setCopiedAddr] = useState(false);
  const [showTransferBox, setShowTransferBox] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  if (!isOpen || !user) return null;

  const userAddress = user.address || `valens1q${(user.id || 'p2p').slice(0, 12)}network`;
  const truncatedAddress = userAddress.length > 20
    ? `${userAddress.slice(0, 10)}...${userAddress.slice(-8)}`
    : userAddress;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(userAddress);
    setCopiedAddr(true);
    showToast('📋 Dirección ValensCoin copiada', 'success');
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleStartChat = () => {
    // Adaptar usuario para startChatWithPeer
    const peerData = {
      id: user.id || `peer-${Date.now()}`,
      name: user.name || 'Usuario P2P',
      role: user.roleLabel || user.role || 'Cadete P2P',
      avatar: user.avatar,
      isOnline: Boolean(user.isOnline),
      address: userAddress,
      rating: user.rating || 4.95,
      vehicle: user.vehicle,
      locality: user.coverageZone || 'Alta Gracia'
    };
    startChatWithPeer(peerData);
    onClose();
  };

  const handleExecuteTransfer = async () => {
    const intAmount = Math.floor(Number(transferAmount));
    if (intAmount <= 0) {
      showToast('❌ El monto debe ser un entero mayor a 0 VAL.', 'error');
      return;
    }
    if (Math.floor(balance) < intAmount) {
      showToast(`❌ Saldo insuficiente (${Math.floor(balance)} VAL disponibles).`, 'error');
      return;
    }

    setIsTransferring(true);
    try {
      const res = await transferTokens(userAddress, intAmount);
      if (res?.success) {
        setShowTransferBox(false);
        setTransferAmount('');
      }
    } finally {
      setIsTransferring(false);
    }
  };

  const reviewsList = user.reviews || [
    {
      id: 'rev-def-1',
      author: 'Comunidad P2P',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      stars: 5,
      date: 'Recientemente',
      comment: 'Miembro activo y verificado en la red descentralizada de Alta Gracia.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className={`border rounded-2xl max-w-md w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
        isDark ? 'bg-[#0A1128] border-[#1F2D48] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        {/* Banner Superior con Avatar y Controles */}
        <div className="relative p-5 pb-3 border-b border-inherit bg-gradient-to-br from-[#121B2D] via-[#0A1128] to-[#16223D] text-white">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-xl border border-white/20 bg-black/40 text-slate-300 hover:text-white transition-all active:scale-95"
            title="Cerrar perfil"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Identidad */}
          <div className="flex items-start space-x-3.5">
            <div className="relative">
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#F7931A] shadow-glow-orange"
              />
              {user.isOnline ? (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0A1128] shadow-xs" title="En línea" />
              ) : (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-500 border-2 border-[#0A1128]" title="Desconectado" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black truncate">{user.name}</h2>
                <ShieldCheck className="w-4 h-4 text-[#F7931A] flex-shrink-0" />
              </div>
              <p className="text-xs font-mono text-[#F0B90B] font-semibold">
                @{user.username || user.name?.toLowerCase().replace(/[^a-z0-9]/g, '')}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F7931A]/20 text-[#F0B90B] border border-[#F7931A]/40">
                  {user.roleLabel || user.role || 'Miembro P2P'}
                </span>
                {user.coverageZone && (
                  <span className="text-[10px] font-medium text-slate-300 flex items-center gap-0.5 truncate max-w-[180px]">
                    <MapPin className="w-3 h-3 text-[#F7931A]" />
                    {user.coverageZone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cuerpo del Perfil */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* Bio o Descripción */}
          {user.bio && (
            <p className={`text-xs leading-relaxed italic ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              "{user.bio}"
            </p>
          )}

          {/* Métricas y Reputación */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`p-2.5 rounded-xl border text-center ${
              isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-center space-x-1 text-[#F0B90B] mb-0.5">
                <Star className="w-3.5 h-3.5 fill-[#F0B90B]" />
                <span className="text-sm font-black font-mono">{(user.rating || 4.95).toFixed(1)}</span>
              </div>
              <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Calificación</p>
            </div>

            <div className={`p-2.5 rounded-xl border text-center ${
              isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-slate-50 border-slate-200'
            }`}>
              <p className="text-sm font-black font-mono text-emerald-400 mb-0.5">
                {user.completedAgreements || 25}
              </p>
              <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Acuerdos P2P</p>
            </div>

            <div className={`p-2.5 rounded-xl border text-center ${
              isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-slate-50 border-slate-200'
            }`}>
              <p className="text-sm font-black font-mono text-[#F7931A] mb-0.5">
                {user.reviewsCount || reviewsList.length}
              </p>
              <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Reseñas</p>
            </div>
          </div>

          {/* Billetera ValensCoin L1 */}
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
            isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-amber-50/70 border-amber-200/80'
          }`}>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 mb-0.5">
                <Coins className="w-3.5 h-3.5 text-[#F7931A]" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Billetera ValensCoin L1</span>
              </div>
              <p className="text-xs font-mono font-bold text-[#F0B90B] truncate">
                {truncatedAddress}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyAddress}
              className={`p-2 rounded-xl border font-bold text-xs flex items-center gap-1 transition-all active:scale-95 flex-shrink-0 ${
                isDark
                  ? 'bg-[#1A253D] border-[#2D3E61] text-slate-200 hover:text-white'
                  : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
              }`}
              title="Copiar dirección de billetera"
            >
              {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#F7931A]" />}
              <span className="text-[10px]">{copiedAddr ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          {/* Badges / Especialidades */}
          {user.badges && user.badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {user.badges.map((b, i) => (
                <span
                  key={i}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                    isDark ? 'bg-[#1A253D] border-[#2D3E61] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  ✓ {b}
                </span>
              ))}
            </div>
          )}

          {/* Subpanel de Transferencia Rápida */}
          {showTransferBox && (
            <div className={`p-3.5 rounded-xl border space-y-2.5 animate-fadeIn ${
              isDark ? 'bg-[#070C1E] border-[#F7931A]/40' : 'bg-amber-50 border-amber-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#F7931A]">
                  <Zap className="w-4 h-4 fill-[#F7931A]" />
                  <span>Transferir ValensCoin a {user.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTransferBox(false)}
                  className="text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-[10.5px] font-bold block mb-1">
                  Monto a enviar (VAL enteros):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="ej. 5"
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-mono font-bold border focus:outline-none focus:border-[#F7931A] ${
                      isDark ? 'bg-[#121B2D] border-[#1F2D48] text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <div className="flex gap-1">
                    {[1, 5, 10].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTransferAmount(String(amt))}
                        className={`text-[10px] px-2 py-2 rounded-xl border font-mono font-bold active:scale-95 ${
                          isDark ? 'bg-[#1A253D] border-[#2D3E61] text-[#F0B90B]' : 'bg-white border-slate-300 text-amber-800'
                        }`}
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Disponible: {Math.floor(balance)} VAL</span>
                  {transferAmount && parseInt(transferAmount) > 0 && (
                    <span className="font-mono text-[#F0B90B]">
                      ≈ ${(parseInt(transferAmount) * 2).toFixed(0)} USD
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={isTransferring || !transferAmount || parseInt(transferAmount) <= 0 || parseInt(transferAmount) > Math.floor(balance)}
                onClick={handleExecuteTransfer}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black font-black text-xs shadow-glow-orange hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTransferring ? 'Enviando tokens...' : `Confirmar envío de ${transferAmount || 0} VAL`}</span>
              </button>
            </div>
          )}

          {/* Reseñas y Comentarios Comunitarios */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Reseñas Recíprocas ({reviewsList.length})
              </h3>
              <span className="text-[10px] font-mono text-[#F0B90B] flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-[#F0B90B]" /> 100% Positivas
              </span>
            </div>

            <div className="space-y-2">
              {reviewsList.map((rev) => (
                <div
                  key={rev.id}
                  className={`p-3 rounded-xl border space-y-1 ${
                    isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img
                        src={rev.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                        alt={rev.author}
                        className="w-5 h-5 rounded-full object-cover border border-amber-400/40"
                      />
                      <span className="text-xs font-bold">{rev.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="flex">
                        {[...Array(rev.stars || 5)].map((_, idx) => (
                          <Star key={idx} className="w-2.5 h-2.5 fill-[#F0B90B] text-[#F0B90B]" />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono ml-1">{rev.date}</span>
                    </div>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Barra de Acciones Fijas Inferiores */}
        <div className={`p-3.5 border-t grid grid-cols-2 gap-2.5 ${
          isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={handleStartChat}
            className="min-h-[44px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Iniciar Chat P2P</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTransferBox(!showTransferBox)}
            className="min-h-[44px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black font-black text-xs shadow-glow-orange hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Zap className="w-4 h-4 fill-black" />
            <span>Transferir VAL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
