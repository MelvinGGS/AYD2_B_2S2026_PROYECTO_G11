describe('E2E Spec 02 - Catalogo Dinamico, Filtros y Carrito Multiproducto Persistente', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    const clienteMock = {
      id: 1,
      nombre: 'Melvin Garcia',
      email: 'cliente@megastore.com',
      role: 'cliente',
      token: 'jwt-cliente-token-fase3'
    };
    cy.setSessionUser(clienteMock);
  });

  it('Flujo 1: Debe explorar catalogo, aplicar filtros por categoria y realizar busqueda en vivo', () => {
    cy.visit('/catalogo');

    // Validar hero banner y lista de categorias
    cy.contains('Black Friday SGO-Logic').should('exist');
    cy.get('.category-list').should('exist');

    // Filtrar por Línea Blanca
    cy.contains('.category-item', 'Línea Blanca').click();
    cy.contains('Cafetera Espresso').should('exist');
    cy.contains('Smartwatch').should('not.exist');

    // Filtrar por Electrónica
    cy.contains('.category-item', 'Electrónica').click();
    cy.contains('Smartwatch').should('exist');
    cy.contains('Cafetera Espresso').should('not.exist');

    // Búsqueda en barra superior
    cy.get('.navbar-search .search-input').type('Aspirador{enter}');
    cy.contains('Robot Aspirador').should('exist');
    cy.contains('Smart TV').should('not.exist');
  });

  it('Flujo 2: Debe agregar multiples productos, actualizar contador de carrito y preservar estado', () => {
    cy.visit('/catalogo');

    // Agregar el primer producto disponible
    cy.get('.product-card').first().within(() => {
      cy.get('.btn-add-cart').click();
      cy.contains('¡Agregado!').should('exist');
    });

    // Validar badge en Navbar
    cy.get('.cart-badge').should('contain', '1');

    // Agregar un segundo producto
    cy.get('.product-card').eq(1).within(() => {
      cy.get('.btn-add-cart').click();
      cy.contains('¡Agregado!').should('exist');
    });

    // Badge actualizado a 2
    cy.get('.cart-badge').should('contain', '2');

    // Navegar al carrito
    cy.get('.cart-btn').click();
    cy.url().should('include', '/carrito');
    cy.contains('Mi carrito').should('exist');
    cy.get('.cart-item').should('have.length', 2);

    // Validar que en localStorage este persistido el carrito
    cy.window().then((win) => {
      const cart = JSON.parse(win.localStorage.getItem('sgologic_cart'));
      expect(cart).to.have.length(2);
    });
  });

  it('Flujo 3: Debe modificar cantidades, recalcular precios y permitir eliminacion con preservacion tras recarga', () => {
    cy.visit('/catalogo');

    // Agregar dos productos al carrito
    cy.get('.product-card').eq(0).find('.btn-add-cart').click();
    cy.get('.product-card').eq(1).find('.btn-add-cart').click();

    cy.visit('/carrito');
    cy.get('.cart-item').should('have.length', 2);

    // Capturar subtotal inicial
    cy.get('.summary-value').first().invoke('text').then((subtotalInicial) => {
      // Incrementar cantidad del primer producto
      cy.get('.cart-item').first().find('button[title="Aumentar cantidad"]').click();
      cy.get('.cart-item').first().find('.qty-value').should('contain', '2');

      // Verificar que el subtotal vario positivamente
      cy.get('.summary-value').first().invoke('text').should((nuevoSubtotal) => {
        expect(nuevoSubtotal).to.not.equal(subtotalInicial);
      });
    });

    // Probar boton de eliminar producto
    cy.get('.cart-item').first().find('.btn-remove').click();
    cy.get('.cart-item').should('have.length', 1);

    // Recargar la pagina para verificar preservacion de estado
    cy.reload();
    cy.get('.cart-item').should('have.length', 1);

    // Validar boton de proceder al pago
    cy.get('.btn-checkout').should('exist').and('contain', 'Proceder al pago');
  });

});
