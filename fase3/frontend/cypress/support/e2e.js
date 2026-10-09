// Cypress E2E Support file - MegaStore SGO-Logic Fase 3
import './commands';

// Ignorar excepciones no controladas de resize observer u origenes externos
Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

const INITIAL_PRODUCTS_MOCK = [
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
  }
];

beforeEach(() => {
  cy.clearSessionState();

  // Productos de inventario
  cy.intercept('GET', '**/api/inventario/productos*', (req) => {
    const url = new URL(req.url);
    const cat = url.searchParams.get('categoria');
    const q = url.searchParams.get('q');
    let filtered = [...INITIAL_PRODUCTS_MOCK];
    if (cat && cat !== 'Todas') {
      filtered = filtered.filter(p => p.categoria.toLowerCase() === cat.toLowerCase());
    }
    if (q && q.trim()) {
      const term = q.toLowerCase();
      filtered = filtered.filter(p => p.nombre.toLowerCase().includes(term) || p.descripcion.toLowerCase().includes(term));
    }
    req.reply(filtered);
  }).as('productosApi');

  // Disponibilidad de inventario
  cy.intercept('GET', '**/api/inventario/disponibilidad/*', (req) => {
    req.reply([
      { ubicacion: 'CD Norte', cantidadDisponible: 50 },
      { ubicacion: 'CD Sur', cantidadDisponible: 30 }
    ]);
  }).as('disponibilidadApi');

  // Inventario unificado para dashboard
  cy.intercept('GET', '**/api/inventario/unificado', (req) => {
    req.reply([
      { sku: 'SKU-EPR-001', producto: 'Cafetera Espresso Serie X', cdNorte: 15, cdSur: 8, tiendas: 42, total: 65, estado: 'Óptimo' },
      { sku: 'SKU-REF-002', producto: 'Refrigerador Multi-Door 24 cu.ft', cdNorte: 2, cdSur: 1, tiendas: 5, total: 8, estado: 'Crítico' },
      { sku: 'SKU-ROB-003', producto: 'Robot Aspirador Laser LiDAR', cdNorte: 25, cdSur: 18, tiendas: 60, total: 103, estado: 'Óptimo' },
      { sku: 'SKU-SMA-004', producto: 'Smartwatch V3 Pro AMOLED', cdNorte: 40, cdSur: 32, tiendas: 110, total: 182, estado: 'Óptimo' }
    ]);
  }).as('inventarioUnificadoApi');

  // Clientes para dashboard
  cy.intercept('GET', '**/api/clientes', (req) => {
    req.reply([
      { id: 'CLI-1', nombre: 'Melvin Garcia', email: 'cliente@megastore.com', canal: 'Web Store', ordenes: 1, totalGasto: 227.79, estado: 'Activo' },
      { id: 'CLI-2', nombre: 'Carlos Aragon (Ops Admin)', email: 'admin@megastore.com', canal: 'Call Center', ordenes: 0, totalGasto: 0.00, estado: 'Activo' }
    ]);
  }).as('clientesApi');

  // Incidencias para dashboard
  cy.intercept('GET', '**/api/incidencias*', (req) => {
    req.reply([]);
  }).as('incidenciasApi');

  // Autenticacion
  cy.intercept('POST', '**/api/clientes/login', (req) => {
    const { email } = req.body || {};
    if (email === 'admin@megastore.com' || (email && email.includes('admin'))) {
      req.reply({
        id: 99,
        nombre: 'Carlos Aragon (Ops Admin)',
        email: 'admin@megastore.com',
        role: 'admin',
        token: 'jwt-admin-token-e2e'
      });
    } else {
      req.reply({
        id: 1,
        nombre: 'Melvin Garcia',
        email: email || 'cliente@megastore.com',
        role: 'cliente',
        creditScore: 85,
        token: 'jwt-cliente-token-e2e',
        tarjetas: [
          { id: 'card-saved-1', brand: 'Visa', last4: '4242', exp: '12/28' }
        ]
      });
    }
  }).as('loginApi');

  // Evaluacion de Credito BNPL
  cy.intercept('POST', '**/api/credito/evaluar', (req) => {
    const { clienteId, montoOrden, monto } = req.body || {};
    const m = Number(montoOrden || monto) || 0;
    const cid = String(clienteId || '1');
    const califica = cid !== 'bad' && cid !== 'riesgo' && m <= 5000;
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 30);
    req.reply({
      clienteId: Number(clienteId) || 1,
      aprobado: califica,
      score: califica ? 85 : 45,
      limiteCredito: 5000.00,
      saldoDisponible: 3500.00,
      plazoDias: 30,
      fechaVencimiento: hoy.toISOString().split('T')[0],
      mensaje: califica ? 'Aprobado para la campana: Compra ahora, paga en 30 dias (0% Interes)' : 'Credito no disponible'
    });
  }).as('creditoApi');

  // Estado mutable de ordenes en memoria para specs E2E
  const e2eOrdersStore = [
    {
      id: 'ORD-TEST-001',
      clienteNombre: 'Melvin Garcia',
      cliente: 'Melvin Garcia',
      canal: 'Web Store',
      metodoPago: 'credito_propio',
      metodoEntrega: 'Envio a Domicilio',
      direccion: 'Zona 10, Ciudad de Guatemala',
      subtotal: 189.99,
      impuestos: 22.80,
      envio: 15.00,
      total: 227.79,
      estado: 'CREADA',
      fechaCreacion: new Date().toISOString(),
      codigoRastreo: 'LEX-102938-GT',
      items: [{ id: 'prod-004', nombre: 'Smartwatch V3 Pro', precio: 189.99, cantidad: 1 }]
    },
    {
      id: 'ORD-TEST-002',
      clienteNombre: 'Ana Gomez',
      cliente: 'Ana Gomez',
      canal: 'Web Store',
      metodoPago: 'payklik',
      metodoEntrega: 'Recogida en Tienda',
      direccion: 'Tienda Central',
      subtotal: 249.99,
      impuestos: 30.00,
      envio: 0.00,
      total: 279.99,
      estado: 'PAGADA',
      fechaCreacion: new Date().toISOString(),
      codigoRastreo: 'LEX-482019-GT',
      items: [{ id: 'prod-001', nombre: 'Cafetera Espresso', precio: 249.99, cantidad: 1 }]
    }
  ];

  // Interceptar listado de ordenes para dashboard
  cy.intercept('GET', '**/api/ordenes', (req) => {
    req.reply(e2eOrdersStore);
  }).as('getOrdenesApi');

  // Interceptar orden individual para pantalla de seguimiento
  cy.intercept('GET', '**/api/ordenes/*', (req) => {
    const parts = req.url.split('/');
    const ordId = decodeURIComponent(parts[parts.length - 1].split('?')[0]);
    const found = e2eOrdersStore.find(o => o.id === ordId);
    if (found) {
      req.reply(found);
    } else {
      const isBnpl = ordId.includes('BNPL') || ordId.includes('CRED');
      req.reply({
        id: ordId,
        fechaCreacion: new Date().toISOString(),
        clienteNombre: 'Melvin Garcia',
        cliente: 'Melvin Garcia',
        canal: 'Web Store',
        estado: 'CREADA',
        codigoRastreo: 'LEX-849204-GT',
        metodoPago: isBnpl ? 'Credito Propio (Paga en 30 dias)' : 'PayKlik (Tarjeta **** 4242)',
        metodoEntrega: 'Envio a Domicilio',
        direccion: 'Zona 10, Ciudad de Guatemala',
        subtotal: 189.99,
        impuestos: 22.80,
        envio: 15.00,
        total: 227.79,
        items: [
          { id: 'prod-004', nombre: 'Smartwatch V3 Pro AMOLED', precio: 189.99, cantidad: 1 }
        ]
      });
    }
  }).as('getSingleOrdenApi');

  // Interceptar actualizacion de estado en dashboard
  cy.intercept('PATCH', '**/api/ordenes/*/estado', (req) => {
    const parts = req.url.split('/');
    const ordId = decodeURIComponent(parts[parts.indexOf('ordenes') + 1]);
    const { estado } = req.body || {};
    const item = e2eOrdersStore.find(o => o.id === ordId);
    if (item) {
      item.estado = estado;
    }
    req.reply({
      id: ordId,
      estado: estado,
      mensaje: 'Estado actualizado correctamente'
    });
  }).as('patchEstadoApi');

  // Creacion de ordenes
  cy.intercept('POST', '**/api/ordenes', (req) => {
    const body = req.body || {};
    const isBnpl = body.metodoPago && (
      body.metodoPago === 'credito_propio' ||
      body.metodoPago === 'CREDITO_PROPIO_30D' ||
      body.metodoPago.toLowerCase().includes('credito propio') ||
      body.metodoPago.toLowerCase().includes('30 dias') ||
      body.metodoPago.toLowerCase().includes('bnpl')
    );
    const simId = isBnpl ? `ORD-BNPL-${Math.floor(10000 + Math.random() * 90000)}` : `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const items = body.items || [];
    const sub = +(items.reduce((s, i) => s + (Number(i.precio) || 0) * (Number(i.cantidad) || 1), 0).toFixed(2));
    const imp = +(sub * 0.12).toFixed(2);
    const env = body.metodoEntrega === 'Envio a Domicilio' ? 15.00 : 0.00;
    const tot = +(sub + imp + env).toFixed(2);
    const created = {
      id: simId,
      clienteNombre: body.clienteNombre || 'Melvin Garcia',
      cliente: body.clienteNombre || 'Melvin Garcia',
      canal: body.canal || 'Web Store',
      metodoPago: isBnpl ? 'Credito Propio (Paga en 30 dias)' : 'PayKlik (Tarjeta **** 4242)',
      metodoEntrega: body.metodoEntrega || 'Envio a Domicilio',
      direccion: body.direccion || 'Zona 10, Ciudad de Guatemala',
      subtotal: sub || 189.99,
      impuestos: imp || 22.80,
      envio: env,
      total: tot || 227.79,
      estado: 'CREADA',
      fechaCreacion: new Date().toISOString(),
      codigoRastreo: `LEX-${Math.floor(100000 + Math.random() * 900000)}-GT`,
      items: items.length > 0 ? items : [{ id: 'prod-004', nombre: 'Smartwatch V3 Pro AMOLED', precio: 189.99, cantidad: 1 }]
    };
    e2eOrdersStore.unshift(created);
    req.reply(created);
  }).as('crearOrdenApi');
});
