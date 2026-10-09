import { createClient } from '@supabase/supabase-js';

// 1. Detección y Configuración Segura de Variables de Entorno
const rawEnvUrl = import.meta.env.VITE_SUPABASE_URL;
const rawEnvKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que la URL sea un enlace HTTP/HTTPS válido
const isValidHttpUrl = (str) => {
  if (!str || typeof str !== 'string') return false;
  return (str.startsWith('https://') || str.startsWith('http://')) && !str.startsWith('sb_');
};

export const envKey = (rawEnvKey && !rawEnvKey.startsWith('http')) 
  ? rawEnvKey 
  : 'sb_publishable_dmaLw22X8HXQ0ZIwIS-qag_2SVgWxlN';

// Asegurar que createClient use la URL de Supabase real
export const envUrl = (isValidHttpUrl(rawEnvUrl) && !rawEnvUrl.includes('your-project-id')) 
  ? rawEnvUrl 
  : 'https://wbgaeniwnshlmppvmlcf.supabase.co';

// isSupabaseConfigured: acepta claves JWT (eyJ...) y claves publishable modernas (sb_publishable_...)
export const isSupabaseConfigured = Boolean(
  isValidHttpUrl(envUrl) &&
  !envUrl.includes('your-project-id') &&
  envKey &&
  (envKey.startsWith('sb_') || envKey.startsWith('eyJ') || envKey.startsWith('sb_publishable_'))
);

