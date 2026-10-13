describe('E2E Spec 05 - Ops Admin Dashboard, Filtros de Pago y Transiciones Logisticas', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Iniciar con credenciales de Administrador en localStorage
    const adminUser = {
      id: 99,
      nombre: 'Carlos Aragon (Ops Admin)',
      email: 'admin@megastore.com',
      role: 'admin',
      token: 'jwt-admin-token-e2e'
    };
    cy.setSessionUser(adminUser);

    // Precargar ordenes de prueba para validar transiciones y filtros
    const testOrders = [
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
        items: [{ id: 'prod-001', nombre: 'Cafetera Espresso', precio: 249.99, cantidad: 1 }]
      }
    ];
    cy.setSessionOrders(testOrders);
  });

  it('Flujo 1: Acceso al Dashboard, visualizacion de metricas y estado de sistemas en tiempo real', () => {
    cy.visit('/admin/dashboard');

    // Validar cabecera operativa
    cy.contains('MegaStore Ops').should('exist');
    cy.contains('Dashboard Operativo').should('exist');

    // Validar KPIs y tarjetas de estado
    cy.contains('Órdenes Hoy').should('exist');
    cy.contains('Ingresos Hoy').should('exist');
    cy.contains('Estado de Servicios e Integraciones').should('exist');
    cy.contains('RabbitMQ Bus Eventos').should('exist');
    cy.contains('PayKlik API').should('exist');
    cy.contains('SAT Facturación XML').should('exist');
  });

  it('Flujo 2: Gestion de pedidos, filtrado por metodo de pago y transicion secuencial de estados', () => {
    cy.visit('/admin/dashboard');

    // Cambiar a la pestaña de Gestion de Pedidos
    cy.contains('button', 'Gestión de Pedidos').click();
    cy.contains('Control Centralizado de Pedidos').should('exist');

    // 1. Filtrar por metodo de pago: Credito Propio (BNPL 30d)
    cy.get('select').contains('Todos los métodos de pago').parent().select('credito_propio');
    cy.contains('ORD-TEST-001').should('exist');
    cy.contains('ORD-TEST-002').should('not.exist');

    // 2. Filtrar por otros metodos de pago (Contado / PayKlik)
    cy.get('select').contains('Todos los métodos de pago').parent().select('otros');
    cy.contains('ORD-TEST-002').should('exist');
    cy.contains('ORD-TEST-001').should('not.exist');

    // 3. Restablecer filtro de metodo de pago
    cy.get('select').contains('Todos los métodos de pago').parent().select('TODOS');
    cy.contains('ORD-TEST-001').should('exist');

    // 4. Transicion de estado: CREADA -> EN_PREPARACION
    cy.contains('tr', 'ORD-TEST-001').within(() => {
      cy.get('select[title="Actualizar estado operativo"]').select('EN_PREPARACION');
      cy.contains('.badge', 'En preparación').should('exist');
    });

    // 5. Transicion de estado: EN_PREPARACION -> EN_TRANSITO
    cy.contains('tr', 'ORD-TEST-001').within(() => {
      cy.get('select[title="Actualizar estado operativo"]').select('EN_TRANSITO');
      cy.contains('.badge', 'En tránsito').should('exist');
    });

    // 6. Transicion de estado: EN_TRANSITO -> ENTREGADA
    cy.contains('tr', 'ORD-TEST-001').within(() => {
      cy.get('select[title="Actualizar estado operativo"]').select('ENTREGADA');
      cy.contains('.badge', 'Entregada').should('exist');
    });
  });

  it('Flujo 3: Cancelacion de orden y verificacion de badge de cancelacion', () => {
    cy.visit('/admin/dashboard');
    cy.contains('button', 'Gestión de Pedidos').click();

    // Cancelar orden ORD-TEST-001
    cy.contains('tr', 'ORD-TEST-001').within(() => {
      cy.get('select[title="Actualizar estado operativo"]').select('CANCELADA');
      cy.contains('.badge', 'Cancelada').should('exist');
    });
  });

  it('Flujo 4: Consulta de vista unificada de inventario CD Norte, CD Sur y tiendas POS', () => {
    cy.visit('/admin/dashboard');

    // Cambiar a la pestaña de Inventario Unificado
    cy.contains('button', 'Inventario Unificado').click();
    cy.contains('Vista Unificada de Existencias').should('exist');
    cy.contains('CD Norte').should('exist');
    cy.contains('CD Sur').should('exist');
    cy.contains('32 Tiendas POS').should('exist');
    cy.contains('SKU-EPR-001').should('exist');
  });

  it('Flujo 5: Gestion de disponibilidad y resiliencia de microservicios (Deshabilitar / Habilitar)', () => {
    cy.visit('/admin/dashboard');

    // Cambiar a la pestaña de Parametros y Resiliencia
    cy.contains('button', 'Configuración').click();
    cy.contains('Panel de Control de Disponibilidad y Resiliencia').should('exist');
    cy.contains('Pasarela de Pagos PayKlik').should('exist');
    cy.contains('Certificador SAT FEL & AS/400').should('exist');
    cy.contains('Servicio Central de Inventario').should('exist');

    // Probar boton de deshabilitar / habilitar
    cy.contains('button', 'Pasarela PayKlik').should('exist');
    cy.contains('button', 'Facturacion SAT').should('exist');
    cy.contains('button', 'Reserva Stock').should('exist');
  });

});
