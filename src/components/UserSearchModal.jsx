import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  X,
  User,
  Star,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Bike,
  Coins
} from 'lucide-react';

export default function UserSearchModal({ isOpen, onClose }) {
  const {
    theme,
    searchUsers,
    openPublicProfile
  } = useApp();

  const isDark = theme === 'dark';

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'cadete' | 'cliente' | 'comercio'
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Ejecutar búsqueda reactiva en vivo
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const found = await searchUsers(query);
        if (!isCancelled) {
          setResults(found || []);
        }
      } catch (err) {
        if (!isCancelled) setResults([]);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 150);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query, isOpen, searchUsers]);

  // Filtrado por rol
  const filteredResults = useMemo(() => {
    if (roleFilter === 'all') return results;
    return results.filter((u) => {
      const uRole = (u.role || '').toLowerCase();
      if (roleFilter === 'cadete') return uRole === 'cadete' || uRole === 'ambos';
      if (roleFilter === 'cliente') return uRole === 'cliente';
      if (roleFilter === 'comercio') return uRole === 'comercio';
      return true;
    });
  }, [results, roleFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className={`border rounded-2xl max-w-md w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
        isDark ? 'bg-[#0A1128] border-[#1F2D48] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        {/* Header del Buscador */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-[#1F2D48] bg-[#121B2D]/80' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F7931A] to-[#F0B90B] p-0.5 flex items-center justify-center shadow-glow-orange">
              <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isDark ? 'bg-[#0A1128]' : 'bg-white'}`}>
                <Search className="w-4 h-4 text-[#F7931A]" />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight">Buscar Usuarios P2P</h2>
              <p className={`text-[10px] ${isDark ? 'text-[#8C9BB4]' : 'text-slate-500'}`}>
                Comunidad de Alta Gracia & Paravachasca
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition-colors ${
              isDark ? 'border-[#1F2D48] hover:bg-[#1A253D] text-slate-400 hover:text-white' : 'border-slate-300 hover:bg-slate-200 text-slate-600'
            }`}
            title="Cerrar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input de Búsqueda */}
        <div className="p-3.5 space-y-2.5">
          <div className="relative">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`} />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nick (@), nombre o correo..."
              className={`w-full pl-9 pr-8 py-2.5 rounded-xl text-xs font-medium border focus:outline-none transition-all ${
                isDark
                  ? 'bg-[#121B2D] border-[#1F2D48] text-white placeholder-slate-500 focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A]'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A]'
              }`}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros rápidos por Rol */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'cadete', label: 'Cadetes 🏍️' },
              { id: 'cliente', label: 'Clientes 👤' },
              { id: 'comercio', label: 'Comercios 🏪' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setRoleFilter(f.id)}
                className={`text-[10.5px] px-2.5 py-1 rounded-lg border font-semibold transition-all whitespace-nowrap active:scale-95 ${
                  roleFilter === f.id
                    ? isDark
                      ? 'bg-gradient-to-r from-[#F7931A] to-[#E07D09] text-black border-[#F7931A] font-bold shadow-xs'
                      : 'bg-[#F7931A] text-black border-[#F7931A] font-bold shadow-xs'
                    : isDark
                    ? 'bg-[#121B2D] border-[#1F2D48] text-slate-400 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Resultados */}
        <div className="flex-1 overflow-y-auto px-3.5 pb-4 space-y-2 min-h-[220px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Buscando en la red P2P...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center space-y-2 my-2 ${
              isDark ? 'bg-[#121B2D]/40 border-[#1F2D48]/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-[#F0B90B]">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold">No se encontraron usuarios con ese nick o correo</h3>
              <p className={`text-[11px] max-w-xs mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {query ? `No hay coincidencias para "${query}". Intenta buscar por nombre de pila o apodo de Alta Gracia.` : 'Escribe arriba para buscar cadetes, clientes o comercios.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 font-mono">
                <span>{filteredResults.length} {filteredResults.length === 1 ? 'miembro encontrado' : 'miembros encontrados'}</span>
                <span>Toca para ver perfil</span>
              </div>

              {filteredResults.map((u) => {
                const uRole = (u.role || 'cadete').toLowerCase();
                const isCad = uRole === 'cadete' || uRole === 'ambos';
                const isShop = uRole === 'comercio';

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      openPublicProfile(u);
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group active:scale-[0.99] ${
                      isDark
                        ? 'bg-[#121B2D] border-[#1F2D48] hover:border-[#F7931A]/60 hover:bg-[#18243C]'
                        : 'bg-white border-slate-200 hover:border-[#F7931A]/60 hover:bg-slate-50 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      {/* Avatar con badge online */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                          alt={u.name}
                          className="w-10 h-10 rounded-xl object-cover border border-amber-400/30"
                        />
                        {u.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0A1128]" />
                        )}
                      </div>

                      {/* Info del usuario */}
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-xs font-bold truncate group-hover:text-[#F0B90B] transition-colors">
                            {u.name}
                          </h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            isCad
                              ? isDark ? 'bg-amber-500/10 text-[#F0B90B] border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300'
                              : isShop
                              ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}>
                            {isCad ? 'Cadete' : isShop ? 'Comercio' : 'Cliente'}
                          </span>
                        </div>

                        <p className={`text-[10px] font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          @{u.username || u.name?.toLowerCase().replace(/[^a-z0-9]/g, '')}
                          {u.email && ` • ${u.email}`}
                        </p>

                        <div className="flex items-center space-x-2 mt-0.5 text-[10px]">
                          <span className="flex items-center space-x-0.5 text-[#F0B90B] font-bold font-mono">
                            <Star className="w-3 h-3 fill-[#F0B90B]" />
                            <span>{(u.rating || 4.95).toFixed(1)}</span>
                          </span>
                          <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            • {u.completedAgreements || u.reviewsCount || 20} acuerdos
                          </span>
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#F7931A] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
