// API service for SGO-Logic Frontend (Fase 3)
// Integrado con backend Java Spring Boot (ordenes-service :8081, inventario-service :8082, facturacion-service :8084) y .NET 8 (:8086)

const API_HOST = (typeof window !== 'undefined' && window.location && window.location.hostname)
  ? window.location.hostname
  : 'localhost';

export const ORDENES_API = (typeof process !== 'undefined' && process.env?.REACT_APP_ORDENES_API)
  ? process.env.REACT_APP_ORDENES_API
  : (import.meta.env?.VITE_ORDENES_API || `http://${API_HOST}:8081/api`);

export const INVENTARIO_API = (typeof process !== 'undefined' && process.env?.REACT_APP_INVENTARIO_API)
  ? process.env.REACT_APP_INVENTARIO_API
  : (import.meta.env?.VITE_INVENTARIO_API || `http://${API_HOST}:8082/api/inventario`);

export const FACTURACION_API = (typeof process !== 'undefined' && process.env?.REACT_APP_FACTURACION_API)
  ? process.env.REACT_APP_FACTURACION_API
  : (import.meta.env?.VITE_FACTURACION_API || `http://${API_HOST}:8084/api/facturas`);

export const PAGOS_API = (typeof process !== 'undefined' && process.env?.REACT_APP_PAGOS_API)
  ? process.env.REACT_APP_PAGOS_API
  : (import.meta.env?.VITE_PAGOS_API || `http://${API_HOST}:8083/api`);

export const LOGISTICA_API = (typeof process !== 'undefined' && process.env?.REACT_APP_LOGISTICA_API)
  ? process.env.REACT_APP_LOGISTICA_API
  : (import.meta.env?.VITE_LOGISTICA_API || `http://${API_HOST}:8085/api/logistica`);

export const NOTIFICACIONES_API = (typeof process !== 'undefined' && process.env?.REACT_APP_NOTIFICACIONES_API)
  ? process.env.REACT_APP_NOTIFICACIONES_API
  : (import.meta.env?.VITE_NOTIFICACIONES_API || `http://${API_HOST}:8086/api/notificaciones`);

const fetchWithTimeout = async (url, options = {}, timeoutMs = 800) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

const INITIAL_PRODUCTS = [
  {
    id: 'prod-001',
    nombre: 'Cafetera Espresso Profesional Serie X',
    descripcion: 'Máquina automática de acero inoxidable con molinillo integrado de 15 bares.',
    precio: 249.99,
    precioAnterior: 299.99,
    categoria: 'Línea Blanca',
    imagen: 'https://images.unsplash.com/photo-1517668808822-9efe02eae25c?auto=format&fit=crop&w=600&q=80',
    stock: 15,
    tag: 'Disponible',
    tagType: 'orange',
    rating: 4.8
  },
  {
    id: 'prod-002',
    nombre: 'Refrigerador Inteligente Multi-Door 24 cu.ft',
    descripcion: 'Control WiFi, dispensador de agua purificada y pantalla táctil HD de 21".',
    precio: 1499.00,
    precioAnterior: 1799.00,
    categoria: 'Línea Blanca',
    imagen: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80',
    stock: 3,
    tag: 'Últimas unidades',
    tagType: 'error',
    rating: 4.9
  },
  {
    id: 'prod-003',
    nombre: 'Robot Aspirador con Mapeo Láser LiDAR',
    descripcion: 'Navegación inteligente de precisión, trapeado ultrasónico y estación de autovaciado.',
    precio: 429.50,
    precioAnterior: 499.00,
    categoria: 'Electrónica',
    imagen: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&q=80',
    stock: 20,
    tag: 'Popular',
    tagType: 'info',
    rating: 4.7
  },
  {
    id: 'prod-004',
    nombre: 'Smartwatch Deportivo V3 Pro AMOLED',
    descripcion: 'Medición de oxigenación de sangre, GPS multibanda y autonomía de 14 días.',
    precio: 189.99,
    precioAnterior: 229.00,
    categoria: 'Electrónica',
    imagen: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80',
    stock: 28,
    tag: 'Disponible',
    tagType: 'orange',
    rating: 4.6
  },
  {
    id: 'prod-005',
    nombre: 'Auriculares Inalámbricos Noise Cancelling Pro',
    descripcion: 'Cancelación activa de ruido adaptable, drivers de titanio de 40mm y audio Hi-Res.',
    precio: 129.50,
    precioAnterior: 169.00,
    categoria: 'Electrónica',
    imagen: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    stock: 12,
    tag: 'Oferta',
    tagType: 'orange',
    rating: 4.9
  },
  {
    id: 'prod-006',
    nombre: 'Smart TV OLED 4K 65" Cinema Edition',
    descripcion: 'Procesador AI Alpha 9, HDR10+, Dolby Atmos y 120Hz nativos para gaming.',
    precio: 1299.00,
    precioAnterior: 1599.00,
    categoria: 'Electrónica',
    imagen: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
    stock: 7,
    tag: 'Destacado',
    tagType: 'orange',
    rating: 4.9
  },
  {
    id: 'prod-007',
    nombre: 'Chaqueta Impermeable Termosellada Urban',
    descripcion: 'Diseño ergonómico, membrana cortavientos transpirable y bolsillos magnéticos.',
    precio: 89.99,
    precioAnterior: 110.00,
    categoria: 'Ropa',
    imagen: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=80',
    stock: 45,
    tag: 'Disponible',
    tagType: 'orange',
    rating: 4.5
  },
  {
    id: 'prod-008',
    nombre: 'Zapatillas Running Ultralight Boost',
    descripcion: 'Suela Continental de máximo agarre, plantilla de amortiguación de nitrógeno.',
    precio: 119.00,
    precioAnterior: 145.00,
    categoria: 'Calzado',
    imagen: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    stock: 30,
    tag: 'Nuevo',
    tagType: 'info',
    rating: 4.8
  }
];

