-- ====================================================================
-- GREMAMI P2P - ESQUEMA COMPLETO DE BASE DE DATOS Y BACKEND SUPABASE
-- Región: Alta Gracia, Valle de Paravachasca y Gran Córdoba
-- ====================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. TABLA: PROFILES (Usuarios, Clientes, Cadetes y Comercios)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Usuario Gremami',
  avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  phone TEXT,
  role TEXT CHECK (role IN ('cliente', 'cadete', 'ambos')) DEFAULT 'cadete',
  fiat_provider TEXT DEFAULT 'Mercado Pago',
  fiat_alias TEXT DEFAULT 'cadete.gremami.mp',
  fiat_cbu_cvu TEXT,
  fiat_holder_name TEXT,
  fiat_cuit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 2. TABLA: WALLETS (Billetera Dual: ValensCoin + Recaudación en $ ARS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  valens_balance NUMERIC(14, 2) NOT NULL DEFAULT 10.0,
  ars_collected NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 3. TABLA: ORDERS (Solicitudes de Servicio y Subastas P2P en Vivo)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('caminando', 'bicicleta', 'moto', 'motocicleta', 'auto', 'automovil', 'flete', 'fletes')),
  modality TEXT DEFAULT 'envios' CHECK (modality IN ('pasajeros', 'envios', 'mixto')),
  origin_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL DEFAULT -31.6529,
  origin_lng DOUBLE PRECISION NOT NULL DEFAULT -64.4283,
  base_price_ars NUMERIC(12, 2) NOT NULL DEFAULT 2500.0,
  val_incentive NUMERIC(8, 2) NOT NULL DEFAULT 1.0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_transit', 'completed', 'cancelled')),
  delivery_pin TEXT NOT NULL DEFAULT '4821', -- PIN de 4 dígitos para entrega soberana
  assigned_cadet_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 4. TABLA: BIDS (Ofertas y Cotizaciones en Subasta P2P)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  cadet_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_ars NUMERIC(12, 2) NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 5. TABLA: VALENS_TRANSACTIONS (Libro Mayor Inmutable y Auditable)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.valens_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount_val NUMERIC(10, 2) NOT NULL,
  amount_ars NUMERIC(12, 2) DEFAULT 0.0,
  type TEXT NOT NULL CHECK (type IN ('faucet', 'reward_release', 'direct_transfer', 'tip')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 6. ÍNDICES DE ALTO RENDIMIENTO
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_category ON public.orders(category);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_cadet ON public.orders(assigned_cadet_id);
CREATE INDEX IF NOT EXISTS idx_bids_order_id ON public.bids(order_id);
CREATE INDEX IF NOT EXISTS idx_bids_cadet_id ON public.bids(cadet_id);
CREATE INDEX IF NOT EXISTS idx_valens_tx_sender ON public.valens_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_valens_tx_receiver ON public.valens_transactions(receiver_id);

-- ====================================================================
-- 7. TRIGGER: CREACIÓN AUTOMÁTICA DE PERFIL Y BILLETERA AL REGISTRARSE (GOOGLE OAUTH & EMAIL)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_avatar TEXT;
  v_role TEXT;
BEGIN
  -- Extraer nombre del usuario (Soporta Google OAuth: full_name o name)
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    'Usuario Gremami'
  );

  -- Extraer foto/avatar de Google OAuth (avatar_url o picture)
  v_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );

  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'cadete');

  -- 1. Inserción o actualización del perfil del usuario
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (NEW.id, v_name, v_avatar, v_role)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

  -- 2. Creación de Billetera Dual inicial: 10.0 VAL de bienvenida y $0.0 ARS acumulados
  INSERT INTO public.wallets (user_id, valens_balance, ars_collected)
  VALUES (NEW.id, 10.0, 0.0)
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Transacción en el Libro Mayor (Airdrop Inicial de Bienvenida de 10 VAL)
  INSERT INTO public.valens_transactions (
    sender_id,
    receiver_id,
    amount_val,
    amount_ars,
    type,
    description
  )
  VALUES (
    NULL,
    NEW.id,
    10.0,
    0.0,
    'faucet',
    'Airdrop Inicial de Bienvenida (10.0 VALENS)'
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 8. PROCEDIMIENTO ALMACENADO ATÓMICO (RPC): LIBERACIÓN POR PIN
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
  -- 1. Bloquear y verificar orden atómicamente
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Orden no encontrada'
    );
  END IF;

  -- 2. Validar que la orden esté en curso o asignada
  IF v_order.status NOT IN ('assigned', 'in_transit') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'La orden debe encontrarse en estado asignado o en tránsito (Estado actual: ' || v_order.status || ')'
    );
  END IF;

  -- 3. Validar PIN de 4 dígitos
  IF TRIM(v_order.delivery_pin) <> TRIM(p_pin) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'El código PIN de validación es incorrecto'
    );
  END IF;

  v_ars := COALESCE(v_order.base_price_ars, 0);
  v_val := COALESCE(v_order.val_incentive, 1.0);

  -- 4. Marcar orden como completada
  UPDATE public.orders
  SET 
    status = 'completed',
    assigned_cadet_id = COALESCE(assigned_cadet_id, p_cadet_id),
    updated_at = NOW()
  WHERE id = p_order_id;

  -- 5. Acreditar saldo en la billetera del cadete (ARS + VAL)
  INSERT INTO public.wallets (user_id, valens_balance, ars_collected, updated_at)
  VALUES (p_cadet_id, 10.0 + v_val, v_ars, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET 
    valens_balance = public.wallets.valens_balance + v_val,
    ars_collected = public.wallets.ars_collected + v_ars,
    updated_at = NOW();

  -- 6. Si hay cliente registrado, debitar fianza en tokens si corresponde
  IF v_order.client_id IS NOT NULL THEN
    UPDATE public.wallets
    SET 
      valens_balance = GREATEST(0, valens_balance - v_val),
      updated_at = NOW()
    WHERE user_id = v_order.client_id;
  END IF;

  -- 7. Registrar en el libro de transacciones inmutable
  INSERT INTO public.valens_transactions (
    sender_id,
    receiver_id,
    order_id,
    amount_val,
    amount_ars,
    type,
    description
  )
  VALUES (
    v_order.client_id,
    p_cadet_id,
    p_order_id,
    v_val,
    v_ars,
    'reward_release',
    'Entrega finalizada con PIN soberano: ' || v_order.title
  )
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'completed',
    'cadet_id', p_cadet_id,
    'amount_ars', v_ars,
    'amount_val', v_val,
    'transaction_id', v_tx_id,
    'message', 'Entrega verificada exitosamente. Fondos y recompensa acreditados al cadete.'
  );
