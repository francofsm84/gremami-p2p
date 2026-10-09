// Base de datos de la red descentralizada Gremami P2P (Alta Gracia, Córdoba, Argentina)

// Helper para garantizar siempre formato en kilómetros con 1 decimal
export const formatDistanceKm = (metersOrKm) => {
  if (metersOrKm === undefined || metersOrKm === null) return '0.5 km';
  if (typeof metersOrKm === 'number') {
    return `${(metersOrKm / 1000).toFixed(1)} km`;
  }
  const str = String(metersOrKm).trim();
  if (str.endsWith('km')) {
    const val = parseFloat(str);
    return !isNaN(val) ? `${val.toFixed(1)} km` : str;
  }
  if (str.endsWith('m')) {
    const val = parseFloat(str);
    return !isNaN(val) ? `${(val / 1000).toFixed(1)} km` : str;
  }
  const num = parseFloat(str);
  return !isNaN(num) ? `${num.toFixed(1)} km` : '0.5 km';
};

// Helper para normalizar redes sociales y mensajería de cualquier prestador
export const getPeerSocials = (peer) => {
  if (peer?.socials && (peer.socials.instagram || peer.socials.whatsapp || peer.socials.twitter || peer.socials.facebook)) {
    return {
      instagram: peer.socials.instagram || `@${peer.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'cadete'}.altagracia`,
      whatsapp: peer.socials.whatsapp || '+5493547420101',
      twitter: peer.socials.twitter || `@${peer.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'cadete'}_p2p`,
      facebook: peer.socials.facebook || `${peer.name || 'Prestador'} P2P Alta Gracia`
    };
  }
  const clean = (peer?.name || 'cadete').toLowerCase().replace(/[^a-z0-9]/g, '');
  return {
    instagram: `@${clean}.altagracia`,
    whatsapp: '+5493547420101',
    twitter: `@${clean}_p2p`,
    facebook: `${peer?.name || 'Cadete'} P2P Alta Gracia`
  };
};

// Generador de enlaces directos clicables para redes sociales y mensajería
export const getSocialLink = (platform, value) => {
  if (!value) return '#';
  const val = String(value).trim();
  if (val.startsWith('http://') || val.startsWith('https://')) return val;

  switch (platform) {
    case 'instagram': {
      const handle = val.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '');
      return `https://instagram.com/${handle}`;
    }
    case 'whatsapp': {
      const digits = val.replace(/[^0-9]/g, '');
      return `https://api.whatsapp.com/send?phone=${digits.length ? digits : '5493547420101'}&text=${encodeURIComponent('Hola, te contacto desde Gremami P2P Alta Gracia')}`;
    }
    case 'twitter':
    case 'x': {
      const handle = val.replace(/^@/, '').replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, '');
      return `https://x.com/${handle}`;
    }
    case 'facebook': {
      const slug = val.replace(/^https?:\/\/(www\.)?facebook\.com\//, '').replace(/\s+/g, '.');
      return `https://facebook.com/${slug}`;
    }
    default:
      return val;
  }
};

// Modalidades de servicio para Automóviles y Motocicletas
export const SERVICE_MODALITIES = [
  {
    id: 'all',
    label: '✨ Todas las Modalidades',
    shortLabel: 'Todas',
    badge: 'Todas las Modalidades',
    badgeColor: 'slate',
    description: 'Ver todas las modalidades de servicio'
  },
  {
    id: 'pasajeros',
    label: '🚖 Transporte de Pasajeros (Viajes / Tipo Taxi)',
    shortLabel: '🚖 Pasajeros (Taxi)',
    badge: '🚖 Pasajeros (Tipo Taxi)',
    badgeColor: 'amber',
    emoji: '🚖',
    description: 'Exclusivo para traslado de personas por el ejido urbano e interurbano de Alta Gracia.'
  },
  {
    id: 'envios',
    label: '📦 Envíos y Paquetes (Delivery / Comida / Carga)',
    shortLabel: '📦 Envíos / Delivery',
    badge: '📦 Envíos y Paquetes',
    badgeColor: 'blue',
    emoji: '📦',
    description: 'Exclusivo para transporte de objetos, pedidos gastronómicos, farmacia y mercadería.'
  },
  {
    id: 'mixto',
    label: '🔄 Servicio Mixto (Pasajeros y Envíos)',
    shortLabel: '🔄 Mixto (Ambos)',
    badge: '🔄 Pasajeros y Envíos (Mixto)',
    badgeColor: 'emerald',
    emoji: '🔄',
    description: 'Para prestadores que realizan tanto traslado de pasajeros como entrega de paquetes.'
  }
];

export const getModalityInfo = (modality) => {
  switch (modality) {
    case 'pasajeros':
      return {
        id: 'pasajeros',
        label: 'Transporte de Pasajeros (Viajes / Tipo Taxi)',
        shortLabel: 'Pasajeros (Taxi)',
        badge: '🚖 Pasajeros (Tipo Taxi)',
        badgeColor: 'amber',
        emoji: '🚖',
        description: 'Exclusivo para traslado de personas'
      };
    case 'envios':
      return {
        id: 'envios',
        label: 'Envíos y Paquetes (Delivery / Mercadería)',
        shortLabel: 'Envíos / Delivery',
        badge: '📦 Envíos y Paquetes',
        badgeColor: 'blue',
        emoji: '📦',
        description: 'Exclusivo para transporte de objetos y mercadería'
      };
    case 'mixto':
      return {
        id: 'mixto',
        label: 'Servicio Mixto (Pasajeros y Envíos)',
        shortLabel: 'Mixto (Ambos)',
        badge: '🔄 Pasajeros y Envíos (Mixto)',
        badgeColor: 'emerald',
        emoji: '🔄',
        description: 'Traslado de pasajeros y entrega de pedidos'
      };
    default:
      return {
        id: 'envios',
        label: 'Envíos y Paquetes',
        shortLabel: 'Envíos',
        badge: '📦 Envíos',
        badgeColor: 'blue',
        emoji: '📦',
        description: 'Logística de paquetería'
      };
  }
};

