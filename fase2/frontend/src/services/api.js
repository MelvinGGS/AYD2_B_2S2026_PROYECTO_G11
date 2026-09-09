// Mock API service for SGO-Logic Frontend (Fase 2)

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

const INITIAL_ORDERS = [
  {
    id: 'ORD-2026-08941',
    fecha: '2026-09-08T18:30:00Z',
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
      { estado: 'CREADA', titulo: 'Creada', desc: 'Pedido recibido en el sistema unificado.', fecha: '08 Sep 2026, 06:30 PM', completado: true },
      { estado: 'PAGADA', titulo: 'Pagada', desc: 'Pago procesado exitosamente vía PayKlik.', fecha: '08 Sep 2026, 06:31 PM', completado: true },
      { estado: 'FACTURADA', titulo: 'Facturada', desc: 'Certificación XML generada por SAT Guatemala.', fecha: '08 Sep 2026, 06:35 PM', completado: true },
      { estado: 'EN_PREPARACION', titulo: 'En preparación', desc: 'Tu pedido está siendo empaquetado en el centro logístico.', fecha: '08 Sep 2026, 07:15 PM', completado: true, activo: true },
      { estado: 'EN_TRANSITO', titulo: 'En tránsito', desc: 'Guía generada. Paquete recolectado por LogiExpress.', fecha: 'Estimado mañana', completado: false },
      { estado: 'ENTREGADA', titulo: 'Entregada', desc: 'Pedido entregado en dirección del cliente.', fecha: '-', completado: false }
    ]
  },
  {
    id: 'ORD-2026-08940',
    fecha: '2026-09-08T16:15:00Z',
    cliente: 'Carlos Mendoza',
    canal: 'App Móvil',
    estado: 'EN_TRANSITO',
    codigoRastreo: 'LEX-773910-GT',
    metodoPago: 'Billetera Digital',
    metodoEntrega: 'Envío a Domicilio',
    direccion: 'Zona 14, Ciudad de Guatemala',
    items: [
      { id: 'prod-001', nombre: 'Cafetera Espresso Profesional Serie X', precio: 249.99, cantidad: 1 }
    ],
    subtotal: 249.99,
    impuestos: 30.00,
    envio: 15.00,
    total: 294.99,
    timeline: [
      { estado: 'CREADA', titulo: 'Creada', desc: 'Pedido recibido.', fecha: '08 Sep 2026, 04:15 PM', completado: true },
      { estado: 'PAGADA', titulo: 'Pagada', desc: 'Pago procesado.', fecha: '08 Sep 2026, 04:16 PM', completado: true },
      { estado: 'FACTURADA', titulo: 'Facturada', desc: 'Factura SAT OK.', fecha: '08 Sep 2026, 04:20 PM', completado: true },
      { estado: 'EN_PREPARACION', titulo: 'En preparación', desc: 'Empaquetado listo.', fecha: '08 Sep 2026, 05:00 PM', completado: true },
      { estado: 'EN_TRANSITO', titulo: 'En tránsito', desc: 'En ruta con LogiExpress.', fecha: '08 Sep 2026, 05:30 PM', completado: true, activo: true },
      { estado: 'ENTREGADA', titulo: 'Entregada', desc: 'Entregado.', fecha: '-', completado: false }
    ]
  },
  {
    id: 'ORD-2026-08939',
    fecha: '2026-09-08T14:00:00Z',
    cliente: 'Ana Lucía Gómez',
    canal: 'Tienda Física (Call Center)',
    estado: 'ENTREGADA',
    codigoRastreo: 'LEX-112049-GT',
    metodoPago: 'Transferencia Bancaria',
    metodoEntrega: 'Recogida en Tienda',
    direccion: 'MegaStore Central Plaza',
    items: [
      { id: 'prod-008', nombre: 'Zapatillas Running Ultralight Boost', precio: 119.00, cantidad: 2 }
    ],
    subtotal: 238.00,
    impuestos: 28.56,
    envio: 0.00,
    total: 266.56,
    timeline: [
      { estado: 'CREADA', titulo: 'Creada', desc: 'Pedido recibido.', fecha: '08 Sep 2026, 02:00 PM', completado: true },
      { estado: 'PAGADA', titulo: 'Pagada', desc: 'Pago confirmado.', fecha: '08 Sep 2026, 02:05 PM', completado: true },
      { estado: 'FACTURADA', titulo: 'Facturada', desc: 'Factura enviada.', fecha: '08 Sep 2026, 02:10 PM', completado: true },
      { estado: 'EN_PREPARACION', titulo: 'En preparación', desc: 'Listo en mostrador.', fecha: '08 Sep 2026, 02:30 PM', completado: true },
      { estado: 'EN_TRANSITO', titulo: 'En tránsito', desc: 'En mostrador de retiro.', fecha: '08 Sep 2026, 02:40 PM', completado: true },
      { estado: 'ENTREGADA', titulo: 'Entregada', desc: 'Entregado a cliente.', fecha: '08 Sep 2026, 03:15 PM', completado: true, activo: true }
    ]
  }
];

