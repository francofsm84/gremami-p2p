import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Gift,
  ShoppingCart,
  Coins,
  ArrowRight,
  ChevronLeft,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Clock,
  User,
  X,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  DollarSign
} from 'lucide-react';

export default function DexScreen() {
  const {
    dexOrders,
    createDexOrder,
    donateValens,
    fulfillDexTrade,
    balance,
    requestFaucet,
    showToast,
    theme,
    role,
    userName,
    startChatWithPeer,
    peers,
    setActiveTab,
    goBack
  } = useApp();

  const isDark = theme === 'dark';
  const hasMinBalance = balance >= 1.0;

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'donation_request' | 'sell' | 'buy'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(null); // order object
  const [showTradeModal, setShowTradeModal] = useState(null); // order object

  // Form states for new order
  const [orderType, setOrderType] = useState('donation_request');
  const [orderAmount, setOrderAmount] = useState(1.0);
  const [orderUnitPrice, setOrderUnitPrice] = useState(1200);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState('Solidaridad P2P');
  const [orderDescription, setOrderDescription] = useState('');

  // Filter orders
  const filteredOrders = dexOrders.filter((order) => {
    if (activeFilter === 'all') return true;
    return order.type === activeFilter;
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!orderDescription.trim()) {
      showToast('⚠️ Ingresa una breve descripción para tu orden', 'warning');
      return;
    }

    createDexOrder({
      type: orderType,
      amountValens: orderAmount,
      unitPriceArs: orderType === 'donation_request' ? 0 : orderUnitPrice,
      paymentMethod: orderPaymentMethod,
      description: orderDescription
    });

    setShowCreateModal(false);
    setOrderDescription('');
  };

  const handleConfirmDonation = () => {
    if (showDonateModal) {
      donateValens(showDonateModal.id, showDonateModal.amountValens || 1.0);
      setShowDonateModal(null);
    }
  };

  const handleConfirmTrade = () => {
    if (showTradeModal) {
      fulfillDexTrade(showTradeModal.id);
      setShowTradeModal(null);
    }
  };

  const handleChatWithOrderUser = (order) => {
    // Find matching peer or create simulated peer
    const matchedPeer = peers.find((p) => p.name.toLowerCase().includes(order.userName.toLowerCase())) || peers[0];
    startChatWithPeer(matchedPeer);
  };

  return (
    <div className={`w-full min-h-[calc(100vh-130px)] p-4 pb-10 space-y-4 max-w-lg mx-auto animate-fadeIn transition-colors duration-200 ${
      isDark ? 'bg-[#0A1128] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* Mini header de navegación con botón de regreso */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => goBack ? goBack() : setActiveTab('home')}
          className={`flex items-center space-x-1.5 text-xs transition-colors ${
            isDark ? 'text-[#8C9BB4] hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ChevronLeft size={16} />
          <span>Volver</span>
        </button>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border ${
          isDark ? 'text-[#F0B90B] bg-[#121B2D] border-[#1F2D48]' : 'text-amber-700 bg-amber-50 border-amber-200 font-bold'
        }`}>
          Mercado DEX
        </span>
      </div>

      {/* 1. Header Banner */}
      <div className={`relative rounded-2xl border p-4 shadow-xl overflow-hidden transition-colors ${
        isDark
          ? 'bg-gradient-to-br from-[#121B2D] via-[#101726] to-[#0A1128] border-[#1F2D48]'
          : 'bg-gradient-to-br from-white via-slate-50 to-amber-50/50 border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              isDark
                ? 'bg-gradient-to-r from-[#F7931A]/20 to-[#E02424]/20 text-[#F0B90B] border-[#F7931A]/30'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              📈 Mercado P2P DEX
            </span>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
            isDark ? 'bg-[#070C1E] border-slate-700 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
          }`}>
            Libro Abierto Sin Intermediarios
          </span>
        </div>

        <h2 className={`text-lg font-black tracking-tight leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Donaciones e Intercambio de ValensCoin
        </h2>
        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Comunidades autónomas en Alta Gracia. Si un cadete se queda en 0 VALENS, puede pedir auxilio mutuo o comprar tokens directamente a otros vecinos.
        </p>

        {/* 2. Regla Operativa de la Red */}
        <div className={`mt-3 p-3 rounded-xl border flex items-start space-x-2.5 text-xs ${
          hasMinBalance
            ? isDark
              ? 'bg-[#0A2218]/60 border-emerald-500/40 text-emerald-300'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : isDark
            ? 'bg-[#2D120B]/70 border-amber-500/50 text-amber-300'
            : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}>
          <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${hasMinBalance ? 'text-emerald-400' : 'text-amber-500'}`} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[11px] leading-tight">
              Regla Operativa: Requiere al menos 1.0 VALENS para visibilidad en el radar
            </p>
            <p className="text-[10px] mt-0.5 opacity-90">
              {hasMinBalance
                ? `Tu nodo cuenta con ${balance.toFixed(2)} VALENS. Tu señal GPS está activa y recibes pedidos en vivo.`
                : `⚠️ Saldo actual: ${balance.toFixed(2)} VALENS. Tu señal en el mapa está pausada. Publica una solicitud de donación o recarga con el Grifo.`}
            </p>
          </div>
          {!hasMinBalance && (
            <button
              onClick={requestFaucet}
              className="px-2 py-1 rounded-lg bg-[#F7931A] text-slate-950 font-bold text-[10px] shadow-sm flex-shrink-0"
            >
              +5 Grifo
            </button>
          )}
        </div>

        {/* Action Buttons Bar */}
        <div className="mt-3.5 pt-2.5 border-t flex items-center justify-between gap-2 border-slate-700/50">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Mi Saldo:</span>
            <span className="font-mono font-black text-[#F7931A]">{balance.toFixed(2)} VAL</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setOrderType('donation_request');
                setOrderAmount(1.0);
                setOrderUnitPrice(0);
                setOrderPaymentMethod('Solidaridad Comunitaria');
                setShowCreateModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F7931A] to-[#E07D09] hover:from-[#F0B90B] hover:to-[#F7931A] text-slate-950 font-bold text-xs shadow-md active:scale-95 flex items-center gap-1.5 transition-all"
            >
              <PlusCircle size={14} />
              <span>Publicar Orden DEX</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Filtros por Tipo de Orden */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: '🌟 Todas', count: dexOrders.length },
          { id: 'donation_request', label: '🎁 Donaciones / Ayuda', count: dexOrders.filter(o => o.type === 'donation_request').length },
          { id: 'sell', label: '🛒 Ofertas de Venta', count: dexOrders.filter(o => o.type === 'sell').length },
          { id: 'buy', label: '💰 Ofertas de Compra', count: dexOrders.filter(o => o.type === 'buy').length }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              activeFilter === f.id
                ? 'bg-[#F7931A] text-slate-950 border-amber-400 shadow-md font-bold'
                : isDark
                ? 'bg-[#121B2D] text-slate-300 hover:text-white border-slate-800'
                : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 shadow-xs'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* 4. Lista de Órdenes DEX */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className={`p-8 rounded-2xl border text-center ${
            isDark ? 'bg-[#121B2D] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
          }`}>
            <p className="text-sm font-semibold">No hay órdenes en esta categoría.</p>
            <p className="text-xs mt-1">Sé el primero en publicar una oferta o solicitud solidaria.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isDonation = order.type === 'donation_request';
            const isSell = order.type === 'sell';
            const isBuy = order.type === 'buy';
            const isCompleted = order.status === 'completed';

            return (
              <div
                key={order.id}
                className={`rounded-2xl border p-4 shadow-md transition-all relative overflow-hidden ${
                  isCompleted
                    ? isDark ? 'bg-[#0E1524] border-slate-800 opacity-60' : 'bg-slate-100 border-slate-200 opacity-60'
                    : isDonation
                    ? isDark ? 'bg-[#121B2D] border-emerald-500/40 hover:border-emerald-500' : 'bg-white border-emerald-300 hover:border-emerald-500'
                    : isSell
                    ? isDark ? 'bg-[#121B2D] border-amber-500/40 hover:border-amber-500' : 'bg-white border-amber-300 hover:border-amber-500'
                    : isDark ? 'bg-[#121B2D] border-cyan-500/40 hover:border-cyan-500' : 'bg-white border-cyan-300 hover:border-cyan-500'
                }`}
              >
                {/* Lateral accent strip */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                  isDonation ? 'bg-emerald-500' : isSell ? 'bg-[#F7931A]' : 'bg-cyan-500'
                }`} />

                <div className="pl-1">
                  {/* Top Bar of the Card */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isDonation ? (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-xs flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/60 ring-1 ring-emerald-500/30">
                          <span>🟢 Donación Solidaria</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-xs flex items-center gap-1 bg-blue-500/20 text-blue-400 border-blue-500/60 ring-1 ring-blue-500/30">
                          <span>🔵 Intercambio por Dinero Local (ARS)</span>
                        </span>
                      )}

                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        isDonation
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50'
                          : isSell
                          ? 'bg-amber-500/20 text-[#F7931A] border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      }`}>
                        {isDonation ? '🎁 Auxilio Mutuo' : isSell ? '🛒 Venta de Tokens' : '💰 Compra de Tokens'}
                      </span>

                      {order.urgency === 'alta' && (
                        <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/30 font-bold">
                          Urgente
                        </span>
                      )}
                    </div>

                    <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {order.timestamp}
                    </span>
                  </div>

                  {/* User info */}
                  <div className="flex items-center space-x-3 mt-2.5">
                    <img
                      src={order.userAvatar}
                      alt={order.userName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {order.userName}
                        </h4>
                        <div className="text-right">
                          <span className="text-sm font-black font-mono text-[#F7931A]">
                            {order.amountValens} VAL
                          </span>
                        </div>
                      </div>
                      <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {order.userRole}
                      </p>
                    </div>
                  </div>

                  {/* Order Description Message */}
                  <div className={`mt-2.5 p-2 rounded-xl text-xs leading-relaxed ${
                    isDark ? 'bg-[#070C1E] border border-slate-800 text-slate-300' : 'bg-slate-50 border border-slate-200 text-slate-700'
                  }`}>
                    <p className="italic text-[11px]">"{order.description}"</p>
                  </div>

                  {/* Pricing and Payment Details */}
                  <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-xs ${
                    isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                  }`}>
                    <div>
                      {isDonation ? (
                        <span className="text-[11px] font-bold text-emerald-500 font-mono">
                          Gratis (Solidaridad entre Pares)
                        </span>
                      ) : (
                        <div className="font-mono text-[11px]">
                          <span>Precio: <strong>${order.unitPriceArs?.toLocaleString('es-AR')} ARS/VAL</strong></span>
                          <span className="block text-[10px] text-slate-400">Total: ${order.priceArs?.toLocaleString('es-AR')} ARS</span>
                        </div>
                      )}
                      <span className="text-[10px] block text-slate-500 mt-0.5">
                        💳 {order.paymentMethod}
                      </span>
                    </div>

                    {/* Action button */}
                    <div>
                      {isCompleted ? (
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          Completada
                        </span>
                      ) : isDonation ? (
                        <button
                          onClick={() => setShowDonateModal(order)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md active:scale-95 flex items-center gap-1"
                        >
                          <Gift size={13} />
                          <span>Donar 1 VAL</span>
                        </button>
                      ) : isSell ? (
                        <button
                          onClick={() => setShowTradeModal(order)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F7931A] to-[#E07D09] hover:from-[#F0B90B] hover:to-[#F7931A] text-slate-950 font-black text-xs shadow-md active:scale-95 flex items-center gap-1"
                        >
                          <ShoppingCart size={13} />
                          <span>Comprar Tokens</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowTradeModal(order)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs shadow-md active:scale-95 flex items-center gap-1"
                        >
                          <Coins size={13} />
                          <span>Vender Tokens</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL: Publicar Nueva Orden DEX (100% Sólido sin transparencias) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl border max-w-sm w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#0B132B] border-[#1F2D48] text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
              title="Cerrar"
            >
              <X size={18} />
            </button>
            <button
              onClick={() => setShowCreateModal(false)}
              className={`flex items-center gap-1.5 text-xs font-semibold mb-3 transition-colors ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ChevronLeft size={15} />
              <span>Volver</span>
            </button>

            <div className="flex items-center gap-2 text-[#F7931A] mb-2">
              <TrendingUp size={20} />
              <h3 className="text-sm font-bold">Publicar en el Mercado DEX</h3>
            </div>
            <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Libro abierto descentralizado para toda la red de Alta Gracia:
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              {/* Selector de Tipo */}
              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-400">Tipo de operación:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'donation_request', label: '🎁 Donación' },
                    { id: 'sell', label: '🛒 Venta' },
                    { id: 'buy', label: '💰 Compra' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setOrderType(t.id);
                        if (t.id === 'donation_request') {
                          setOrderAmount(1.0);
                          setOrderPaymentMethod('Solidaridad Comunitaria');
                        } else if (t.id === 'sell') {
                          setOrderUnitPrice(1200);
                          setOrderPaymentMethod('Mercado Pago / Efectivo');
                        } else {
                          setOrderUnitPrice(1000);
                          setOrderPaymentMethod('Efectivo en Mano / MP');
                        }
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        orderType === t.id
                          ? 'bg-[#F7931A] text-slate-950 border-amber-400 font-bold'
                          : isDark
                          ? 'bg-[#121B2D] border-slate-800 text-slate-300'
                          : 'bg-slate-100 border-slate-300 text-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cantidad de VALENS */}
              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-400">Cantidad de ValensCoin (VAL):</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(Number(e.target.value))}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold ${
                    isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Precio unitario (si no es donación) */}
              {orderType !== 'donation_request' && (
                <div>
                  <label className="block text-[11px] font-bold mb-1 text-slate-400">Precio unitario en Efectivo ($ ARS c/u):</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={orderUnitPrice}
                    onChange={(e) => setOrderUnitPrice(Number(e.target.value))}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold ${
                      isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
                    Total: ${(orderAmount * orderUnitPrice).toLocaleString('es-AR')} ARS
                  </span>
                </div>
              )}

              {/* Método de Pago */}
              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-400">Método de intercambio:</label>
                <input
                  type="text"
                  required
                  value={orderPaymentMethod}
                  onChange={(e) => setOrderPaymentMethod(e.target.value)}
                  placeholder="Ej. Transferencia Mercado Pago, Efectivo en Mano"
                  className={`w-full border rounded-xl px-3 py-2 text-xs ${
                    isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-400">Mensaje para la comunidad:</label>
                <textarea
                  rows={2}
                  required
                  value={orderDescription}
                  onChange={(e) => setOrderDescription(e.target.value)}
                  placeholder={
                    orderType === 'donation_request'
                      ? 'Ej. Me quedé en 0 VALENS para hacer repartos hoy en Alta Gracia. ¡Agradezco la ayuda de algún compañero!'
                      : 'Ej. Vendo saldo acumulado por entregas de la semana en Alta Gracia.'
                  }
                  className={`w-full border rounded-xl px-3 py-2 text-xs ${
                    isDark ? 'bg-[#070C1E] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-slate-950 font-bold text-xs shadow-md active:scale-95"
                >
                  Publicar en DEX
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: Confirmar Donación Solidaria */}
      {showDonateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl border max-w-sm w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#0B132B] border-emerald-500/50 text-white' : 'bg-white border-emerald-300 text-slate-900'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/40">
              <Gift size={24} />
            </div>

            <h3 className="text-sm font-bold text-center">Donar 1 VALENS a {showDonateModal.userName}</h3>
            <p className={`text-xs text-center mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Este cadete necesita 1 VALENS para reactivar su radar y recibir pedidos en Alta Gracia. Se transferirá 1.0 VALENS de tu billetera sin intermediarios.
            </p>

            <div className={`mt-3 p-3 rounded-xl border text-xs ${
              isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">Monto a transferir:</span>
                <span className="font-mono font-bold text-emerald-400">1.0 VALENS</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tu saldo después:</span>
                <span className="font-mono font-bold text-[#F7931A]">{(balance - 1.0).toFixed(2)} VALENS</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowDonateModal(null)}
                className={`flex-1 min-h-[44px] py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                }`}
              >
                <ChevronLeft size={15} />
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmDonation}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-md active:scale-95"
              >
                Confirmar Donación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: Coordinar Intercambio P2P (Compra / Venta) */}
      {showTradeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl border max-w-sm w-full p-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto ${
            isDark ? 'bg-[#0B132B] border-amber-500/50 text-white' : 'bg-white border-amber-300 text-slate-900'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-[#F7931A] flex items-center justify-center mx-auto mb-2 border border-amber-500/40">
              <Coins size={24} />
            </div>

            <h3 className="text-sm font-bold text-center">
              {showTradeModal.type === 'sell' ? 'Comprar VALENS' : 'Vender VALENS'} con {showTradeModal.userName}
            </h3>

            <p className={`text-xs text-center mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Coordinación directa P2P en Alta Gracia. Puedes transferir de billetera a billetera o abrir el chat para coordinar el pago en mano.
            </p>

            <div className={`mt-3 p-3 rounded-xl border text-xs space-y-1.5 ${
              isDark ? 'bg-[#070C1E] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tokens:</span>
                <span className="font-mono font-bold text-[#F7931A]">{showTradeModal.amountValens} VALENS</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Precio total:</span>
                <span className="font-mono font-bold text-emerald-400">${showTradeModal.priceArs?.toLocaleString('es-AR')} ARS</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Pago acordado:</span>
                <span className="font-medium text-slate-300">{showTradeModal.paymentMethod}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmTrade}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-slate-950 font-black text-xs shadow-md active:scale-95"
              >
                Concretar Intercambio Directo
              </button>

              <button
                type="button"
                onClick={() => {
                  handleChatWithOrderUser(showTradeModal);
                  setShowTradeModal(null);
                }}
                className="w-full min-h-[44px] py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <MessageSquare size={14} className="text-[#F7931A]" />
                <span>Abrir Chat con {showTradeModal.userName}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTradeModal(null)}
                className="w-full py-1 text-slate-400 hover:text-white text-xs font-medium"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