// Entidades Financieras Argentinas para Cobros FIAT ($ ARS) sin comisiones
export const ARGENTINE_FIAT_PROVIDERS = [
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    shortName: 'Mercado Pago',
    color: '#009EE3',
    textColor: '#FFFFFF',
    badge: 'Billetera Digital',
    aliasSuffix: '.mp',
    placeholderAlias: 'cadete.gremami.mp',
    iconEmoji: '💙',
    description: 'Acreditación instantánea con CVU / Alias de Mercado Pago'
  },
  {
    id: 'brubank',
    name: 'Brubank',
    shortName: 'Brubank',
    color: '#6F3DF4',
    textColor: '#FFFFFF',
    badge: 'Banco Digital',
    aliasSuffix: '.bru',
    placeholderAlias: 'cadete.gremami.bru',
    iconEmoji: '💜',
    description: 'Banco digital con CBU bancario y transferencias inmediatas'
  },
  {
    id: 'personalpay',
    name: 'Personal Pay',
    shortName: 'Personal Pay',
    color: '#002F6C',
    textColor: '#FFFFFF',
    badge: 'Billetera Telecom',
    aliasSuffix: '.ppay',
    placeholderAlias: 'cadete.personalpay',
    iconEmoji: '🔷',
    description: 'Billetera virtual con rendimientos diarios y transferencias sin cargo'
  },
  {
    id: 'lemon',
    name: 'Lemon Cash',
    shortName: 'Lemon Cash',
    color: '#00EA90',
    textColor: '#0B132B',
    badge: 'Cripto & Pesos',
    aliasSuffix: '.lemon',
    placeholderAlias: 'cadete.lemon',
    iconEmoji: '🍋',
    description: 'Ecosistema cripto y pesos con $lemontag y CVU'
  },
  {
    id: 'prex',
    name: 'Prex',
    shortName: 'Prex',
    color: '#4B2582',
    textColor: '#FFFFFF',
    badge: 'Billetera Digital',
    aliasSuffix: '.prex',
    placeholderAlias: 'cadete.prex',
    iconEmoji: '🟪',
    description: 'Billetera con CVU en pesos y transferencias 24/7'
  },
  {
    id: 'belo',
    name: 'Belo',
    shortName: 'Belo',
    color: '#8437F9',
    textColor: '#FFFFFF',
    badge: 'Cripto & Pesos',
    aliasSuffix: '.belo',
    placeholderAlias: 'cadete.belo',
    iconEmoji: '🟣',
    description: 'Pagos en pesos y cripto sin comisiones con $belotag'
  },
  {
    id: 'naranjax',
    name: 'Naranja X',
    shortName: 'Naranja X',
    color: '#FF5900',
    textColor: '#FFFFFF',
    badge: 'Cuenta Remunerada',
    aliasSuffix: '.nx',
    placeholderAlias: 'cadete.naranjax',
    iconEmoji: '🍊',
    description: 'Cuenta digital en pesos con rendimientos y transferencias'
  },
  {
    id: 'uala',
    name: 'Ualá',
    shortName: 'Ualá',
    color: '#E51937',
    textColor: '#FFFFFF',
    badge: 'Bancaria / Uilo',
    aliasSuffix: '.uala',
    placeholderAlias: 'cadete.uala',
    iconEmoji: '💳',
    description: 'CBU bancario Uilo y CVU Ualá con acreditación al instante'
  },
  {
    id: 'bancotradicional',
    name: 'Banco / CBU Tradicional',
    shortName: 'Banco / CBU',
    color: '#1E3A8A',
    textColor: '#FFFFFF',
    badge: 'Bancor / Nación / Privados',
    aliasSuffix: '',
    placeholderAlias: 'cadete.bancor o CBU 0200...',
    iconEmoji: '🏛️',
    description: 'CBU bancario tradicional de Bancor, Banco Nación o bancos privados'
  }
];

export const PEER_CATEGORIES = [
  {
    id: 'caminando',
    title: 'Servicios Caminando',
    subtitle: 'Delivery a pie, trámites y mandados cortos',
    iconName: 'Footprints',
    badge: 'A Pie (50)',
    badgeColor: 'emerald',
    description: 'Cadetes a pie en Alta Gracia, Córdoba Capital (Centro, Nueva Córdoba, Güemes) y localidades intermedias.'
  },
  {
    id: 'bicicleta',
    title: 'Servicios en Bicicleta',
    subtitle: 'Bici-cadetes y mensajería urbana ecológica',
    iconName: 'Bike',
    badge: 'Bici (50)',
    badgeColor: 'orange',
    description: 'Logística ágil y sustentable por ciclovías y avenidas de Alta Gracia, Córdoba Capital, Malagueño y Anisacate.'
  },
  {
    id: 'motocicleta',
    title: 'Servicios en Motocicleta',
    subtitle: 'Moto-taxis, envíos express y viandas calientes',
    iconName: 'Motorcycle',
    badge: 'Motos (50)',
    badgeColor: 'amber',
    description: 'Cadetes en moto cubriendo Alta Gracia, Córdoba Capital y Paravachasca con traslado de pasajeros (🚖) y encomiendas express (📦).'
  },
  {
    id: 'automovil',
    title: 'Servicios de Automóviles',
    subtitle: 'Viajes tipo taxi, delivery y baúl espacioso',
    iconName: 'Car',
    badge: 'Autos (50)',
    badgeColor: 'raven',
    description: 'Autos para Traslado de Pasajeros tipo Taxi (🚖), Envíos de Paquetes (📦) y Servicio Mixto entre el Gran Córdoba y el Valle de Paravachasca.'
  },
  {
    id: 'fletes',
    title: 'Fletes y Cargas Pesadas',
    subtitle: 'Mudanzas, materiales, escombros y utilitarios',
    iconName: 'Truck',
    badge: 'Fletes (50)',
    badgeColor: 'blue',
    description: 'Fletes, mudanzas y cargas pesadas entre Alta Gracia, Córdoba Sur, Malagueño, Bouwer, Toledo y Paravachasca.'
  }
];

// 250 Nodos Simulados Distribuidos en Gran Córdoba, Alta Gracia y Valle de Paravachasca (50 por categoría)
const PEER_NAMES = [
  'Ana P.', 'Lucas B.', 'Martín R.', 'Valeria S.', 'Gonzalo M.',
  'Florencia T.', 'Facundo D.', 'Camila L.', 'Nicolás G.', 'Sofía V.',
  'Agustín C.', 'Milagros F.', 'Joaquín H.', 'Valentina K.', 'Mateo N.',
  'Julieta Q.', 'Lautaro W.', 'Delfina X.', 'Ignacio Y.', 'Candela Z.',
  'Santiago P.', 'Rocío A.', 'Tomás E.', 'Lucía D.', 'Franco O.',
  'Martina B.', 'Emiliano J.', 'Abril G.', 'Bautista R.', 'Micaela T.',
  'Federico S.', 'Paula M.', 'Benjamín L.', 'Carla V.', 'Ezequiel K.',
  'Victoria N.', 'Rodrigo H.', 'Malena C.', 'Esteban F.', 'Zoe Q.',
  'Gabriel W.', 'Sol X.', 'Maximiliano Y.', 'Clara Z.', 'Mariano P.',
  'Daniela A.', 'Patricio E.', 'Bianca D.', 'Álvaro O.', 'Renata B.'
];

const PEER_AVATARS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80'
];

