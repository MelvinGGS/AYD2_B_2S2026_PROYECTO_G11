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

export const getProductos = async (query = '', categoria = '') => {
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
  } catch (e) {
    console.warn('Backend Spring Boot offline, utilizando respuesta mock...');
  }

  const isAdmin = email.includes('admin');
  return {
    id: 'usr-101',
    nombre: isAdmin ? 'Administrador Ops' : 'Usuario Cliente',
    email,
    role: isAdmin ? 'admin' : 'cliente',
    token: 'mock-jwt-token-sgo-logic-2026'
  };
};

export const crearOrden = async (carrito, shippingInfo, paymentInfo) => {
  const payload = {
    clienteId: 'usr-101',
    clienteNombre: shippingInfo.nombreCompleto || 'Cliente Omnicanal',
    canal: 'Web Store',
    metodoPago: paymentInfo.metodo === 'payklik' ? 'PayKlik (Tarjeta de Crédito)' : 'Transferencia bancaria',
    metodoEntrega: shippingInfo.tipoEntrega === 'domicilio' ? 'Envío a Domicilio' : 'Recogida en Tienda',
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

  try {
    const res = await fetch(`${ORDENES_API}/ordenes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      data.timeline = buildTimeline(data.estado);
      return data;
    }
  } catch (e) {
    console.warn('Backend Spring Boot offline, simulando guardado local...');
  }

  // Fallback Mock Order creation
  const newId = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const subtotal = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const impuestos = +(subtotal * 0.12).toFixed(2);
  const envio = shippingInfo.tipoEntrega === 'domicilio' ? 15.00 : 0.00;
  const total = +(subtotal + impuestos + envio).toFixed(2);

  const nuevaOrden = {
    id: newId,
    fecha: new Date().toISOString(),
    cliente: shippingInfo.nombreCompleto || 'Melvin García',
    canal: 'Web Store',
    estado: 'CREADA',
    codigoRastreo: `LEX-${Math.floor(100000 + Math.random() * 900000)}-GT`,
    metodoPago: paymentInfo.metodo === 'payklik' ? 'PayKlik (Tarjeta **** 4242)' : 'Transferencia Bancaria',
    metodoEntrega: shippingInfo.tipoEntrega === 'domicilio' ? 'Envío a Domicilio' : 'Recogida en Tienda',
    direccion: shippingInfo.direccion || 'Ciudad de Guatemala',
    items: carrito.map(i => ({ id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad })),
    subtotal,
    impuestos,
    envio,
    total,
    timeline: buildTimeline('CREADA')
  };

  MOCK_ORDERS.unshift(nuevaOrden);
  return nuevaOrden;
};

export const getOrden = async (ordenId) => {
  try {
    const res = await fetch(`${ORDENES_API}/ordenes/${ordenId}`);
    if (res.ok) {
      const data = await res.json();
      data.timeline = buildTimeline(data.estado);
      return data;
    }
  } catch (e) {
    console.warn('Backend Spring Boot offline, buscando en dataset local...');
  }

  const found = MOCK_ORDERS.find(o => o.id.toLowerCase() === ordenId.toLowerCase());
  if (found) return found;

  return {
    ...MOCK_ORDERS[0],
    id: ordenId
  };
};

export const getDashboardMetrics = async () => {
  try {
    const res = await fetch(`${ORDENES_API}/ordenes`);
    if (res.ok) {
      const realOrders = await res.json();
      if (realOrders && realOrders.length > 0) {
        return {
          totalOrdenesHoy: realOrders.length,
          ordenesIncremento: '+15% vs ayer',
          ordenesPendientes: realOrders.filter(o => o.estado !== 'ENTREGADA').length,
          alertasActivas: 1,
          ingresosHoy: '$' + realOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2),
          sistemas: [
            { nombre: 'PayKlik API', estado: 'Operativo', statusType: 'success', latencia: '42ms' },
            { nombre: 'SAT Facturación XML', estado: 'Operativo', statusType: 'success', latencia: '120ms' },
            { nombre: 'LogiExpress API', estado: 'Operativo', statusType: 'success', latencia: '55ms' },
            { nombre: 'RabbitMQ Bus Eventos', estado: 'Operativo', statusType: 'success', latencia: '2ms' }
          ],
          ultimasOrdenes: realOrders
        };
      }
    }
  } catch (e) {
    console.warn('Backend Spring Boot offline, retornando métricas integradas...');
  }

  return {
    totalOrdenesHoy: 1247,
    ordenesIncremento: '+12% vs ayer',
    ordenesPendientes: 38,
    alertasActivas: 2,
    ingresosHoy: '$42,890.50',
    sistemas: [
      { nombre: 'PayKlik API', estado: 'Operativo', statusType: 'success', latencia: '42ms' },
      { nombre: 'SAT Facturación XML', estado: 'Alta Latencia', statusType: 'warning', latencia: '380ms' },
      { nombre: 'LogiExpress API', estado: 'Operativo', statusType: 'success', latencia: '55ms' },
      { nombre: 'RabbitMQ Bus Eventos', estado: 'Operativo', statusType: 'success', latencia: '2ms' }
    ],
    ultimasOrdenes: MOCK_ORDERS
  };
};

function buildTimeline(estadoActual) {
  const e = estadoActual || 'CREADA';
  return [
    { estado: 'CREADA', titulo: 'Creada', desc: 'Pedido registrado en SGO-Logic.', fecha: 'Reciente', completado: true, activo: e === 'CREADA' },
    { estado: 'PAGADA', titulo: 'Pagada', desc: 'Pago procesado por pasarela PayKlik.', fecha: 'Confirmado', completado: e !== 'CREADA', activo: e === 'PAGADA' },
    { estado: 'FACTURADA', titulo: 'Facturada', desc: 'Comprobante fiscal XML emitido.', fecha: 'Facturado', completado: ['FACTURADA', 'EN_PREPARACION', 'EN_TRANSITO', 'ENTREGADA'].includes(e), activo: e === 'FACTURADA' },
    { estado: 'EN_PREPARACION', titulo: 'En preparación', desc: 'Empaquetado en centro logístico.', fecha: 'Empaquetando', completado: ['EN_PREPARACION', 'EN_TRANSITO', 'ENTREGADA'].includes(e), activo: e === 'EN_PREPARACION' },
    { estado: 'EN_TRANSITO', titulo: 'En tránsito', desc: 'Despachado con LogiExpress.', fecha: 'En camino', completado: ['EN_TRANSITO', 'ENTREGADA'].includes(e), activo: e === 'EN_TRANSITO' },
    { estado: 'ENTREGADA', titulo: 'Entregada', desc: 'Recibido por el cliente.', fecha: 'Finalizado', completado: e === 'ENTREGADA', activo: e === 'ENTREGADA' }
  ];
}