// Helper delay to simulate network call
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const getProductos = async (query = '', categoria = '') => {
  await delay(200);
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

export const getProductoById = async (id) => {
  await delay(150);
  return INITIAL_PRODUCTS.find(p => p.id === id) || null;
};

export const crearOrden = async (carrito, shippingInfo, paymentInfo) => {
  await delay(500);
  const newId = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const subtotal = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const impuestos = +(subtotal * 0.12).toFixed(2);
  const envio = shippingInfo.tipoEntrega === 'domicilio' ? 15.00 : 0.00;
  const total = +(subtotal + impuestos + envio).toFixed(2);

  const nuevaOrden = {
    id: newId,
    fecha: new Date().toISOString(),
    cliente: shippingInfo.nombreCompleto || 'Cliente Demo',
    canal: 'Web Store',
    estado: 'CREADA',
    codigoRastreo: `LEX-${Math.floor(100000 + Math.random() * 900000)}-GT`,
    metodoPago: paymentInfo.metodo === 'payklik' ? 'PayKlik (Tarjeta de Crédito)' : paymentInfo.metodo === 'transferencia' ? 'Transferencia bancaria' : 'Billetera Digital',
    metodoEntrega: shippingInfo.tipoEntrega === 'domicilio' ? 'Envío a Domicilio' : 'Recogida en Tienda',
    direccion: shippingInfo.direccion || 'Ciudad de Guatemala',
    items: carrito.map(item => ({ id: item.id, nombre: item.nombre, precio: item.precio, cantidad: item.cantidad, imagen: item.imagen })),
    subtotal,
    impuestos,
    envio,
    total,
    timeline: [
      { estado: 'CREADA', titulo: 'Creada', desc: 'Pedido recibido en el sistema unificado.', fecha: 'Recién creado', completado: true, activo: true },
      { estado: 'PAGADA', titulo: 'Pagada', desc: 'Procesando pago con la pasarela PayKlik...', fecha: 'En proceso', completado: false },
      { estado: 'FACTURADA', titulo: 'Facturada', desc: 'Generando comprobante fiscal SAT.', fecha: '-', completado: false },
      { estado: 'EN_PREPARACION', titulo: 'En preparación', desc: 'Preparación en almacén.', fecha: '-', completado: false },
      { estado: 'EN_TRANSITO', titulo: 'En tránsito', desc: 'Despacho con LogiExpress.', fecha: '-', completado: false },
      { estado: 'ENTREGADA', titulo: 'Entregada', desc: 'Entregado al cliente.', fecha: '-', completado: false }
    ]
  };

  // Add to in-memory array
  INITIAL_ORDERS.unshift(nuevaOrden);
  return nuevaOrden;
};

export const getOrden = async (ordenId) => {
  await delay(250);
  const found = INITIAL_ORDERS.find(o => o.id.toLowerCase() === ordenId.toLowerCase());
  if (found) return found;
  
  // Default fallback order mock if ID not matched exact
  return {
    ...INITIAL_ORDERS[0],
    id: ordenId
  };
};

export const loginUser = async (email, password) => {
  await delay(400);
  const isAdmin = email.includes('admin');
  return {
    id: 'usr-101',
    nombre: isAdmin ? 'Administrador Ops' : 'Usuario Cliente',
    email,
    role: isAdmin ? 'admin' : 'cliente',
    token: 'mock-jwt-token-sgo-logic-2026'
  };
};

export const getDashboardMetrics = async () => {
  await delay(300);
  return {
    totalOrdenesHoy: 1247,
    ordenesIncremento: '+12% vs ayer',
    ordenesPendientes: 38,
    alertasActivas: 2,
    ingresosHoy: '$42,890.50',
    sistemas: [
      { nombre: 'PayKlik', estado: 'Operativo', statusType: 'success', latencia: '42ms' },
      { nombre: 'SAT Facturación', estado: 'Alta Latencia', statusType: 'warning', latencia: '380ms' },
      { nombre: 'LogiExpress API', estado: 'Operativo', statusType: 'success', latencia: '55ms' },
      { nombre: 'Redis Cache', estado: 'Operativo', statusType: 'success', latencia: '4ms' }
    ],
    ultimasOrdenes: INITIAL_ORDERS.slice(0, 10)
  };
};