export const supabase = createClient(envUrl, envKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

const buildMockGoogleUser = (fullName = 'Usuario Demo Google') => {
  const now = Date.now();
  const safeName = String(fullName || 'Usuario Demo Google').trim() || 'Usuario Demo Google';
  const avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  return {
    id: `mock-google-user-${now}`,
    email: `demo.google.${now}@gremami.test`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: {
      provider: 'google',
      providers: ['google']
    },
    user_metadata: {
      full_name: safeName,
      name: safeName,
      avatar_url: avatarUrl,
      picture: avatarUrl,
      role: 'cadete'
    },
    isMock: true
  };
};

// ====================================================================
// FUNCIÓN CENTRAL: SINCRONIZACIÓN AUTOMÁTICA DE PERFIL Y BILLETERA DUAL
// ====================================================================
export const syncUserProfileAndWallet = async (user, additionalData = {}) => {
  if (!user || !user.id) return { profile: null, wallet: null };

  const fullName = additionalData.fullName || 
    user.user_metadata?.full_name || 
    user.user_metadata?.name || 
    user.email?.split('@')[0] || 
    'Usuario Gremami';

  const avatarUrl = user.user_metadata?.avatar_url || 
    user.user_metadata?.picture || 
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  const role = additionalData.role || user.user_metadata?.role || 'cadete';

  let profile = null;
  let wallet = null;

  try {
    // 1. Verificar o Crear Registro en 'profiles'
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      profile = existingProfile;
    } else {
      const newProfile = {
        id: user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        role: role,
        fiat_provider: 'Mercado Pago',
        fiat_alias: 'cadete.gremami.mp',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertedProfile } = await supabase
        .from('profiles')
        .upsert([newProfile])
        .select()
        .maybeSingle();

      profile = insertedProfile || newProfile;
    }

    // 2. Verificar o Crear Registro en 'wallets' con Saldo Inicial Predeterminado (10.0 VAL, 0.0 ARS)
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingWallet) {
      wallet = existingWallet;
    } else {
      const initialWallet = {
        user_id: user.id,
        valens_balance: 10.0,
        ars_collected: 0.0,
        updated_at: new Date().toISOString()
      };

      const { data: insertedWallet } = await supabase
        .from('wallets')
        .upsert([initialWallet])
        .select()
        .maybeSingle();

      wallet = insertedWallet || initialWallet;

      // 3. Registrar Transacción de Faucet / Bienvenida en 'valens_transactions'
      await supabase.from('valens_transactions').insert([{
        receiver_id: user.id,
        amount_val: 10.0,
        amount_ars: 0.0,
        type: 'faucet',
        description: 'Airdrop Inicial de Bienvenida (10.0 VALENS)'
      }]).catch(() => {});
    }
  } catch (err) {
    console.warn('Advertencia durante la sincronización en Supabase:', err);
  }

  // Si falló la conexión remota con Supabase, proveer estructura por defecto válida
  if (!profile) {
    profile = {
      id: user.id,
      full_name: fullName,
      avatar_url: avatarUrl,
      role: role,
      fiat_provider: 'Mercado Pago',
      fiat_alias: 'cadete.gremami.mp',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  if (!wallet) {
    wallet = {
      user_id: user.id,
      valens_balance: 10.0,
      ars_collected: 0.0,
      updated_at: new Date().toISOString()
    };
  }

  // Respaldo en localStorage para disponibilidad local inmediata
  try {
    localStorage.setItem('gremami_auth_user', JSON.stringify({
      ...user,
      profile,
      wallet
    }));
  } catch (e) {}

  return { profile, wallet };
};

// ====================================================================
// 2. MÓDULO DE AUTENTICACIÓN (Supabase Auth Real)
// ====================================================================
export const authService = {
  // Registro de usuario con creación automática de perfil y billetera
  signUp: async ({ email, password, fullName = 'Usuario Gremami', role = 'cadete' }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role
        }
      }
    });

    if (!error && data?.user) {
      await syncUserProfileAndWallet(data.user, { fullName, role });
    }

    return { data, error };
  },

  // Inicio de sesión
  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!error && data?.user) {
      await syncUserProfileAndWallet(data.user);
    }

    return { data, error };
  },

  // 1. Función de Inicio de Sesión / Registro con Google OAuth
  signInWithGoogle: async () => {
    // Usar window.location.origin de forma limpia sin rutas secundarias ni barras al final
    const redirectTarget = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin.replace(/\/+$/, '')
      : 'https://gremami-p2p.vercel.app';

    console.info('[Auth] Google OAuth redirect target:', redirectTarget);

    try {
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTarget,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      // data.url presente = Supabase devolvió la URL de redirección a Google (flujo normal OAuth)
      // No es un error - el browser hará la redirección y el onAuthStateChange en AppContext
      // capturará el SIGNED_IN event cuando el usuario regrese
      if (result?.data?.url) {
        console.info('[Auth] Google OAuth URL recibida, redirigiendo al proveedor de identidad...');
        return result;
      }

      if (result?.error) {
        throw result.error;
      }

      return result;
    } catch (error) {
      // Solo cae aquí si hay un error real de red (CORS, Supabase caído, config incorrecta)
      console.warn('[Auth] Google OAuth no disponible; activando sesión simulada (testnet):', error?.message || error);

      const mockUser = buildMockGoogleUser('Usuario Demo Google');
      const mockWallet = { valens_balance: 10.0 };
      const mockProfile = {
        full_name: mockUser.user_metadata.full_name,
        avatar_url: mockUser.user_metadata.avatar_url,
        role: 'cadete'
      };

      try {
        localStorage.setItem('gremami_auth_user', JSON.stringify({
          ...mockUser,
          profile: mockProfile,
          wallet: mockWallet
        }));
      } catch (e) {
        console.warn('[Auth] No se pudo guardar la sesión mock en localStorage:', e);
      }

      return {
        data: {
          user: mockUser,
          session: {
            user: mockUser,
            access_token: 'mock-google-access-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600
          }
        },
        error: null,
        source: 'mock'
      };
    }
  },

  // Sincronización Automática de Perfil y Billetera Dual tras Login
  syncUserSession: async (user, additionalData = {}) => {
    return await syncUserProfileAndWallet(user, additionalData);
  },

  // Cierre de sesión
  signOut: async () => {
    localStorage.removeItem('gremami_auth_user');
    return await supabase.auth.signOut();
  },

  // Obtener sesión actual (procesa automáticamente tokens y hash OAuth de la URL)
  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data?.session || null;
    } catch (e) {
      console.warn('[Auth] Error obteniendo sesión:', e);
      return null;
    }
  },

  // Usuario actual
  getUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return user;
    } catch (e) {}

    try {
      const saved = localStorage.getItem('gremami_auth_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed?.user || parsed;
    } catch (e) {
      return null;
    }
  },

  // Suscripción al estado de autenticación
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(() => callback(event, session), 0);
    });
  }
};

