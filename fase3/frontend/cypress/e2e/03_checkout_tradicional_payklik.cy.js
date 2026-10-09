describe('E2E Spec 03 - Checkout Tradicional con Pasarela PayKlik y Tokenizacion', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Iniciar sesion con perfil de cliente y tarjeta precargada
    const clienteMock = {
      id: 'riesgo',
      nombre: 'Melvin Garcia',
      email: 'cliente@megastore.com',
      role: 'cliente',
      telefono: '5555-1234',
      direccion: 'Zona 10, Ciudad de Guatemala',
      creditScore: 60, // Scoring menor a 70 para forzar metodo PayKlik por defecto
      token: 'jwt-token-payklik-e2e',
      tarjetas: [
        { id: 'card-saved-1', brand: 'Visa', last4: '4242', exp: '12/28' }
      ]
    };
    const cartMock = [
      {
        id: 'prod-004',
        nombre: 'Smartwatch Deportivo V3 Pro AMOLED',
        precio: 189.99,
        cantidad: 1,
        imagen: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80',
        stockStatus: 'Disponible'
      }
    ];
    cy.setSessionUser(clienteMock);
    cy.setSessionCart(cartMock);
  });

  it('Flujo 1: Debe validar campos requeridos, gestionar tarjetas y pagar con PayKlik exitosamente', () => {
    // 1. Agregar producto al carrito desde catalogo
    cy.visit('/catalogo');
    cy.get('.product-card').first().find('.btn-add-cart').click();

    // 2. Navegar a Checkout
    cy.visit('/checkout');
    cy.contains('Finalizar Compra').should('exist');

    // 3. Verificar autollenado de datos de envio
    cy.get('input[placeholder="Ej. Juan Pérez"]').should('have.value', 'Melvin Garcia');
    cy.get('input[placeholder="Ej. +502 5555 1234"]').should('have.value', '5555-1234');
    cy.get('input[placeholder="Ej. Avenida Reforma 12-01, Zona 10, Ciudad de Guatemala"]')
      .should('have.value', 'Zona 10, Ciudad de Guatemala');

    // 4. Seleccionar PayKlik como metodo de pago
    cy.get('input[name="payment"][value="payklik"]').check({ force: true });
    cy.contains('PayKlik Pasarela Unificada').should('exist');

    // 5. Probar gestion de tarjetas: seleccionar 'manual'
    cy.get('select').first().select('manual');
    cy.contains('Número de tarjeta').should('exist');

    // 6. Probar formateo en tiempo real del numero de tarjeta
    cy.get('input[placeholder="4532 0000 0000 4242"]')
      .type('4532123456784242')
      .should('have.value', '4532 1234 5678 4242');

    // 7. Probar formateo de fecha de vencimiento y CVV
    cy.get('input[placeholder="MM/AA"]')
      .type('1228')
      .should('have.value', '12/28');

    cy.get('input[placeholder="•••"]')
      .type('888')
      .should('have.value', '888');

    // 8. Confirmar compra
    cy.get('.btn-confirm-pay').click();

    // 9. Redireccion automatica a confirmacion
    cy.url().should('include', '/confirmacion');
    cy.contains('Orden confirmada exitosamente').should('exist');
    cy.contains('Número de orden:').should('exist');
    cy.contains('PayKlik').should('exist');

    // 10. Navegar al seguimiento del pedido
    cy.contains('button', 'Ver estado de mi orden').click();
    cy.url().should('include', '/seguimiento');
    cy.contains('Seguimiento de Pedido').should('exist');
    cy.contains('Código de Rastreo LogiExpress').should('exist');
    cy.contains('Estado de Transmisión').should('exist');
  });

  it('Flujo 2: Debe permitir eliminar una tarjeta guardada desde el selector de PayKlik', () => {
    cy.visit('/catalogo');
    cy.get('.product-card').first().find('.btn-add-cart').click();
    cy.visit('/checkout');

    cy.get('input[name="payment"][value="payklik"]').check({ force: true });

    // Probar boton de eliminar tarjeta guardada
    cy.contains('button', 'Eliminar tarjeta').should('exist').click();

    // Tras eliminar la tarjeta, el selector pasa al modo manual y muestra los campos
    cy.get('input[placeholder="4532 0000 0000 4242"]').should('exist');
  });

});
