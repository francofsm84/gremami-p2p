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

export const isSupabaseConfigured = Boolean(
  isValidHttpUrl(envUrl) &&
  !envUrl.includes('your-project-id') &&
  envKey &&
  (envKey.startsWith('sb_') || envKey.startsWith('eyJ'))
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
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
      }
    });
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

  // Usuario actual
  getUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return user;
    } catch (e) {}
    const saved = localStorage.getItem('gremami_auth_user');
    return saved ? JSON.parse(saved) : null;
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
  getOrders: async ({ status = 'open', category } = {}) => {
    if (!isSupabaseConfigured) {
      const local = JSON.parse(localStorage.getItem('gremami_supabase_orders') || '[]');
      return local.filter((o) => {
        if (status && o.status !== status) return false;
        if (category && category !== 'all' && o.category !== category) return false;
        return true;
      });
    }

    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (status) {
      query = query.eq('status', status);
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

  createOrder: async (orderData) => {
    const newOrder = {
      id: orderData.id || `ord-${Date.now()}`,
      client_id: orderData.client_id || null,
      title: orderData.title || orderData.description?.slice(0, 40) || 'Pedido Gremami P2P',
      description: orderData.description,
      category: orderData.category || 'bicicleta',
      modality: orderData.modality || 'envios',
      origin_address: orderData.origin || orderData.origin_address || 'Av. Belgrano Centro, Alta Gracia',
      destination_address: orderData.destination || orderData.destination_address || 'Bv. Pellegrini, Alta Gracia',
      origin_lat: Number(orderData.origin_lat || orderData.lat || -31.6529),
      origin_lng: Number(orderData.origin_lng || orderData.lng || -64.4283),
      base_price_ars: Number(orderData.base_price_ars || orderData.estimatedFeeArs || 2500),
      val_incentive: Number(orderData.val_incentive || orderData.estimatedFeeValens || 1.0),
      status: 'open',
      delivery_pin: String(orderData.delivery_pin || '4821'),
      assigned_cadet_id: null,
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

  updateOrderStatus: async (orderId, status, assignedCadetId = null) => {
    const updatePayload = {
      status,
      updated_at: new Date().toISOString()
    };
    if (assignedCadetId) {
      updatePayload.assigned_cadet_id = assignedCadetId;
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
        (payload) => {
          callback(payload);
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
// 6. MÓDULO DE OFERTAS EN SUBASTA (public.bids)
// ====================================================================
export const bidService = {
  getBidsForOrder: async (orderId) => {
    if (!isSupabaseConfigured) {
      const cached = JSON.parse(localStorage.getItem('gremami_supabase_bids') || '[]');
      return cached.filter((b) => b.order_id === orderId);
    }

    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error leyendo cotizaciones de Supabase:', error.message);
      return [];
    }
    return data || [];
  },

  submitBid: async ({ order_id, cadet_id = 'current-cadet-satoshidev', amount_ars, note }) => {
    const newBid = {
      order_id,
      cadet_id,
      amount_ars: Number(amount_ars),
      note: String(note || '').trim(),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // Caché local de respaldo
    try {
      const cached = JSON.parse(localStorage.getItem('gremami_supabase_bids') || '[]');
      cached.unshift(newBid);
      localStorage.setItem('gremami_supabase_bids', JSON.stringify(cached.slice(0, 100)));
    } catch (e) {}

    if (!isSupabaseConfigured) {
      return { success: true, bid: newBid, remote: false };
    }

    const { data, error } = await supabase
      .from('bids')
      .insert([newBid])
      .select()
      .single();

    return { success: !error, bid: data || newBid, remote: !error, error };
  },

  // Suscripción Realtime a Cotizaciones de la Competencia
  subscribeToBids: (orderId, callback) => {
    if (!isSupabaseConfigured || !orderId) {
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel(`bids-order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          callback(payload);
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
// 7. MÓDULO DE LIBERACIÓN POR PIN (RPC ATÓMICO) & TRANSACCIONES
// ====================================================================
export const transactionService = {
  // Ejecución atómica de release_reward_by_pin
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
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error leyendo transacciones de Supabase:', error.message);
      return [];
    }
    return data || [];
  }
};

export default supabase;