// ====================================================================
// 3. MÓDULO DE PERFILES DE USUARIO (public.profiles)
// ====================================================================
export const profileService = {
  getProfile: async (userId) => {
    if (!isSupabaseConfigured) {
      const cache = JSON.parse(localStorage.getItem('gremami_supabase_profiles') || '{}');
      return cache[userId] || null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Error leyendo perfil de Supabase:', error.message);
      return null;
    }
    return data;
  },

  upsertProfile: async (profileData) => {
    const payload = {
      ...profileData,
      updated_at: new Date().toISOString()
    };

    // Caché local de respaldo
    try {
      const cache = JSON.parse(localStorage.getItem('gremami_supabase_profiles') || '{}');
      cache[payload.id] = { ...(cache[payload.id] || {}), ...payload };
      localStorage.setItem('gremami_supabase_profiles', JSON.stringify(cache));
    } catch (e) {}

    if (!isSupabaseConfigured) {
      return { success: true, profile: payload, remote: false };
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert([payload]);

    return { success: !error, profile: payload, remote: !error, error };
  },

  // Sincronización automática de perfil con datos de Google OAuth
  syncGoogleUserProfile: async (user) => {
    if (!user) return null;
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario Gremami';
    const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    const role = user.user_metadata?.role || 'cadete';

    const profileData = {
      id: user.id,
      full_name: name,
      avatar_url: avatar,
      role
    };

    return await profileService.upsertProfile(profileData);
  },

  // Actualizar ubicación geográfica en tiempo real
  updateLocation: async (userId, { lat, lng }) => {
    if (!userId) return { success: false };
    const payload = {
      lat: Number(lat),
      lng: Number(lng),
      last_location_update: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!isSupabaseConfigured) {
      try {
        const cache = JSON.parse(localStorage.getItem('gremami_supabase_profiles') || '{}');
        if (cache[userId]) {
          cache[userId] = { ...cache[userId], ...payload };
          localStorage.setItem('gremami_supabase_profiles', JSON.stringify(cache));
        }
      } catch (e) {}
      return { success: true, remote: false };
    }

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    return { success: !error, error };
  },

  // Alternar estado de conexión (Online / Offline)
  toggleOnlineStatus: async (userId, isOnline) => {
    if (!userId) return { success: false };
    const payload = {
      is_online: Boolean(isOnline),
      updated_at: new Date().toISOString()
    };

    if (!isSupabaseConfigured) {
      try {
        const cache = JSON.parse(localStorage.getItem('gremami_supabase_profiles') || '{}');
        if (cache[userId]) {
          cache[userId] = { ...cache[userId], ...payload };
          localStorage.setItem('gremami_supabase_profiles', JSON.stringify(cache));
        }
      } catch (e) {}
      return { success: true, remote: false };
    }

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    return { success: !error, error };
  },

  // Obtener cadetes activos en el mapa de Alta Gracia
  getOnlineCadetes: async () => {
    if (!isSupabaseConfigured) {
      try {
        const cache = JSON.parse(localStorage.getItem('gremami_supabase_profiles') || '{}');
        return Object.values(cache).filter(p => p.is_online && (p.role === 'cadete' || p.role === 'ambos'));
      } catch (e) {
        return [];
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, vehicle_type, service_modality, is_online, payment_alias, lat, lng, coverage_zone, last_location_update')
      .eq('is_online', true)
      .in('role', ['cadete', 'ambos']);

    if (error) {
      console.warn('Error obteniendo cadetes online:', error.message);
      return [];
    }
    return data || [];
  },

  // Suscripción Realtime al estado de perfiles y ubicación
  subscribeToProfiles: (callback) => {
    if (!isSupabaseConfigured) {
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => callback(payload)
      )
      .subscribe();

  },

  // Búsqueda de usuarios públicos vía RPC search_community_users
  searchUsers: async (query) => {
    if (!query || !query.trim()) return [];
    const cleanQuery = query.trim().toLowerCase();

    // Fallback offline: buscar en cache local de profiles
    if (!isSupabaseConfigured) {
      try {
        const cache = JSON.parse(localStorage.getItem('gremami_supabase_profiles') || '{}');
        return Object.values(cache).filter(p =>
          (p.full_name && p.full_name.toLowerCase().includes(cleanQuery)) ||
          (p.username && p.username.toLowerCase().includes(cleanQuery)) ||
          (p.email && p.email.toLowerCase().includes(cleanQuery)) ||
          (p.payment_alias && p.payment_alias.toLowerCase().includes(cleanQuery))
        );
      } catch (e) {
        return [];
      }
    }

    try {
      // Invocar la función RPC search_community_users creada en Supabase
      const { data, error } = await supabase.rpc('search_community_users', {
        search_term: cleanQuery
      });

      if (error) {
        console.warn('Error en RPC search_community_users:', error.message);
        return [];
      }

      // Normalizar campos al formato que espera PublicProfileModal / UserSearchModal
      return (data || []).map((p) => ({
        id: p.id,
        name: p.full_name || p.username || p.email?.split('@')[0] || 'Usuario',
        username: p.username || p.email?.split('@')[0] || 'usuario',
        email: p.email || '',
        avatar: p.avatar_url || '',
        role: p.role || 'cliente',
        roleLabel: p.role === 'cadete' ? 'Cadete P2P' : p.role === 'comercio' ? 'Comercio' : 'Cliente',
        isOnline: Boolean(p.is_online),
        coverageZone: p.coverage_zone || 'Alta Gracia',
        vehicle: p.vehicle_type || '',
        payment_alias: p.payment_alias || '',
        rating: 5.0,
        reviewsCount: 0,
        completedAgreements: 0,
        address: `valens1q${p.id?.slice(0, 12) || 'unknown'}`,
        badges: [p.role === 'cadete' ? 'Cadete Verificado' : 'Miembro Gremami'],
        bio: `Miembro de la comunidad Gremami P2P${p.coverage_zone ? ' — ' + p.coverage_zone : ''}.`,
        reviews: [],
        _source: 'supabase'
      }));
    } catch (err) {
      console.warn('Excepción en searchUsers RPC:', err);
      return [];
    }
  }
};

// ====================================================================
// 4. MÓDULO DE BILLETERAS Y SALDOS DUALES (public.wallets)
// ====================================================================
export const walletService = {
  getWallet: async (userId) => {
    if (!isSupabaseConfigured) {
      const cache = JSON.parse(localStorage.getItem('gremami_supabase_wallets') || '{}');
      return cache[userId] || { user_id: userId, valens_balance: 10.0, ars_collected: 0.0 };
    }

    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.warn('Error leyendo billetera de Supabase:', error.message);
      return { user_id: userId, valens_balance: 10.0, ars_collected: 0.0 };
    }
    return data;
  },

  // Asegurar billetera inicial (10.0 VAL de bienvenida y $0.0 ARS acumulados)
  ensureWallet: async (userId) => {
    if (!userId) return null;
    if (!isSupabaseConfigured) {
      const cache = JSON.parse(localStorage.getItem('gremami_supabase_wallets') || '{}');
      if (!cache[userId]) {
        cache[userId] = { user_id: userId, valens_balance: 10.0, ars_collected: 0.0 };
        localStorage.setItem('gremami_supabase_wallets', JSON.stringify(cache));
      }
      return cache[userId];
    }

    // Comprobar si existe la billetera en Supabase
    const { data: existing } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    // Crear billetera dual con saldo inicial de bienvenida
    const initialWallet = {
      user_id: userId,
      valens_balance: 10.0,
      ars_collected: 0.0,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('wallets')
      .insert([initialWallet])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Error inicializando billetera dual en Supabase:', error.message);
      return initialWallet;
    }

    return data || initialWallet;
  },

  // Suscripción Realtime a cambios en la billetera
  subscribeToWallet: (userId, callback) => {
    if (!isSupabaseConfigured || !userId) {
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel(`wallet-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }
};

// ====================================================================
// 5. MÓDULO DE ÓRDENES Y SUBASTAS EN VIVO (public.orders)
// ====================================================================
export const orderService = {
  getOrders: async ({ status = 'pendiente', category } = {}) => {
    if (!isSupabaseConfigured) {
      const local = JSON.parse(localStorage.getItem('gremami_supabase_orders') || '[]');
      return local.filter((o) => {
        if (status && o.status !== status && !(status === 'open' && (o.status === 'pendiente' || o.status === 'open'))) return false;
        if (category && category !== 'all' && o.category !== category) return false;
        return true;
      });
    }

    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (status) {
      if (status === 'open' || status === 'pendiente') {
        query = query.in('status', ['open', 'pendiente', 'ofertado']);
      } else {
        query = query.eq('status', status);
      }
    }
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error leyendo órdenes de Supabase:', error.message);
      return [];
    }
    return data || [];
  },

  getOrderById: async (orderId) => {
    if (!orderId) return null;
    if (!isSupabaseConfigured) {
      const local = JSON.parse(localStorage.getItem('gremami_supabase_orders') || '[]');
      return local.find((o) => o.id === orderId) || null;
    }
    const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (error) {
      console.warn('Error leyendo orden por id:', error.message);
      return null;
    }
    return data;
  },

  createOrder: async (orderData) => {
    const priceArs = Number(orderData.price_ars || orderData.base_price_ars || orderData.estimatedFeeArs || 2500);
    const rewardVal = Number(orderData.reward_val || orderData.val_incentive || orderData.estimatedFeeValens || 1.0);
    const newOrder = {
      id: orderData.id || `ord-${Date.now()}`,
      client_id: orderData.client_id || null,
      title: orderData.title || orderData.description?.slice(0, 40) || 'Pedido Gremami P2P',
      description: orderData.description || 'Mandado sin descripción',
      category: orderData.category || 'moto',
      status: orderData.status || 'pendiente',
      origin_address: orderData.origin || orderData.origin_address || 'Av. Belgrano Centro, Alta Gracia',
      destination_address: orderData.destination || orderData.destination_address || 'Bv. Pellegrini, Alta Gracia',
      origin_lat: Number(orderData.origin_lat || orderData.lat || -31.6529),
      origin_lng: Number(orderData.origin_lng || orderData.lng || -64.4283),
      price_ars: priceArs,
      base_price_ars: priceArs,
      reward_val: rewardVal,
      val_incentive: rewardVal,
      delivery_pin: String(orderData.delivery_pin || '4821'),
      pin_attempts: 0,
      whatsapp_shared: Boolean(orderData.whatsapp_shared || false),
      cadete_id: orderData.cadete_id || null,
      assigned_cadet_id: orderData.cadete_id || null,
      created_at: new Date().toISOString()
    };

    // Caché local reactivo
    try {
      const cached = JSON.parse(localStorage.getItem('gremami_supabase_orders') || '[]');
      cached.unshift(newOrder);
      localStorage.setItem('gremami_supabase_orders', JSON.stringify(cached.slice(0, 100)));
    } catch (e) {}

    if (!isSupabaseConfigured) {
      return { success: true, order: newOrder, remote: false };
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([newOrder])
      .select()
      .single();

    return { success: !error, order: data || newOrder, remote: !error, error };
  },

  updateOrderStatus: async (orderId, status, cadeteId = null) => {
    const updatePayload = {
      status,
      updated_at: new Date().toISOString()
    };
    if (cadeteId) {
      updatePayload.cadete_id = cadeteId;
      updatePayload.assigned_cadet_id = cadeteId;
    }
    if (status === 'completado' || status === 'completed') {
      updatePayload.completed_at = new Date().toISOString();
    }

    if (!isSupabaseConfigured) {
      return { success: true, remote: false };
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    return { success: !error, data, error };
  },

  shareWhatsApp: async (orderId, shared = true) => {
    if (!orderId) return { success: false };
    if (!isSupabaseConfigured) return { success: true, remote: false };
    const { error } = await supabase
      .from('orders')
      .update({ whatsapp_shared: Boolean(shared), updated_at: new Date().toISOString() })
      .eq('id', orderId);
    return { success: !error, error };
  },

  // Suscripción Realtime a Nuevas Órdenes y Cambios en el Mapa
  subscribeToLiveOrders: (callback) => {
    if (!isSupabaseConfigured) {
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => callback(payload)
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  },

  subscribeToOrders: (callback) => orderService.subscribeToLiveOrders(callback)
};

export const mandadosService = orderService;

// ====================================================================
// 6. MÓDULO DE OFERTAS Y SUBASTAS (public.offers & public.bids)
// ====================================================================
export const offerService = {
  getOffers: async (orderId) => {
    if (!orderId) return [];
    if (!isSupabaseConfigured) {
      const cached = JSON.parse(localStorage.getItem('gremami_supabase_offers') || '[]');
      return cached.filter((o) => o.order_id === orderId);
    }

    const { data, error } = await supabase
      .from('offers')
      .select('*, cadete:profiles(id, full_name, avatar_url, vehicle_type)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error leyendo offers de Supabase:', error.message);
      return [];
    }
    return data || [];
  },

  submitOffer: async ({ order_id, cadete_id, proposed_price_ars, note }) => {
    const newOffer = {
      order_id,
      cadete_id,
      proposed_price_ars: Number(proposed_price_ars),
      note: String(note || '').trim(),
      status: 'pendiente',
      created_at: new Date().toISOString()
    };

    try {
      const cached = JSON.parse(localStorage.getItem('gremami_supabase_offers') || '[]');
      cached.unshift(newOffer);
      localStorage.setItem('gremami_supabase_offers', JSON.stringify(cached.slice(0, 100)));
    } catch (e) {}

    if (!isSupabaseConfigured) {
      return { success: true, offer: newOffer, remote: false };
    }

    const { data, error } = await supabase
      .from('offers')
      .insert([newOffer])
      .select()
      .single();

    if (!error) {
      await supabase
        .from('orders')
        .update({ status: 'ofertado' })
        .eq('id', order_id)
        .eq('status', 'pendiente');
    }

    return { success: !error, offer: data || newOffer, remote: !error, error };
  },

  acceptOffer: async (offerId, orderId, cadeteId, proposedPriceArs) => {
    if (!isSupabaseConfigured) return { success: true, remote: false };

    // 1. Aceptar oferta elegida
    const { error: offerErr } = await supabase
      .from('offers')
      .update({ status: 'aceptada' })
      .eq('id', offerId);

    if (offerErr) return { success: false, error: offerErr };

    // 2. Marcar resto de ofertas como rechazadas
    await supabase
      .from('offers')
      .update({ status: 'rechazada' })
      .eq('order_id', orderId)
      .neq('id', offerId);

    // 3. Asignar orden al cadete y pasar a 'en_curso'
    const { error: orderErr } = await supabase
      .from('orders')
      .update({
        cadete_id: cadeteId,
        assigned_cadet_id: cadeteId,
        price_ars: proposedPriceArs,
        base_price_ars: proposedPriceArs,
        status: 'en_curso',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    return { success: !orderErr, error: orderErr };
  },

  rejectOffer: async (offerId) => {
    if (!isSupabaseConfigured) return { success: true, remote: false };
    const { error } = await supabase
      .from('offers')
      .update({ status: 'rechazada' })
      .eq('id', offerId);
    return { success: !error, error };
  },

  subscribeToOffers: (orderId, callback) => {
    if (!isSupabaseConfigured || !orderId) return { unsubscribe: () => {} };
    const channel = supabase
      .channel(`offers-order-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'offers', filter: `order_id=eq.${orderId}` },
        (payload) => callback(payload)
      )
      .subscribe();
    return { unsubscribe: () => { supabase.removeChannel(channel); } };
  }
};

export const offersService = offerService;

// Compatibilidad con código previo de bids
export const bidService = {
  getBidsForOrder: async (orderId) => {
    return await offerService.getOffers(orderId);
  },
  submitBid: async ({ order_id, cadet_id = 'current-cadet-satoshidev', amount_ars, note }) => {
    return await offerService.submitOffer({
      order_id,
      cadete_id: cadet_id,
      proposed_price_ars: amount_ars,
      note
    });
  },
  subscribeToBids: (orderId, callback) => {
    return offerService.subscribeToOffers(orderId, callback);
  }
};

// ====================================================================
// 7. MÓDULO DE MENSAJERÍA INSTANTÁNEA (public.messages)
// ====================================================================
export const messageService = {
  getMessages: async (orderId) => {
    if (!orderId) return [];
    if (!isSupabaseConfigured) {
      const cached = JSON.parse(localStorage.getItem('gremami_supabase_messages') || '[]');
      return cached.filter((m) => m.order_id === orderId);
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(id, full_name, avatar_url)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error leyendo messages:', error.message);
      return [];
    }
    return data || [];
  },

  sendMessage: async ({ order_id, sender_id, text, is_system_event = false }) => {
    const newMsg = {
      order_id,
      sender_id,
      text: String(text || '').trim(),
      is_system_event: Boolean(is_system_event),
      created_at: new Date().toISOString()
    };

    try {
      const cached = JSON.parse(localStorage.getItem('gremami_supabase_messages') || '[]');
      cached.push(newMsg);
      localStorage.setItem('gremami_supabase_messages', JSON.stringify(cached.slice(-200)));
    } catch (e) {}

    if (!isSupabaseConfigured) return { success: true, message: newMsg, remote: false };

    const { data, error } = await supabase
      .from('messages')
      .insert([newMsg])
      .select()
      .single();

    return { success: !error, message: data || newMsg, remote: !error, error };
  },

  subscribeToMessages: (orderId, callback) => {
    if (!isSupabaseConfigured || !orderId) return { unsubscribe: () => {} };
    const channel = supabase
      .channel(`chat-order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${orderId}` },
        (payload) => callback(payload.new)
      )
      .subscribe();
    return { unsubscribe: () => { supabase.removeChannel(channel); } };
  }
};

export const messagesService = messageService;
export const chatService = messageService;

// ====================================================================
// 8. MÓDULO DE REPUTACIÓN Y RESEÑAS (public.reviews)
// ====================================================================
export const reviewService = {
  getReviewsForUser: async (userId) => {
    if (!userId || !isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('reviews')
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url)')
      .eq('reviewed_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error leyendo reviews:', error.message);
      return [];
    }
    return data || [];
  },

  submitReview: async ({ order_id = null, reviewer_id, reviewed_id, stars, comment = '' }) => {
    const reviewData = {
      order_id,
      reviewer_id,
      reviewed_id,
      stars: Math.max(1, Math.min(5, Number(stars) || 5)),
      comment: String(comment || '').trim(),
      created_at: new Date().toISOString()
    };

    if (!isSupabaseConfigured) return { success: true, review: reviewData, remote: false };

    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single();

    return { success: !error, review: data || reviewData, error };
  },

  getUserRating: async (userId) => {
    const reviews = await reviewService.getReviewsForUser(userId);
    if (!reviews.length) return { average: 5.0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + (r.stars || 5), 0);
    return {
      average: Number((sum / reviews.length).toFixed(1)),
      count: reviews.length
    };
  }
};