// Zonas Geográficas: Córdoba (Alta Gracia + Capital + Interior) y Buenos Aires (AMBA + Interior) — 50 zonas
const GEOGRAPHIC_ZONES = [
  // ── ALTA GRACIA (10) ────────────────────────────────────────────────────────
  { locality: 'Alta Gracia', label: 'Alta Gracia Centro', lat: -31.6529, lng: -64.4283, km: 0.4 },
  { locality: 'Alta Gracia', label: 'El Tajamar', lat: -31.6538, lng: -64.4270, km: 0.7 },
  { locality: 'Alta Gracia', label: 'Plaza Solares', lat: -31.6520, lng: -64.4305, km: 0.5 },
  { locality: 'Alta Gracia', label: 'B° Pellegrini', lat: -31.6580, lng: -64.4350, km: 1.6 },
  { locality: 'Alta Gracia', label: 'El Crucero', lat: -31.6610, lng: -64.4395, km: 2.4 },
  { locality: 'Alta Gracia', label: 'Sabattini', lat: -31.6490, lng: -64.4360, km: 1.4 },
  { locality: 'Anisacate', label: 'Anisacate Río', lat: -31.7160, lng: -64.4120, km: 4.8 },
  { locality: 'Villa La Bolsa', label: 'Villa La Bolsa', lat: -31.7220, lng: -64.4410, km: 6.8 },
  { locality: 'La Serranita', label: 'La Serranita', lat: -31.7525, lng: -64.4540, km: 11.5 },
  { locality: 'Santa Ana', label: 'Santa Ana Ruta 5', lat: -31.5720, lng: -64.3580, km: 6.1 },

  // ── CÓRDOBA CAPITAL (10) ────────────────────────────────────────────────────
  { locality: 'Córdoba Centro', label: 'Córdoba Centro', lat: -31.4165, lng: -64.1835, km: 34.1 },
  { locality: 'Nueva Córdoba', label: 'Nueva Córdoba', lat: -31.4280, lng: -64.1880, km: 32.5 },
  { locality: 'Barrio Güemes', label: 'Barrio Güemes', lat: -31.4245, lng: -64.1925, km: 32.8 },
  { locality: 'Córdoba Zona Sur', label: 'Ciudad Universitaria', lat: -31.4380, lng: -64.1940, km: 29.5 },
  { locality: 'Córdoba Zona Norte', label: 'Villa Allende', lat: -31.2980, lng: -64.2960, km: 48.5 },
  { locality: 'Malagueño', label: 'Malagueño', lat: -31.4650, lng: -64.3320, km: 16.5 },
  { locality: 'Bouwer', label: 'Bouwer Ruta 36', lat: -31.5580, lng: -64.1910, km: 22.5 },
  { locality: 'Toledo', label: 'Toledo Ruta 9 Sur', lat: -31.5550, lng: -64.0850, km: 32.0 },
  { locality: 'Córdoba Centro', label: 'Av. Colón Córdoba', lat: -31.4135, lng: -64.1890, km: 34.5 },
  { locality: 'Córdoba Zona Sur', label: 'B° San Fernando', lat: -31.4600, lng: -64.1980, km: 26.8 },

  // ── CÓRDOBA INTERIOR (10) ───────────────────────────────────────────────────
  { locality: 'Villa Carlos Paz', label: 'Villa Carlos Paz Centro', lat: -31.4230, lng: -64.4980, km: 36.5 },
  { locality: 'Villa Carlos Paz', label: 'Costa Azul C. Paz', lat: -31.4085, lng: -64.5120, km: 38.0 },
  { locality: 'Villa María', label: 'Villa María Centro', lat: -32.4073, lng: -63.2438, km: 140.0 },
  { locality: 'Villa María', label: 'Villa Nueva (V. María)', lat: -32.4220, lng: -63.2350, km: 141.5 },
  { locality: 'Río Cuarto', label: 'Río Cuarto Centro', lat: -33.1315, lng: -64.3502, km: 215.0 },
  { locality: 'Río Cuarto', label: 'Alberdi Río Cuarto', lat: -33.1450, lng: -64.3620, km: 216.5 },
  { locality: 'Bell Ville', label: 'Bell Ville', lat: -32.6274, lng: -62.6905, km: 185.0 },
  { locality: 'San Francisco', label: 'San Francisco Cba', lat: -31.4282, lng: -62.0852, km: 195.0 },
  { locality: 'Cruz del Eje', label: 'Cruz del Eje', lat: -30.7263, lng: -64.8036, km: 120.0 },
  { locality: 'La Falda', label: 'La Falda — Punilla', lat: -31.0919, lng: -64.4874, km: 80.0 },

  // ── BUENOS AIRES — CABA / GBA (10) ─────────────────────────────────────────
  { locality: 'CABA', label: 'Buenos Aires Centro', lat: -34.6037, lng: -58.3816, km: 710.0 },
  { locality: 'CABA', label: 'Palermo CABA', lat: -34.5755, lng: -58.4330, km: 708.0 },
  { locality: 'CABA', label: 'Caballito CABA', lat: -34.6192, lng: -58.4427, km: 712.0 },
  { locality: 'CABA', label: 'San Telmo / La Boca', lat: -34.6247, lng: -58.3733, km: 711.0 },
  { locality: 'CABA', label: 'Núñez / Belgrano', lat: -34.5445, lng: -58.4565, km: 706.0 },
  { locality: 'GBA Norte', label: 'San Isidro', lat: -34.4713, lng: -58.5267, km: 695.0 },
  { locality: 'GBA Norte', label: 'Tigre Delta', lat: -34.4260, lng: -58.5796, km: 690.0 },
  { locality: 'GBA Oeste', label: 'Morón / Haedo', lat: -34.6530, lng: -58.6191, km: 720.0 },
  { locality: 'GBA Sur', label: 'Quilmes Centro', lat: -34.7241, lng: -58.2584, km: 718.0 },
  { locality: 'GBA Sur', label: 'Lanús / Avellaneda', lat: -34.6902, lng: -58.3732, km: 714.0 },

  // ── BUENOS AIRES INTERIOR (10) ──────────────────────────────────────────────
  { locality: 'La Plata', label: 'La Plata Centro', lat: -34.9215, lng: -57.9545, km: 730.0 },
  { locality: 'La Plata', label: 'City Bell (La Plata)', lat: -34.8729, lng: -58.0527, km: 725.0 },
  { locality: 'Mar del Plata', label: 'Mar del Plata Centro', lat: -38.0028, lng: -57.5575, km: 400.0 },
  { locality: 'Mar del Plata', label: 'MDQ Playa Grande', lat: -38.0290, lng: -57.5320, km: 402.0 },
  { locality: 'Bahía Blanca', label: 'Bahía Blanca Centro', lat: -38.7183, lng: -62.2663, km: 508.0 },
  { locality: 'Bahía Blanca', label: 'Villa Harding Green BB', lat: -38.7280, lng: -62.2480, km: 510.0 },
  { locality: 'Tandil', label: 'Tandil Centro', lat: -37.3217, lng: -59.1332, km: 332.0 },
  { locality: 'Tandil', label: 'Tandil Cerro El Centinela', lat: -37.3380, lng: -59.1200, km: 334.0 },
  { locality: 'Rosario', label: 'Rosario Centro (Santa Fe)', lat: -32.9468, lng: -60.6393, km: 310.0 },
  { locality: 'Rosario', label: 'Rosario Sur Fisherton', lat: -32.9610, lng: -60.6890, km: 312.0 }
];

// Solicitudes en vivo y pedidos en subasta iniciales en la red de Alta Gracia
const CLIENT_NAMES_POOL = [
  'Lucía M.', 'Carlos F.', 'Farmacia Belgrano', 'Kiosco El Tajamar', 'Dra. Marcela Rossi',
  'Esteban G. (Corralón)', 'Panadería La Espiga', 'Matías B.', 'Dra. Silvina Gómez', 'Veterinaria Paravachasca',
  'Café Martínez Cba', 'Librería Sarmiento', 'Julián T.', 'Distribuidora San Cayetano', 'Heladería Grido Centro',
  'Verdulería La Huerta', 'Paula N.', 'Ferretería El Tornillo', 'Restaurante El Fundador', 'Agustina D.',
  'Imprenta Gráfica Cba', 'Ignacio F.', 'Óptica Visión', 'Cotillón Fiesta', 'Carolina R.',
  'Laboratorio Bioquímico', 'MaxiKiosco 24hs', 'Tienda de Ropa Urbana', 'Roberto L.', 'Dietética Natural',
  'Pizzería Los Hornos', 'Mariano C.', 'Repuestos Moto Sur', 'Boutique Gourmet', 'Florencia P.',
  'Vivero Santa Ana', 'Mueblería La Serrana', 'Gastón V.', 'Supermercado Becerra', 'Consultorios Médicos del Valle',
  'Almacén Don Mario', 'Valentina S.', 'Carnicería El Buen Corte', 'Fiambrería La Tabla', 'Sebastián H.',
  'Estudio Contable Córdoba', 'Bar de Copas Güemes', 'LavaAutos Express', 'Clara E.', 'Mercado de Frutas Anisacate'
];

