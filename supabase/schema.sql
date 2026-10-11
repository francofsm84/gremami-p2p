-- ====================================================================
-- GREMAMI P2P - ESQUEMA INTEGRAL DE BASE DE DATOS, STORAGE Y BACKEND
-- Región: Alta Gracia, Valle de Paravachasca y Gran Córdoba
-- Auditoría Integral: Tablas, RLS, Realtime y Storage Buckets
-- ====================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. TABLA: PROFILES (Usuarios, Cadetes, Clientes y Comercios)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Usuario Gremami',
  avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role TEXT CHECK (role IN ('cliente', 'cadete', 'comercio', 'ambos')) DEFAULT 'cadete',
  vehicle_type TEXT CHECK (vehicle_type IN ('caminando', 'bicicleta', 'moto', 'auto', 'flete')) DEFAULT 'moto',
  service_modality TEXT CHECK (service_modality IN ('pasajeros', 'paqueteria', 'mixto', 'envios')) DEFAULT 'mixto',
  is_online BOOLEAN DEFAULT false,
  payment_alias TEXT DEFAULT 'cadete.gremami.mp',
  whatsapp TEXT DEFAULT '',
  coverage_zone TEXT DEFAULT 'Alta Gracia & Valle de Paravachasca',
  lat DOUBLE PRECISION DEFAULT -31.6529,
  lng DOUBLE PRECISION DEFAULT -64.4283,
  last_location_update TIMESTAMPTZ DEFAULT NOW(),
  referral_code TEXT,
  referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Campos auxiliares de cobro y reputación
  fiat_provider TEXT DEFAULT 'Mercado Pago',
  fiat_alias TEXT DEFAULT 'cadete.gremami.mp',
  fiat_cbu_cvu TEXT,
  fiat_holder_name TEXT,
  fiat_cuit TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compatibilidad con proyectos donde profiles se creó antes de vehicle_type.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT NOT NULL DEFAULT 'moto'
  CHECK (vehicle_type IN ('caminando', 'bicicleta', 'moto', 'auto', 'flete'));

-- Añadir email y username a profiles para búsqueda pública sin acceder a auth.users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Índices para búsqueda rápida por email y username
CREATE INDEX IF NOT EXISTS idx_profiles_email    ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ====================================================================
-- 2. TABLA: ORDERS (Mandados / Solicitudes de Logística P2P)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cadete_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_cadet_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- compatibilidad
  title TEXT NOT NULL DEFAULT 'Mandado Gremami P2P',
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('caminando', 'bicicleta', 'moto', 'motocicleta', 'auto', 'automovil', 'flete', 'fletes')),
  status TEXT CHECK (status IN (
    'pendiente', 'ofertado', 'en_curso', 'completado', 'cancelado',
    'open', 'assigned', 'in_transit', 'completed', 'cancelled'
  )) DEFAULT 'pendiente',
  origin_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL DEFAULT -31.6529,
  origin_lng DOUBLE PRECISION NOT NULL DEFAULT -64.4283,
  price_ars NUMERIC(12, 2) NOT NULL DEFAULT 2500.0,
  base_price_ars NUMERIC(12, 2) DEFAULT 2500.0, -- compatibilidad
  reward_val NUMERIC(8, 2) NOT NULL DEFAULT 1.0,
  val_incentive NUMERIC(8, 2) DEFAULT 1.0, -- compatibilidad
  delivery_pin VARCHAR(4) NOT NULL DEFAULT lpad((floor(random() * 9000) + 1000)::int::text, 4, '0'),
  pin_attempts INT NOT NULL DEFAULT 0,
  whatsapp_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vista Segura: Perfiles Públicos con Enmascaramiento de WhatsApp Sensible
CREATE OR REPLACE VIEW public.profiles_public AS
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.role,
    p.vehicle_type,
    p.service_modality,
    p.is_online,
    p.payment_alias,
    p.coverage_zone,
    p.lat,
    p.lng,
    p.last_location_update,
    p.referral_code,
    p.referred_by,
    p.created_at,
    -- El número de WhatsApp permanece privado por defecto, solo visible si se compartió en una orden activa
    CASE 
      WHEN auth.uid() = p.id THEN p.whatsapp
      WHEN EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.whatsapp_shared = true
          AND ((o.client_id = auth.uid() AND (o.cadete_id = p.id OR o.assigned_cadet_id = p.id))
            OR ((o.cadete_id = auth.uid() OR o.assigned_cadet_id = auth.uid()) AND o.client_id = p.id))
      ) THEN p.whatsapp
      ELSE NULL
    END AS whatsapp
  FROM public.profiles p;

