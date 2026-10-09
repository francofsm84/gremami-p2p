import React, { lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import UserSearchModal from './components/UserSearchModal';
import PublicProfileModal from './components/PublicProfileModal';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const DexScreen = lazy(() => import('./components/DexScreen'));
const HomeScreen = lazy(() => import('./components/HomeScreen'));
const MapaP2P = lazy(() => import('./components/MapaP2P'));
const ChatScreen = lazy(() => import('./components/ChatScreen'));
const WalletScreen = lazy(() => import('./components/WalletScreen'));
const ProfileScreen = lazy(() => import('./components/ProfileScreen'));

function MainLayout() {
  const {
    activeTab,
    setActiveTab,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    startChatWithPeer,
    role,
    toast,
    theme,
    isAuthModalOpen,
    closeAuthModal,
    isSearchModalOpen,
    closeSearchModal,
    selectedPublicProfile,
    closePublicProfile
  } = useApp();

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex justify-center transition-colors duration-200 ${
      isDark ? 'bg-[#070C1E]' : 'bg-slate-200'
    }`}>
      {/* Mobile container - takes full width on mobile, centered smartphone canvas on desktop */}
      <div className={`w-full max-w-md min-h-screen flex flex-col shadow-2xl relative border-x transition-colors duration-200 ${
        isDark ? 'bg-[#0A1128] border-[#1F2D48]/70 text-slate-100' : 'bg-[#F8FAFC] border-slate-300 text-slate-900'
      }`}>
        {/* Top Sticky Header with Brand, Slogan, Testnet status and Top-Right Hamburger Menu */}
        <Header />

        {/* Global Toast Alert */}
        {toast && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4 animate-bounce pointer-events-none">
            <div
              className={`p-3 rounded-2xl shadow-2xl backdrop-blur-md border text-xs flex items-center space-x-2 ${
                toast.type === 'success'
                  ? 'bg-[#0A2218]/95 border-emerald-500/80 text-emerald-300'
                  : toast.type === 'warning'
                  ? 'bg-[#241A0B]/95 border-[#F7931A]/80 text-[#F0B90B]'
                  : toast.type === 'error'
                  ? 'bg-[#2D0A11]/95 border-[#E02424]/80 text-rose-300 shadow-glow-raven'
                  : 'bg-[#121B2D]/95 border-[#1F2D48] text-white'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-[#F7931A] flex-shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-[#E02424] flex-shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-[#F0B90B] flex-shrink-0" />}
              <span className="flex-1 font-medium">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Dynamic Screen View - Navegación exclusiva por Menú Hamburguesa */}
        <main className="flex-1 flex flex-col overflow-x-hidden min-h-0 pb-3">
          <Suspense fallback={
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-400" role="status">
              Cargando pantalla...
            </div>
          }>
            {activeTab === 'home' && <HomeScreen />}
            {activeTab === 'map' && (
              <MapaP2P
                selectedCategory={selectedCategoryFilter}
                setSelectedCategory={setSelectedCategoryFilter}
                setActiveTab={setActiveTab}
                setSelectedUserForChat={startChatWithPeer}
                role={role}
              />
            )}
            {activeTab === 'chat' && <ChatScreen />}
            {activeTab === 'wallet' && <WalletScreen />}
            {activeTab === 'dex' && <DexScreen />}
            {activeTab === 'profile' && <ProfileScreen />}
          </Suspense>
        </main>

        {/* Modal de Autenticación Supabase / Google OAuth */}
        <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />

        {/* Modal de Búsqueda de Usuarios P2P */}
        {isSearchModalOpen && (
          <div className="fixed inset-0 z-[200] pointer-events-auto">
            <UserSearchModal isOpen={isSearchModalOpen} onClose={closeSearchModal} />
          </div>
        )}

        {/* Modal de Perfil Público */}
        {selectedPublicProfile && (
          <div className="fixed inset-0 z-[210] pointer-events-auto">
            <PublicProfileModal
              user={selectedPublicProfile}
              isOpen={!!selectedPublicProfile}
              onClose={closePublicProfile}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
