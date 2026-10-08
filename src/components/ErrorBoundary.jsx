import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó un fallo:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    // Si hay un Service Worker trabado, desregistrarlo y recargar limpio
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }
    // Limpiar posibles cachés corruptos
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    window.location.reload();
  };

  handleResetState = () => {
    try {
      localStorage.removeItem('gremami_orders_history');
      localStorage.removeItem('gremami_user_profile');
    } catch (e) {}
    this.handleReload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A1128] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-lg font-black tracking-tight">Gremami P2P • Recuperación Activa</h1>
              <p className="text-xs text-slate-400 mt-1">
                La aplicación detectó un problema de ejecución y protegió tus datos.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/50 border border-slate-800 text-left font-mono text-[10px] text-rose-300 max-h-32 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-slate-950 font-black text-xs hover:brightness-110 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar Aplicación Limpia</span>
              </button>

              <button
                onClick={this.handleResetState}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Limpiar Caché Local y Reiniciar
              </button>
            </div>

            <p className="text-[10px] text-slate-500">
              Logística Descentralizada • Alta Gracia, Córdoba
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