const MOCK_ORDERS = [
  {
    id: 'ORD-2026-08941',
    fecha: new Date().toISOString(),
    cliente: 'Melvin García',
    canal: 'Web Store',
    estado: 'EN_PREPARACION',
    codigoRastreo: 'LEX-849204-GT',
    metodoPago: 'PayKlik (Tarjeta **** 4242)',
    metodoEntrega: 'Envío a Domicilio (Express)',
    direccion: 'Zona 10, Ciudad de Guatemala',
    items: [
      { id: 'prod-004', nombre: 'Smartwatch Deportivo V3 Pro AMOLED', precio: 189.99, cantidad: 1 },
      { id: 'prod-005', nombre: 'Auriculares Inalámbricos Noise Cancelling Pro', precio: 129.50, cantidad: 1 }
    ],
    subtotal: 319.49,
    impuestos: 38.34,
    envio: 0.00,
    total: 357.83,
    timeline: [
      { estado: 'CREADA', titulo: 'Creada', desc: 'Pedido recibido en el sistema unificado.', fecha: 'Hoy, 06:30 PM', completado: true },
      { estado: 'PAGADA', titulo: 'Pagada', desc: 'Pago procesado exitosamente vía PayKlik.', fecha: 'Hoy, 06:31 PM', completado: true },
      { estado: 'FACTURADA', titulo: 'Facturada', desc: 'Certificación XML generada por SAT Guatemala.', fecha: 'Hoy, 06:35 PM', completado: true },
      { estado: 'EN_PREPARACION', titulo: 'En preparación', desc: 'Tu pedido está siendo empaquetado en el centro logístico.', fecha: 'Hoy, 07:15 PM', completado: true, activo: true },
      { estado: 'EN_TRANSITO', titulo: 'En tránsito', desc: 'Guía generada. Paquete recolectado por LogiExpress.', fecha: 'Estimado mañana', completado: false },
      { estado: 'ENTREGADA', titulo: 'Entregada', desc: 'Pedido entregado en dirección del cliente.', fecha: '-', completado: false }
    ]
  }
];

const PRODUCT_IMAGE_FALLBACKS = {
  'prod-001': 'https://images.unsplash.com/photo-1517668808822-9efe02eae25c?auto=format&fit=crop&w=600&q=80',
  'prod-002': 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80',
  'prod-003': 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&q=80',
  'prod-004': 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80',
  'prod-005': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  'prod-006': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
  'prod-007': 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=80',
  'prod-008': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  'PROD-001': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80',
  'PROD-002': 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80',
  'PROD-003': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
  'PROD-004': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'
};

