describe('E2E Spec 01 - Autenticacion, Sesion y Control de Acceso Omnicanal', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('Flujo 1: Debe iniciar sesion como cliente, persistir credenciales en localStorage y reflejar datos en Navbar', () => {
    cy.visit('/login');

    // Validacion de elementos de la pantalla de Login
    cy.contains('MegaStore').should('exist');
    cy.contains('Sistema de Gestión y Logística Omnicanal').should('exist');
    cy.get('#email').should('exist');
    cy.get('#password').should('exist');

    // Ingresar credenciales de cliente
    cy.get('#email').type('cliente@megastore.com');
    cy.get('#password').type('Password123');
    cy.get('button[type="submit"]').click();

    // Redireccion automatica al catalogo
    cy.url().should('include', '/catalogo');

    // Verificacion de persistencia en localStorage
    cy.window().then((win) => {
      const stored = win.localStorage.getItem('sgologic_user');
      expect(stored).to.not.be.null;
      const parsed = JSON.parse(stored);
      expect(parsed.email).to.equal('cliente@megastore.com');
      expect(parsed.role).to.equal('cliente');
      expect(parsed.token).to.be.a('string');
    });

    // Validacion visual en Navbar: avatar de usuario y boton de logout
    cy.get('.user-name').should('exist').and('contain', 'Melvin');
    cy.get('button[title="Cerrar Sesión"]').should('exist');
  });

  it('Flujo 2: Debe cerrar sesion y limpiar almacenamiento local impidiendo accesos protegidos', () => {
    // Iniciar sesion rapida
    cy.visit('/login');
    cy.contains('button', 'Cliente Tienda').click();
    cy.url().should('include', '/catalogo');

    // Verificar que localStorage tiene la sesion activa
    cy.window().then((win) => {
      expect(win.localStorage.getItem('sgologic_user')).to.not.be.null;
    });

    // Ejecutar Logout desde Navbar
    cy.get('button[title="Cerrar Sesión"]').click();
    cy.url().should('include', '/login');

    // Verificar que localStorage se limpio por completo
    cy.window().then((win) => {
      expect(win.localStorage.getItem('sgologic_user')).to.be.null;
    });

    // Intentar acceder a rutas protegidas sin sesion (Checkout, Carrito, Seguimiento)
    cy.visit('/checkout');
    cy.url().should('include', '/login?redirect=/checkout');

    cy.visit('/carrito');
    cy.url().should('include', '/login?redirect=/carrito');

    cy.visit('/seguimiento');
    cy.url().should('include', '/login?redirect=/seguimiento');
  });

  it('Flujo 3: Cliente no debe tener acceso a /admin/dashboard mostrando pantalla de restriccion', () => {
    // Login como cliente
    cy.visit('/login');
    cy.contains('button', 'Cliente Tienda').click();
    cy.url().should('include', '/catalogo');

    // Intentar navegar directamente al panel de administracion
    cy.visit('/admin/dashboard');

    // Debe mostrar la vista de Acceso Restringido
    cy.contains('Acceso Restringido').should('exist');
    cy.contains('Esta sección está reservada exclusivamente para el personal operativo').should('exist');
    cy.contains('button', 'Ir al Catálogo').should('exist');
  });

  it('Flujo 4: Debe autenticar como Administrador y acceder al Ops Dashboard con persistencia tras recarga', () => {
    cy.visit('/login');

    // Login como Admin
    cy.get('#email').type('admin@megastore.com');
    cy.get('#password').type('Admin123');
    cy.get('button[type="submit"]').click();

    // Redireccion al panel operativo de admin
    cy.url().should('include', '/admin/dashboard');
    cy.contains('MegaStore Ops').should('be.visible');
    cy.contains('Admin Dashboard').should('be.visible');
    cy.contains('Panel de Control').should('be.visible');

    // Validar que el token y rol guardados son de admin
    cy.window().then((win) => {
      const stored = win.localStorage.getItem('sgologic_user');
      const parsed = JSON.parse(stored);
      expect(parsed.role).to.equal('admin');
      expect(parsed.email).to.equal('admin@megastore.com');
    });

    // Recargar pagina y comprobar persistencia
    cy.reload();
    cy.url().should('include', '/admin/dashboard');
    cy.contains('MegaStore Ops').should('be.visible');
    cy.contains('admin@megastore.com').should('be.visible');
  });

});
