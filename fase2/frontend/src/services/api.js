// API service for SGO-Logic Frontend (Fase 2)
// Integrado con backend Java Spring Boot (ordenes-service puerto 8081) y .NET 8 (notificaciones-service puerto 8086)

const ORDENES_API = 'http://localhost:8081/api';

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
const INVENTARIO_API = (typeof process !== 'undefined' && process.env?.REACT_APP_INVENTARIO_API)
  ? process.env.REACT_APP_INVENTARIO_API
  : (import.meta.env?.VITE_INVENTARIO_API || 'http://localhost:8082/api/inventario');

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
    
    const res = await fetch(url);
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
  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(p => p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q));
  }
  return result;
};

export const loginUser = async (email, password) => {
  try {
    const res = await fetch(`${ORDENES_API}/clientes/login`, {
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

export const crearOrden = async (carrito, shippingInfo, paymentInfo) => {
  const payload = {
    clienteId: shippingInfo.clienteId || '1',
    clienteNombre: shippingInfo.nombreCompleto || 'Cliente Omnicanal',
    canal: 'Web Store',
    metodoPago: paymentInfo.metodo === 'payklik' ? 'PayKlik (Tarjeta de Credito)' : 'Transferencia bancaria',
    metodoEntrega: shippingInfo.tipoEntrega === 'domicilio' ? 'Envio a Domicilio' : 'Recogida en Tienda',
    direccion: shippingInfo.direccion || 'Ciudad de Guatemala',
    items: carrito.map(item => ({
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion,
      precio: item.precio,
      cantidad: item.cantidad,
      imagen: item.imagen
    }))
  };

  const res = await fetch(`${ORDENES_API}/ordenes`, {
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
};

export const getOrden = async (ordenId) => {
  if (!ordenId) throw new Error('ID de orden no especificado');
  const res = await fetch(`${ORDENES_API}/ordenes/${ordenId}`);
  if (res.ok) {
    const data = await res.json();
    return normalizeOrder(data);
  }
  const err = await res.json().catch(() => ({}));
  throw new Error(err.error || `Orden ${ordenId} no encontrada`);
};

export const getOrdenes = async () => {
  try {
    const res = await fetch(`${ORDENES_API}/ordenes`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeOrder) : [];
    }
  } catch (e) {
    console.warn('Error al obtener órdenes del backend:', e);
  }
  return [];
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
    console.warn('Error al actualizar estado:', e);
  }
  return null;
};

export const getDashboardMetrics = async () => {
  try {
    const res = await fetch(`${ORDENES_API}/ordenes`);
    if (res.ok) {
      const rawOrders = await res.json();
      const realOrders = Array.isArray(rawOrders) ? rawOrders.map(normalizeOrder) : [];
      const totalVentas = realOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      return {
        totalOrdenesHoy: realOrders.length,
        ordenesIncremento: realOrders.length > 0 ? `+${realOrders.length} ordenes registradas` : '0 hoy',
        ordenesPendientes: realOrders.filter(o => o.estado !== 'ENTREGADA').length,
        alertasActivas: 0,
        ingresosHoy: 'Q' + totalVentas.toFixed(2),
        sistemas: [
          { nombre: 'PayKlik API', estado: 'Operativo', statusType: 'success', latencia: '15ms' },
          { nombre: 'SAT Facturación XML', estado: 'Operativo', statusType: 'success', latencia: '45ms' },
          { nombre: 'LogiExpress API', estado: 'Operativo', statusType: 'success', latencia: '20ms' },
          { nombre: 'RabbitMQ Bus Eventos', estado: 'Operativo', statusType: 'success', latencia: '2ms' }
        ],
        ultimasOrdenes: realOrders
      };
    }
  } catch (e) {
    console.warn('Backend Ordenes offline:', e);
  }

  return {
    totalOrdenesHoy: 0,
    ordenesIncremento: '0 hoy',
    ordenesPendientes: 0,
    alertasActivas: 0,
    ingresosHoy: 'Q0.00',
    sistemas: [
      { nombre: 'PayKlik API', estado: 'Operativo', statusType: 'success', latencia: '15ms' },
      { nombre: 'SAT Facturación XML', estado: 'Operativo', statusType: 'success', latencia: '45ms' },
      { nombre: 'LogiExpress API', estado: 'Operativo', statusType: 'success', latencia: '20ms' },
      { nombre: 'RabbitMQ Bus Eventos', estado: 'Operativo', statusType: 'success', latencia: '2ms' }
    ],
    ultimasOrdenes: []
  };
};

function buildTimeline(estadoActual) {
  const e = estadoActual || 'CREADA';
  const isFinalizada = e === 'ENTREGADA';
  return [
    { estado: 'CREADA', titulo: 'Creada', desc: 'Pedido registrado en SGO-Logic.', fecha: 'Reciente', completado: true, activo: !isFinalizada && e === 'CREADA' },
    { estado: 'PAGADA', titulo: 'Pagada', desc: 'Pago procesado por pasarela PayKlik.', fecha: 'Confirmado', completado: e !== 'CREADA', activo: !isFinalizada && e === 'PAGADA' },
    { estado: 'FACTURADA', titulo: 'Facturada', desc: 'Comprobante fiscal XML emitido.', fecha: 'Facturado', completado: ['FACTURADA', 'EN_PREPARACION', 'EN_TRANSITO', 'ENTREGADA'].includes(e), activo: !isFinalizada && e === 'FACTURADA' },
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