export const reviewsService = reviewService;

// ====================================================================
// 9. MÓDULO DE BLOQUEOS DE SEGURIDAD P2P (public.user_blocks)
// ====================================================================
export const blockService = {
  getBlockedUsers: async (userId) => {
    if (!userId || !isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('user_blocks')
      .select('blocked_id, created_at, blocked:profiles!user_blocks_blocked_id_fkey(id, full_name, avatar_url)')
      .eq('blocker_id', userId);

    if (error) return [];
    return data || [];
  },

  blockUser: async (blockerId, blockedId) => {
    if (!blockerId || !blockedId) return { success: false };
    if (!isSupabaseConfigured) return { success: true, remote: false };

    const { error } = await supabase
      .from('user_blocks')
      .insert([{ blocker_id: blockerId, blocked_id: blockedId }]);

    return { success: !error, error };
  },

  unblockUser: async (blockerId, blockedId) => {
    if (!blockerId || !blockedId) return { success: false };
    if (!isSupabaseConfigured) return { success: true, remote: false };

    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);

    return { success: !error, error };
  },

  isBlocked: async (userA, userB) => {
    if (!userA || !userB || !isSupabaseConfigured) return false;
    const { data } = await supabase
      .from('user_blocks')
      .select('id')
      .or(`and(blocker_id.eq.${userA},blocked_id.eq.${userB}),and(blocker_id.eq.${userB},blocked_id.eq.${userA})`)
      .limit(1);

    return Boolean(data && data.length > 0);
  }
};