export const getCategoryImage = (cat = '') => {
  const c = (cat || '').toLowerCase();
  if (c.includes('blanca')) return 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80';
  if (c.includes('electr')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
  if (c.includes('ropa')) return 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=80';
  if (c.includes('calzado')) return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80';
  return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
};

export const getProductos = async (filtrosOQuery = '', categoriaParam = '') => {
  try {
    let q = '';
    let categoria = '';
    let ofertas = false;
    let maxPrecio = '';
    let enStock = false;

    if (typeof filtrosOQuery === 'object' && filtrosOQuery !== null) {
      q = filtrosOQuery.q || '';
      categoria = filtrosOQuery.categoria || '';
      ofertas = !!filtrosOQuery.ofertas;
      maxPrecio = filtrosOQuery.maxPrecio || '';
      enStock = !!filtrosOQuery.enStock;
    } else {
      q = filtrosOQuery || '';
      categoria = categoriaParam || '';
    }

    const params = new URLSearchParams();
    if (q && q.trim()) params.append('q', q.trim());
    if (categoria && categoria !== 'Todas') params.append('categoria', categoria.trim());
    if (ofertas) params.append('ofertas', 'true');
    if (maxPrecio) params.append('maxPrecio', maxPrecio);
    if (enStock) params.append('enStock', 'true');

    const qs = params.toString();
    const url = `${INVENTARIO_API}/productos${qs ? `?${qs}` : ''}`;
    
    const res = await fetchWithTimeout(url);
    if (res.ok) {
      const data = await res.json();
      return data.map(p => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio) || 0,
        precioAnterior: p.precioAnterior ? Number(p.precioAnterior) : undefined,
        categoria: p.categoria || 'General',
        descripcion: p.descripcion || `${p.nombre} con garantía oficial MegaStore SGO-Logic.`,
        imagen: p.imagen || PRODUCT_IMAGE_FALLBACKS[p.id] || getCategoryImage(p.categoria),
        stock: p.stock ?? 25,
        tag: p.tag || 'Disponible',
        tagType: p.tagType || (p.tag && p.tag.includes('Black Friday') ? 'orange' : 'info'),
        rating: p.rating || 4.8
      }));
    }
  } catch (e) {
    console.warn('Backend Inventario offline, utilizando catálogo de respaldo...');
  }

  let result = [...INITIAL_PRODUCTS];
  if (categoria && categoria !== 'Todas') {
    result = result.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
  }
  if (q && q.trim()) {
    const term = q.toLowerCase();
    result = result.filter(p => p.nombre.toLowerCase().includes(term) || p.descripcion.toLowerCase().includes(term));
  }
  return result;
};

