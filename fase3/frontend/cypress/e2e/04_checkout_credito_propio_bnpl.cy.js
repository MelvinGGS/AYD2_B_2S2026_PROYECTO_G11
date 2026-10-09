describe('E2E Spec 04 - Checkout Credito Propio BNPL 30 Dias (0% Interes)', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Cliente con excelente scoring crediticio (Score 85 >= 70)
    const clienteApto = {
      id: 1,
      nombre: 'Melvin Garcia',
      email: 'cliente@megastore.com',
      role: 'cliente',
      telefono: '5555-1234',
      direccion: 'Avenida Las Americas 14-20, Zona 14, Guatemala',
      creditScore: 85,
      token: 'jwt-token-bnpl-e2e'
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
    cy.setSessionUser(clienteApto);
    cy.setSessionCart(cartMock);
  });

  it('Flujo Completo BNPL: Evaluacion de scoring, seleccion automatica de Credito Propio y confirmacion sin tarjeta', () => {
    // 1. Agregar producto al carrito desde catalogo
    cy.visit('/catalogo');
    cy.get('.product-card').first().find('.btn-add-cart').click();

    // 2. Navegar a Checkout
    cy.visit('/checkout');
    cy.contains('Finalizar Compra').should('exist');

    // 3. Validar presentacion del banner naranja de Credito Propio (Campaña BNPL Fase 3)
    cy.contains('Crédito Propio MegaStore').should('exist');
    cy.contains('PAGA EN 30 DÍAS').should('exist');
    cy.contains('0% interés promocional').should('exist');

    // 4. Validar desglose de scoring y saldo en la tarjeta de metodo de pago
    cy.contains('Cupo disponible:').should('exist');
    cy.contains('Score Crediticio: 85/100 (Aprobado)').should('exist');

    // 5. Verificar que el radio button de credito_propio este seleccionado por defecto
    cy.get('input[name="payment"][value="credito_propio"]').should('be.checked');

    // 6. Verificar que NO se solicitan datos de tarjeta de credito
    cy.get('input[placeholder="4532 0000 0000 4242"]').should('not.exist');
    cy.get('input[placeholder="MM/AA"]').should('not.exist');
    cy.get('input[placeholder="•••"]').should('not.exist');

    // 7. Confirmar la compra con financiamiento directo
    cy.get('.btn-confirm-pay').click();

    // 8. Validar pantalla de confirmacion de orden
    cy.url().should('include', '/confirmacion');
    cy.contains('Orden confirmada exitosamente').should('exist');
    cy.contains('Crédito Propio MegaStore (Paga en 30 días)').should('exist');
    cy.contains('0% recargo — 30 días de gracia').should('exist');
    cy.contains('Fecha límite de pago:').should('exist');

    // 9. Navegar al seguimiento del pedido y verificar detalle financiero
    cy.contains('button', 'Ver estado de mi orden').click();
    cy.url().should('include', '/seguimiento');
    cy.contains('Seguimiento de Pedido').should('exist');
    cy.contains('Crédito Propio (Paga en 30 días)').should('exist');
    cy.contains('Vencimiento del crédito').should('exist');
    cy.contains('(0% recargo)').should('exist');
  });

});