const DEMAND_CATEGORIES = [
  { id: 'caminando', label: 'Servicios Caminando', baseFee: 1800, baseVal: 0.7, descs: ['Entrega de recetas y medicamentos urgentes', 'Llevar sobre confidencial de escribanía', 'Retiro de llaves y documentación bancaria', 'Mandados cortos de farmacia y óptica'] },
  { id: 'bicicleta', label: 'Servicios en Bicicleta', baseFee: 2400, baseVal: 1.0, descs: ['Delivery gastronómico en mochila térmica sellada', 'Retiro de repuestos livianos en bicicletería', 'Envío de paquete sellado de tienda online', 'Trámite rápido de estudio contable'] },
  { id: 'motocicleta', label: 'Servicios en Motocicleta', baseFee: 3200, baseVal: 1.3, descs: ['Moto-envío express de repuestos mecánicos', 'Traslado de viandas calientes con urgencia', 'Retiro de encomienda en terminal y entrega rápida', 'Moto-taxi: traslado de pasajero con casco'] },
  { id: 'automovil', label: 'Servicios de Automóviles', baseFee: 5500, baseVal: 2.2, descs: ['Viaje interurbano de pasajeros con equipaje', 'Envío de mercadería frágil en baúl espacioso', 'Traslado de compras de supermercado mayorista', 'Viaje directo Alta Gracia - Córdoba Capital'] },
  { id: 'fletes', label: 'Fletes y Cargas Pesadas', baseFee: 19000, baseVal: 7.5, descs: ['Flete utilitario para mudanza de muebles y cajas', 'Retiro de 25 bolsas de cemento y perfiles de hierro', 'Transporte de electrodomésticos y pallets', 'Carga pesada de corralón a obra en construcción'] },
  { id: 'negocios', label: 'Comercios y Negocios', baseFee: 3500, baseVal: 1.5, descs: ['Retiro de mercadería en local comercial', 'Envío de pedidos de tienda online', 'Retiro de productos en mostrador para entrega express', 'Abastecimiento de insumos para comercio minorista'] }
];

// Generador de 250 Demandas Simuladas en Modo Cadete (50 por categoría)
const buildInitialLiveRequests = () => {
  const list = [];

  DEMAND_CATEGORIES.forEach((cat, categoryIndex) => {
    for (let i = 0; i < 50; i++) {
      const zone = GEOGRAPHIC_ZONES[i % GEOGRAPHIC_ZONES.length];
      const clientName = CLIENT_NAMES_POOL[(i + cat.descs.length) % CLIENT_NAMES_POOL.length];
      const clientAvatar = PEER_AVATARS[i % PEER_AVATARS.length];
      const id = (cat.id === 'caminando' && i === 0) ? 'req-live-101'
        : (cat.id === 'bicicleta' && i === 0) ? 'req-live-102'
        : (cat.id === 'motocicleta' && i === 0) ? 'req-live-103'
        : (cat.id === 'automovil' && i === 0) ? 'req-live-104'
        : (cat.id === 'fletes' && i === 0) ? 'req-live-105'
        : `req-live-${cat.id}-${i + 1}`;

      const desc = cat.descs[i % cat.descs.length];
      const jitterLat = (((i * 2) % 7) - 3) * 0.0009;
      const jitterLng = (((i * 5) % 7) - 3) * 0.0009;
      const categoryAngle = (categoryIndex / DEMAND_CATEGORIES.length) * Math.PI * 2;
      const categoryOffsetLat = Math.sin(categoryAngle) * 0.0016;
      const categoryOffsetLng = Math.cos(categoryAngle) * 0.0016;
      const lat = Number((zone.lat + jitterLat + categoryOffsetLat).toFixed(6));
      const lng = Number((zone.lng + jitterLng + categoryOffsetLng).toFixed(6));

      const distanceKm = `${zone.km.toFixed(1)} km`;
      const distanceMeters = Math.round(zone.km * 1000);
      const locationLabel = `${zone.label} (${distanceKm})`;

      const feeMultiplier = 1 + ((i % 5) * 0.15);
      const estimatedFeeArs = Math.round(cat.baseFee * feeMultiplier);
      const estimatedFeeValens = Number((cat.baseVal * feeMultiplier).toFixed(1));

      const hours = ['15:00', '16:30', '17:00', '18:15', '19:30', '20:00'][i % 6];
      const scheduledTime = i % 4 === 0 ? 'Inmediato' : `Hoy ${hours} hs`;

      // 0, 1 o 2 cotizaciones anónimas de la competencia
      const offersCount = i % 3;
      const offers = [];
      for (let o = 0; o < offersCount; o++) {
        offers.push({
          id: `offer-${cat.id}-${i}-${o + 1}`,
          cadeteId: `cadete-competitor-${o + 1}`,
          cadeteName: `Cadete ${o + 1}`,
          cadeteAvatar: PEER_AVATARS[(o + 3) % PEER_AVATARS.length],
          cadeteRating: 4.9,
          vehicle: `Vehículo ${cat.label}`,
          feeArs: Math.round(estimatedFeeArs * (0.9 + (o * 0.1))),
          feeValens: estimatedFeeValens,
          note: `Cotización verificada para entrega en ${zone.locality}. Vehículo listo.`,
          timestamp: `Hace ${o + 2} min`
        });
      }

      list.push({
        id,
        clientName: (id === 'req-live-101') ? 'Lucía M.' : (id === 'req-live-102') ? 'Kiosco El Tajamar' : clientName,
        clientAvatar,
        clientRating: Number((4.7 + ((i % 4) * 0.1)).toFixed(1)),
        category: cat.id,
        categoryLabel: cat.label,
        description: (id === 'req-live-101') ? 'Retirar medicamento en Farmacia Belgrano y entregar en B° Pellegrini'
          : (id === 'req-live-102') ? 'Cadete en bicicleta para llevar 2 pedidos gastronómicos calientes a B° Cámara'
          : `${desc} en ${zone.label}`,
        origin: (id === 'req-live-101') ? 'Alta Gracia Centro, Farmacia Belgrano 180' : `${zone.label}, Calle Principal ${100 + (i * 20)}`,
        destination: (id === 'req-live-101') ? 'B° Pellegrini 320, Alta Gracia' : `Entrega en ${zone.locality}, B° Residencial`,
        scheduledTime: (id === 'req-live-101') ? 'Inmediato' : scheduledTime,
        estimatedFeeArs,
        estimatedFeeValens,
        lat,
        lng,
        distanceKm: (id === 'req-live-101') ? '0.5 km' : distanceKm,
        distanceMeters: (id === 'req-live-101') ? 500 : distanceMeters,
        locality: (id === 'req-live-101') ? 'Alta Gracia' : zone.locality,
        locationLabel: (id === 'req-live-101') ? 'Alta Gracia Centro (0.5 km)' : locationLabel,
        status: 'open',
        timestamp: `Hace ${1 + (i % 15)} min`,
        urgent: i % 5 === 0,
        offers
      });
    }
  });

  return list;
};