-- Vista de compatibilidad para "mandados"
CREATE OR REPLACE VIEW public.mandados AS
  SELECT * FROM public.orders;

-- ====================================================================
-- 3. TABLA: OFFERS / BIDS (Ofertas y Subastas P2P en Vivo)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  cadete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proposed_price_ars NUMERIC(12, 2) NOT NULL,
  note TEXT,
  status TEXT CHECK (status IN ('pendiente', 'aceptada', 'rechazada', 'pending', 'accepted', 'rejected')) DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vista/Tabla de compatibilidad para "bids"
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  cadet_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_ars NUMERIC(12, 2) NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'pendiente', 'aceptada', 'rechazada')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 4. TABLA: MESSAGES / CHATS (Mensajería P2P por Mandado)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_system_event BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 5. TABLA: REVIEWS (Sistema de Reputación y Estrellas)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stars INT CHECK (stars BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 6. TABLA: USER_BLOCKS (Seguridad y Bloqueo P2P)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_blocker_blocked UNIQUE (blocker_id, blocked_id)
);

-- ====================================================================
-- 7. TABLA: USER_REPORTS (Denuncias y Moderación Comunitaria)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pendiente', 'revisado')) DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 8. TABLA: DEX_ORDERS (Mercado P2P de Tokens ValensCoin)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.dex_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_type TEXT CHECK (order_type IN ('donacion', 'venta_val', 'compra_val')) NOT NULL,
  amount_val NUMERIC(14, 2) NOT NULL,
  price_ars_unit NUMERIC(14, 2) NOT NULL,
  payment_method TEXT DEFAULT 'Mercado Pago',
  status TEXT CHECK (status IN ('abierta', 'completada', 'cancelada')) DEFAULT 'abierta',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 9. TABLA: WALLETS (Billeteras Duales)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance_ars NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
  balance_val NUMERIC(14, 2) NOT NULL DEFAULT 10.0,
  ars_collected NUMERIC(14, 2) DEFAULT 0.0, -- compatibilidad
  valens_balance NUMERIC(14, 2) DEFAULT 10.0, -- compatibilidad
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 10. TABLA: VALENS_TRANSACTIONS / TRANSACTIONS (Historial y Libro Mayor)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.valens_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  from_user UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_user UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- compatibilidad
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- compatibilidad
  amount_ars NUMERIC(14, 2) DEFAULT 0.0,
  amount_val NUMERIC(14, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'servicio', 'recompensa_pin', 'dex', 'faucet',
    'reward_release', 'direct_transfer', 'tip'
  )),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 11. ÍNDICES DE ALTO RENDIMIENTO
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_online ON public.profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_category ON public.orders(category);
CREATE INDEX IF NOT EXISTS idx_orders_client ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_cadete ON public.orders(cadete_id);
CREATE INDEX IF NOT EXISTS idx_offers_order ON public.offers(order_id);
CREATE INDEX IF NOT EXISTS idx_offers_cadete ON public.offers(cadete_id);
CREATE INDEX IF NOT EXISTS idx_messages_order ON public.messages(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON public.reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_dex_status ON public.dex_orders(status);
CREATE INDEX IF NOT EXISTS idx_tx_from ON public.valens_transactions(from_user);
CREATE INDEX IF NOT EXISTS idx_tx_to ON public.valens_transactions(to_user);

-- ====================================================================
-- 12. TRIGGERS DE SINCRONIZACIÓN AUTOMÁTICA
-- ====================================================================

-- A. Creación Automática de Perfil y Billetera tras Registro en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_avatar TEXT;
  v_role TEXT;
  v_ref_code TEXT;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    'Usuario Gremami'
  );

  v_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );

  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'cadete');
  v_ref_code := 'ref-' || SUBSTRING(NEW.id::text, 1, 8);

  -- 1. Insertar Perfil (con email y username para búsqueda pública)
  INSERT INTO public.profiles (
    id, full_name, avatar_url, role, referral_code, payment_alias, email, username
  )
  VALUES (
    NEW.id, v_name, v_avatar, v_role, v_ref_code, 'cadete.gremami.mp',
    NEW.email,
    LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)), '[^a-z0-9]', '_', 'g'))
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name  = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    email      = EXCLUDED.email,
    username   = COALESCE(profiles.username, EXCLUDED.username),
    updated_at = NOW();

  -- 2. Insertar Billetera Dual (10.0 VAL + $0.0 ARS)
  INSERT INTO public.wallets (
    user_id, balance_val, balance_ars, valens_balance, ars_collected
  )
  VALUES (
    NEW.id, 10.0, 0.0, 10.0, 0.0
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Transacción Inicial de Faucet de Bienvenida
  INSERT INTO public.valens_transactions (
    from_user, to_user, receiver_id, amount_val, amount_ars, type, description
  )
  VALUES (
    NULL, NEW.id, NEW.id, 10.0, 0.0, 'faucet', 'Airdrop Inicial de Bienvenida (10.0 VALENS)'
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B. Sincronizar columnas duales en wallets (balance_val <-> valens_balance)
CREATE OR REPLACE FUNCTION public.sync_wallet_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.balance_val IS DISTINCT FROM OLD.balance_val THEN
    NEW.valens_balance := NEW.balance_val;
  ELSIF NEW.valens_balance IS DISTINCT FROM OLD.valens_balance THEN
    NEW.balance_val := NEW.valens_balance;
  END IF;

  IF NEW.balance_ars IS DISTINCT FROM OLD.balance_ars THEN
    NEW.ars_collected := NEW.balance_ars;
  ELSIF NEW.ars_collected IS DISTINCT FROM OLD.ars_collected THEN
    NEW.balance_ars := NEW.ars_collected;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_wallet_columns ON public.wallets;
CREATE TRIGGER trg_sync_wallet_columns
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_columns();

-- C. Sincronizar columnas duales en orders (cadete_id <-> assigned_cadet_id, price_ars <-> base_price_ars)
CREATE OR REPLACE FUNCTION public.sync_order_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cadete_id IS NOT NULL AND NEW.assigned_cadet_id IS NULL THEN
    NEW.assigned_cadet_id := NEW.cadete_id;
  ELSIF NEW.assigned_cadet_id IS NOT NULL AND NEW.cadete_id IS NULL THEN
    NEW.cadete_id := NEW.assigned_cadet_id;
  END IF;

  IF NEW.price_ars IS NOT NULL THEN
    NEW.base_price_ars := NEW.price_ars;
  END IF;

  IF NEW.reward_val IS NOT NULL THEN
    NEW.val_incentive := NEW.reward_val;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_order_columns ON public.orders;
CREATE TRIGGER trg_sync_order_columns
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.sync_order_columns();

-- ====================================================================
-- 13. FUNCIÓN RPC: LIBERACIÓN POR PIN CON CONTROL DE INTENTOS
-- ====================================================================
CREATE OR REPLACE FUNCTION public.release_reward_by_pin(
  p_order_id UUID,
  p_pin TEXT,
  p_cadet_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_tx_id UUID;
  v_ars NUMERIC;
  v_val NUMERIC;
BEGIN
  -- 1. Bloquear registro de la orden
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Orden no encontrada');
  END IF;

  -- Autorización: solo el cliente o el cadete de la orden pueden liberar el pago
  IF auth.uid() IS NULL
     OR auth.uid() NOT IN (v_order.client_id, v_order.cadete_id, v_order.assigned_cadet_id)
  THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autorizado para liberar esta orden');
  END IF;

  IF v_order.status IN ('completado', 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta orden ya fue completada');
  END IF;

  -- 2. Control de Intentos Fallidos de PIN (Máximo 3)
  IF COALESCE(v_order.pin_attempts, 0) >= 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Límite de intentos de PIN excedido (3/3). Contacta a soporte por seguridad.'
    );
  END IF;

  -- 3. Validar PIN
  IF TRIM(v_order.delivery_pin) <> TRIM(p_pin) THEN
    UPDATE public.orders
    SET pin_attempts = COALESCE(pin_attempts, 0) + 1, updated_at = NOW()
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Código PIN incorrecto. Intento ' || (COALESCE(v_order.pin_attempts, 0) + 1) || ' de 3.'
    );
  END IF;

  v_ars := COALESCE(v_order.price_ars, v_order.base_price_ars, 0);
  v_val := COALESCE(v_order.reward_val, v_order.val_incentive, 1.0);

  -- 4. Marcar orden como completada
  UPDATE public.orders
  SET 
    status = 'completado',
    cadete_id = COALESCE(cadete_id, p_cadet_id),
    assigned_cadet_id = COALESCE(assigned_cadet_id, p_cadet_id),
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_id;

  -- 5. Acreditar saldo en la billetera del cadete
  INSERT INTO public.wallets (
    user_id, balance_val, balance_ars, valens_balance, ars_collected, updated_at
  )
  VALUES (
    p_cadet_id, 10.0 + v_val, v_ars, 10.0 + v_val, v_ars, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    balance_val = public.wallets.balance_val + v_val,
    valens_balance = public.wallets.valens_balance + v_val,
    balance_ars = public.wallets.balance_ars + v_ars,
    ars_collected = public.wallets.ars_collected + v_ars,
    updated_at = NOW();

  -- 6. Debitar fianza del cliente si existe
  IF v_order.client_id IS NOT NULL THEN
    UPDATE public.wallets
    SET 
      balance_val = GREATEST(0, balance_val - v_val),
      valens_balance = GREATEST(0, valens_balance - v_val),
      updated_at = NOW()
    WHERE user_id = v_order.client_id;
  END IF;

  -- 7. Registrar en el libro de transacciones
  INSERT INTO public.valens_transactions (
    order_id, from_user, to_user, sender_id, receiver_id,
    amount_val, amount_ars, type, description
  )
  VALUES (
    p_order_id, v_order.client_id, p_cadet_id, v_order.client_id, p_cadet_id,
    v_val, v_ars, 'recompensa_pin',
    'Entrega finalizada con PIN soberano: ' || v_order.title
  )
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'completado',
    'cadet_id', p_cadet_id,
    'amount_ars', v_ars,
    'amount_val', v_val,
    'transaction_id', v_tx_id,
    'message', 'Entrega verificada exitosamente. Fondos acreditados al cadete.'
  );
END;
$$;

-- ====================================================================
-- 14. FUNCIÓN HELPER: VALIDACIÓN DE BLOQUEOS P2P
-- ====================================================================
CREATE OR REPLACE FUNCTION public.is_blocked_between(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF user_a IS NULL OR user_b IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ====================================================================
-- 15. SEGURIDAD: ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dex_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valens_transactions ENABLE ROW LEVEL SECURITY;

-- 1. Políticas Profiles
-- Solo el dueño puede leer su fila completa (contiene WhatsApp, CBU/CVU, CUIT, teléfono).
-- Las lecturas públicas deben usar la vista segura public.profiles_public.
DROP POLICY IF EXISTS "profiles_select_public_filtered" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Políticas Orders
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
CREATE POLICY "orders_select_policy" ON public.orders
  FOR SELECT USING (
    -- Abiertas para todos sin bloqueos, o visibles para las partes de la orden
    (status IN ('pendiente', 'ofertado', 'open') AND NOT public.is_blocked_between(auth.uid(), client_id))
    OR auth.uid() = client_id
    OR auth.uid() = cadete_id
    OR auth.uid() = assigned_cadet_id
  );

DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
CREATE POLICY "orders_insert_policy" ON public.orders
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (client_id IS NULL OR client_id = auth.uid())
  );

DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
CREATE POLICY "orders_update_policy" ON public.orders
  FOR UPDATE USING (
    auth.uid() = client_id 
    OR auth.uid() = cadete_id 
    OR auth.uid() = assigned_cadet_id
  );

-- 3. Políticas Offers & Bids
DROP POLICY IF EXISTS "offers_select_policy" ON public.offers;
CREATE POLICY "offers_select_policy" ON public.offers
  FOR SELECT USING (
    NOT public.is_blocked_between(auth.uid(), cadete_id)
  );

DROP POLICY IF EXISTS "offers_insert_policy" ON public.offers;
CREATE POLICY "offers_insert_policy" ON public.offers
  FOR INSERT WITH CHECK (auth.uid() = cadete_id);

DROP POLICY IF EXISTS "offers_update_policy" ON public.offers;
CREATE POLICY "offers_update_policy" ON public.offers
  FOR UPDATE USING (auth.uid() = cadete_id);

DROP POLICY IF EXISTS "bids_select_policy" ON public.bids;
CREATE POLICY "bids_select_policy" ON public.bids
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "bids_insert_policy" ON public.bids;
CREATE POLICY "bids_insert_policy" ON public.bids
  FOR INSERT WITH CHECK (auth.uid() = cadet_id);

-- 4. Políticas Messages (Chat P2P Seguro)
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
CREATE POLICY "messages_select_policy" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (o.client_id = auth.uid() OR o.cadete_id = auth.uid() OR o.assigned_cadet_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
CREATE POLICY "messages_insert_policy" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (o.client_id = auth.uid() OR o.cadete_id = auth.uid() OR o.assigned_cadet_id = auth.uid())
      AND NOT public.is_blocked_between(o.client_id, o.cadete_id)
    )
  );

-- 5. Políticas Reviews
DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
CREATE POLICY "reviews_select_all" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_insert_authenticated" ON public.reviews;
CREATE POLICY "reviews_insert_authenticated" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- 6. Políticas User Blocks
DROP POLICY IF EXISTS "user_blocks_policy" ON public.user_blocks;
CREATE POLICY "user_blocks_policy" ON public.user_blocks
  FOR ALL USING (auth.uid() = blocker_id);

-- 7. Políticas User Reports
DROP POLICY IF EXISTS "user_reports_insert" ON public.user_reports;
CREATE POLICY "user_reports_insert" ON public.user_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "user_reports_select_own" ON public.user_reports;
CREATE POLICY "user_reports_select_own" ON public.user_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- 8. Políticas DEX Orders
DROP POLICY IF EXISTS "dex_orders_select" ON public.dex_orders;
CREATE POLICY "dex_orders_select" ON public.dex_orders
  FOR SELECT USING (status = 'abierta' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "dex_orders_manage_own" ON public.dex_orders;
CREATE POLICY "dex_orders_manage_own" ON public.dex_orders
  FOR ALL USING (auth.uid() = user_id);

-- 9. Políticas Wallets
DROP POLICY IF EXISTS "wallets_select" ON public.wallets;
CREATE POLICY "wallets_select" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wallets_update_own" ON public.wallets;
CREATE POLICY "wallets_update_own" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- 10. Políticas Transactions
DROP POLICY IF EXISTS "tx_select" ON public.valens_transactions;
CREATE POLICY "tx_select" ON public.valens_transactions
  FOR SELECT USING (
    auth.uid() = from_user 
    OR auth.uid() = to_user
    OR auth.uid() = sender_id 
    OR auth.uid() = receiver_id
  );

-- ====================================================================
-- 16. CANALES SUPABASE REALTIME
-- ====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'offers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'dex_orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dex_orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'wallets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
  END IF;
END $$;

-- ====================================================================
-- 17. STORAGE BUCKETS (Avatars, Verifications/Documents, Shops)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('shops', 'shops', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('verifications', 'verifications', false, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de Storage: Avatars (Público para lectura, autenticado para subida)
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
CREATE POLICY "avatars_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_auth_insert" ON storage.objects;
CREATE POLICY "avatars_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "avatars_auth_update" ON storage.objects;
CREATE POLICY "avatars_auth_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

-- Políticas de Storage: Shops (Público para lectura, autenticado para subida)
DROP POLICY IF EXISTS "shops_public_select" ON storage.objects;
CREATE POLICY "shops_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'shops');

DROP POLICY IF EXISTS "shops_auth_insert" ON storage.objects;
CREATE POLICY "shops_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'shops' 
    AND auth.role() = 'authenticated'
  );

-- Políticas de Storage: Verifications / Documents (Privado, solo usuario propietario)
DROP POLICY IF EXISTS "verifications_owner_select" ON storage.objects;
CREATE POLICY "verifications_owner_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verifications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "verifications_owner_insert" ON storage.objects;
CREATE POLICY "verifications_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'verifications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ====================================================================
-- 18. TOKEN GENESIS — ValensCoin (VAL) Tokenomics y Configuración de Red
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.token_genesis (
  id SERIAL PRIMARY KEY,
  token_symbol TEXT NOT NULL DEFAULT 'VAL',
  token_name TEXT NOT NULL DEFAULT 'ValensCoin',
  total_supply BIGINT NOT NULL DEFAULT 1000000000000,
  decimals INTEGER NOT NULL DEFAULT 0,
  faucet_drip_amount INTEGER NOT NULL DEFAULT 5,
  initial_user_airdrop INTEGER NOT NULL DEFAULT 10,
  reserve_balance BIGINT NOT NULL DEFAULT 1000000000000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registro único de génesis
INSERT INTO public.token_genesis (
  token_symbol, token_name, total_supply, decimals,
  faucet_drip_amount, initial_user_airdrop, reserve_balance
)
SELECT 'VAL', 'ValensCoin', 1000000000000, 0, 5, 10, 1000000000000
WHERE NOT EXISTS (SELECT 1 FROM public.token_genesis WHERE token_symbol = 'VAL');

-- Seguridad de token_genesis: legible públicamente, pero solo escribible
-- por las funciones SECURITY DEFINER internas (no por clientes anon/authenticated).
ALTER TABLE public.token_genesis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "token_genesis_select_public" ON public.token_genesis;
CREATE POLICY "token_genesis_select_public" ON public.token_genesis
  FOR SELECT USING (true);

-- ====================================================================
-- 19. EXTENSIÓN DE WALLETS — Campos Cripto para ValensCoin L1
-- ====================================================================
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS public_address TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS balance_valens BIGINT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS encrypted_seed_phrase TEXT;

-- Sincronizar balance_valens con balance_val al arrancar (redondeo entero)
UPDATE public.wallets SET balance_valens = FLOOR(COALESCE(balance_val, valens_balance, 10)) WHERE balance_valens IS NULL;

-- ====================================================================
-- 20. TABLA: TRANSACTIONS (Alias uniforme de valens_transactions)
-- ====================================================================
CREATE OR REPLACE VIEW public.transactions AS
  SELECT
    id,
    order_id,
    from_user      AS sender_id,
    to_user        AS receiver_id,
    sender_id      AS sender_user_id,
    receiver_id    AS receiver_user_id,
    amount_val     AS amount,
    amount_ars,
    type,
    description,
    created_at,
    NULL::TEXT     AS tx_hash,
    NULL::TEXT     AS sender_address,
    NULL::TEXT     AS receiver_address,
    'confirmed'::TEXT AS status
  FROM public.valens_transactions;

-- ====================================================================
-- 21. FUNCIÓN RPC: TRANSFERENCIA ATÓMICA DE VALENSCOIN (Integers Only)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.transfer_valens_tokens(
  p_sender_id      UUID,
  p_receiver_addr  TEXT,
  p_amount         INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_wallet   RECORD;
  v_receiver_wallet RECORD;
  v_tx_hash         TEXT;
  v_receiver_id     UUID;
BEGIN
  -- Validaciones
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'El monto debe ser mayor a 0 VAL entero.');
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> p_sender_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autorizado: solo puedes transferir desde tu propia billetera.');
  END IF;

  -- Bloquear billetera del emisor
  SELECT * INTO v_sender_wallet
  FROM public.wallets WHERE user_id = p_sender_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Billetera emisora no encontrada.');
  END IF;

  IF COALESCE(v_sender_wallet.balance_valens, FLOOR(v_sender_wallet.balance_val)) < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente de ValensCoin.');
  END IF;

  -- Buscar receptor por dirección pública o user_id
  SELECT user_id INTO v_receiver_id
  FROM public.wallets WHERE public_address = p_receiver_addr
  LIMIT 1;

  -- Generar hash de transacción único
  v_tx_hash := '0x' || encode(gen_random_bytes(16), 'hex');

  -- Debitar emisor
  UPDATE public.wallets
  SET balance_valens = COALESCE(balance_valens, FLOOR(balance_val)) - p_amount,
      balance_val    = GREATEST(0, COALESCE(balance_val, 0) - p_amount),
      valens_balance = GREATEST(0, COALESCE(valens_balance, 0) - p_amount),
      updated_at     = NOW()
  WHERE user_id = p_sender_id;

  -- Acreditar receptor si existe en la plataforma
  IF v_receiver_id IS NOT NULL THEN
    UPDATE public.wallets
    SET balance_valens = COALESCE(balance_valens, 0) + p_amount,
        balance_val    = COALESCE(balance_val, 0) + p_amount,
        valens_balance = COALESCE(valens_balance, 0) + p_amount,
        updated_at     = NOW()
    WHERE user_id = v_receiver_id;
  END IF;

  -- Registrar transacción
  INSERT INTO public.valens_transactions (
    from_user, to_user, sender_id, receiver_id,
    amount_val, amount_ars, type, description
  ) VALUES (
    p_sender_id, v_receiver_id, p_sender_id, v_receiver_id,
    p_amount, 0, 'direct_transfer',
    'Transferencia P2P ValensCoin: ' || p_amount || ' VAL → ' || p_receiver_addr
  );

  -- Reducir reserva del token_genesis
  UPDATE public.token_genesis
  SET reserve_balance = GREATEST(0, reserve_balance - p_amount)
  WHERE token_symbol = 'VAL';

  RETURN jsonb_build_object(
    'success', true,
    'tx_hash', v_tx_hash,
    'amount', p_amount,
    'receiver_address', p_receiver_addr,
    'message', 'Transferencia de ' || p_amount || ' VAL confirmada.'
  );
END;
$$;

-- ====================================================================
-- 22. FUNCIÓN RPC: GRIFO (FAUCET) — +5 VAL Atómico
-- ====================================================================
CREATE OR REPLACE FUNCTION public.claim_faucet_tokens(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_drip    INTEGER := 5;
  v_tx_hash TEXT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autorizado: solo puedes reclamar para tu propia billetera.');
  END IF;

  v_tx_hash := '0xfa' || encode(gen_random_bytes(8), 'hex');

  -- Acreditar 5 VAL enteros al usuario
  INSERT INTO public.wallets (user_id, balance_valens, balance_val, valens_balance, updated_at)
  VALUES (p_user_id, v_drip, v_drip, v_drip, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET balance_valens = COALESCE(wallets.balance_valens, 0) + v_drip,
      balance_val    = COALESCE(wallets.balance_val, 0) + v_drip,
      valens_balance = COALESCE(wallets.valens_balance, 0) + v_drip,
      updated_at     = NOW();

  -- Registrar transacción de faucet
  INSERT INTO public.valens_transactions (
    from_user, to_user, receiver_id, amount_val, amount_ars, type, description
  ) VALUES (
    NULL, p_user_id, p_user_id, v_drip, 0, 'faucet',
    'Grifo ValensCoin Testnet: +' || v_drip || ' VAL'
  );

  -- Reducir reserva
  UPDATE public.token_genesis
  SET reserve_balance = GREATEST(0, reserve_balance - v_drip)
  WHERE token_symbol = 'VAL';

  RETURN jsonb_build_object(
    'success', true,
    'tx_hash', v_tx_hash,
    'amount', v_drip,
    'message', '+' || v_drip || ' VAL acreditados desde el Grifo Testnet.'
  );
END;
$$;

-- ====================================================================
-- 23. FUNCIÓN RPC: BÚSQUEDA PÚBLICA DE USUARIOS (solo campos seguros)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.search_community_users(search_term TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT,
  is_online BOOLEAN,
  coverage_zone TEXT,
  vehicle_type TEXT,
  payment_alias TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, full_name, username, email, avatar_url, role,
         is_online, coverage_zone, vehicle_type, payment_alias
  FROM public.profiles
  WHERE btrim(search_term) <> ''
    AND (
      full_name ILIKE '%' || btrim(search_term) || '%'
      OR username ILIKE '%' || btrim(search_term) || '%'
      OR email ILIKE '%' || btrim(search_term) || '%'
      OR payment_alias ILIKE '%' || btrim(search_term) || '%'
    )
  LIMIT 50;
$$;