export const blocksService = blockService;

// ====================================================================
// 10. MÓDULO DE DENUNCIAS COMUNITARIAS (public.user_reports)
// ====================================================================
export const reportService = {
  submitReport: async ({ reporter_id, reported_id, reason }) => {
    const reportData = {
      reporter_id,
      reported_id,
      reason: String(reason || '').trim(),
      status: 'pendiente',
      created_at: new Date().toISOString()
    };

    if (!isSupabaseConfigured) return { success: true, report: reportData, remote: false };

    const { data, error } = await supabase
      .from('user_reports')
      .insert([reportData])
      .select()
      .single();

    return { success: !error, report: data || reportData, error };
  },

  getUserReports: async (userId) => {
    if (!userId || !isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('user_reports')
      .select('*')
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false });

    return (!error && data) ? data : [];
  }
};

export const reportsService = reportService;

// ====================================================================
// 11. MÓDULO DEX P2P DE TOKENS VALENSCOIN (public.dex_orders)
// ====================================================================
export const dexService = {
  getOrders: async ({ orderType = null, status = 'abierta' } = {}) => {
    if (!isSupabaseConfigured) {
      const cached = JSON.parse(localStorage.getItem('gremami_supabase_dex') || '[]');
      return cached.filter((d) => (!status || d.status === status) && (!orderType || d.order_type === orderType));
    }

    let query = supabase
      .from('dex_orders')
      .select('*, user:profiles(id, full_name, avatar_url, payment_alias)')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (orderType) query = query.eq('order_type', orderType);

    const { data, error } = await query;
    if (error) {
      console.warn('Error leyendo dex_orders:', error.message);
      return [];
    }
    return data || [];
  },

  createOrder: async ({ user_id, order_type, amount_val, price_ars_unit, payment_method = 'Mercado Pago' }) => {
    const newOrder = {
      user_id,
      order_type,
      amount_val: Number(amount_val),
      price_ars_unit: Number(price_ars_unit),
      payment_method,
      status: 'abierta',
      created_at: new Date().toISOString()
    };

    try {
      const cached = JSON.parse(localStorage.getItem('gremami_supabase_dex') || '[]');
      cached.unshift(newOrder);
      localStorage.setItem('gremami_supabase_dex', JSON.stringify(cached.slice(0, 100)));
    } catch (e) {}

    if (!isSupabaseConfigured) return { success: true, order: newOrder, remote: false };

    const { data, error } = await supabase
      .from('dex_orders')
      .insert([newOrder])
      .select()
      .single();

    return { success: !error, order: data || newOrder, error };
  },

  cancelOrder: async (orderId, userId) => {
    if (!isSupabaseConfigured) return { success: true, remote: false };

    const { error } = await supabase
      .from('dex_orders')
      .update({ status: 'cancelada' })
      .eq('id', orderId)
      .eq('user_id', userId);

    return { success: !error, error };
  },

  subscribeToDexOrders: (callback) => {
    if (!isSupabaseConfigured) return { unsubscribe: () => {} };
    const channel = supabase
      .channel('public:dex_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dex_orders' },
        (payload) => callback(payload)
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }
};

