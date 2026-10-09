# Gremami P2P - Progressive Web App (PWA) Móvil (Bitcoin + Ravencoin)

Plataforma P2P educativa y logística con micropagos **ValensCoin (Testnet Layer 1)** y acuerdos de pago local en mano a mano, construida desde cero con **React**, **Tailwind CSS** y **Lucide Icons**.

---

## 🦅 Identidad Visual Cripto Híbrida (Bitcoin + Ravencoin)
- **Fondo Principal**: Azul Oscuro Metalizado Ravencoin (`#0A1128` / `#070C1E`).
- **Tarjetas y Superficies**: Azul Carbón Mate (`#121B2D` / `#1A253D`).
- **Acentos Primarios Bitcoin**: Naranja Bitcoin (`#F7931A`) y Dorado (`#F0B90B`).
- **Acentos Secundarios Ravencoin**: Rojo Cuervo Ravencoin (`#E02424` / `#E2231A`) para alertas, badges o estados especiales.
- **Bordes y Sombras Neón**: Bordes suaves (`rounded-2xl`) con resplandor difuso naranja (`shadow-glow-orange`) y rojo cuervo (`shadow-glow-raven`).

---

## 🚀 Arquitectura y Pantallas

### 1. Pantalla Inicial / Home de Categorías (4 Botones Principales)
Diseñada especialmente para la experiencia de entrada en **Modo Cliente** con acceso inmediato a los 4 pilares de servicio:
1. 🚶 **"Servicios Caminando"** (`Footprints`): Delivery a pie y mandados cercanos (llaves, sobres, farmacias en la misma manzana).
2. 🚲 **"Servicios en Bicicleta"** (`Bike`): Bici-cadetes ágiles y logística liviana en ciclovías.
3. 🚗 **"Servicios de Automóviles"** (`Car`): Transporte vehicular, baúl amplio y cargas pesadas/supermercado.
4. 🏪 **"Comercios y Negocios"** (`Store`): Kioscos 24hs, almacenes, farmacias y puntos oficiales de encuentro P2P.

> **Acción directa**: Al presionar cualquiera de estas 4 tarjetas, la app redirige automáticamente a la pestaña **Mapa P2P** con el filtro de categoría aplicado.

---

### 2. Mapa P2P Nocturno (Filtrado por Categoría)
- Interfaz estilo Google Maps nocturno con vías principales, avenidas iluminadas, río y parques urbanos sobre la paleta azul metálico Ravencoin.
- Marcadores interactivos filtrados según la categoría elegida (o explorables con la barra superior de píldoras: *Todos*, *A pie*, *Bicicleta*, *Vehículos*, *Negocios*).
- Cada pin muestra avatar del peer, distancia relativa (ej. *250m*, *300m*, *650m*) y calificación en estrellas (*4.9 ★*).
- **Tarjeta Inferior (Bottom Sheet)** al presionar un pin:
  - Foto de perfil, nombre, tipo de vehículo/servicio y badges de categoría.
  - **Reseñas recíprocas recientes** (comentarios reales de clientes y pares).
  - **Tarifa P2P sugerida en dinero local** (`$1.00 USD / $1,250 ARS`) y **estado de su billetera ValensCoin** (verificación on-chain).
  - Botón de acción: **"Iniciar Chat P2P Directo"** para entablar conversación sin intermediarios.

---

### 3. Header Superior e Interruptor de Rol
- Marca con emblema híbrido `₿🦅 Gremami P2P` y badge `RVN · BTC`.
- Indicador **Valens Testnet** con pulso verde esmeralda y altura de bloque.
- **Interruptor de Rol**: Alterna fluidamente entre **Modo Cliente** y **Modo Cadete**.
- En **Modo Cadete**:
  - Alerta `🟢 Visibilidad GPS: Activa en Radar`.
  - Validación de depósito de garantía mínimo ($\ge 1.0\text{ VALENS}$) con advertencia y atajo al grifo testnet.
- Acceso directo al **Perfil y Frase Semilla** desde el header.

---

### 4. Chat P2P Directo
- Mensajería interactiva soberana con respuestas automáticas contextuales.
- **Acciones Rápidas Integradas**:
  - 💵 **"Acordar Pago Local ($1 USD)"**: Modal para indicar descripción de paquete y publicación de la tarjeta de acuerdo en efectivo contra entrega.
  - ⚡ **"Transferir 1 ValensCoin de Agradecimiento vía QR"**: Modal con código QR criptográfico, dirección de billetera, validación de fondos y firma on-chain con generación de recibo TxHash.

---

### 5. Billetera ValensCoin & Escuela Cripto P2P
- Tarjeta de saldo disponible (inicia en **10.00 VALENS**).
- Clave pública con copiado rápido de un toque (`¡Copiado!`).
- Código QR para recibir transferencias y botón **Grifo / Faucet (+5 VAL)**.
- **Escuela Cripto P2P (Acordeón Educativo)**:
  1. *Clave Pública vs Clave Privada* (Analogía del buzón postal).
  2. *Autocustodia* ("Not your keys, not your coins").
  3. *La Frase Semilla* (12 palabras de respaldo).
  4. *Micropagos y Efectivo en Mano* (El modelo híbrido Gremami).
  - Mini-Trivia interactiva con recompensa didáctica.
- Historial de transacciones on-chain.

---

### 6. Perfil, Reputación & Frase Semilla
- Datos de usuario `SatoshiDev`, nivel de reputación (promedio de **4.96 ★**, 54 evaluaciones, 100% cumplimiento).
- Historial de acuerdos P2P completados.
- **Bóveda de Frase Semilla BIP-39**: Protegida por PIN (código de 4 dígitos como `1234`), revela las 12 palabras de recuperación con opción de copiado y advertencias de seguridad física.

---

### 7. Navegación Inferior Fija (Bottom Nav)
Barra fija de 4 pestañas:
1. 🔲 **Inicio/Categorías** (`LayoutGrid`): Dashboard principal con los 4 botones de servicio.
2. 📍 **Mapa P2P** (`MapPin`): Radar urbano filtrado con bottom sheet.
3. 💬 **Chat P2P** (`MessageSquare`): Mensajería con acuerdos y propinas QR.
4. 💳 **Billetera** (`Wallet`): Saldo, grifo y Escuela Cripto.

---

## 💻 Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo en puerto 3000
npm.cmd run dev

# Compilar para producción
npm.cmd run build

# Previsualizar compilación
npm.cmd run preview
```

## 🔐 Configuración de inicio de sesión con Google

La aplicación usa Supabase Auth para el registro e inicio de sesión con Google. En el panel de Supabase:

1. En **Authentication → Sign In / Providers**, activa **Google** y configura el Client ID y Client Secret de OAuth.
2. En la configuración OAuth de Google, registra como URI de redirección autorizada `https://<project-ref>.supabase.co/auth/v1/callback`.
3. En **Authentication → URL Configuration**, agrega el origen de la aplicación a las URL de redirección permitidas (por ejemplo, `http://localhost:3000` para desarrollo y el dominio publicado).
4. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env` y reinicia Vite después de cambiarlos.
5. En **SQL Editor** de Supabase, ejecuta [`supabase/schema.sql`](./supabase/schema.sql) para crear o actualizar las tablas y políticas. Vuelve a ejecutarlo después de cambios del esquema; incluye una migración compatible para agregar `profiles.vehicle_type` a proyectos existentes.