// 250 Solicitudes de Clientes y Demandas en Vivo (50 por categoría)
export const INITIAL_LIVE_REQUESTS = buildInitialLiveRequests();

const PEER_CATEGORY_CONFIG = [
  { id: 'caminando', prefix: 'cadete-foot', role: 'Cadete Peatonal', icon: '🚶' },
  { id: 'bicicleta', prefix: 'cadete-bike', role: 'Bici-Cadete', icon: '🚲' },
  { id: 'motocicleta', prefix: 'cadete-moto', role: 'Moto-Cadete', icon: '🏍️' },
  { id: 'automovil', prefix: 'cadete-auto', role: 'Auto Remís & Envíos', icon: '🚗' },
  { id: 'fletes', prefix: 'flete-heavy', role: 'Flete Pesado & Carga', icon: '🚚' },
  { id: 'negocios', prefix: 'comercio-store', role: 'Comercio / Tienda P2P', icon: '🏪' }
];

const buildInitialPeers = () => {
  const list = [];
  PEER_CATEGORY_CONFIG.forEach((cat, categoryIndex) => {
    for (let i = 0; i < 50; i++) {
      const zone = GEOGRAPHIC_ZONES[i % GEOGRAPHIC_ZONES.length];
      const name = PEER_NAMES[i % PEER_NAMES.length];
      const avatar = PEER_AVATARS[i % PEER_AVATARS.length];
      const id = `${cat.prefix}-${i + 1}`;

      let serviceModality = 'envios';
      if (cat.id === 'motocicleta') {
        serviceModality = i % 3 === 0 ? 'envios' : i % 3 === 1 ? 'pasajeros' : 'mixto';
      } else if (cat.id === 'automovil') {
        serviceModality = i % 3 === 0 ? 'pasajeros' : i % 3 === 1 ? 'envios' : 'mixto';
      }

      let vehicle = '';
      let loadCapacity = '';
      if (cat.id === 'caminando') {
        vehicle = 'A Pie / Mochila Urbana 🎒';
        loadCapacity = 'Mochila Urbana 🎒 - Hasta 8 kg';
      } else if (cat.id === 'bicicleta') {
        vehicle = 'Bicicleta Rodado 29 con Parrilla 🚲';
        loadCapacity = 'Caja Térmica 🚲 - Hasta 15 kg';
      } else if (cat.id === 'motocicleta') {
        if (serviceModality === 'pasajeros') {
          vehicle = 'Moto Honda XR 150cc 🏍️';
          loadCapacity = 'Traslado de 1 Pasajero (Casco extra incluido)';
        } else if (serviceModality === 'envios') {
          vehicle = 'Moto Honda Wave 110cc 🛵';
          loadCapacity = 'Baúl Térmico 80L 🛵 - Hasta 25 kg';
        } else {
          vehicle = 'Moto Yamaha YBR 125cc 🏍️';
          loadCapacity = '1 Pasajero o Encomiendas hasta 25 kg';
        }
      } else if (cat.id === 'automovil') {
        if (serviceModality === 'pasajeros') {
          vehicle = 'Fiat Cronos 1.3 Sedán 🚖';
          loadCapacity = 'Hasta 4 Pasajeros con Aire Acondicionado';
        } else if (serviceModality === 'envios') {
          vehicle = 'Renault Kangoo Utilitario 📦';
          loadCapacity = 'Baúl Grande 🚗 - Cargas hasta 200 kg';
        } else {
          vehicle = 'Chevrolet Onix Plus 🔄';
          loadCapacity = '3 Pasajeros o Baúl de 470 Litros';
        }
      } else if (cat.id === 'fletes') {
        vehicle = 'Ford Ranger / F-100 Carrozada 🚚';
        loadCapacity = 'Caja Abierta / Cerrada 🚚 - Cargas hasta 1.500 kg';
      } else if (cat.id === 'negocios') {
        vehicle = 'Local Comercial / Mostrador Fijo 🏪';
        loadCapacity = 'Stock Permanente en Mostrador 🏪 - Retiro Inmediato';
      }

      const jitterLat = ((i % 7) - 3) * 0.0008;
      const jitterLng = (((i * 3) % 7) - 3) * 0.0008;
      const categoryAngle = (categoryIndex / PEER_CATEGORY_CONFIG.length) * Math.PI * 2;
      const categoryOffsetLat = Math.sin(categoryAngle) * 0.0016;
      const categoryOffsetLng = Math.cos(categoryAngle) * 0.0016;
      const finalLat = Number((zone.lat + jitterLat + categoryOffsetLat).toFixed(6));
      const finalLng = Number((zone.lng + jitterLng + categoryOffsetLng).toFixed(6));

      const distanceKm = `${zone.km.toFixed(1)} km`;
      const distanceMeters = Math.round(zone.km * 1000);
      const locationLabel = `${zone.label} (${distanceKm})`;

      list.push({
        id,
        name,
        type: 'cadete',
        category: cat.id,
        role: `${cat.role} (${zone.locality})`,
        serviceModality,
        distance: distanceKm,
        distanceKm,
        distanceMeters,
        rating: Number((4.80 + ((i % 20) * 0.01)).toFixed(2)),
        reviewsCount: 20 + ((i * 13) % 150),
        vehicle,
        vehicleIcon: cat.icon,
        status: i % 12 === 0 ? 'En viaje P2P' : 'Disponible ahora',
        isOnline: true,
        avatar,
        address: `valens1q${cat.prefix}${i + 1}p2pnetwork`,
        walletStatus: '🟢 Billetera Verificada',
        baseFee: cat.id === 'fletes' ? '$8.500 ARS' : cat.id === 'negocios' ? '$3.200 ARS' : cat.id === 'automovil' ? '$3.800 ARS' : cat.id === 'motocicleta' ? '$2.400 ARS' : cat.id === 'bicicleta' ? '$1.800 ARS' : '$1.400 ARS',
        cryptoFee: cat.id === 'fletes' ? '3.5 VALENS' : cat.id === 'negocios' ? '1.2 VALENS' : cat.id === 'automovil' ? '1.5 VALENS' : cat.id === 'motocicleta' ? '1.0 VALENS' : '0.6 VALENS',
        description: `Logística P2P soberana en ${zone.locality} y corredor metropolitano. Entrega directa sin comisiones abusivas.`,
        locationLabel,
        locality: zone.locality,
        zone: zone.label,
        lat: finalLat,
        lng: finalLng,
        x: 50 + (((finalLng + 64.30) / 0.3) * 50),
        y: 50 - (((finalLat + 31.55) / 0.3) * 50),
        specialties: ['Directo P2P', zone.locality, cat.role],
        completedDeliveries: 45 + ((i * 17) % 350),
        reputation: i === 13 || i === 37 ? 'reported' : 'recommended',
        recommendations: 20 + ((i * 7) % 80),
        reportsCount: i === 13 || i === 37 ? 1 : 0,
        reputationReports: (i === 13 || i === 37) ? [
          {
            reason: 'Cobro engañoso / Sobreprecio',
            comment: 'Intentó cobrar tarifa fuera de lo acordado en la orden.',
            date: 'Ayer',
            status: 'pending_review'
          }
        ] : [],
        coverageArea: 'Gran Córdoba, Alta Gracia & Valle de Paravachasca',
        operatingHours: 'Lun a Sáb 08:00 - 21:00 hs',
        responseTime: '5-15 min',
        insuranceVerified: true,
        loadCapacity,
        fiatPaymentMethods: ['Mercado Pago', 'Brubank', 'Transferencia'],
        socials: {
          instagram: `@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.gremami`,
          whatsapp: '+5493547420101',
          twitter: `@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}_p2p`,
          facebook: `${name} Gremami P2P`
        }
      });
    }
  });
  return list;
};

