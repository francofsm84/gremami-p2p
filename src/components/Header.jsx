import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Menu,
  X,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Wallet,
  User,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  TrendingUp,
  Settings,
  LogIn,
  LogOut,
  CheckCircle2
} from 'lucide-react';

export default function Header() {
  const {
    theme,
    toggleTheme,
    role,
    setRole,
    balance,
    isGpsActive,
    requestFaucet,
    activeTab,
    setActiveTab,
    userName,
    messages,
    isOnline,
    toggleOnlineStatus,
    currentUser,
    openAuthModal,
    logout,
    userProfile
  } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isDark = theme === 'dark';
  const isCadete = role === 'cadete';
  const hasMinBalance = balance >= 1.0;

  const navMenuItems = [
    {
      id: 'home',
      label: 'Inicio / Categorías',
      icon: LayoutGrid,
      desc: 'Explorar las 6 categorías de Alta Gracia',
      badge: null
    },
    {
      id: 'map',
      label: 'Mapa P2P Completo',
      icon: MapPin,
      desc: 'Callejero urbano de Alta Gracia (60 nodos)',
      badge: '60'
    },
    {
      id: 'chat',
      label: 'Chats P2P Activos',
      icon: MessageSquare,
      desc: 'Mensajería directa y PIN antifraude',
      badge: '3'
    },
    {
      id: 'wallet',
      label: 'Billetera ValensCoin',
      icon: Wallet,
      desc: 'Saldo y Escuela Cripto P2P',
      badge: `${balance.toFixed(1)} VAL`
    },
    {
      id: 'dex',
      label: 'Mercado P2P DEX',
      icon: TrendingUp,
      desc: 'Donaciones y Compra/Venta de Tokens',
      badge: 'DEX'
    },
    {
      id: 'profile',
      label: 'Dashboard / Perfil',
      icon: User,
      desc: 'Métricas multimoneda y Frase Semilla',
      badge: '4.96 ★'
    }
  ];

  const handleNavigate = (tabId) => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-50 w-full border-b transition-colors duration-200 shadow-xl ${
      isDark
        ? 'bg-[#121B2D] border-[#1F2D48] text-white'
        : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Top Branding Bar */}
      <div className={`px-3.5 py-2.5 flex items-center justify-between border-b ${
        isDark ? 'border-[#1F2D48]' : 'border-slate-200'
      }`}>
        {/* Brand & Slogan */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E02424] via-[#F7931A] to-[#F0B90B] p-0.5 shadow-glow-orange flex-shrink-0">
            <img
              src="/icon-192.svg"
              alt="Gremami P2P Logo"
              className={`w-full h-full rounded-[10px] object-cover ${isDark ? 'bg-[#0A1128]' : 'bg-white'}`}
            />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-base font-black tracking-tight leading-none">
                Gremami <span className="text-[#F7931A]">P2P</span>
              </h1>
            </div>
            <p className={`text-[10px] font-medium tracking-wide mt-0.5 ${isDark ? 'text-[#8C9BB4]' : 'text-slate-500'}`}>
              Logística Descentralizada • Gran Córdoba & Valle de Paravachasca
            </p>
          </div>
        </div>

        {/* Right Section: Testnet Badge, Theme Toggle (Sun/Moon) & Hamburger Menu Button */}
        <div className="flex items-center space-x-2">
          {/* Testnet Badge */}
          <div className={`hidden xs:flex items-center space-x-1.5 px-2 py-1 rounded-full border text-[11px] ${
            isDark ? 'bg-[#0A1128] border-[#1F2D48]' : 'bg-slate-100 border-slate-200'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className={`font-mono text-[10px] ${isDark ? 'text-[#8C9BB4]' : 'text-slate-600'}`}>Testnet</span>
          </div>

          {/* Botón de Autenticación / Google */}
          {currentUser ? (
            <button
              onClick={() => setActiveTab('profile')}
              title={`Conectado como ${currentUser.user_metadata?.full_name || currentUser.email}`}
              className="flex items-center space-x-1.5 p-1 px-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs active:scale-95"
            >
              <img
                src={currentUser.user_metadata?.avatar_url || userProfile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt="Avatar"
                className="w-5 h-5 rounded-full object-cover border border-emerald-400"
              />
              <span className="hidden sm:inline font-bold text-[10px] max-w-[70px] truncate">
                {(currentUser.user_metadata?.full_name || currentUser.email || 'Google').split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              title="Iniciar sesión o registrarse con Google"
              className="flex items-center space-x-1 py-1 px-2 rounded-xl border border-[#F7931A]/40 bg-[#F7931A]/10 hover:bg-[#F7931A]/20 text-[#F7931A] transition-all text-xs active:scale-95 font-semibold"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span className="text-[10px]">Ingresar</span>
            </button>
          )}

          {/* 1. Selector de Tema Día / Noche (Sol / Luna) Requerido */}
          <button
            onClick={toggleTheme}
            aria-label="Alternar Modo Día / Noche"
            title={isDark ? 'Activar Modo Día (High Contrast)' : 'Activar Modo Noche (Cripto Dark)'}
            className={`p-2 rounded-xl border transition-all flex items-center justify-center active:scale-95 ${
              isDark
                ? 'bg-[#1A253D] text-[#F0B90B] border-[#2D3E61] hover:border-[#F7931A] hover:bg-[#22304E]'
                : 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 shadow-sm'
            }`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 stroke-[2.2] animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 stroke-[2.2]" />
            )}
          </button>

          {/* Menú Hamburguesa Arriba a la Derecha */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir Menú de Navegación"
            className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
              isMenuOpen
                ? 'bg-[#E02424] text-white border-[#E02424] shadow-glow-raven'
                : isDark
                ? 'bg-[#1A253D] text-white border-[#2D3E61] hover:border-[#F7931A] hover:bg-[#22304E] shadow-md active:scale-95'
                : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 active:scale-95'
            }`}
          >
            {isMenuOpen ? (
              <X className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Menu className="w-4 h-4 stroke-[2.5] text-[#F7931A]" />
            )}
          </button>
        </div>
      </div>

      {/* Role Switcher (Modo Cliente / Modo Cadete) */}
      <div className={`px-3.5 py-1.5 flex items-center justify-between gap-2 border-b transition-colors ${
        isDark ? 'bg-[#0F1726] border-[#1F2D48]/50' : 'bg-slate-100 border-slate-200'
      }`}>
        <span className={`text-[11px] font-medium ${isDark ? 'text-[#8C9BB4]' : 'text-slate-600'}`}>Modo:</span>

        <div className={`flex items-center p-1 rounded-xl border shadow-inner ${
          isDark ? 'bg-[#070C1E] border-[#1F2D48]' : 'bg-white border-slate-200'
        }`}>
          <button
            onClick={() => setRole('cliente')}
            type="button"
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              !isCadete
                ? isDark
                  ? 'bg-[#1E293B] text-white shadow-md border border-[#2D3E61]'
                  : 'bg-slate-900 text-white shadow-md'
                : isDark ? 'text-[#8C9BB4] hover:text-gray-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            👤 Cliente
          </button>

          <button
            onClick={() => setRole('cadete')}
            type="button"
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              isCadete
                ? 'bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black shadow-glow-orange font-bold'
                : isDark ? 'text-[#8C9BB4] hover:text-gray-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🛵 Cadete
          </button>
        </div>
      </div>

      {/* Cadete Mode GPS Alert & Online/Offline Status */}
      {isCadete && (
        <div className={`border-t px-3.5 py-1.5 animate-fadeIn ${
          isDark ? 'border-[#1F2D48] bg-[#0A1128]' : 'border-emerald-200 bg-emerald-50/70'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-radar absolute inline-flex h-full w-full rounded-full ${isOnline ? 'bg-emerald-400 opacity-80' : 'bg-slate-400 opacity-40'}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-emerald-400' : 'bg-slate-400'}`} />
              </span>
              <span className={`font-semibold text-[11px] ${isOnline ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : 'text-slate-400'}`}>
                {isOnline ? '🟢 ONLINE en Radar' : '⚪ OFFLINE'}
              </span>
              <button
                onClick={toggleOnlineStatus}
                className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition-all ${
                  isOnline
                    ? isDark ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/40' : 'border-emerald-300 text-emerald-800 bg-emerald-100 hover:bg-emerald-200'
                    : isDark ? 'border-slate-700 text-slate-300 bg-slate-800 hover:bg-slate-700' : 'border-slate-300 text-slate-700 bg-slate-200 hover:bg-slate-300'
                }`}
                title={isOnline ? 'Pasar a Offline (silenciar alertas y ocultar en radar)' : 'Pasar a Online (recibir solicitudes)'}
              >
                {isOnline ? 'Pausar' : 'Conectar'}
              </button>
            </div>

            {hasMinBalance ? (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isDark ? 'text-emerald-300 bg-emerald-950/50 border-emerald-700/50' : 'text-emerald-800 bg-emerald-100 border-emerald-300'
              }`}>
                Depósito: {balance.toFixed(2)} VAL
              </span>
            ) : (
              <button
                onClick={requestFaucet}
                className="px-2 py-0.5 rounded bg-[#F7931A] text-black font-bold text-[10px] shadow-glow-orange"
              >
                +5 VAL Grifo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Menú Desplegable Hamburguesa (100% Sólido y Opaco, sin transparencias) */}
      {isMenuOpen && (
        <>
          {/* Backdrop para cerrar al hacer clic afuera */}
          <div
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 animate-fadeIn"
          />

          <div className={`absolute top-full right-0 left-0 sm:left-auto sm:w-80 border-b sm:border-l shadow-2xl p-4 z-50 animate-in slide-in-from-top-2 duration-150 ring-1 ring-black/20 max-h-[85dvh] overflow-y-auto ${
            isDark
              ? 'bg-[#0B132B] border-[#1F2D48] text-white'
              : 'bg-white border-slate-300 text-slate-900'
          }`}>
            {/* User Status Card in Menu con Soporte Google OAuth */}
            <div className={`p-3 rounded-2xl border mb-3 shadow-md ${
              isDark ? 'bg-[#121B2D] border-[#1F2D48]' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5 min-w-0">
                  {currentUser?.user_metadata?.avatar_url || userProfile?.avatar ? (
                    <img
                      src={currentUser?.user_metadata?.avatar_url || userProfile?.avatar}
                      alt="Avatar"
                      className="w-9 h-9 rounded-xl object-cover border border-[#F7931A]/40"
                    />
                  ) : (
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm font-bold text-[#F7931A] ${
                      isDark ? 'bg-[#0A1128] border-[#F7931A]/40' : 'bg-amber-100 border-amber-300'
                    }`}>
                      ₿
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {currentUser?.user_metadata?.full_name || userName}
                    </p>
                    {currentUser?.email ? (
                      <p className="text-[10px] text-emerald-400 truncate font-mono">
                        {currentUser.email}
                      </p>
                    ) : (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                        {balance.toFixed(2)} VALENS
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F7931A]/15 text-[#F7931A] dark:text-[#F0B90B] border border-[#F7931A]/40 font-bold flex-shrink-0">
                  {role === 'cadete' ? '🛵 Cadete' : '👤 Cliente'}
                </span>
              </div>

              {/* Botón de Google OAuth o Cerrar Sesión */}
              <div className="mt-2.5 pt-2 border-t border-dashed border-[#1F2D48]/70 flex items-center justify-between gap-2">
                {currentUser ? (
                  <>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 size={11} /> Conectado con Google
                    </span>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="text-[10px] px-2 py-1 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 flex items-center gap-1 transition-all active:scale-95"
                    >
                      <LogOut size={10} /> Salir
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      openAuthModal();
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-white text-slate-800 hover:bg-slate-100 text-[11px] font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Iniciar Sesión con Google</span>
                  </button>
                )}
              </div>
            </div>

            <p className={`text-[10px] font-bold uppercase tracking-wider px-1 mb-2 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Navegación de la Plataforma
            </p>

            {/* Navigation Items */}
            <div className="space-y-1.5">
              {navMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    type="button"
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black shadow-glow-orange font-bold'
                        : isDark
                        ? 'bg-[#121B2D]/90 hover:bg-[#1A263D] text-slate-100 border border-[#1F2D48]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? 'text-black stroke-[2.5]' : 'text-[#F7931A]'
                        }`}
                      />
                      <div className="min-w-0">
                        <span className={`text-xs block leading-tight font-semibold ${
                          isActive ? 'text-black' : isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {item.label}
                        </span>
                        <span
                          className={`text-[10px] block leading-tight truncate mt-0.5 ${
                            isActive
                              ? 'text-black/85 font-medium'
                              : isDark
                              ? 'text-slate-400'
                              : 'text-slate-600'
                          }`}
                        >
                          {item.desc}
                        </span>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ml-2 flex-shrink-0 ${
                          isActive
                            ? 'bg-black text-white'
                            : isDark
                            ? 'bg-[#1A253D] text-[#F0B90B] border border-[#2D3E61]'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ⚙️ Ajustes de Plataforma y Toggle Día/Noche */}
            <div className={`mt-3 pt-2.5 border-t ${
              isDark ? 'border-[#1F2D48]' : 'border-slate-200'
            }`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider px-1 mb-2 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                ⚙️ Ajustes y Apariencia
              </p>

              <button
                onClick={toggleTheme}
                type="button"
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isDark
                    ? 'bg-[#121B2D] hover:bg-[#1A263D] border-[#1F2D48] text-white'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-amber-500/20 text-[#F0B90B]' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-semibold block leading-tight">
                      {isDark ? 'Modo Noche (Cripto Dark)' : 'Modo Día (High Contrast)'}
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Toca para cambiar a {isDark ? 'Modo Día' : 'Modo Noche'}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F7931A]/20 text-[#F7931A] border border-[#F7931A]/40">
                  {isDark ? '🌙 Dark' : '☀️ Light'}
                </span>
              </button>
            </div>

            {/* Footer note in menu */}
            <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] ${
              isDark ? 'border-[#1F2D48] text-slate-400' : 'border-slate-200 text-slate-600'
            }`}>
              <span className="font-medium">Gremami P2P • Alta Gracia</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-[#F7931A] font-bold hover:underline"
              >
                Cerrar ✕
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