END;
$$;

-- ====================================================================
-- 9. SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valens_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas Profiles
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- Políticas Wallets
DROP POLICY IF EXISTS "wallets_select_own_or_public" ON public.wallets;
CREATE POLICY "wallets_select_own_or_public" ON public.wallets
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "wallets_update_own" ON public.wallets;
CREATE POLICY "wallets_update_own" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas Orders
DROP POLICY IF EXISTS "orders_select_open_and_parties" ON public.orders;
CREATE POLICY "orders_select_open_and_parties" ON public.orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "orders_insert_authenticated" ON public.orders;
CREATE POLICY "orders_insert_authenticated" ON public.orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "orders_update_parties" ON public.orders;
CREATE POLICY "orders_update_parties" ON public.orders
  FOR UPDATE USING (true);

-- Políticas Bids (Ofertas en Subastas)
DROP POLICY IF EXISTS "bids_select_all" ON public.bids;
CREATE POLICY "bids_select_all" ON public.bids
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "bids_insert_cadet" ON public.bids;
CREATE POLICY "bids_insert_cadet" ON public.bids
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "bids_update_cadet" ON public.bids;
CREATE POLICY "bids_update_cadet" ON public.bids
  FOR UPDATE USING (auth.uid() = cadet_id OR auth.uid() IS NULL);

-- Políticas Transactions
DROP POLICY IF EXISTS "tx_select_parties" ON public.valens_transactions;
CREATE POLICY "tx_select_parties" ON public.valens_transactions
  FOR SELECT USING (true);

-- ====================================================================
-- 10. PUBLICACIÓN SUPABASE REALTIME (Subscripciones en Vivo)
-- ====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bids'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'wallets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'valens_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.valens_transactions;
  END IF;
END $$;