export const INITIAL_PEERS = buildInitialPeers();

export const INITIAL_MESSAGES = {
  'cadete-moto-1': [
    {
      id: 'm1',
      sender: 'peer',
      senderName: 'Diego T. (Moto)',
      text: '¡Hola! Estoy con la moto cerca de Av. Belgrano y El Tajamar. ¿Tenés algún paquete para retirar o entregar?',
      timestamp: '10:35',
      type: 'text'
    },
    {
      id: 'm2',
      sender: 'user',
      text: '¡Hola Diego! Necesito retirar un sobre en el Kiosco El Tajamar y llevarlo a B° Pellegrini.',
      timestamp: '10:36',
      type: 'text'
    },
    {
      id: 'm3',
      sender: 'peer',
      senderName: 'Diego T. (Moto)',
      text: 'Dale, paso de inmediato. Acordamos el pago directo sin comisiones bancarias.',
      timestamp: '10:38',
      type: 'text'
    }
  ],
  'cadete-auto-1': [
    {
      id: 'm_auto1',
      sender: 'peer',
      senderName: 'Carlos Mendoza (Auto)',
      text: '¡Hola! Tengo el Cronos con baúl libre de 525L en Av. Belgrano por si precisas llevar cajas grandes o compras.',
      timestamp: '10:25',
      type: 'text'
    }
  ],
  'cadete-bike-1': [
    {
      id: 'm_bike1',
      sender: 'peer',
      senderName: 'Leo M. (Bicicleta)',
      text: '¡Hola! Estoy por la ciclovía de Av. España en bici fixie. Listo para pedidos livianos o comida caliente.',
      timestamp: '10:20',
      type: 'text'
    }
  ],
  'cadete-foot-1': [
    {
      id: 'm_foot1',
      sender: 'peer',
      senderName: 'Ana P. (A Pie)',
      text: '¡Buenas! Estoy a pie cerca de Plaza Solares por si necesitas un trámite o mandado urgente.',
      timestamp: '10:10',
      type: 'text'
    }
  ],
  'comercio-1': [
    {
      id: 'm_k1',
      sender: 'peer',
      senderName: 'Kiosco El Tajamar 24hs',
      text: '¡Hola! Bienvenido al chat directo de Kiosco El Tajamar. Todo nuestro stock está disponible para retiro con cadetes P2P.',
      timestamp: '09:15',
      type: 'text'
    }
  ]
};

// Historial inicial para el Dashboard Multimoneda (Cliente y Cadete)
export const INITIAL_ORDERS_HISTORY = {
  cliente: [
    {
      id: 'ord-101',
      date: 'Hoy, 11:45',
      counterpart: 'Leo M. (Bicicleta)',
      route: 'Kiosco El Tajamar ➔ B° Pellegrini',
      amountArs: 3500,
      amountUsd: 2.80,
      valensReward: 1.0,
      status: 'Completado',
      savingsArs: 1500,
      pin: '4821',
      pinVerified: true
    },
    {
      id: 'ord-102',
      date: 'Ayer, 18:20',
      counterpart: 'Diego T. (Moto)',
      route: 'Farmacia Belgrano ➔ B° Cámara',
      amountArs: 4200,
      amountUsd: 3.36,
      valensReward: 1.0,
      status: 'Completado',
      savingsArs: 1800,
      pin: '7392',
      pinVerified: true
    },
    {
      id: 'ord-103',
      date: '04 Oct, 14:10',
      counterpart: 'Panadería La Espiga Dorada',
      route: 'Calle Sarmiento ➔ El Tajamar',
      amountArs: 2900,
      amountUsd: 2.32,
      valensReward: 0.5,
      status: 'Completado',
      savingsArs: 1250,
      pin: '5120',
      pinVerified: true
    },
    {
      id: 'ord-104',
      date: '02 Oct, 19:30',
      counterpart: 'Carlos Mendoza (Auto)',
      route: 'Don Pepe Almacén ➔ Villa Camiares',
      amountArs: 6500,
      amountUsd: 5.20,
      valensReward: 2.0,
      status: 'Completado',
      savingsArs: 2800,
      pin: '8841',
      pinVerified: true
    }
  ],
  cadete: [
    {
      id: 'del-201',
      date: 'Hoy, 12:15',
      counterpart: 'Mariana T. (Cliente)',
      route: 'Av. Belgrano ➔ Sierras Hotel',
      amountArs: 3800,
      amountUsd: 3.04,
      valensEarned: 1.0,
      status: 'Completado',
      commissionSavedArs: 1650,
      pin: '4821',
      pinVerified: true
    },
    {
      id: 'del-202',
      date: 'Ayer, 20:00',
      counterpart: 'Pizzería Sarmiento (Comercio)',
      route: 'Calle Sarmiento ➔ B° Don Bosco',
      amountArs: 4500,
      amountUsd: 3.60,
      valensEarned: 1.5,
      status: 'Completado',
      commissionSavedArs: 1950,
      pin: '6619',
      pinVerified: true
    },
    {
      id: 'del-203',
      date: '04 Oct, 17:40',
      counterpart: 'Guillermo H. (Cliente)',
      route: 'Mateo Beres ➔ Plaza Solares',
      amountArs: 3200,
      amountUsd: 2.56,
      valensEarned: 1.0,
      status: 'Completado',
      commissionSavedArs: 1400,
      pin: '3210',
      pinVerified: true
    },
    {
      id: 'del-204',
      date: '03 Oct, 13:00',
      counterpart: 'Andrea L. (Flete)',
      route: 'El Crucero ➔ Sabattini',
      amountArs: 7200,
      amountUsd: 5.76,
      valensEarned: 2.5,
      status: 'Completado',
      commissionSavedArs: 3100,
      pin: '9082',
      pinVerified: true
    }
  ]
};

export const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-001',
    type: 'airdrop',
    amount: 10,
    title: 'Airdrop Inicial Valens Testnet',
    date: 'Hoy, 09:00',
    hash: '0x3a7e...f82b',
    status: 'Confirmado',
    note: 'Fondos iniciales de bienvenida en la red de pruebas (Layer 1)'
  }
];

export const BIP39_SEED_WORDS = [
  'satoshi',
  'freedom',
  'raven',
  'ledger',
  'block',
  'genesis',
  'valens',
  'network',
  'merkle',
  'halving',
  'p2p',
  'cadete'
];