export const loginUser = async (email, password) => {
  try {
    const res = await fetchWithTimeout(`${ORDENES_API}/clientes/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Credenciales invalidas');
  } catch (e) {
    console.error('Error de autenticacion:', e);
    // Modo offline resiliente para pruebas y demostracion sin backend levantado
    if (e.message && (e.message.includes('fetch') || e.name === 'TypeError' || e.message === 'Failed to fetch')) {
      if (email === 'admin@megastore.com' || (email && email.includes('admin'))) {
        return {
          id: 99,
          nombre: 'Administrador SGO-Logic',
          email: 'admin@megastore.com',
          role: 'admin',
          token: 'jwt-admin-token-fase3'
        };
      }
      return {
        id: 1,
        nombre: 'Melvin Garcia',
        email: email || 'cliente@megastore.com',
        role: 'cliente',
        creditScore: 85,
        token: 'jwt-cliente-token-fase3',
        tarjetas: [
          { id: 'card-1', brand: 'Visa', last4: '4242', exp: '12/28' }
        ]
      };
    }
    throw e;
  }
};

export const registerUser = async (userData) => {
  try {
    const res = await fetch(`${ORDENES_API}/clientes/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al registrar usuario');
  } catch (e) {
    console.error('Error en registro:', e);
    throw e;
  }
};

export const actualizarPerfilCliente = async (id, perfilData) => {
  try {
    const res = await fetch(`${ORDENES_API}/clientes/${id}/perfil`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(perfilData)
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al actualizar perfil');
  } catch (e) {
    console.error('Error al actualizar perfil:', e);
    throw e;
  }
};

export const getInventarioUnificado = async () => {
  try {
    const res = await fetch(`${INVENTARIO_API}/unificado`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('No se pudo obtener inventario unificado del backend:', e);
  }
  return [];
};

export const getClientes = async () => {
  try {
    const res = await fetch(`${ORDENES_API}/clientes`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('No se pudo obtener lista de clientes del backend:', e);
  }
  return [];
};

export const normalizeOrder = (raw) => {
  if (!raw) return null;
  const cliente = raw.clienteNombre || raw.cliente || 'Cliente Omnicanal';
  const fecha = raw.fechaCreacion || raw.fecha || new Date().toISOString();
  const items = Array.isArray(raw.items)
    ? raw.items.map((it) => {
        const precioUnitario = Number(it.precioUnitario != null ? it.precioUnitario : it.precio) || 0;
        const cantidad = Number(it.cantidad) || 1;
        const nombre = it.nombreProducto || it.nombre || 'Producto MegaStore';
        return {
          ...it,
          id: it.id || it.productoId,
          productoId: it.productoId || it.id,
          nombre,
          nombreProducto: nombre,
          precio: precioUnitario,
          precioUnitario,
          cantidad,
          subtotal: Number(it.subtotal) || +(precioUnitario * cantidad).toFixed(2)
        };
      })
    : [];

  return {
    ...raw,
    cliente,
    clienteNombre: cliente,
    fecha,
    fechaCreacion: fecha,
    subtotal: Number(raw.subtotal) || 0,
    impuestos: Number(raw.impuestos) || 0,
    envio: Number(raw.envio) || 0,
    total: Number(raw.total) || 0,
    items,
    timeline: raw.timeline || buildTimeline(raw.estado)
  };
};

export const evaluarCredito = async (clienteId, monto) => {
  try {
    const res = await fetchWithTimeout(`${ORDENES_API}/credito/evaluar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteId: String(clienteId || '1'),
        montoOrden: Number(monto) || 0,
        monto: Number(monto) || 0
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.info('Usando evaluacion desacoplada de scoring crediticio (Fase 3):', err.message);
  }

  const cid = String(clienteId || '1');
  const esRiesgoso = cid === 'bad' || cid === 'riesgo';
  const limiteCredito = 5000.00;
  const saldoDisponible = 3500.00;
  const califica = !esRiesgoso && Number(monto) <= saldoDisponible;

  const hoy = new Date();
  hoy.setDate(hoy.getDate() + 30);
  const fechaVencimiento = hoy.toISOString().split('T')[0];

  return {
    clienteId: Number(clienteId) || 1,
    aprobado: califica,
    score: califica ? 85 : 45,
    limiteCredito,
    saldoDisponible,
    plazoDias: 30,
    fechaVencimiento,
    mensaje: califica
      ? 'Aprobado para la campana: Compra ahora, paga en 30 dias (0% Interes)'
      : 'Credito propio no disponible para esta orden'
  };
};

export const crearOrden = async (carrito, shippingInfo, paymentInfo) => {
  // Pre-validar disponibilidad de inventario antes de crear la orden
  for (const item of carrito) {
    try {
      const res = await fetchWithTimeout(`${INVENTARIO_API}/disponibilidad/${item.id}`, {}, 500);
      if (res.ok) {
        const stockData = await res.json();
        const totalDisp = stockData.reduce((sum, u) => sum + u.cantidadDisponible, 0);
        if (totalDisp < item.cantidad) {
          throw new Error(`Inventario insuficiente para "${item.nombre}". Disponible: ${totalDisp}, solicitado: ${item.cantidad}.`);
        }
      } else if (res.status === 404) {
        throw new Error(`Producto "${item.nombre}" no encontrado en inventario.`);
      }
    } catch (e) {
      if (e.message.includes('Inventario insuficiente') || e.message.includes('no encontrado')) {
        throw e; // Abortar la creación de la orden
      }
      // Si el servicio de inventario está caído, dejamos pasar (el backend validará asincrónicamente)
      console.warn('No se pudo pre-validar inventario:', e.message);
    }
  }

  let metodoPagoText = 'Transferencia bancaria';
  if (paymentInfo.metodo === 'credito_propio') {
    metodoPagoText = 'Credito Propio (Paga en 30 dias)';
  } else if (paymentInfo.metodo === 'payklik') {
    metodoPagoText = 'PayKlik (Tarjeta de Credito)';
  } else if (paymentInfo.metodo === 'billetera') {
    metodoPagoText = 'Billetera Digital Omnicanal';
  }

  const payload = {
    clienteId: shippingInfo.clienteId || '1',
    clienteNombre: shippingInfo.nombreCompleto || 'Cliente Omnicanal',
    canal: 'Web Store',
    metodoPago: metodoPagoText,
    metodoEntrega: shippingInfo.tipoEntrega === 'domicilio' ? 'Envio a Domicilio' : 'Recogida en Tienda',
    direccion: shippingInfo.direccion || 'Ciudad de Guatemala',
    plazoDias: paymentInfo.metodo === 'credito_propio' ? 30 : 0,
    items: carrito.map(item => ({
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion,
      precio: item.precio,
      cantidad: item.cantidad,
      imagen: item.imagen
    }))
  };

  try {
    const res = await fetchWithTimeout(`${ORDENES_API}/ordenes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      return normalizeOrder(data);
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Error al procesar la orden en el servidor');
  } catch (err) {
    if (err.message && (err.message.includes('fetch') || err.name === 'TypeError' || err.message === 'Failed to fetch')) {
      const simulatedId = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const sub = +(carrito.reduce((s, i) => s + (Number(i.precio) || 0) * (Number(i.cantidad) || 1), 0).toFixed(2));
      const imp = +(sub * 0.12).toFixed(2);
      const env = shippingInfo.tipoEntrega === 'domicilio' ? 15.00 : 0.00;
      const tot = +(sub + imp + env).toFixed(2);

      const fallbackOrder = {
        id: simulatedId,
        clienteNombre: payload.clienteNombre,
        cliente: payload.clienteNombre,
        canal: payload.canal,
        metodoPago: payload.metodoPago,
        metodoEntrega: payload.metodoEntrega,
        direccion: payload.direccion,
        subtotal: sub,
        impuestos: imp,
        envio: env,
        total: tot,
        estado: 'CREADA',
        fechaCreacion: new Date().toISOString(),
        codigoRastreo: `LEX-${Math.floor(100000 + Math.random() * 900000)}-GT`,
        items: payload.items
      };
      const existing = JSON.parse(localStorage.getItem('sgologic_sim_orders') || '[]');
      existing.unshift(fallbackOrder);
      localStorage.setItem('sgologic_sim_orders', JSON.stringify(existing));
      return normalizeOrder(fallbackOrder);
    }
    throw err;
  }
};

export const getOrden = async (ordenId) => {
  if (!ordenId) throw new Error('ID de orden no especificado');
  try {
    const res = await fetch(`${ORDENES_API}/ordenes/${ordenId}`);
    if (res.ok) {
      const data = await res.json();
      return normalizeOrder(data);
    }
  } catch (e) {
    console.warn('Backend offline al obtener orden:', e);
  }

  const existing = JSON.parse(localStorage.getItem('sgologic_sim_orders') || '[]');
  const found = existing.find(o => o.id === ordenId) || MOCK_ORDERS.find(o => o.id === ordenId);
  if (found) return normalizeOrder(found);

  return normalizeOrder({
    id: ordenId,
    fechaCreacion: new Date().toISOString(),
    clienteNombre: 'Melvin Garcia',
    cliente: 'Melvin Garcia',
    canal: 'Web Store',
    estado: 'CREADA',
    codigoRastreo: 'LEX-849204-GT',
    metodoPago: ordenId.includes('BNPL') || ordenId.includes('CRED') ? 'Credito Propio (Paga en 30 dias)' : 'PayKlik (Tarjeta **** 4242)',
    metodoEntrega: 'Envio a Domicilio',
    direccion: 'Zona 10, Ciudad de Guatemala',
    subtotal: 189.99,
    impuestos: 22.80,
    envio: 15.00,
    total: 227.79,
    items: [
      { id: 'prod-004', nombre: 'Smartwatch Deportivo V3 Pro AMOLED', precio: 189.99, cantidad: 1 }
    ]
  });
};

export const getOrdenes = async () => {
  try {
    const res = await fetch(`${ORDENES_API}/ordenes`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeOrder) : [];
    }
  } catch (e) {
    console.warn('Backend ordenes offline, usando registro local:', e);
  }
  const existing = JSON.parse(localStorage.getItem('sgologic_sim_orders') || '[]');
  const combined = [...existing, ...MOCK_ORDERS];
  return combined.map(normalizeOrder);
};

export const updateEstadoOrden = async (ordenId, nuevoEstado) => {
  try {
    const res = await fetch(`${ORDENES_API}/ordenes/${encodeURIComponent(ordenId)}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (res.ok) {
      const data = await res.json();
      return normalizeOrder(data);
    }
  } catch (e) {
    console.warn('Backend offline al actualizar estado:', e);
  }

  const existing = JSON.parse(localStorage.getItem('sgologic_sim_orders') || '[]');
  const idx = existing.findIndex(o => o.id === ordenId);
  if (idx !== -1) {
    existing[idx].estado = nuevoEstado;
    existing[idx].timeline = buildTimeline(nuevoEstado);
    localStorage.setItem('sgologic_sim_orders', JSON.stringify(existing));
    return normalizeOrder(existing[idx]);
  }
  const mockIdx = MOCK_ORDERS.findIndex(o => o.id === ordenId);
  if (mockIdx !== -1) {
    MOCK_ORDERS[mockIdx].estado = nuevoEstado;
    MOCK_ORDERS[mockIdx].timeline = buildTimeline(nuevoEstado);
    return normalizeOrder(MOCK_ORDERS[mockIdx]);
  }
  return normalizeOrder({ id: ordenId, estado: nuevoEstado, timeline: buildTimeline(nuevoEstado) });
};

const pingServiceHealth = async (nombre, url, checkFn = null, allow404 = false) => {
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(url, {}, 700);
    const latencia = `${Math.max(1, Date.now() - start)}ms`;
    if (res.ok || (allow404 && res.status === 404)) {
      if (checkFn && res.ok) {
        const data = await res.json().catch(() => ({}));
        const custom = checkFn(data, latencia);
        if (custom) return custom;
      }
      return { nombre, estado: 'Operativo', statusType: 'success', latencia };
    }
    return { nombre, estado: `HTTP ${res.status}`, statusType: 'error', latencia };
  } catch (err) {
    return { nombre, estado: 'En Contingencia (MQ)', statusType: 'error', latencia: 'Timeout' };
  }
};

export const getDashboardMetrics = async () => {
  try {
    const [resOrdenes, payklikHealth, satHealth, logiHealth, mqHealth, pagosContingencia] = await Promise.all([
      fetchWithTimeout(`${ORDENES_API}/ordenes`, {}, 1000).catch(() => null),
      pingServiceHealth('PayKlik API', `${PAGOS_API}/payklik/modo`, (data, latencia) => {
        if (data && data.falloSimulado) {
          return { nombre: 'PayKlik API', estado: 'Caída Simulada (DLQ Activo)', statusType: 'error', latencia };
        }
        return null;
      }),
      pingServiceHealth('SAT Facturación XML', `${FACTURACION_API}/ORD-HEALTHCHECK`, null, true),
      pingServiceHealth('LogiExpress API', `${INVENTARIO_API}/unificado`),
      pingServiceHealth('RabbitMQ Bus Eventos', `${NOTIFICACIONES_API}/health`),
      fetchWithTimeout(`${PAGOS_API}/pagos/contingencia`, {}, 700).then(r => r.ok ? r.json() : []).catch(() => [])
    ]);

    if (resOrdenes && resOrdenes.ok) {
      const rawOrders = await resOrdenes.json();
      const realOrders = Array.isArray(rawOrders) ? rawOrders.map(normalizeOrder) : [];
      const totalVentas = realOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const sistemas = [payklikHealth, satHealth, logiHealth, mqHealth];
      const serviciosCaidos = sistemas.filter(s => s.statusType === 'error').length;
      const ordenesEnContingencia = realOrders.filter(o => o.estado === 'PAGO_EN_CONTINGENCIA').length;
      const alertasActivas = serviciosCaidos + Math.max(ordenesEnContingencia, Array.isArray(pagosContingencia) ? pagosContingencia.length : 0);

      return {
        totalOrdenesHoy: realOrders.length,
        ordenesIncremento: realOrders.length > 0 ? `+${realOrders.length} órdenes registradas` : '0 hoy',
        ordenesPendientes: realOrders.filter(o => o.estado !== 'ENTREGADA' && o.estado !== 'CANCELADA').length,
        alertasActivas,
        ingresosHoy: 'Q' + totalVentas.toFixed(2),
        sistemas,
        ultimasOrdenes: realOrders
      };
    }
  } catch (e) {
    console.warn('Backend Ordenes offline:', e);
  }

  const existing = JSON.parse(localStorage.getItem('sgologic_sim_orders') || '[]');
  const allOrders = [...existing, ...MOCK_ORDERS].map(normalizeOrder);
  const totalVentas = allOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  return {
    totalOrdenesHoy: allOrders.length,
    ordenesIncremento: `+${allOrders.length} órdenes registradas`,
    ordenesPendientes: allOrders.filter(o => o.estado !== 'ENTREGADA').length,
    alertasActivas: 1,
    ingresosHoy: 'Q' + totalVentas.toFixed(2),
    sistemas: [
      { nombre: 'PayKlik API', estado: 'Modo Respaldo', statusType: 'info', latencia: '15ms' },
      { nombre: 'SAT Facturación XML', estado: 'Modo Respaldo', statusType: 'info', latencia: '45ms' },
      { nombre: 'LogiExpress API', estado: 'Modo Respaldo', statusType: 'info', latencia: '20ms' },
      { nombre: 'RabbitMQ Bus Eventos', estado: 'Modo Respaldo', statusType: 'info', latencia: '2ms' }
    ],
    ultimasOrdenes: allOrders
  };
};

function buildTimeline(estadoActual) {
  const e = estadoActual || 'CREADA';
  const isFinalizada = e === 'ENTREGADA';
  const isError = e === 'INVENTARIO_INSUFICIENTE' || e === 'CANCELADA';
  const isContingencia = e === 'PAGO_EN_CONTINGENCIA';

  if (isError) {
    return [
      { estado: 'CREADA', titulo: 'Creada', desc: 'Pedido registrado en SGO-Logic.', fecha: 'Reciente', completado: true, activo: false },
      { estado: e, titulo: e === 'INVENTARIO_INSUFICIENTE' ? 'Sin Stock' : 'Cancelada', desc: e === 'INVENTARIO_INSUFICIENTE' ? 'Orden detenida por falta de stock disponible.' : 'Orden cancelada y stock liberado en almacén.', fecha: 'Cancelado', completado: false, activo: true, statusType: 'error' }
    ];
  }

  if (isContingencia) {
    return [
      { estado: 'CREADA', titulo: 'Creada', desc: 'Pedido registrado y stock reservado.', fecha: 'Confirmado', completado: true, activo: false },
      { estado: 'PAGO_EN_CONTINGENCIA', titulo: 'Pago en Cola de Contingencia (DLQ)', desc: 'Pasarela externa sin respuesta. Cobro resguardado en RabbitMQ DLQ para reintento automático sin pérdida de orden.', fecha: 'En Cola MQ', completado: false, activo: true, statusType: 'warning' },
      { estado: 'FACTURADA', titulo: 'Facturada', desc: 'Pendiente de confirmación de cobro.', fecha: 'En espera', completado: false, activo: false },
      { estado: 'EN_PREPARACION', titulo: 'En preparación', desc: 'Pendiente de liberación financiera.', fecha: 'En espera', completado: false, activo: false },
      { estado: 'EN_TRANSITO', titulo: 'En tránsito', desc: 'Despacho con LogiExpress.', fecha: 'En espera', completado: false, activo: false },
      { estado: 'ENTREGADA', titulo: 'Entregada', desc: 'Recibido por el cliente.', fecha: 'En espera', completado: false, activo: false }
    ];
  }

  return [
    { estado: 'CREADA', titulo: 'Creada', desc: 'Pedido registrado en SGO-Logic.', fecha: 'Reciente', completado: true, activo: !isFinalizada && e === 'CREADA' },
    { estado: 'PAGADA', titulo: 'Pagada', desc: 'Transacción financiera autorizada.', fecha: 'Confirmado', completado: e !== 'CREADA', activo: !isFinalizada && e === 'PAGADA' },
    { estado: 'FACTURADA', titulo: 'Facturada', desc: 'Comprobante fiscal XML emitido ante SAT.', fecha: 'Facturado', completado: ['FACTURADA', 'EN_PREPARACION', 'EN_TRANSITO', 'ENTREGADA'].includes(e), activo: !isFinalizada && e === 'FACTURADA' },
    { estado: 'EN_PREPARACION', titulo: 'En preparación', desc: 'Empaquetado en centro logístico.', fecha: 'Empaquetando', completado: ['EN_PREPARACION', 'EN_TRANSITO', 'ENTREGADA'].includes(e), activo: !isFinalizada && e === 'EN_PREPARACION' },
    { estado: 'EN_TRANSITO', titulo: 'En tránsito', desc: 'Despachado con LogiExpress.', fecha: 'En camino', completado: ['EN_TRANSITO', 'ENTREGADA'].includes(e), activo: !isFinalizada && e === 'EN_TRANSITO' },
    { estado: 'ENTREGADA', titulo: 'Entregada', desc: 'Recibido por el cliente.', fecha: 'Finalizado', completado: e === 'ENTREGADA', activo: false }
  ];
}

export const registrarIncidenciaCliente = async (ordenId, tipo, detalle) => {
  try {
    const res = await fetch(`${ORDENES_API}/ordenes/${encodeURIComponent(ordenId)}/incidencias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, detalle })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Error al registrar incidencia en backend:', e);
  }
  return null;
};

export const getIncidencias = async () => {
  try {
    const res = await fetch(`${ORDENES_API}/ordenes/incidencias`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Error al obtener incidencias del backend:', e);
  }
  return [];
};

export const cancelarOrdenCliente = async (ordenId) => {
  try {
    const res = await fetch(`${ORDENES_API}/ordenes/${encodeURIComponent(ordenId)}/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      return normalizeOrder(data);
    }
    const err = await res.json().catch(() => ({}));
    if (err.error) throw new Error(err.error);
  } catch (e) {
    if (e.message && e.message.includes('entregada')) {
      throw e;
    }
    console.warn('Backend offline al cancelar orden:', e);
  }
  return updateEstadoOrden(ordenId, 'CANCELADA');
};

export const getEstadoCreditoCliente = async (clienteId) => {
  try {
    const res = await fetchWithTimeout(`${ORDENES_API}/credito/estado/${encodeURIComponent(clienteId || '1')}`, {}, 800);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('No se pudo consultar estado crediticio en backend:', e.message);
  }
  return evaluarCredito(clienteId, 100);
};

export const abonarCreditoCliente = async (clienteId, monto, ordenId = null) => {
  try {
    const payload = {
      clienteId: String(clienteId || '1'),
      monto: Number(monto) || 0
    };
    if (ordenId) payload.ordenId = ordenId;

    const res = await fetch(`${ORDENES_API}/credito/abono`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    if (err.error) throw new Error(err.error);
  } catch (e) {
    if (e.message && (e.message.includes('liquidada') || e.message.includes('mayor a cero'))) {
      throw e;
    }
    console.warn('Backend offline al registrar abono de credito:', e);
  }
  return {
    clienteId: String(clienteId || '1'),
    montoAbonado: Number(monto) || 0,
    ordenLiquidada: ordenId,
    mensaje: 'Abono a credito propio aplicado exitosamente',
    fecha: new Date().toISOString()
  };
};

export const obtenerHistorialPagoOrden = async (ordenId) => {
  if (!ordenId) return { online: true, intentos: [] };
  try {
    const res = await fetchWithTimeout(`${PAGOS_API}/pagos/orden/${encodeURIComponent(ordenId)}`, {}, 800);
    if (res.ok) {
      const data = await res.json();
      return { online: true, intentos: Array.isArray(data) ? data : [] };
    }
    if (res.status === 404) {
      return { online: true, intentos: [] };
    }
    return { online: false, intentos: [], error: `HTTP ${res.status}` };
  } catch (e) {
    return { online: false, intentos: [], error: 'Microservicio de Pagos (:8083) fuera de línea — Eventos encolados en RabbitMQ' };
  }
};

export const getModoPayKlik = async () => {
  try {
    const res = await fetchWithTimeout(`${PAGOS_API}/payklik/modo`, {}, 800);
    if (res.ok) {
      const data = await res.json();
      return {
        deshabilitado: Boolean(data.deshabilitado || data.falloSimulado),
        estadoPasarela: data.estadoPasarela || (data.deshabilitado ? 'DESHABILITADO' : 'OPERATIVA'),
        estadoServicio: data.estadoServicio || (data.deshabilitado ? 'DESHABILITADO' : 'HABILITADO')
      };
    }
  } catch (e) {
    return { deshabilitado: true, estadoPasarela: 'CONTENEDOR_DETENIDO', estadoServicio: 'DESHABILITADO', offline: true };
  }
  return { deshabilitado: false, estadoPasarela: 'OPERATIVA', estadoServicio: 'HABILITADO' };
};

export const toggleModoPayKlik = async (deshabilitado) => {
  const res = await fetch(`${PAGOS_API}/payklik/modo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deshabilitado, falloSimulado: deshabilitado })
  });
  if (!res.ok) throw new Error('No se pudo cambiar el estado de la pasarela PayKlik');
  return await res.json();
};

export const getModoSat = async () => {
  try {
    const res = await fetchWithTimeout(`${FACTURACION_API}/sat/modo`, {}, 800);
    if (res.ok) return await res.json();
  } catch (e) {
    return { deshabilitado: false, estadoServicio: 'HABILITADO' };
  }
  return { deshabilitado: false, estadoServicio: 'HABILITADO' };
};

export const toggleModoSat = async (deshabilitado) => {
  const res = await fetch(`${FACTURACION_API}/sat/modo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deshabilitado })
  });
  if (!res.ok) throw new Error('No se pudo cambiar el estado del servicio SAT');
  return await res.json();
};

export const getModoInventario = async () => {
  try {
    const res = await fetchWithTimeout(`${INVENTARIO_API}/modo`, {}, 800);
    if (res.ok) return await res.json();
  } catch (e) {
    return { deshabilitado: false, estadoServicio: 'HABILITADO' };
  }
  return { deshabilitado: false, estadoServicio: 'HABILITADO' };
};

export const toggleModoInventario = async (deshabilitado) => {
  const res = await fetch(`${INVENTARIO_API}/modo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deshabilitado })
  });
  if (!res.ok) throw new Error('No se pudo cambiar el estado de reserva de inventario');
  return await res.json();
};

