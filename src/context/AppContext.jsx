import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_PEERS,
  INITIAL_MESSAGES,
  INITIAL_TRANSACTIONS,
  BIP39_SEED_WORDS,
  PEER_CATEGORIES,
  INITIAL_ORDERS_HISTORY,
  INITIAL_LIVE_REQUESTS,
  INITIAL_DEX_ORDERS,
  formatDistanceKm,
  getPeerSocials,
  ARGENTINE_FIAT_PROVIDERS
} from '../data/mockData';
import { playP2PAlertChime, playCelebrationSound } from '../utils/audioAlert';
import { 
  saveBidToSupabase, 
  recordDeliveryTransactionInSupabase,
  saveFiatPaymentConfigToSupabase 
} from '../lib/supabase';
import { authService, profileService, isSupabaseConfigured } from '../lib/supabaseClient';

const AppContext = createContext();

export const CURRENT_CADET_ID = 'current-cadet-satoshidev';

export const EXCHANGE_RATES = {
  ARS_PER_USD: 1250,
  ARS_PER_VALENS: 2500,
  USD_PER_VALENS: 2.0
};

export function AppProvider({ children }) {
  // Theme: 'dark' (Cripto Dark) or 'light' (High Contrast Urbano)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gremami_theme') || 'dark';
  });

  // Role: 'cliente' or 'cadete'
  const [role, setRole] = useState('cliente');

  // Navigation tab: 'home', 'map', 'chat', 'wallet', 'profile'
  const [activeTab, setActiveTab] = useState('home');

  // Category filter for the map: 'all', 'caminando', 'bicicleta', 'automovil', 'comercio'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // ValensCoin balance (requirement: initial balance 10 VALENS)
  const [balance, setBalance] = useState(10.0);

  // User credentials & identity
  const [userPublicKey] = useState('valens1q7x8m9z4k0t3w2y5d8c1f6g9h2j4l7v9m3a');
  const [userName, setUserName] = useState('SatoshiDev');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 4. Interruptor de Estado en Tiempo Real (Online / Offline - Disponible para Trabajar)
  const [isOnline, setIsOnline] = useState(() => {
    return localStorage.getItem('gremami_is_online') !== 'false';
  });

  // Perfil Ampliado del Usuario / Prestador
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('gremami_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.aliasCbu) parsed.aliasCbu = 'cadete.gremami.mp';
        if (!parsed.fiatProvider) parsed.fiatProvider = 'Mercado Pago';
        if (!parsed.fiatAlias) parsed.fiatAlias = parsed.aliasCbu || 'cadete.gremami.mp';
        if (!parsed.fiatCbuCvu) parsed.fiatCbuCvu = '0000003100049281729384';
        if (!parsed.fiatHolderName) parsed.fiatHolderName = 'Satoshi Dev Nakamoto';
        if (!parsed.fiatCuit) parsed.fiatCuit = '20-38492019-4';
        return parsed;
      }
    } catch (e) {}
    return {
      name: 'SatoshiDev',
      role: 'cadete',
      aliasCbu: 'cadete.gremami.mp',
      fiatProvider: 'Mercado Pago',
      fiatAlias: 'cadete.gremami.mp',
      fiatCbuCvu: '0000003100049281729384',
      fiatHolderName: 'Satoshi Dev Nakamoto',
      fiatCuit: '20-38492019-4',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      idDocumentUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
      isIdVerified: true,
      bio: 'Servicio de logística y fletes soberano en Alta Gracia. Mudanzas, trámites rápidos y cargas pesadas sin comisiones abusivas.',
      workZone: 'Alta Gracia, Córdoba capital y Valle de Paravachasca',
      vehicleType: 'Camioneta Pick-up',
      serviceModality: 'mixto', // 'pasajeros' | 'envios' | 'mixto'
      loadCapacity: '1.500 kg / 8 m³',
      includesHelpers: true,
      socials: {
        instagram: '@gremami.p2p',
        twitter: '@gremamip2p',
        whatsapp: '+5493547123456',
        facebook: 'Gremami P2P Alta Gracia'
      },
      referralCode: 'satoshidev',
      referralsCount: 4,
      referralRewardsValens: 8.0,
      milestones: {
        weeklyDeliveries: 12,
        positiveRatingPercent: 100,
        commissionsSavedArs: 48500,
        totalTripsAllTime: 42
      }
    };
  });

  // GPS visibility
  const [isGpsActive, setIsGpsActive] = useState(true);

  // Coordenadas GPS en Tiempo Real del Usuario (Alta Gracia / Gran Córdoba)
  const [userGpsCoords, setUserGpsCoords] = useState([-31.6529, -64.4283]);
  const [userGpsAccuracy, setUserGpsAccuracy] = useState(null);
  const [hasLiveGps, setHasLiveGps] = useState(false);

  // Selected peer for map bottom-sheet
  const [selectedPeer, setSelectedPeer] = useState(null);

  // Active chat peer ID
  const [activeChatPeerId, setActiveChatPeerId] = useState('cadete-moto-1');

  // Peers data (50 nodos en Alta Gracia, Córdoba)
  const [peers, setPeers] = useState(INITIAL_PEERS);

  // Orders History for Multicurrency Dashboard (Cliente & Cadete)
  const [ordersHistory, setOrdersHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('gremami_orders_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_ORDERS_HISTORY;
  });

  // Solicitudes de servicio en vivo (Live Broadcast P2P)
  const [liveRequests, setLiveRequests] = useState(INITIAL_LIVE_REQUESTS);

  // Alerta en vivo activa para el modo Cadete/Prestador
  const [activeAlert, setActiveAlert] = useState({
    id: 'req-live-101',
    title: '🔔 ¡Alarma P2P: Nuevo cliente a 0.5 km buscando entrega!',
    subtitle: 'Lucía M. solicita: Retirar medicamento en Farmacia Belgrano y entregar en B° Pellegrini',
    request: INITIAL_LIVE_REQUESTS[0]
  });

  // Flujo de Conexión Condicional del Chat P2P (Aceptación Mutua previa)
  const [acceptedConnections, setAcceptedConnections] = useState(['cadete-moto-1', 'cadete-auto-1']);

  // Módulo de Seguridad: Lista de usuarios bloqueados
  const [blockedUserIds, setBlockedUserIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gremami_blocked_users')) || [];
    } catch (e) {
      return [];
    }
  });

  // Solicitudes P2P de Imagen de DNI (Intercambio Voluntario): { [peerId]: 'none' | 'pending' | 'accepted' | 'rejected' }
  const [dniRequests, setDniRequests] = useState({});

  // Privacidad de Contacto: Consentimiento Explícito para Compartir WhatsApp por Chat P2P: { [peerId]: boolean }
  const [sharedWhatsappChats, setSharedWhatsappChats] = useState({});

  // Sistema Antifraude: PIN dinámico de 4 dígitos
  const [orderPin, setOrderPin] = useState('4821');
  const [pinStatus, setPinStatus] = useState('pending'); // 'pending' | 'verified'
  const [pinFailedAttempts, setPinFailedAttempts] = useState(0);
  const [isPinLocked, setIsPinLocked] = useState(false);

  // Modal de celebración e impacto visual (Dopamina P2P)
  const [celebrationData, setCelebrationData] = useState(null); // { open, rewardAmount, peerName, isCadete, txHash }

  // Messages dictionary: { [peerId]: Message[] }
  const [messages, setMessages] = useState(INITIAL_MESSAGES);

  // Transactions list
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);

  // Mercado P2P DEX: Libro de órdenes abierto descentralizado
  const [dexOrders, setDexOrders] = useState(INITIAL_DEX_ORDERS);

  // Toast notifications
  const [toast, setToast] = useState(null);

  // Auto-clear toast after 3.5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  // Sincronización automática de Sesión de Supabase y Google OAuth
  useEffect(() => {
    // 1. Verificar si hay usuario activo almacenado o devuelto por redirect OAuth
    authService.getUser().then(async (user) => {
      if (user) {
        setCurrentUser(user);
        const { profile, wallet } = await authService.syncUserSession(user);
        const name = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];
        const avatar = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (name) setUserName(name);
        if (avatar) {
          setUserProfile((prev) => ({
            ...prev,
            avatar,
            name: name || prev.name
          }));
        }
        if (wallet && typeof wallet.valens_balance === 'number') {
          setBalance(wallet.valens_balance);
        }
      }
    }).catch(() => {});

    // 2. Escuchar eventos de inicio / cierre de sesión en tiempo real (Google OAuth Redirects)
    const { data: authListener } = authService.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        authService.syncUserSession(session.user).then(({ profile, wallet }) => {
          const name = profile?.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0];
          const avatar = profile?.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
          if (name) setUserName(name);
          if (avatar) {
            setUserProfile((prev) => ({
              ...prev,
              avatar,
              name: name || prev.name
            }));
          }
          if (wallet && typeof wallet.valens_balance === 'number') {
            setBalance(wallet.valens_balance);
          }
        }).catch((error) => {
          console.error('Error al sincronizar el perfil después de iniciar sesión:', error);
          showToast('La sesión inició, pero no se pudo sincronizar el perfil.', 'error');
        });
        if (event === 'SIGNED_IN') {
          showToast('¡Sesión iniciada con Google / Supabase!', 'success');
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // 3. Seguimiento GPS Continuo en Tiempo Real (watchPosition) con sincronización en Supabase
  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('geolocation' in navigator) || !navigator.geolocation) return;

    let lastSentTimestamp = 0;
    let watchId = null;

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!pos || !pos.coords) return;
          const { latitude, longitude, accuracy } = pos.coords;
          const coords = [Number(latitude.toFixed(6)), Number(longitude.toFixed(6))];
          setUserGpsCoords(coords);
          setUserGpsAccuracy(accuracy);
          setHasLiveGps(true);

          // Si el usuario está autenticado, actualizar posición en Supabase con throttle de 15 segundos
          const now = Date.now();
          if (currentUser?.id && isSupabaseConfigured && (now - lastSentTimestamp > 15000)) {
            lastSentTimestamp = now;
            profileService.updateLocation(currentUser.id, {
              lat: coords[0],
              lng: coords[1]
            }).catch(() => {});
          }
        },
        (err) => {
          console.warn('AppContext GPS aviso:', err?.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 4000 }
      );
    } catch (e) {
      console.warn('AppContext error al iniciar watchPosition:', e);
    }

    return () => {
      if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          navigator.geolocation.clearWatch(watchId);
        } catch (e) {}
      }
    };
  }, [currentUser?.id]);

  // 4. Suscripción Realtime a Supabase: Perfiles y Ubicaciones de Cadetes en Alta Gracia
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Cargar cadetes remotos activos en primera instancia
    profileService.getOnlineCadetes().then((onlineProfiles) => {
      if (onlineProfiles && onlineProfiles.length > 0) {
        setPeers((prevPeers) => {
          const merged = [...prevPeers];
          onlineProfiles.forEach((remote) => {
            const idx = merged.findIndex((p) => p.id === remote.id);
            const peerData = {
              id: remote.id,
              name: remote.full_name || 'Cadete Gremami',
              category: remote.vehicle_type === 'bicicleta' ? 'bicicleta' :
                remote.vehicle_type === 'caminando' ? 'caminando' :
                remote.vehicle_type === 'auto' ? 'automovil' :
                remote.vehicle_type === 'flete' ? 'fletes' : 'motocicleta',
              serviceModality: remote.service_modality || 'mixto',
              lat: remote.lat,
              lng: remote.lng,
              is_online: remote.is_online,
              avatar: remote.avatar_url,
              phone: remote.whatsapp,
              rating: 5.0
            };
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...peerData };
            } else {
              merged.push(peerData);
            }
          });
          return merged;
        });
      }
    }).catch(() => {});

    // Suscripción a cambios en vivo en la tabla profiles (movimiento GPS en tiempo real)
    const sub = profileService.subscribeToProfiles((payload) => {
      if (payload?.new) {
        const u = payload.new;
        setPeers((prevPeers) => {
          const idx = prevPeers.findIndex((p) => p.id === u.id);
          const peerData = {
            id: u.id,
            name: u.full_name || 'Cadete Gremami',
            category: u.vehicle_type === 'bicicleta' ? 'bicicleta' :
              u.vehicle_type === 'caminando' ? 'caminando' :
              u.vehicle_type === 'auto' ? 'automovil' :
              u.vehicle_type === 'flete' ? 'fletes' : 'motocicleta',
            serviceModality: u.service_modality || 'mixto',
            lat: u.lat,
            lng: u.lng,
            is_online: u.is_online,
            avatar: u.avatar_url,
            phone: u.whatsapp,
            rating: 5.0
          };
          if (idx >= 0) {
            const next = [...prevPeers];
            next[idx] = { ...next[idx], ...peerData };
            return next;
          } else {
            return [...prevPeers, peerData];
          }
        });
      }
    });

    return () => {
      sub?.unsubscribe();
    };
  }, []);

  // Helper to switch role with feedback
  const handleSetRole = (newRole) => {
    setRole(newRole);
    if (newRole === 'cadete') {
      setIsGpsActive(true);
      if (balance < 1.0) {
        showToast('⚠️ Saldo insuficiente (< 1 VALENS) para operar como Cadete', 'warning');
      } else {
        showToast('🟢 Modo Cadete: Visibilidad GPS y radar activa', 'success');
      }
    } else {
      showToast('👤 Modo Cliente: Selecciona una categoría de servicio', 'info');
    }
  };

  // Select category from Home screen and navigate directly to the filtered Map
  const selectCategoryAndGoToMap = (categoryId) => {
    setSelectedCategoryFilter(categoryId);
    setActiveTab('map');
    const categoryObj = PEER_CATEGORIES.find((c) => c.id === categoryId);
    if (categoryObj) {
      showToast(`📍 Mostrando: ${categoryObj.title}`, 'info');
    }
  };

  // Start chat with a specific peer and open chat tab
  const startChatWithPeer = (peer) => {
    setSelectedPeer(null); // close bottom drawer
    if (peer) {
      setPeers((prev) => {
        if (!prev.find((p) => p.id === peer.id)) {
          return [peer, ...prev];
        }
        return prev;
      });
      setActiveChatPeerId(peer.id);
    }
    setActiveTab('chat');
  };

  // Send a regular text message in active chat
  const sendTextMessage = (peerId, text) => {
    if (!text.trim()) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };

    setMessages((prev) => ({
      ...prev,
      [peerId]: [...(prev[peerId] || []), newMessage]
    }));

    // Auto simulated response from peer
    setTimeout(() => {
      const currentPeer = peers.find((p) => p.id === peerId);
      const peerName = currentPeer ? currentPeer.name : 'Contacto';
      
      let replyText = '¡Entendido! Recibí tu mensaje. Estoy disponible para coordinar la entrega.';
      if (text.toLowerCase().includes('hola') || text.toLowerCase().includes('buenas')) {
        replyText = `¡Hola! ¿Cómo estás? ¿Qué paquete o pedido necesitas retirar?`;
      } else if (text.toLowerCase().includes('precio') || text.toLowerCase().includes('cuanto') || text.toLowerCase().includes('tarifa')) {
        replyText = `La tarifa sugerida es $1 USD / $1,250 ARS en efectivo o equivalente en ValensCoin.`;
      } else if (text.toLowerCase().includes('paquete') || text.toLowerCase().includes('sobre') || text.toLowerCase().includes('pedido')) {
        replyText = `Perfecto. Pasame los datos de retiro y entrega para calcular la ruta exacta.`;
      }

      const replyMsg = {
        id: `msg-reply-${Date.now()}`,
        sender: 'peer',
        senderName: peerName,
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      };

      setMessages((prev) => ({
        ...prev,
        [peerId]: [...(prev[peerId] || []), replyMsg]
      }));
    }, 1200);
  };

  // Quick Action: Acordar Pago Local ($1 USD)
  const agreeCashPayment = (peerId, details = {}) => {
    const agreementMsg = {
      id: `cash-${Date.now()}`,
      sender: 'user',
      type: 'cash_agreement',
      amount: '$1.00 USD / $1,250 ARS',
      currency: 'Efectivo Local',
      status: 'Acordado en Mano',
      note: details.note || 'Entrega estándar acordada de forma soberana sin intermediarios',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => ({
      ...prev,
      [peerId]: [...(prev[peerId] || []), agreementMsg]
    }));

    showToast('🤝 Acuerdo de $1 USD en efectivo registrado en el chat', 'success');

    // Peer acceptance response
    setTimeout(() => {
      const peerConfirmMsg = {
        id: `peer-ack-${Date.now()}`,
        sender: 'peer',
        senderName: peers.find(p => p.id === peerId)?.name || 'Cadete',
        text: '✅ Acuerdo de pago local aceptado. Iniciando ruta hacia el punto de retiro.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      };

      setMessages((prev) => ({
        ...prev,
        [peerId]: [...(prev[peerId] || []), peerConfirmMsg]
      }));
    }, 1000);
  };

  // Quick Action: Enviar 1 ValensCoin de Agradecimiento vía QR / directo
  const sendValensTip = (peerId, tipAmount = 1.0) => {
    if (balance < tipAmount) {
      showToast('❌ Saldo insuficiente en Valens Testnet. Usa el Grifo Faucet para recargar.', 'error');
      return { success: false, error: 'insufficient_funds' };
    }

    const peer = peers.find((p) => p.id === peerId) || { name: 'Compañero P2P', address: 'valens1q...' };
    const txHash = '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('') + '...' + Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    // Deduct balance
    setBalance((prev) => +(prev - tipAmount).toFixed(2));

    // Register transaction
    const newTx = {
      id: `tx-${Date.now()}`,
      type: 'tip_sent',
      amount: -tipAmount,
      title: `Propina a ${peer.name}`,
      date: 'Recién',
      hash: txHash,
      status: 'Confirmado (Bloque #840,129)',
      note: 'Agradecimiento P2P instantáneo vía Valens Testnet'
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Send tip bubble in chat
    const tipMsg = {
      id: `tip-${Date.now()}`,
      sender: 'user',
      type: 'valens_tip',
      amount: `${tipAmount} VALENS`,
      txHash: txHash,
      recipient: peer.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => ({
      ...prev,
      [peerId]: [...(prev[peerId] || []), tipMsg]
    }));

    showToast(`⚡ ¡Enviado ${tipAmount} VALENS de agradecimiento a ${peer.name}!`, 'success');

    // Peer gratitude reply
    setTimeout(() => {
      const thankMsg = {
        id: `peer-thanks-${Date.now()}`,
        sender: 'peer',
        senderName: peer.name,
        text: `🦅 ¡Muchísimas gracias por el ${tipAmount} VALENS de propina! Calificación de 5 estrellas agregada a tu perfil. ⭐⭐⭐⭐⭐`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      };

      setMessages((prev) => ({
        ...prev,
        [peerId]: [...(prev[peerId] || []), thankMsg]
      }));
    }, 1500);

    return { success: true, txHash };
  };

  // Testnet Faucet (+5 VALENS)
  const requestFaucet = () => {
    const faucetTxHash = '0xfa' + Array.from({ length: 6 }, () => Math.floor(Math.random() * 16).toString(16)).join('') + '...' + Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    setBalance((prev) => +(prev + 5.0).toFixed(2));

    const newTx = {
      id: `tx-faucet-${Date.now()}`,
      type: 'faucet',
      amount: 5.0,
      title: 'Recarga Testnet Faucet',
      date: 'Recién',
      hash: faucetTxHash,
      status: 'Confirmado (Bloque #840,130)',
      note: 'Grifo de prueba ValensCoin (+5 VALENS)'
    };

    setTransactions((prev) => [newTx, ...prev]);
    showToast('🚰 +5 VALENS recibidos exitosamente desde el Grifo Testnet', 'success');
  };

  // Toggle Theme: Modo Noche (Cripto Dark) vs Modo Día (High Contrast)
  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('gremami_theme', next);
      showToast(
        next === 'dark'
          ? '🌙 Modo Noche (Cripto Dark) activado'
          : '☀️ Modo Día (High Contrast Urbano) activado',
        'info'
      );
      return next;
    });
  };

  // Sistema Antifraude: Generar nuevo PIN dinámico
  const generateNewPin = () => {
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    setOrderPin(newCode);
    setPinStatus('pending');
    setPinFailedAttempts(0);
    setIsPinLocked(false);
    showToast(`🔐 Nuevo PIN Antifraude generado: ${newCode}`, 'info');
    return newCode;
  };

  // Reenviar PIN por Chat P2P
  const resendPinViaChat = (peerId = null) => {
    const targetChatId = peerId || activeChatPeerId;
    const notice = {
      id: `resend-pin-${Date.now()}`,
      sender: 'user',
      type: 'pin_reminder',
      text: `🔐 [PIN Antifraude]: Mi código de 4 dígitos para entrega en mano es "${orderPin}". Recuerda validar contra el pago en dinero local (ARS).`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (targetChatId) {
      setMessages((prev) => ({
        ...prev,
        [targetChatId]: [...(prev[targetChatId] || []), notice]
      }));
    }

    setPinFailedAttempts(0);
    setIsPinLocked(false);
    playP2PAlertChime();
    showToast(`📨 PIN reenviado al chat P2P y campo desbloqueado.`, 'success');
  };

  // Contactar Soporte Comunitario Descentralizado
  const contactCommunitySupport = () => {
    playP2PAlertChime();
    showToast(`🤝 Contactando soporte comunitario descentralizado de Alta Gracia. Un árbitro voluntario asistirá en la validación.`, 'info');
  };

  const resetPinAttempts = () => {
    setPinFailedAttempts(0);
    setIsPinLocked(false);
    showToast('🔓 Intentos de PIN reiniciados.', 'info');
  };

  const closeCelebrationModal = () => {
    setCelebrationData(null);
  };

  // 2. Flujo de Pago Físico, Recaudación Fiduciaria y Liberación de ValensCoin mediante PIN
  const completeDeliveryWithPin = (inputPin, peerId = null, rewardAmount = 1.0, agreedFeeArs = 2000) => {
    if (isPinLocked) {
      showToast('⚠️ Campo bloqueado temporalmente tras 3 intentos. Reenvía el PIN por chat o contacta soporte.', 'warning');
      return { success: false, locked: true };
    }

    const currentPeerObj = peers.find((p) => p.id === (peerId || activeChatPeerId)) || peers[0];
    const peerName = currentPeerObj?.name || 'Cadete / Comercio';

    // Manejo de PIN Incorrecto (Seguridad P2P)
    if (!inputPin || inputPin.trim() !== orderPin) {
      const nextFailed = pinFailedAttempts + 1;
      setPinFailedAttempts(nextFailed);
      playP2PAlertChime();

      if (nextFailed >= 3) {
        setIsPinLocked(true);
        showToast('⚠️ 3 intentos fallidos consecutivos. Campo bloqueado por seguridad P2P.', 'error');
        return { success: false, locked: true, attempts: nextFailed };
      } else {
        showToast(`❌ PIN incorrecto (Intento ${nextFailed}/3). Solicita al cliente su código de 4 dígitos.`, 'error');
        return { success: false, locked: false, attempts: nextFailed };
      }
    }

    // PIN Correcto!
    setPinFailedAttempts(0);
    setIsPinLocked(false);
    setPinStatus('verified');

    const isCadeteUser = role === 'cadete';
    const finalFeeArs = Number(agreedFeeArs || 2000);
    const finalRewardVal = Number(rewardAmount || 1.0);

    // Acreditar simultáneamente el token en el balance (+1.0 VAL)
    setBalance((prev) => +(prev + finalRewardVal).toFixed(2));

    const deliveryId = `del-${Date.now()}`;
    const orderId = `ord-${Date.now()}`;

    // 1. Persistencia atómica en Supabase (tabla 'deliveries' con fallback indetectable a localStorage)
    recordDeliveryTransactionInSupabase({
      delivery_id: deliveryId,
      order_id: orderId,
      cadet_id: CURRENT_CADET_ID,
      client_name: peerName,
      amount_ars: finalFeeArs,
      amount_val: finalRewardVal,
      pin: inputPin,
      created_at: new Date().toISOString()
    });

    // 2. Registrar en historial de órdenes y entregas (ordersHistory)
    const newCadetRecord = {
      id: deliveryId,
      date: 'Recién',
      counterpart: `${peerName} (Cliente)`,
      route: 'Centro Alta Gracia ➔ Destino Verificado',
      amountArs: finalFeeArs,
      amount_ars: finalFeeArs,
      amountUsd: +(finalFeeArs / EXCHANGE_RATES.ARS_PER_USD).toFixed(2),
      valensEarned: finalRewardVal,
      amount_val: finalRewardVal,
      status: 'Completado',
      commissionSavedArs: Math.round(finalFeeArs * 0.30),
      pin: inputPin,
      pinVerified: true,
      timestamp: new Date().toISOString()
    };

    const newClientRecord = {
      id: orderId,
      date: 'Recién',
      counterpart: `${peerName} (Prestador)`,
      route: 'Centro Alta Gracia ➔ Destino Verificado',
      amountArs: finalFeeArs,
      amount_ars: finalFeeArs,
      amountUsd: +(finalFeeArs / EXCHANGE_RATES.ARS_PER_USD).toFixed(2),
      valensReward: finalRewardVal,
      amount_val: finalRewardVal,
      status: 'Completado',
      savingsArs: Math.round(finalFeeArs * 0.30),
      pin: inputPin,
      pinVerified: true,
      timestamp: new Date().toISOString()
    };

    setOrdersHistory((prev) => {
      const updated = {
        cliente: [newClientRecord, ...(prev?.cliente || [])],
        cadete: [newCadetRecord, ...(prev?.cadete || [])]
      };
      try {
        localStorage.setItem('gremami_orders_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 3. Actualizar hitos de perfil del prestador
    setUserProfile((prev) => {
      const next = {
        ...prev,
        milestones: {
          ...prev?.milestones,
          weeklyDeliveries: (prev?.milestones?.weeklyDeliveries || 12) + 1,
          totalTripsAllTime: (prev?.milestones?.totalTripsAllTime || 42) + 1,
          commissionsSavedArs: (prev?.milestones?.commissionsSavedArs || 48500) + Math.round(finalFeeArs * 0.30)
        }
      };
      try {
        localStorage.setItem('gremami_user_profile', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // 4. Registrar transacción en la red con desglose dual (amount_ars y amount_val)
    const txHash = '0xcb' + Array.from({ length: 6 }, () => Math.floor(Math.random() * 16).toString(16)).join('') + '...' + Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const rewardTx = {
      id: `tx-reward-${Date.now()}`,
      type: isCadeteUser ? 'delivery_earnings' : 'cashback_received',
      amount: +finalRewardVal,
      amount_val: +finalRewardVal,
      amountArs: finalFeeArs,
      amount_ars: finalFeeArs,
      title: isCadeteUser ? `Cobro de entrega completada (${peerName})` : `Cashback ValensCoin de ${peerName}`,
      date: 'Recién',
      hash: txHash,
      status: 'Confirmado (Bloque #840,135)',
      note: `Pago de $${finalFeeArs.toLocaleString('es-AR')} ARS recibido sin comisiones + ${finalRewardVal} VAL acreditado (PIN Verificado)`
    };
    setTransactions((prev) => [rewardTx, ...prev]);

    // 5. Mensaje automático en el chat P2P
    const systemNoticeMsg = {
      id: `pin-success-${Date.now()}`,
      sender: 'system',
      type: 'delivery_completed',
      text: `🎉 ¡Entrega verificada exitosamente! Pago fiduciario de $${finalFeeArs.toLocaleString('es-AR')} ARS acreditado al prestador (0% comisión corporativa) y +${finalRewardVal} VAL en ValensCoin.`,
      rewardAmount: finalRewardVal,
      amountArs: finalFeeArs,
      txHash,
      peerName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const targetChatId = peerId || activeChatPeerId;
    if (targetChatId) {
      setMessages((prev) => ({
        ...prev,
        [targetChatId]: [...(prev[targetChatId] || []), systemNoticeMsg]
      }));
    }

    // 6. Sonido festivo y Modal de Dopamina P2P
    playCelebrationSound();
    setCelebrationData({
      open: true,
      rewardAmount: finalRewardVal,
      amountArs: finalFeeArs,
      peerName,
      isCadete: isCadeteUser,
      txHash
    });

    showToast(`🎉 ¡Entrega verificada! +$${finalFeeArs.toLocaleString('es-AR')} ARS recaudados y +${finalRewardVal} VAL acreditados`, 'success');

    return { success: true, locked: false, rewardAmount: finalRewardVal, amountArs: finalFeeArs, peerName };
  };

  // Sistema Antifraude: Verificar PIN ingresado por el cadete
  const verifyPin = (inputPin) => {
    const res = completeDeliveryWithPin(inputPin);
    return res.success;
  };

  // 2. Sistema de Alertas y Notificaciones de Solicitudes en Vivo
  const createServiceRequest = ({ category, description, origin, destination }) => {
    const categoryInfo = PEER_CATEGORIES.find((c) => c.id === category);
    const newReq = {
      id: `req-live-${Date.now()}`,
      clientName: userName || 'Cliente Alta Gracia',
      category: category || 'bicicleta',
      categoryLabel: categoryInfo?.title || 'Servicio P2P',
      description: description?.trim() || 'Mandado / entrega rápida en Alta Gracia',
      origin: origin?.trim() || 'Centro de Alta Gracia (Tajamar / Belgrano)',
      destination: destination?.trim() || 'Bv. Pellegrini / Plaza Solares',
      distanceKm: '0.4 km',
      distanceMeters: 400,
      status: 'pending',
      timestamp: 'Recién',
      urgent: true,
      proposedFeeArs: null,
      proposedFeeValens: null
    };

    setLiveRequests((prev) => [newReq, ...prev]);
    playP2PAlertChime();
    showToast('🚀 ¡Solicitud publicada en vivo a todos los prestadores de Alta Gracia!', 'success');

    // Alerta auditiva/visual para prestadores y cadetes
    setActiveAlert({
      id: newReq.id,
      title: '🔔 ¡Alarma P2P: Nuevo cliente a 0.4 km buscando entrega!',
      subtitle: `${newReq.clientName} solicita: ${newReq.description}`,
      request: newReq
    });

    return newReq;
  };

  // Enviar propuesta de tarifa directa (Modo Cadete)
  const sendFeeProposal = (requestId, proposedFeeArs = 2800, proposedFeeValens = 1.1) => {
    setLiveRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'proposal_sent',
              proposedFeeArs,
              proposedFeeValens
            }
          : r
      )
    );
    playP2PAlertChime();
    showToast(`📨 Propuesta de $${proposedFeeArs.toLocaleString('es-AR')} ARS enviada. Esperando aceptación mutua.`, 'success');
  };

  // Aceptar propuesta y conectar
  const acceptServiceRequest = (requestId, peerId = null) => {
    setLiveRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'accepted' } : r
      )
    );
    if (peerId) {
      setAcceptedConnections((prev) => (prev.includes(peerId) ? prev : [...prev, peerId]));
      setActiveChatPeerId(peerId);
      setActiveTab('chat');
    }
    setActiveAlert(null);
    playP2PAlertChime();
    showToast('🤝 ¡Propuesta aceptada! Chat P2P directo habilitado con éxito.', 'success');
  };

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  // Disparar alarma sonora y visual de prueba
  const triggerAlertTest = () => {
    playP2PAlertChime();
    setActiveAlert({
      id: `alert-${Date.now()}`,
      title: '🔔 ¡Alarma P2P: Nuevo cliente a 0.5 km buscando entrega!',
      subtitle: 'Lucía M. solicita: Retiro de medicamentos en Farmacia Central y entrega en B° Pellegrini',
      request: liveRequests[0] || INITIAL_LIVE_REQUESTS[0]
    });
    showToast('🔔 Alarma P2P en vivo emitida a 0.5 km', 'info');
  };

  // 3. Flujo de Habilitación Condicional del Chat P2P
  const unlockChatConnection = (peerId) => {
    setAcceptedConnections((prev) => {
      if (prev.includes(peerId)) return prev;
      return [...prev, peerId];
    });
    const targetPeer = peers.find((p) => p.id === peerId);
    playP2PAlertChime();
    showToast(`✅ Conexión aceptada con ${targetPeer ? targetPeer.name : 'el prestador'}. Chat directo P2P habilitado.`, 'success');
  };

  const isChatUnlocked = (peerId) => {
    return acceptedConnections.includes(peerId);
  };

  // 4. Solicitud P2P de Imagen de DNI (Intercambio Voluntario entre Cliente y Prestador)
  const requestDniVerification = (peerId) => {
    setDniRequests((prev) => ({ ...prev, [peerId]: 'pending' }));

    // Asegurar que el chat esté habilitado con este prestador
    if (!acceptedConnections.includes(peerId)) {
      setAcceptedConnections((prev) => [...prev, peerId]);
    }
    setActiveChatPeerId(peerId);

    const targetPeer = peers.find((p) => p.id === peerId);
    const peerName = targetPeer ? targetPeer.name : 'el prestador';

    const reqMsg = {
      id: `dni-req-${Date.now()}`,
      sender: 'user',
      senderName: userName || 'Cliente',
      type: 'dni_request',
      status: 'pending',
      peerId,
      text: '🪪 Solicitud P2P de Imagen de DNI: El cliente ha solicitado voluntariamente la confirmación de identidad para mayor transparencia en la entrega activa.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => ({
      ...prev,
      [peerId]: [...(prev[peerId] || []), reqMsg]
    }));

    playP2PAlertChime();
    showToast(`🪪 Solicitud de verificación de DNI enviada a ${peerName} por el Chat P2P.`, 'info');

    // Simulación reactiva: si el rol es cliente, el prestador responde aceptando para permitir la verificación
    if (role !== 'cadete') {
      setTimeout(() => {
        acceptDniVerification(peerId);
      }, 2000);
    }
  };

  const acceptDniVerification = (peerId) => {
    setDniRequests((prev) => ({ ...prev, [peerId]: 'accepted' }));

    const targetPeer = peers.find((p) => p.id === peerId);
    const peerName = targetPeer ? targetPeer.name : 'Prestador';
    const dniImage = targetPeer?.idDocumentUrl || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80";

    const acceptMsg = {
      id: `dni-accepted-${Date.now()}`,
      sender: 'peer',
      senderName: peerName,
      type: 'dni_verified',
      status: 'accepted',
      peerId,
      idDocumentUrl: dniImage,
      text: '🛡️ Identidad Confirmada: El prestador ha aceptado compartir la imagen protegida de su DNI. Visualización habilitada temporalmente para esta entrega activa.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => ({
      ...prev,
      [peerId]: [...(prev[peerId] || []), acceptMsg]
    }));

    playP2PAlertChime();
    showToast(`🛡️ ${peerName} aceptó compartir su DNI protegido en la sala de chat.`, 'success');
  };

  const rejectDniVerification = (peerId) => {
    setDniRequests((prev) => ({ ...prev, [peerId]: 'rejected' }));

    const targetPeer = peers.find((p) => p.id === peerId);
    const peerName = targetPeer ? targetPeer.name : 'Prestador';

    const rejectMsg = {
      id: `dni-reject-${Date.now()}`,
      sender: 'peer',
      senderName: peerName,
      type: 'text',
      text: 'ℹ️ Solicitud de DNI: El prestador prefirió no compartir su documento en este momento.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => ({
      ...prev,
      [peerId]: [...(prev[peerId] || []), rejectMsg]
    }));

    showToast(`ℹ️ La solicitud de DNI no fue aceptada por ${peerName}.`, 'info');
  };

  const getDniVerificationStatus = (peerId) => {
    return dniRequests[peerId] || 'none';
  };

  // 4.5. Sistema de Subasta P2P y Envíos Programados
  const createAuctionRequest = ({ origin, destination, description, scheduledTime, estimatedFeeArs, category = 'bicicleta' }) => {
    const categoryInfo = PEER_CATEGORIES.find((c) => c.id === category);
    const lat = Number((-31.6529 + (Math.random() - 0.5) * 0.009).toFixed(6));
    const lng = Number((-64.4283 + (Math.random() - 0.5) * 0.009).toFixed(6));
    const feeArs = Number(estimatedFeeArs) || 2500;
    const feeValens = +(feeArs / 2400).toFixed(1);

    const newReq = {
      id: `req-live-${Date.now()}`,
      clientName: userName || 'Cliente Alta Gracia',
      clientAvatar: userProfile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      clientRating: 5.0,
      category: category,
      categoryLabel: categoryInfo?.title || 'Servicio de Transporte',
      description: description?.trim() || 'Envío programado en Alta Gracia',
      origin: origin?.trim() || 'Av. Belgrano Centro, Alta Gracia',
      destination: destination?.trim() || 'Bv. Pellegrini, Alta Gracia',
      scheduledTime: scheduledTime || 'Hoy 18:00 hs',
      estimatedFeeArs: feeArs,
      estimatedFeeValens: feeValens,
      lat,
      lng,
      distanceKm: '0.6 km',
      distanceMeters: 600,
      status: 'open',
      timestamp: 'Recién',
      urgent: false,
      offers: []
    };

    setLiveRequests((prev) => [newReq, ...prev]);
    playP2PAlertChime();
    showToast('📢 ¡Envío programado publicado en la Subasta P2P de Alta Gracia!', 'success');

    // Simular que un cadete de Alta Gracia envía una oferta competitiva en 4 segundos para demostración interactiva
    setTimeout(() => {
      const matchingCadete = peers.find((p) => p.category === category) || peers[0];
      const autoOffer = {
        id: `offer-${Date.now()}`,
        cadeteId: matchingCadete.id,
        cadeteName: matchingCadete.name,
        cadeteAvatar: matchingCadete.avatar,
        cadeteRating: matchingCadete.rating,
        vehicle: `${matchingCadete.vehicle} ${matchingCadete.vehicleIcon || '🚲'}`,
        feeArs: Math.max(1200, Math.round((feeArs * (0.88 + Math.random() * 0.2)) / 100) * 100),
        feeValens: matchingCadete.cryptoFee ? parseFloat(matchingCadete.cryptoFee) : feeValens,
        note: `¡Hola! Disponible para ${scheduledTime || 'ese horario'}. Cumplo puntual y con cuidado.`,
        timestamp: 'Recién'
      };
      setLiveRequests((prev) =>
        prev.map((r) =>
          r.id === newReq.id
            ? { ...r, offers: [autoOffer, ...(r.offers || [])] }
            : r
        )
      );
      playP2PAlertChime();
      showToast(`🔔 ¡Nueva oferta recibida de ${matchingCadete.name} para tu subasta!`, 'info');
    }, 4000);

    return newReq;
  };

  const submitCadeteQuote = async (requestId, { feeArs, note }) => {
    const fee = Number(feeArs) || 2500;
    const cadeteReference = peers.find((p) => p.id === 'cadete-moto-1') || peers[0];
    const cadetId = CURRENT_CADET_ID;
    
    // 1. Guardar la cotización en la tabla 'bids' de Supabase
    // Campos: order_id, cadet_id, amount_ars, note, created_at
    try {
      await saveBidToSupabase({
        order_id: requestId,
        cadet_id: cadetId,
        amount_ars: fee,
        note: note?.trim() || `Propuesta económica: $${fee.toLocaleString('es-AR')} ARS.`
      });
    } catch (err) {
      console.warn('Aviso de persistencia en bids de Supabase:', err);
    }

    const newOffer = {
      id: `offer-${Date.now()}`,
      cadeteId: cadetId,
      cadeteName: userName || 'Tú (Cadete Alta Gracia)',
      cadeteAvatar: userProfile?.avatar || cadeteReference.avatar,
      cadeteRating: 5.0,
      vehicle: userProfile?.vehicleType || 'Vehículo Activo 🚀',
      feeArs: fee,
      feeValens: +(fee / 2400).toFixed(1),
      note: note?.trim() || `Propuesta económica: $${fee.toLocaleString('es-AR')} ARS. Entrega puntual.`,
      timestamp: 'Recién',
      isOwnOffer: true
    };

    let isEdit = false;
    setLiveRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const currentOffers = r.offers || [];
          // Si el cadete ya había cotizado para este pedido, actualiza la oferta (Editar / Re-cotizar)
          const existingIdx = currentOffers.findIndex(
            (o) => o.cadeteId === cadetId || o.cadeteId === 'current-user-cadete'
          );
          let updatedOffers;
          if (existingIdx >= 0) {
            isEdit = true;
            updatedOffers = [...currentOffers];
            updatedOffers[existingIdx] = { ...updatedOffers[existingIdx], ...newOffer };
          } else {
            updatedOffers = [newOffer, ...currentOffers];
          }
          return {
            ...r,
            offers: updatedOffers
          };
        }
        return r;
      })
    );
    playP2PAlertChime();
    showToast(
      isEdit
        ? `📝 ¡Cotización actualizada a $${fee.toLocaleString('es-AR')} ARS en Supabase!`
        : `📨 ¡Oferta de $${fee.toLocaleString('es-AR')} ARS registrada en Supabase (tabla bids)!`,
      'success'
    );
    return newOffer;
  };

  const awardAuctionOffer = (requestId, offerId) => {
    let chosenOffer = null;
    let chosenRequest = null;

    setLiveRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          chosenRequest = r;
          const found = r.offers?.find((o) => o.id === offerId);
          if (found) chosenOffer = found;
          return {
            ...r,
            status: 'awarded',
            awardedOfferId: offerId,
            awardedCadete: found
          };
        }
        return r;
      })
    );

    if (chosenOffer) {
      const cadeteChatId = chosenOffer.cadeteId === 'current-user-cadete' ? 'cadete-moto-1' : chosenOffer.cadeteId;
      unlockChatConnection(cadeteChatId);
      setActiveChatPeerId(cadeteChatId);

      const dealMsg = {
        id: `deal-${Date.now()}`,
        sender: 'system',
        type: 'auction_awarded',
        text: `🤝 ¡Subasta Adjudicada con Éxito! Se ha aceptado la oferta de ${chosenOffer.cadeteName} por $${Number(chosenOffer.feeArs).toLocaleString('es-AR')} ARS (${chosenOffer.feeValens || 1.0} VALENS).\n⏰ Horario programado: ${chosenRequest?.scheduledTime || 'A coordinar'}\n📍 Ruta: ${chosenRequest?.origin || 'Origen'} ➔ ${chosenRequest?.destination || 'Destino'}.\nChat P2P activo para coordinar la entrega.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => ({
        ...prev,
        [cadeteChatId]: [...(prev[cadeteChatId] || []), dealMsg]
      }));

      playCelebrationSound();
      showToast(`🤝 ¡Subasta adjudicada a ${chosenOffer.cadeteName}! Chat P2P habilitado.`, 'success');
    }
  };

  // 4.6. Privacidad y Compartición Consentida de WhatsApp dentro del Chat P2P
  const shareWhatsappWithPeer = (peerId) => {
    setSharedWhatsappChats((prev) => ({ ...prev, [peerId]: true }));
    const userPhone = userProfile?.socials?.whatsapp || '+5493547123456';
    const targetPeer = peers.find((p) => p.id === peerId);
    const peerName = targetPeer ? targetPeer.name : 'la contraparte';

    const shareMsg = {
      id: `wa-share-${Date.now()}`,
      sender: 'user',
      senderName: userName || 'Tú',
      type: 'whatsapp_shared',
      phone: userPhone,
      text: `📱 He compartido voluntariamente mi contacto directo de WhatsApp para coordinar esta entrega en Alta Gracia.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => ({
      ...prev,
      [peerId]: [...(prev[peerId] || []), shareMsg]
    }));

    playP2PAlertChime();
    showToast(`📱 Has compartido tu WhatsApp con ${peerName} con consentimiento explícito.`, 'success');

    // Respuesta recíproca simulada de la contraparte tras 1.5 segundos
    setTimeout(() => {
      const peerSocials = getPeerSocials(targetPeer);
      const peerPhone = peerSocials.whatsapp || '+5493547420101';
      const replyMsg = {
        id: `wa-recip-${Date.now()}`,
        sender: 'peer',
        senderName: peerName,
        type: 'whatsapp_shared',
        phone: peerPhone,
        text: `🤝 ¡Excelente! Te comparto también mi contacto directo de WhatsApp para coordinar la ubicación y cualquier detalle de la entrega.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => ({
        ...prev,
        [peerId]: [...(prev[peerId] || []), replyMsg]
      }));

      playP2PAlertChime();
      showToast(`📱 ${peerName} te ha compartido su contacto de WhatsApp.`, 'info');
    }, 1500);
  };

  const isWhatsappSharedWithPeer = (peerId) => {
    return !!sharedWhatsappChats[peerId];
  };

  // 5. Módulo de Seguridad: Bloqueo y Restricción de Usuarios
  const blockUser = (peerId) => {
    const targetPeer = peers.find((p) => p.id === peerId);
    const peerName = targetPeer ? targetPeer.name : 'Usuario';

    setBlockedUserIds((prev) => {
      const next = prev.includes(peerId) ? prev : [...prev, peerId];
      localStorage.setItem('gremami_blocked_users', JSON.stringify(next));
      return next;
    });

    setSelectedPeer(null);

    // Si el chat activo es con el usuario bloqueado, cambiar al primer usuario no bloqueado
    if (activeChatPeerId === peerId) {
      const remaining = peers.filter((p) => p.id !== peerId && !blockedUserIds.includes(p.id));
      if (remaining.length > 0) {
        setActiveChatPeerId(remaining[0].id);
      }
    }

    showToast(`🛡️ Has bloqueado a ${peerName}. Su posición fue ocultada en el mapa y no podrá contactarte.`, 'warning');
  };

  const unblockUser = (peerId) => {
    const targetPeer = peers.find((p) => p.id === peerId);
    const peerName = targetPeer ? targetPeer.name : 'Usuario';

    setBlockedUserIds((prev) => {
      const next = prev.filter((id) => id !== peerId);
      localStorage.setItem('gremami_blocked_users', JSON.stringify(next));
      return next;
    });

    showToast(`✅ Has desbloqueado a ${peerName}. Visible nuevamente en la red P2P.`, 'success');
  };

  const isUserBlocked = (peerId) => {
    return blockedUserIds.includes(peerId);
  };

  // 3. Sistema de Reputación Visual Comunitaria (🟢 Recomendado | 🟡 Denunciado | 🔴 Bloqueado)
  const recommendPeer = (peerId) => {
    setPeers((prev) =>
      prev.map((p) =>
        p.id === peerId
          ? { ...p, recommendations: (p.recommendations || 0) + 1 }
          : p
      )
    );
    const target = peers.find((p) => p.id === peerId);
    playP2PAlertChime();
    showToast(`👍 ¡Has recomendado a ${target?.name || 'este usuario'}! Sumó +1 a su reputación comunitaria en Alta Gracia.`, 'success');
  };

  const reportPeer = (peerId, { reason, details }) => {
    const newReport = {
      id: `rep-${Date.now()}`,
      reason: reason || 'Cobro indebido o incumplimiento',
      details: details?.trim() || 'Reporte de irregularidad registrado por usuario',
      timestamp: 'Recién',
      status: 'active'
    };

    setPeers((prev) =>
      prev.map((p) =>
        p.id === peerId
          ? {
              ...p,
              reportsCount: (p.reportsCount || 0) + 1,
              reputationReports: [newReport, ...(p.reputationReports || [])]
            }
          : p
      )
    );
    const target = peers.find((p) => p.id === peerId);
    playP2PAlertChime();
    showToast(`⚠️ Denuncia registrada contra ${target?.name || 'el usuario'} por "${reason}". Nivel de confianza actualizado a Advertencia (🟡).`, 'warning');
  };

  const getPeerReputation = (peerId) => {
    if (blockedUserIds.includes(peerId)) return 'blocked'; // 🔴 Rojo
    const peer = peers.find((p) => p.id === peerId);
    if (peer && peer.reportsCount > 0) return 'reported'; // 🟡 Amarillo
    return 'recommended'; // 🟢 Verde
  };

  // 4. Mercado P2P DEX (Donaciones y Compra/Venta de ValensCoin)
  const createDexOrder = ({ type, amountValens, unitPriceArs, description, paymentMethod }) => {
    const valensNum = Number(amountValens) || 1.0;
    const priceNum = Number(unitPriceArs) || 0;
    const newOrd = {
      id: `dex-ord-${Date.now()}`,
      type: type || 'donation_request',
      title:
        type === 'donation_request'
          ? '🎁 Pedido de Donación / Solidaridad (1 VALENS)'
          : type === 'sell'
          ? `🛒 Oferta de Venta: ${valensNum} VALENS`
          : `💰 Oferta de Compra: ${valensNum} VALENS`,
      userName: userName || 'Usuario P2P',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      userRole: role === 'cadete' ? 'Cadete Alta Gracia' : 'Cliente Soberano',
      amountValens: valensNum,
      unitPriceArs: priceNum,
      priceArs: valensNum * priceNum,
      paymentMethod: paymentMethod || (type === 'donation_request' ? 'Solidaridad Comunitaria' : 'Mercado Pago / Efectivo'),
      description: description?.trim() || 'Intercambio soberano P2P de tokens ValensCoin',
      status: 'open',
      timestamp: 'Recién'
    };

    setDexOrders((prev) => [newOrd, ...prev]);
    playP2PAlertChime();
    showToast('📈 ¡Orden publicada exitosamente en el Mercado P2P DEX!', 'success');
    return newOrd;
  };

  const donateValens = (orderId, amount = 1.0) => {
    if (balance < amount) {
      showToast('❌ Saldo insuficiente en tu billetera. Recarga con el Grifo Faucet.', 'error');
      return false;
    }

    const targetOrder = dexOrders.find((o) => o.id === orderId);
    const recipientName = targetOrder ? targetOrder.userName : 'Compañero Cadete';

    setBalance((prev) => +(prev - amount).toFixed(2));

    const donationTx = {
      id: `tx-don-${Date.now()}`,
      type: 'donation_sent',
      amount: -amount,
      title: `Donación solidaria a ${recipientName}`,
      date: 'Recién',
      hash: '0xdn' + Array.from({ length: 6 }, () => Math.floor(Math.random() * 16).toString(16)).join('') + '...' + Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      status: 'Confirmado (Bloque #840,132)',
      note: 'Donación comunitaria de reactivación de nodo para cadete en Alta Gracia'
    };

    setTransactions((prev) => [donationTx, ...prev]);

    setDexOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'completed', completedBy: userName }
          : o
      )
    );

    playP2PAlertChime();
    showToast(`🎁 ¡Has donado ${amount} VALENS a ${recipientName}! Su nodo ha sido reactivado en el mapa.`, 'success');
    return true;
  };

  const fulfillDexTrade = (orderId) => {
    const targetOrder = dexOrders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    if (targetOrder.type === 'buy') {
      // El usuario actual le vende VALENS al comprador
      if (balance < targetOrder.amountValens) {
        showToast(`❌ Necesitas al menos ${targetOrder.amountValens} VALENS para vender.`, 'error');
        return;
      }
      setBalance((prev) => +(prev - targetOrder.amountValens).toFixed(2));
      showToast(`🤝 ¡Venta coordinada! Recibirás $${targetOrder.priceArs.toLocaleString('es-AR')} ARS por ${targetOrder.amountValens} VALENS.`, 'success');
    } else if (targetOrder.type === 'sell') {
      // El usuario actual le compra VALENS al vendedor
      setBalance((prev) => +(prev + targetOrder.amountValens).toFixed(2));
      showToast(`🤝 ¡Compra concretada! Se han sumado ${targetOrder.amountValens} VALENS a tu billetera.`, 'success');
    }

    setDexOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'completed' } : o))
    );
    playP2PAlertChime();
  };

  // 4. Conmutador de Estado en Tiempo Real (Online / Offline)
  const toggleOnlineStatus = () => {
    setIsOnline((prev) => {
      const next = !prev;
      localStorage.setItem('gremami_is_online', String(next));
      playP2PAlertChime();
      showToast(
        next
          ? '🟢 ONLINE: Tu nodo está visible en el Mapa P2P y listo para recibir pedidos o fletes.'
          : '⚪ OFFLINE: Desconectado. Ubicación oculta y alertas pausadas.',
        next ? 'success' : 'info'
      );
      return next;
    });
  };

  // Gestión de Perfil Ampliado, Imágenes y Documento de Identidad
  const updateUserProfile = (updates) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updates };
      if (updates.name) setUserName(updates.name);
      localStorage.setItem('gremami_user_profile', JSON.stringify(next));
      showToast('💾 Perfil y datos de cobertura guardados exitosamente', 'success');
      return next;
    });
  };

  // Configuración de Billeteras Virtuales Argentinas para Cobros FIAT ($ ARS)
  const updateFiatPaymentConfig = ({ fiatProvider, fiatAlias, fiatCbuCvu, fiatHolderName, fiatCuit }) => {
    const nextConfig = {
      fiatProvider: fiatProvider || userProfile.fiatProvider || 'Mercado Pago',
      fiatAlias: (fiatAlias || userProfile.fiatAlias || userProfile.aliasCbu || 'cadete.gremami.mp').trim(),
      aliasCbu: (fiatAlias || userProfile.fiatAlias || userProfile.aliasCbu || 'cadete.gremami.mp').trim(),
      fiatCbuCvu: (fiatCbuCvu ?? userProfile.fiatCbuCvu ?? '').trim(),
      fiatHolderName: (fiatHolderName ?? userProfile.fiatHolderName ?? '').trim(),
      fiatCuit: (fiatCuit ?? userProfile.fiatCuit ?? '').trim()
    };

    setUserProfile((prev) => {
      const updated = { ...prev, ...nextConfig };
      localStorage.setItem('gremami_user_profile', JSON.stringify(updated));
      return updated;
    });

    saveFiatPaymentConfigToSupabase({
      cadet_id: CURRENT_CADET_ID,
      fiat_provider: nextConfig.fiatProvider,
      fiat_alias: nextConfig.fiatAlias,
      fiat_cbu_cvu: nextConfig.fiatCbuCvu,
      fiat_holder_name: nextConfig.fiatHolderName,
      fiat_cuit: nextConfig.fiatCuit
    });

    playP2PAlertChime();
    showToast(`💳 Métodos de cobro FIAT guardados (${nextConfig.fiatProvider})`, 'success');
    return nextConfig;
  };

  const uploadAvatar = (dataUrl) => {
    setUserProfile((prev) => {
      const next = { ...prev, avatar: dataUrl };
      localStorage.setItem('gremami_user_profile', JSON.stringify(next));
      showToast('📸 Foto de perfil/logo actualizada', 'success');
      return next;
    });
  };

  const uploadIdDocument = (dataUrl) => {
    setUserProfile((prev) => {
      const next = { ...prev, idDocumentUrl: dataUrl, isIdVerified: true };
      localStorage.setItem('gremami_user_profile', JSON.stringify(next));
      playP2PAlertChime();
      showToast('🛡️ Documento de Identidad cargado. Identidad Validada P2P activada.', 'success');
      return next;
    });
  };

  const toggleIdVerification = () => {
    setUserProfile((prev) => {
      const next = { ...prev, isIdVerified: !prev.isIdVerified };
      localStorage.setItem('gremami_user_profile', JSON.stringify(next));
      showToast(
        next.isIdVerified
          ? '🛡️ Identidad Validada P2P activada'
          : '⚪ Verificación de identidad comunitaria pausada',
        'info'
      );
      return next;
    });
  };

  const copyReferralLink = () => {
    const link = `https://gremami.app/ref/${userProfile.referralCode || 'satoshidev'}`;
    navigator.clipboard.writeText(link);
    playP2PAlertChime();
    showToast('🔗 ¡Enlace de referido copiado! Comparte con colegas cadetes y fletes.', 'success');
    return link;
  };

  const shareMilestones = () => {
    const text = `🚀 ¡Mis Hitos en Gremami P2P Alta Gracia!\n📦 ${userProfile.milestones.weeklyDeliveries} Entregas/Fletes esta semana\n⭐ ${userProfile.milestones.positiveRatingPercent}% Calificación Positiva\n💰 $${userProfile.milestones.commissionsSavedArs.toLocaleString('es-AR')} ARS ahorrados en comisiones intermediarias corporativas.\n\nSúmate a la logística descentralizada: https://gremami.app/ref/${userProfile.referralCode || 'satoshidev'}`;
    navigator.clipboard.writeText(text);
    playP2PAlertChime();
    showToast('🚀 ¡Hitos copiados al portapapeles listos para compartir en WhatsApp o redes!', 'success');
    return text;
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        role,
        setRole: handleSetRole,
        activeTab,
        setActiveTab,
        selectedCategoryFilter,
        setSelectedCategoryFilter,
        selectCategoryAndGoToMap,
        balance,
        setBalance,
        userPublicKey,
        userName,
        setUserName,
        currentUser,
        setCurrentUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        logout: async () => {
          await authService.signOut();
          setCurrentUser(null);
          showToast('Sesión cerrada correctamente', 'info');
        },
        isGpsActive,
        setIsGpsActive,
        selectedPeer,
        setSelectedPeer,
        activeChatPeerId,
        setActiveChatPeerId,
        peers,
        setPeers,
        categories: PEER_CATEGORIES,
        messages,
        transactions,
        seedWords: BIP39_SEED_WORDS,
        startChatWithPeer,
        sendTextMessage,
        agreeCashPayment,
        sendValensTip,
        requestFaucet,
        toast,
        showToast,
        orderPin,
        pinStatus,
        setPinStatus,
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
        ordersHistory,
        setOrdersHistory,
        exchangeRates: EXCHANGE_RATES,
        // Live service requests, auctions and alerts
        liveRequests,
        setLiveRequests,
        createServiceRequest,
        createAuctionRequest,
        submitCadeteQuote,
        awardAuctionOffer,
        sendFeeProposal,
        acceptServiceRequest,
        activeAlert,
        setActiveAlert,
        dismissAlert,
        triggerAlertTest,
        playAlertSound: playP2PAlertChime,
        // Conditional chat connection unlocking
        acceptedConnections,
        unlockChatConnection,
        isChatUnlocked,
        // DNI verification P2P exchange
        dniRequests,
        requestDniVerification,
        acceptDniVerification,
        rejectDniVerification,
        getDniVerificationStatus,
        // Privacidad de WhatsApp y Consentimiento Explícito
        sharedWhatsappChats,
        shareWhatsappWithPeer,
        isWhatsappSharedWithPeer,
        // User blocking and security
        blockedUserIds,
        blockUser,
        unblockUser,
        isUserBlocked,
        formatDistanceKm,
        // Visual reputation system
        recommendPeer,
        reportPeer,
        getPeerReputation,
        // Mercado P2P DEX
        dexOrders,
        setDexOrders,
        createDexOrder,
        donateValens,
        fulfillDexTrade,
        // Real-time Online/Offline status
        isOnline,
        toggleOnlineStatus,
        // Real-time GPS location
        userGpsCoords,
        setUserGpsCoords,
        userGpsAccuracy,
        hasLiveGps,
        // Expanded user profile, images, verification, milestones & referrals
        userProfile,
        updateUserProfile,
        updateFiatPaymentConfig,
        fiatProviders: ARGENTINE_FIAT_PROVIDERS,
        uploadAvatar,
        uploadIdDocument,
        toggleIdVerification,
        copyReferralLink,
        shareMilestones
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