export const CRYPTO_SCHOOL_MODULES = [
  {
    id: 'keys',
    title: '1. Clave Pública vs Clave Privada',
    subtitle: 'La metáfora del buzón postal inteligente',
    icon: 'Key',
    summary: 'Tu clave pública es como tu dirección postal (todos pueden enviarte cosas). Tu clave privada es la llave única de tu buzón: solo tú puedes abrirlo.',
    points: [
      'Clave Pública: Puedes compartirla libremente para recibir pagos o propinas.',
      'Clave Privada: Jamás debe ser compartida con nadie, ni siquiera con soporte de Gremami.',
      'Firma Criptográfica: Demuestra matemáticamente que eres el dueño sin revelar tu clave secreta.'
    ]
  },
  {
    id: 'self-custody',
    title: '2. Autocustodia ("Not your keys, not your coins")',
    subtitle: 'Sé tu propio banco sin intermediarios',
    icon: 'Shield',
    summary: 'En plataformas bancarias tradicionales, tu dinero está en manos de un tercero que puede congelarlo. En Gremami P2P, los micropagos Valens son directos.',
    points: [
      'Sin custodios centrales: Eres el único responsable y dueño de tus fondos.',
      'Inmunidad ante quiebras bancarias o restricciones arbitrarias.',
      'Los intercambios de entrega se coordinan peer-to-peer de forma soberana.'
    ]
  },
  {
    id: 'seed-phrase',
    title: '3. La Frase Semilla de Respaldo',
    subtitle: '12 palabras que custodian tu identidad y fondos',
    icon: 'FileText',
    summary: 'La frase semilla es la representación legible para humanos de tu clave maestra privada.',
    points: [
      'Si pierdes tu teléfono, con tus 12 palabras restauras tu billetera al instante.',
      'Escríbela en papel y guárdala en un lugar seguro (evita capturas de pantalla).',
      'Cualquiera que tenga tus 12 palabras tiene acceso total a tus ValensCoins.'
    ]
  },
  {
    id: 'micropayments',
    title: '4. Micropagos y Efectivo en Mano',
    subtitle: 'El modelo híbrido P2P de Gremami',
    icon: 'Coins',
    summary: 'Combinamos la certeza del efectivo en mano ($1.500 ARS / $1 USD) para gastos operativos diarios con la agilidad digital de ValensCoin para propinas y reputación descentralizada.',
    points: [
      'Cero comisiones abusivas de pasarelas de pago corporativas.',
      'El cadete recibe el 100% de su tarifa acordada.',
      'Las propinas en ValensCoin construyen reputación on-chain verificable.'
    ]
  }
];

// Mercado P2P DEX: Libro de órdenes abierto descentralizado para Alta Gracia
export const INITIAL_DEX_ORDERS = [
  {
    id: 'dex-ord-101',
    type: 'donation_request', // 'donation_request' | 'sell' | 'buy'
    title: '🎁 Pedido de Donación / Solidaridad (1 VALENS)',
    userName: 'Lucas G.',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    userRole: 'Moto-Cadete (B° Cámara)',
    amountValens: 1.0,
    priceArs: 0,
    unitPriceArs: 0,
    paymentMethod: 'Solidaridad P2P (0 ARS)',
    description: 'Me quedé en 0 VALENS de gas y no aparezco activo en el radar de Alta Gracia. ¿Algún compañero me dona 1 VALENS para salir a repartir? ¡Lo compenso con un favor!',
    urgency: 'alta',
    status: 'open',
    timestamp: 'Hace 12 min'
  },
  {
    id: 'dex-ord-102',
    type: 'sell',
    title: '🛒 Oferta de Venta: 5 VALENS',
    userName: 'Roberto F.',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    userRole: 'Chofer Flete (Av. España)',
    amountValens: 5.0,
    unitPriceArs: 1200,
    priceArs: 6000,
    paymentMethod: 'Transferencia Mercado Pago / Efectivo',
    description: 'Vendo 5 VALENS a $1.200 ARS c/u (Total: $6.000 ARS). Entrega inmediata por transferencia o efectivo en mano.',
    status: 'open',
    timestamp: 'Hace 35 min'
  },
  {
    id: 'dex-ord-103',
    type: 'buy',
    title: '💰 Oferta de Compra: 10 VALENS',
    userName: 'Farmacia El Sol',
    userAvatar: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=150&auto=format&fit=crop&q=80',
    userRole: 'Comercio Adherido (Av. Belgrano)',
    amountValens: 10.0,
    unitPriceArs: 1000,
    priceArs: 10000,
    paymentMethod: 'Efectivo en Caja o Alias MP',
    description: 'Compro 10 VALENS a $1.000 ARS c/u para dar bonificaciones a cadetes de pedidos urgentes del comercio.',
    status: 'open',
    timestamp: 'Hace 1 hora'
  },
  {
    id: 'dex-ord-104',
    type: 'donation_request',
    title: '🎁 Pedido de Donación: 1 VALENS (Nuevo Cadete)',
    userName: 'Tomás Bici',
    userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    userRole: 'Bici-Cadete (El Tajamar)',
    amountValens: 1.0,
    priceArs: 0,
    unitPriceArs: 0,
    paymentMethod: 'Solidaridad Comunitaria (0 ARS)',
    description: 'Recién configuro mi billetera en Alta Gracia. Necesito 1 VALENS para que mi nodo aparezca en el mapa.',
    urgency: 'media',
    status: 'open',
    timestamp: 'Hace 2 horas'
  },
  {
    id: 'dex-ord-105',
    type: 'sell',
    title: '🛒 Oferta de Venta: 8 VALENS',
    userName: 'Sofía K.',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    userRole: 'Bici-Cadete (B° Pellegrini)',
    amountValens: 8.0,
    unitPriceArs: 1150,
    priceArs: 9200,
    paymentMethod: 'Mercado Pago / Transferencia CBU',
    description: 'Vendo 8 VALENS acumulados de entregas a $1.150 ARS c/u. Operación rápida y directa.',
    status: 'open',
    timestamp: 'Hace 3 horas'
  },
  {
    id: 'dex-ord-106',
    type: 'buy',
    title: '💰 Oferta de Compra: 5 VALENS',
    userName: 'Diego T.',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    userRole: 'Moto-Cadete (Av. Belgrano)',
    amountValens: 5.0,
    unitPriceArs: 1050,
    priceArs: 5250,
    paymentMethod: 'Efectivo en mano en Alta Gracia',
    description: 'Compro 5 VALENS a $1.050 ARS c/u en efectivo en mano por el centro o Tajamar.',
    status: 'open',
    timestamp: 'Hace 4 horas'
  }
];

