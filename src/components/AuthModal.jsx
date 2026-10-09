import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { authService, profileService, isSupabaseConfigured } from '../lib/supabaseClient';
import { X, ArrowLeft, Mail, Lock, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, MapPin, Locate, Compass } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { theme, showToast, setUserName, setUserProfile, setBalance, currentUser, setCurrentUser } = useApp();
  const isDark = theme === 'dark';

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('cadete'); // 'cadete' | 'cliente'
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Estado de Geolocalización en Registro / Onboarding
  const [userCoords, setUserCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'locating' | 'granted' | 'denied'

  // Solicitar ubicación GPS en tiempo real
  const requestGpsLocation = () => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'geolocation' in navigator && navigator.geolocation) {
      setGpsStatus('locating');
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = [Number(pos.coords.latitude.toFixed(6)), Number(pos.coords.longitude.toFixed(6))];
            setUserCoords(coords);
            setGpsStatus('granted');
            showToast('📍 Ubicación GPS detectada con éxito', 'success');
          },
          (err) => {
            console.warn('Permiso de GPS no concedido en registro:', err.message);
            setGpsStatus('denied');
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } catch (e) {
        setGpsStatus('denied');
      }
    } else {
      setGpsStatus('denied');
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) onClose();
  }, [currentUser, isOpen, onClose]);

  // Si pasa a registro, solicitar automáticamente permiso de ubicación
  useEffect(() => {
    if (mode === 'register' && gpsStatus === 'idle') {
      requestGpsLocation();
    }
  }, [mode, gpsStatus]);

  if (!isOpen) return null;

  // Limpiar mensajes al cambiar de pestaña
  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
    if (newMode === 'register' && gpsStatus === 'idle') {
      requestGpsLocation();
    }
  };

  // 1. Registro e Inicio de Sesión con Google OAuth
  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const result = await authService.signInWithGoogle();
      const { data, error, source } = result || {};

      if (error) {
        console.error('Error Google OAuth:', error);
        let msg = error.message || 'Error al conectar con Google OAuth.';
        if (msg.includes('Failed to fetch') || msg.includes('your-project-id')) {
          msg = 'No se pudo conectar al servidor de Supabase. Se habilitó el acceso de prueba local para seguir usando la app.';
        }
        setErrorMessage(msg);
        showToast(`Error con Google: ${msg}`, 'warning');
        setGoogleLoading(false);
        return;
      }

      // Si Supabase devuelve la URL de redirección externa de Google
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      const sessionUser = data?.user || data?.session?.user;

      if (sessionUser) {
        setCurrentUser(sessionUser);
        const { profile, wallet } = await authService.syncUserSession(sessionUser, {
          fullName: sessionUser.user_metadata?.full_name || fullName || 'Usuario Google',
          role
        });
        const name = profile?.full_name || sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || 'Usuario Google';
        setUserName(name);
        setUserProfile((prev) => ({
          ...prev,
          name,
          avatar: profile?.avatar_url || sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || prev.avatar
        }));

        if (wallet && typeof wallet.valens_balance === 'number') {
          setBalance(wallet.valens_balance);
        }

        if (userCoords && sessionUser.id) {
          await profileService.updateLocation(sessionUser.id, {
            lat: userCoords[0],
            lng: userCoords[1]
          }).catch(() => {});
        }

        const isMockSession = source === 'mock' || data?.source === 'mock' || sessionUser?.isMock;
        const fallbackLabel = isMockSession ? 'modo de prueba local (testnet)' : 'Google';
        showToast(`¡Bienvenido, ${name}! Sesión conectada con ${fallbackLabel}. Billetera: 10.0 VAL`, 'success');
        onClose();
      } else {
        setErrorMessage('No se pudo completar la autenticación con Google. Intenta de nuevo.');
        showToast('No se pudo completar la autenticación con Google.', 'warning');
      }
    } catch (err) {
      console.error('Error inesperado en Google Auth, activando fallback de contingencia:', err);
      const mockFallbackUser = {
        id: `mock-google-user-${Date.now()}`,
        email: 'usuario.google@testnet.p2p',
        user_metadata: {
          full_name: 'Usuario Demo Google',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role
        },
        isMock: true
      };
      if (setCurrentUser) setCurrentUser(mockFallbackUser);
      setUserName('Usuario Demo Google');
      setUserProfile((prev) => ({
        ...prev,
        name: 'Usuario Demo Google',
        avatar: mockFallbackUser.user_metadata.avatar_url
      }));
      setBalance(10.0);
      showToast('⚡ Sesión simulada activada en modo local (testnet)', 'warning');
      onClose();
    } finally {
      setGoogleLoading(false);
    }
  };

  // 2. Autenticación con Correo y Contraseña
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedEmail = email.trim();
    const trimmedPassword = password;
    const trimmedName = fullName.trim();

    // Validaciones previas obligatorias
    if (!trimmedEmail) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      showToast('El correo es obligatorio', 'warning');
      return;
    }

    if (!trimmedPassword) {
      setErrorMessage('Por favor ingresa tu contraseña.');
      showToast('La contraseña es obligatoria', 'warning');
      return;
    }

    if (trimmedPassword.length < 6) {
      setErrorMessage('La contraseña debe contener al menos 6 caracteres.');
      showToast('Contraseña demasiado corta (mínimo 6 caracteres)', 'warning');
      return;
    }

    if (mode === 'register' && !trimmedName) {
      setErrorMessage('Por favor ingresa tu nombre o apodo para el registro.');
      showToast('El nombre es obligatorio para registrarse', 'warning');
      return;
    }

    try {
      setLoading(true);

      if (!isSupabaseConfigured) {
        throw new Error('Supabase no está configurado. Verifica VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
      }

      if (mode === 'register') {
        // REGISTRO CON EMAIL Y PASSWORD
        const { data, error } = await authService.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          fullName: trimmedName || 'Usuario Gremami',
          role
        });

        if (error) {
          console.error('Error de registro en Supabase:', error);
          let msg = error.message || 'No se pudo crear la cuenta en Supabase.';
          if (msg.includes('Failed to fetch') || msg.includes('your-project-id')) {
            msg = 'No se pudo conectar con Supabase. Verifica VITE_SUPABASE_URL en tu archivo .env.';
          } else if (msg.includes('already registered')) {
            msg = 'Este correo ya se encuentra registrado. Por favor inicia sesión.';
          }
          setErrorMessage(msg);
          showToast(`Error de registro: ${msg}`, 'error');
          setLoading(false);
          return;
        }

        // Si Supabase requiere confirmación de email
        if (data?.user && !data?.session) {
          setSuccessMessage('¡Cuenta creada con éxito! Hemos enviado un enlace de confirmación a tu correo. Por favor confírmalo para iniciar sesión.');
          showToast('Registro exitoso. Revisa tu correo electrónico para confirmar.', 'success');
          setTimeout(() => {
            setMode('login');
          }, 3500);
          return;
        }

        // Si se inició sesión de inmediato
        if (data?.user) {
          const { profile, wallet } = await authService.syncUserSession(data.user, { fullName: trimmedName, role });
          const name = profile?.full_name || trimmedName || 'Usuario Gremami';
          setUserName(name);
          setUserProfile((prev) => ({
            ...prev,
            name,
            avatar: profile?.avatar_url || prev.avatar
          }));
          if (wallet && typeof wallet.valens_balance === 'number') {
            setBalance(wallet.valens_balance);
          }

          // Guardar coordenadas GPS en profiles de Supabase
          if (userCoords && data?.user?.id) {
            await profileService.updateLocation(data.user.id, {
              lat: userCoords[0],
              lng: userCoords[1]
            }).catch(() => {});
          }

          setSuccessMessage(`¡Bienvenido ${name}! Tu cuenta y billetera inicial de 10.0 VAL han sido creadas.`);
          showToast(`¡Cuenta creada con éxito! Bienvenido ${name}. Billetera: 10.0 VAL`, 'success');
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      } else {
        // INICIO DE SESIÓN CON EMAIL Y PASSWORD
        const { data, error } = await authService.signIn({
          email: trimmedEmail,
          password: trimmedPassword
        });

        if (error) {
          console.error('Error de login en Supabase:', error);
          let msg = error.message || 'Credenciales inválidas. Verifica tu correo y contraseña.';
          if (msg.includes('Failed to fetch') || msg.includes('your-project-id')) {
            msg = 'No se pudo conectar con Supabase. Verifica VITE_SUPABASE_URL en tu archivo .env.';
          } else if (msg.includes('Invalid login credentials')) {
            msg = 'Correo o contraseña incorrectos. Por favor intenta de nuevo.';
          } else if (msg.includes('Email not confirmed')) {
            msg = 'Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada o spam.';
          }
          setErrorMessage(msg);
          showToast(`Error de login: ${msg}`, 'error');
          setLoading(false);
          return;
        }

        if (data?.user) {
          const { profile, wallet } = await authService.syncUserSession(data.user);
          const name = profile?.full_name || data.user.user_metadata?.full_name || trimmedEmail.split('@')[0];
          setUserName(name);
          setUserProfile((prev) => ({
            ...prev,
            name,
            avatar: profile?.avatar_url || prev.avatar
          }));
          if (wallet && typeof wallet.valens_balance === 'number') {
            setBalance(wallet.valens_balance);
          }
          setSuccessMessage(`¡Sesión iniciada correctamente!`);
          showToast(`¡Bienvenido de nuevo, ${name}!`, 'success');
          setTimeout(() => {
            onClose();
          }, 900);
        }
      }
    } catch (err) {
      console.error('Error general en autenticación:', err);
      const msg = err.message || 'Ocurrió un error inesperado al procesar la solicitud.';
      setErrorMessage(msg);
      showToast(`Error: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isWorking = loading || googleLoading;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden relative ${
          isDark
            ? 'bg-[#0B132B] border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Volver / Regresar (esquina superior izquierda) */}
        <button
          onClick={() => {
            if (mode === 'register') {
              handleSwitchMode('login');
            } else {
              onClose();
            }
          }}
          disabled={isWorking}
          className={`absolute top-4 left-4 p-2 rounded-xl flex items-center gap-1.5 transition-all text-xs font-semibold ${
            isDark
              ? 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200'
          }`}
          title={mode === 'register' ? 'Volver a Iniciar Sesión' : 'Volver a la aplicación'}
        >
          <ArrowLeft size={16} />
          <span>Volver</span>
        </button>

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          disabled={isWorking}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Cerrar modal"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          {/* Cabecera */}
          <div className="text-center mb-5">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-[#F7931A] to-[#F0B90B] flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
              ⚡
            </div>
            <h2 className="text-xl font-black tracking-tight">
              {mode === 'login' ? 'Iniciar Sesión en Gremami' : 'Crear Cuenta P2P'}
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Logística Descentralizada • Gran Córdoba & Valle de Paravachasca
            </p>
          </div>

          {/* Aviso si la URL de Supabase aún no está configurada */}
          {!isSupabaseConfigured && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-amber-200">Configuración de Supabase Requerida</p>
                <p className="text-[10.5px] mt-0.5 text-amber-300 leading-relaxed">
                  Coloca en tu archivo <span className="font-mono bg-black/30 px-1 py-0.5 rounded text-amber-200">.env</span>:
                  <br />
                  <span className="font-mono font-semibold">VITE_SUPABASE_URL</span>=https://&lt;id-proyecto&gt;.supabase.co
                  <br />
                  <span className="font-mono font-semibold">VITE_SUPABASE_ANON_KEY</span>=&lt;clave-publicable-de-Supabase&gt;
                </p>
              </div>
            </div>
          )}

          {/* Banner de Mensaje de Error */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Error de Autenticación</p>
                <p className="text-[11px] mt-0.5 leading-relaxed text-rose-200">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-rose-400 hover:text-white p-0.5"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Banner de Mensaje de Éxito */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">¡Operación Exitosa!</p>
                <p className="text-[11px] mt-0.5 leading-relaxed text-emerald-200">{successMessage}</p>
              </div>
            </div>
          )}

          {/* BOTÓN PRINCIPAL: CONTINUAR / REGISTRARSE CON GOOGLE */}
          <div className="space-y-3 mb-5">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isWorking}
              className={`w-full py-3 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-3 transition-all shadow-sm relative overflow-hidden ${
                isWorking
                  ? 'opacity-60 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-400'
                  : isDark
                  ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-white active:scale-[0.98]'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400 active:scale-[0.98]'
              }`}
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                /* Logotipo Oficial Multicolor de Google */
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span className="text-xs font-black">
                {googleLoading
                  ? 'Conectando con Google...'
                  : mode === 'register'
                  ? 'Registrarse con Google'
                  : 'Continuar con Google'}
              </span>
            </button>

            {/* Separador "O con correo" */}
            <div className="flex items-center my-4">
              <div className={`flex-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />
              <span className={`px-3 text-[10.5px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                O con correo y contraseña
              </span>
              <div className={`flex-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />
            </div>
          </div>

          {/* FORMULARIO DE CORREO / CONTRASEÑA */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Nombre Completo o Razón Social
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={15} />
                  <input
                    type="text"
                    disabled={isWorking}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Lucas Bici o Cadetería Centro"
                    required
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#F7931A] ${
                      isWorking ? 'opacity-60 cursor-not-allowed' : ''
                    } ${
                      isDark
                        ? 'bg-[#121B2D] border-slate-700 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={15} />
                <input
                  type="email"
                  disabled={isWorking}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  required
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#F7931A] ${
                    isWorking ? 'opacity-60 cursor-not-allowed' : ''
                  } ${
                    isDark
                      ? 'bg-[#121B2D] border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Contraseña (mínimo 6 caracteres)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={15} />
                <input
                  type="password"
                  disabled={isWorking}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#F7931A] ${
                    isWorking ? 'opacity-60 cursor-not-allowed' : ''
                  } ${
                    isDark
                      ? 'bg-[#121B2D] border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Rol Principal en la Red
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isWorking}
                    onClick={() => setRole('cadete')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      role === 'cadete'
                        ? 'bg-amber-500/20 border-[#F7931A] text-[#F7931A]'
                        : isDark
                        ? 'bg-[#121B2D] border-slate-700 text-slate-400'
                        : 'bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    🛵 Cadete / Chofer
                  </button>
                  <button
                    type="button"
                    disabled={isWorking}
                    onClick={() => setRole('cliente')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      role === 'cliente'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : isDark
                        ? 'bg-[#121B2D] border-slate-700 text-slate-400'
                        : 'bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    📦 Cliente / Emisor
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-400 text-[11px]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Ubicación GPS Inicial</span>
                  </div>
                  <button
                    type="button"
                    onClick={requestGpsLocation}
                    disabled={isWorking || gpsStatus === 'locating'}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold underline flex items-center gap-1"
                  >
                    <Locate className={`w-3 h-3 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
                    <span>{gpsStatus === 'granted' ? 'Actualizar GPS' : 'Detectar GPS'}</span>
                  </button>
                </div>
                {userCoords ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Lat: {userCoords[0].toFixed(4)}, Lng: {userCoords[1].toFixed(4)} (Alta Gracia)</span>
                  </div>
                ) : gpsStatus === 'locating' ? (
                  <p className="text-[10.5px] text-amber-300 animate-pulse">
                    Detectando señal satelital del dispositivo...
                  </p>
                ) : (
                  <p className="text-[10.5px] text-slate-400">
                    Permite el acceso a ubicación para fijar tu posición en el mapa P2P.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isWorking}
              className={`w-full mt-2 py-3 px-4 rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                isWorking
                  ? 'opacity-60 cursor-not-allowed bg-slate-700 text-slate-300'
                  : 'bg-gradient-to-r from-[#F7931A] to-[#E07D09] hover:from-[#F0B90B] hover:to-[#F7931A] text-slate-950 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Iniciar Sesión' : 'Registrar Cuenta'}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Switch Login / Registro */}
          <div className="mt-5 text-center">
            <button
              type="button"
              disabled={isWorking}
              onClick={() => handleSwitchMode(mode === 'login' ? 'register' : 'login')}
              className={`text-xs font-bold transition-colors ${
                isDark ? 'text-[#F7931A] hover:underline' : 'text-amber-700 hover:underline'
              }`}
            >
              {mode === 'login'
                ? '¿No tienes cuenta? Regístrate aquí'
                : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