// ====================================================================
// 12. MÓDULO DE LIBERACIÓN POR PIN (RPC ATÓMICO) & TRANSACCIONES
// ====================================================================
export const transactionService = {
  releaseRewardByPin: async ({ orderId, pin, cadetId = 'current-cadet-satoshidev' }) => {
    if (!isSupabaseConfigured) {
      console.info('Simulación RPC Local: Liberación por PIN validada localmente.');
      return {
        success: true,
        order_id: orderId,
        cadet_id: cadetId,
        amount_ars: 2500,
        amount_val: 1.0,
        message: 'Entrega verificada con PIN local (Modo Offline/Simulado)'
      };
    }

    const { data, error } = await supabase.rpc('release_reward_by_pin', {
      p_order_id: orderId,
      p_pin: String(pin).trim(),
      p_cadet_id: cadetId
    });

    if (error) {
      console.error('Error ejecutando RPC release_reward_by_pin:', error.message);
      return { success: false, error: error.message };
    }

    return data;
  },

  getTransactions: async (userId) => {
    if (!isSupabaseConfigured) {
      return JSON.parse(localStorage.getItem('gremami_supabase_txs') || '[]');
    }

    const { data, error } = await supabase
      .from('valens_transactions')
      .select('*')
      .or(`from_user.eq.${userId},to_user.eq.${userId},sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error leyendo transacciones de Supabase:', error.message);
      return [];
    }
    return data || [];
  }
};

// ====================================================================
// 13. MÓDULO DE ALMACENAMIENTO DE ARCHIVOS (Supabase Storage Buckets)
// Buckets: avatars (público), shops (público), verifications (privado)
// ====================================================================
export const storageService = {
  uploadAvatar: async (userId, file) => {
    if (!isSupabaseConfigured || !userId || !file) return { success: false, url: null };
    try {
      const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.warn('Error subiendo avatar:', error.message);
        return { success: false, error: error.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);

      return { success: true, url: publicUrl, path: filePath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  uploadVerificationDoc: async (userId, file, docName = 'dni') => {
    if (!isSupabaseConfigured || !userId || !file) return { success: false };
    try {
      const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
      const filePath = `${userId}/${docName}-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from('verifications')
        .upload(filePath, file, { upsert: true });

      if (error) return { success: false, error: error.message };
      return { success: true, path: filePath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  uploadShopImage: async (shopId, file) => {
    if (!isSupabaseConfigured || !shopId || !file) return { success: false, url: null };
    try {
      const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
      const filePath = `${shopId}/logo-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from('shops')
        .upload(filePath, file, { upsert: true });

      if (error) return { success: false, error: error.message };

      const { data: { publicUrl } } = supabase.storage
        .from('shops')
        .getPublicUrl(filePath);

      return { success: true, url: publicUrl, path: filePath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  getPublicUrl: (bucket, path) => {
    if (!isSupabaseConfigured || !bucket || !path) return '';
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || '';
  }
};

// ====================================================================
// 14. MÓDULO VALENSCOIN CRIPTO — transferTokens, claimFaucet, getTokenGenesis
// ====================================================================
export const valensService = {
  /**
   * Transfiere tokens VAL (enteros) usando RPC atómica o fallback local.
   */
  transferTokens: async ({ senderId, receiverAddress, amount }) => {
    const intAmount = Math.floor(Number(amount));
    if (intAmount <= 0) return { success: false, error: 'Monto inválido: debe ser entero > 0.' };
    if (!receiverAddress || !receiverAddress.startsWith('valens')) {
      return { success: false, error: 'Dirección de destino inválida. Debe iniciar con valens...' };
    }

    if (!isSupabaseConfigured || !senderId) {
      // Fallback local — sin conexión a Supabase
      const txHash = '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      return { success: true, txHash, amount: intAmount, remote: false };
    }

    const { data, error } = await supabase.rpc('transfer_valens_tokens', {
      p_sender_id: senderId,
      p_receiver_addr: receiverAddress,
      p_amount: intAmount
    });

    if (error) {
      console.warn('Error en RPC transfer_valens_tokens:', error.message);
      return { success: false, error: error.message };
    }
    return data || { success: false, error: 'Respuesta vacía del servidor.' };
  },

  /**
   * Reclama +5 VAL del grifo usando RPC atómica o fallback local.
   */
  claimFaucet: async (userId) => {
    if (!isSupabaseConfigured || !userId) {
      const txHash = '0xfa' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      return { success: true, txHash, amount: 5, remote: false };
    }

    const { data, error } = await supabase.rpc('claim_faucet_tokens', {
      p_user_id: userId
    });

    if (error) {
      console.warn('Error en RPC claim_faucet_tokens:', error.message);
      return { success: false, error: error.message };
    }
    return data || { success: true, amount: 5 };
  },

  /**
   * Lee la configuración de token_genesis (suministro total, decimales, etc.).
   */
  getTokenGenesis: async () => {
    const defaultGenesis = {
      token_symbol: 'VAL',
      token_name: 'ValensCoin',
      total_supply: 1000000000000,
      decimals: 0,
      faucet_drip_amount: 5,
      initial_user_airdrop: 10,
      reserve_balance: 1000000000000
    };

    if (!isSupabaseConfigured) return defaultGenesis;

    const { data, error } = await supabase
      .from('token_genesis')
      .select('*')
      .eq('token_symbol', 'VAL')
      .maybeSingle();

    if (error || !data) return defaultGenesis;
    return data;
  }
};

export default supabase;