// ====================================================================
// PERFILES PÚBLICOS DE LA COMUNIDAD GREMAMI P2P (Buscador y Perfiles Públicos)
// ====================================================================
export const MOCK_COMMUNITY_USERS = [
  {
    id: 'user-satoshidev',
    name: 'Satoshi Nakamoto',
    username: 'SatoshiDev',
    email: 'satoshi@gremami.test',
    role: 'cadete',
    roleLabel: 'Cadete / Creador P2P',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    rating: 5.0,
    reviewsCount: 48,
    completedAgreements: 142,
    address: 'valens1q7x8m9z4k0t3w2y5d8c1f6g9h2j4l7v9m3a',
    isOnline: true,
    coverageZone: 'Alta Gracia Centro & Valle de Paravachasca',
    vehicle: 'Moto Eléctrica Soberana ⚡',
    badges: ['Verificado L1', 'Pionero P2P', '100% Reputación'],
    bio: 'Desarrollador y cadete independiente. Promoviendo la soberanía económica y la logística sin intermediarios en Alta Gracia.',
    reviews: [
      {
        id: 'rev-s1',
        author: 'Sol ☀',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        stars: 5,
        date: 'Hace 1 día',
        comment: 'Excelente compañero de comunidad. Puntual, respetuoso y con las cuentas claras en mano.'
      },
      {
        id: 'rev-s2',
        author: 'Lucas R.',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        stars: 5,
        date: 'Hace 3 días',
        comment: 'Entregó un paquete delicado en tiempo récord por Av. Belgrano. Muy agradecido con el servicio.'
      },
      {
        id: 'rev-s3',
        author: 'Panadería Tajamar',
        avatar: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&auto=format&fit=crop&q=80',
        stars: 5,
        date: 'La semana pasada',
        comment: 'Cadete de confianza permanente para el reparto de facturas y panadería a comercios vecinos.'
      }
    ]
  },
  {
    id: 'user-sol-p2p',
    name: 'Sol Gómez',
    username: 'sol_ag',
    email: 'sol.cadete@gremami.test',
    role: 'cadete',
    roleLabel: 'Bici-Cadete Urbana',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    rating: 4.96,
    reviewsCount: 39,
    completedAgreements: 98,
    address: 'valens1qsol99p2paltagracia',
    isOnline: true,
    coverageZone: 'Barrio Tajamar, Pellegrini & Parque García',
    vehicle: 'Bicicleta Rodado 29 Urbana 🚲',
    badges: ['Bici-Cadete', 'Eco-Friendly', 'Puntualidad 100%'],
    bio: 'Cadetería rápida y ecológica en bicicleta por Alta Gracia. Envíos de documentos, viandas y medicamentos.',
    reviews: [
      {
        id: 'rev-sol-1',
        author: 'Mar 🌊',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
        stars: 5,
        date: 'Ayer',
        comment: 'Súper ágil en el centro. Llegó antes de lo previsto y con la mejor onda.'
      },
      {
        id: 'rev-sol-2',
        author: 'Camila V.',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
        stars: 5,
        date: 'Hace 4 días',
        comment: 'Me trajo las compras de la farmacia sin demoras. Recomendada totalmente.'
      }
    ]
  },
  {
    id: 'user-leo-flete',
    name: 'Leo Martínez',
    username: 'leo_fletes',
    email: 'leo.fletes@gremami.test',
    role: 'cadete',
    roleLabel: 'Fletes & Cargas Pesadas',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    rating: 4.92,
    reviewsCount: 52,
    completedAgreements: 115,
    address: 'valens1qleo44fletesparavachasca',
    isOnline: true,
    coverageZone: 'Valle de Paravachasca, Ruta 5 & Anisacate',
    vehicle: 'Camioneta Ford F-100 Carrozada 🚚',
    badges: ['Cargas Grandes', 'Flete Soberano', 'Cobertura Valle'],
    bio: 'Mudanzas medianas, traslado de materiales y bultos grandes en todo el valle. Precios directos sin comisión de app.',
    reviews: [
      {
        id: 'rev-leo-1',
        author: 'Panadería Tajamar',
        avatar: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&auto=format&fit=crop&q=80',
        stars: 5,
        date: 'Hace 3 días',
        comment: 'Trasladó 15 bolsas de harina desde el molino a la panadería con gran cuidado.'
      },
      {
        id: 'rev-leo-2',
        author: 'Lucas R.',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        stars: 5,
        date: 'Hace 2 semanas',
        comment: 'Hicimos mudanza chica de electrodomésticos y todo llegó impecable.'
      }
    ]
  },
  {
    id: 'user-mar-moto',
    name: 'Mar Fernández',
    username: 'mar_delivery',
    email: 'mar.p2p@gremami.test',
    role: 'cadete',
    roleLabel: 'Moto-Cadete Express',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    rating: 4.98,
    reviewsCount: 78,
    completedAgreements: 210,
    address: 'valens1qmar88valenscoinl1',
    isOnline: true,
    coverageZone: 'Alta Gracia, Villa Bolsa & Villa Los Aromos',
    vehicle: 'Moto Honda GLH 150cc 🏍️',
    badges: ['Repartidor Top', 'Rapidez Garantizada', 'Valens Aceptado'],
    bio: 'Cadetería en moto con baúl térmico de 80 litros. Repartos gastronómicos, trámites y paquetería urgente.',
    reviews: [
      {
        id: 'rev-mar-1',
        author: 'Satoshi Nakamoto',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        stars: 5,
        date: 'Hace 2 días',
        comment: 'Gran compromiso con la red descentralizada. Siempre disponible y muy atenta.'
      },
      {
        id: 'rev-mar-2',
        author: 'Sol ☀',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        stars: 5,
        date: 'Hace 5 días',
        comment: 'Excelente colega para coordinar pedidos cuando hay alta demanda en la zona.'
      }
    ]
  },
  {
    id: 'user-lucas-cliente',
    name: 'Lucas Rodríguez',
    username: 'lucas_cliente',
    email: 'lucas.r@gremami.test',
    role: 'cliente',
    roleLabel: 'Cliente P2P Habitual',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    rating: 4.95,
    reviewsCount: 18,
    completedAgreements: 34,
    address: 'valens1qlucasclienteag01',
    isOnline: false,
    coverageZone: 'Alta Gracia Centro',
    badges: ['Cliente Frecuente', 'Buen Pagador', 'PIN Rápido'],
    bio: 'Vecino del centro de Alta Gracia. Uso Gremami P2P para compras locales y trámites semanales.',
    reviews: [
      {
        id: 'rev-luc-1',
        author: 'Leo Martínez',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        stars: 5,
        date: 'Hace 1 semana',
        comment: 'Cliente de diez. Indicó la dirección perfecta, bajó enseguida a recibir y pagó lo acordado.'
      }
    ]
  },
  {
    id: 'user-camila-cliente',
    name: 'Camila Varela',
    username: 'cami_varela',
    email: 'camila.v@gremami.test',
    role: 'cliente',
    roleLabel: 'Cliente P2P',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    rating: 4.90,
    reviewsCount: 22,
    completedAgreements: 52,
    address: 'valens1qcamilaagparavachasca',
    isOnline: true,
    coverageZone: 'Villa Golf & Casco Histórico',
    badges: ['Cliente Verificada', 'Propinas en VAL'],
    bio: 'Compradora habitual en comercios de la ciudad. Prefiero pactar directo con los cadetes.',
    reviews: [
      {
        id: 'rev-cam-1',
        author: 'Sol ☀',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        stars: 5,
        date: 'Hace 4 días',
        comment: 'Muy cordial y respetuosa con los tiempos de entrega. Da gusto trabajar así.'
      }
    ]
  },
  {
    id: 'user-comercio-tajamar',
    name: 'Panadería Tajamar',
    username: 'panaderia_tajamar',
    email: 'tajamar.pan@gremami.test',
    role: 'comercio',
    roleLabel: 'Comercio Local Adherido',
    avatar: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80',
    rating: 4.88,
    reviewsCount: 94,
    completedAgreements: 320,
    address: 'valens1qtajamarcomerciosag',
    isOnline: true,
    coverageZone: 'Av. Sarmiento 240, Alta Gracia',
    badges: ['Comercio Histórico', 'Punto de Retiro', 'Acepta ValensCoin'],
    bio: 'Panadería artesanal y confitería desde 1982. Envíos calientes a domicilio coordinados directamente con cadetes locales.',
    reviews: [
      {
        id: 'rev-taj-1',
        author: 'Mar Fernández',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
        stars: 5,
        date: 'Ayer',
        comment: 'Siempre tienen los paquetes embalados a tiempo. El trato en el mostrador es impecable.'
      }
    ]
  }
];
