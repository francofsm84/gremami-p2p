import React, { useEffect, useMemo } from 'react';
import { Sparkles, CheckCircle2, TrendingUp, X, Wallet, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { playCelebrationSound } from '../utils/audioAlert';

export default function CelebrationModal({
  isOpen,
  onClose,
  rewardAmount = 1.0,
  peerName = 'Cadete / Comercio',
  isCadete = false,
  txHash = '0xcb84a9...12f4',
  isDark = true,
  balance = 10.0,
  onGoToDex
}) {
  useEffect(() => {
    if (isOpen) {
      playCelebrationSound();
    }
  }, [isOpen]);

  // Generate falling coin particles with randomized trajectories and timings
  const coins = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: Math.floor(Math.random() * 92) + 4, // 4% to 96%
      delay: (Math.random() * 1.8).toFixed(2),  // 0s to 1.8s
      duration: (1.6 + Math.random() * 1.6).toFixed(2), // 1.6s to 3.2s
      size: Math.floor(Math.random() * 16) + 20, // 20px to 36px
      rot: Math.floor(Math.random() * 720) - 360
    }));
  }, [isOpen]);

  if (!isOpen) return null;

  const isLowBalance = isCadete && balance < 1.0;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-fadeIn overflow-hidden">
      {/* 1. Lluvia de Monedas de Oro Animadas (Dopamina P2P) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {coins.map((coin) => (
          <div
            key={coin.id}
            style={{
              left: `${coin.left}%`,
              animationDelay: `${coin.delay}s`,
              animationDuration: `${coin.duration}s`,
              fontSize: `${coin.size}px`
            }}
            className="absolute -top-12 animate-coinFall select-none filter drop-shadow-[0_4px_8px_rgba(247,147,26,0.6)]"
          >
            🪙
          </div>
        ))}
      </div>

      {/* 2. Contenedor de la Modal 100% Opaca (sin transparencias ilegibles) */}
      <div className={`relative max-w-sm w-full max-h-[90dvh] overflow-y-auto rounded-3xl border-2 p-5 shadow-2xl z-10 transition-colors animate-in zoom-in-95 duration-200 ${
        isDark
          ? 'bg-[#0B132B] border-[#F7931A] text-white shadow-[0_0_60px_rgba(247,147,26,0.35)]'
          : 'bg-white border-amber-400 text-slate-900 shadow-[0_0_50px_rgba(245,158,11,0.25)]'
      }`}>
        {/* Botón de Cierre */}
        <button
          onClick={onClose}
          className={`absolute top-3.5 right-3.5 p-1.5 rounded-full transition-colors ${
            isDark ? 'text-slate-400 hover:text-white bg-slate-800/80' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
          title="Cerrar modal"
        >
          <X size={16} />
        </button>

        {/* Emblema Central Festivo */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-[#E02424] via-[#F7931A] to-[#F0B90B] p-1 shadow-glow-orange flex items-center justify-center animate-bounce">
            <span className="text-3xl select-none">🪙</span>
          </div>

          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
            <CheckCircle2 size={14} />
            <span>Validación PIN Exitosa</span>
          </div>

          {/* Título y Mensaje Dopamina P2P */}
          <h2 className={`text-lg font-black tracking-tight mt-2.5 leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
            ¡Pedido completado con éxito!
          </h2>

          <p className={`text-xs mt-1 leading-relaxed px-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {isCadete ? (
              <>Has confirmado la entrega física y transferido <strong>{rewardAmount} ValensCoin</strong> de cashback a tu cliente.</>
            ) : (
              <>Has recibido <strong>{rewardAmount} ValensCoin</strong> de <span className="text-[#F7931A] font-bold">{peerName}</span> como recompensa de fidelización.</>
            )}
          </p>

          {/* Placa de Recompensa Destacada */}
          <div className={`mt-3.5 p-3 rounded-2xl border ${
            isDark ? 'bg-[#070C1E] border-slate-700/80' : 'bg-amber-50 border-amber-300'
          }`}>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#F7931A] block">
              Recompensa P2P Acreditada
            </span>
            <div className="text-2xl font-black font-mono text-[#F0B90B] mt-0.5">
              +{rewardAmount.toFixed(1)} VALENS
            </div>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              💵 Pago local en dinero físico (ARS) entregado en mano al validar el PIN.
            </p>
          </div>

          {/* Detalles On-Chain de la Transacción */}
          <div className={`mt-2.5 p-2 rounded-xl border text-[10px] font-mono text-left space-y-0.5 ${
            isDark ? 'bg-[#070C1E]/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            <div className="flex justify-between items-center">
              <span>Red: Valens Testnet Layer 1</span>
              <span className="text-emerald-400 font-bold">Bloque #840,135</span>
            </div>
            <div className="truncate text-[9px] text-[#F7931A]">
              Hash: {txHash}
            </div>
          </div>

          {/* Alerta de Saldo Bajo si es Cadete (< 1 VALENS) */}
          {isLowBalance && (
            <div className={`mt-3 p-2.5 rounded-xl border text-left text-xs ${
              isDark ? 'bg-amber-950/40 border-amber-500/60 text-amber-300' : 'bg-amber-50 border-amber-400 text-amber-950'
            }`}>
              <p className="font-bold text-[11px] flex items-center gap-1">
                ⚠️ Alerta de Saldo para Cadetes:
              </p>
              <p className="text-[10px] mt-0.5 leading-snug">
                Tu saldo restante es de <strong>{balance.toFixed(2)} VALENS</strong> (inferior al mínimo de 1.0 VAL para operar en el radar).
              </p>
              {onGoToDex && (
                <button
                  onClick={() => {
                    onClose();
                    onGoToDex();
                  }}
                  className="mt-2 w-full min-h-[44px] py-2 px-2 rounded-lg bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
                >
                  <TrendingUp size={13} />
                  <span>Ir al Mercado DEX para Recargar / Solicitar Donación</span>
                </button>
              )}
            </div>
          )}

          {/* Botón Principal de Continuar */}
          <button
            onClick={onClose}
            className="mt-4 w-full min-h-[44px] py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-glow-green flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span>¡Excelente! Continuar en la App</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