export const getPagosContingencia = async () => {
  try {
    const res = await fetchWithTimeout(`${PAGOS_API}/pagos/contingencia`, {}, 800);
    if (res.ok) return await res.json();
  } catch (e) {
    // ignore
  }
  return [];
};

export const reprocesarPagosContingencia = async () => {
  const res = await fetch(`${PAGOS_API}/pagos/reprocesar-dlq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Error al reprocesar cola de contingencia DLQ');
  return await res.json();
};

export const ajustarStockInventario = async (productoId, ubicacion, cantidad) => {
  const res = await fetch(`${INVENTARIO_API}/stock/ajuste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productoId, ubicacion, cantidad })
  });
  if (!res.ok) throw new Error('Error al ajustar stock en inventario');
  return await res.json();
};

export const sincronizarCarritoTemporal = async (clienteId, items) => {
  if (!clienteId) return;
  try {
    await fetchWithTimeout(`${ORDENES_API}/carrito/${encodeURIComponent(clienteId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, actualizado: new Date().toISOString() })
    }, 600);
  } catch (e) {
    // Silencioso si Redis/backend no responde
  }
};

export const limpiarCarritoTemporal = async (clienteId) => {
  if (!clienteId) return;
  try {
    await fetchWithTimeout(`${ORDENES_API}/carrito/${encodeURIComponent(clienteId)}`, {
      method: 'DELETE'
    }, 600);
  } catch (e) {
    // Silencioso
  }
};
