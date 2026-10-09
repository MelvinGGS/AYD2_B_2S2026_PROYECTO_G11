// Comandos personalizados para la suite E2E de SGO-Logic Fase 3
// Desarrollado para pruebas de extremo a extremo omnicanal

let sessionUser = null;
let sessionOrders = null;
let sessionCart = null;

Cypress.Commands.add('setSessionUser', (user) => {
  sessionUser = user;
});

Cypress.Commands.add('setSessionOrders', (orders) => {
  sessionOrders = orders;
});

Cypress.Commands.add('setSessionCart', (cart) => {
  sessionCart = cart;
});

Cypress.Commands.add('clearSessionState', () => {
  sessionUser = null;
  sessionOrders = null;
  sessionCart = null;
});

Cypress.Commands.overwrite('visit', (originalFn, url, options = {}) => {
  const customOnBeforeLoad = options.onBeforeLoad;
  return originalFn(url, {
    ...options,
    onBeforeLoad(win) {
      if (sessionUser) {
        win.localStorage.setItem('sgologic_user', JSON.stringify(sessionUser));
      }
      if (sessionOrders) {
        win.localStorage.setItem('sgologic_sim_orders', JSON.stringify(sessionOrders));
      }
      if (sessionCart) {
        win.localStorage.setItem('sgologic_cart', JSON.stringify(sessionCart));
      }
      if (customOnBeforeLoad) {
        customOnBeforeLoad(win);
      }
    }
  });
});

// Mecanismo de desaceleracion visual (slow motion) basado en cy.queue.runCommand
// En modo headed ralentiza la ejecucion para que cada accion sea claramente observable
const COMMAND_DELAY = (Cypress.browser && Cypress.browser.isHeaded) ? 400 : 0;

if (COMMAND_DELAY > 0 && cy && cy.queue && cy.queue.runCommand) {
  const originalRunCommand = cy.queue.runCommand.bind(cy.queue);
  cy.queue.runCommand = function slowRunCommand(cmd) {
    return Cypress.Promise.delay(COMMAND_DELAY).then(() => originalRunCommand(cmd));
  };
}

Cypress.Commands.overwrite('type', (originalFn, element, text, options = {}) => {
  const typingDelay = (Cypress.browser && Cypress.browser.isHeaded) ? 45 : (options.delay || 10);
  return originalFn(element, text, { delay: typingDelay, ...options });
});

Cypress.Commands.add('loginCliente', (email = 'cliente@megastore.com', password = 'Password123') => {
  cy.visit('/login');
  cy.get('#email').clear().type(email);
  cy.get('#password').clear().type(password);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('loginAdmin', (email = 'admin@megastore.com', password = 'Admin123') => {
  cy.visit('/login');
  cy.get('#email').clear().type(email);
  cy.get('#password').clear().type(password);
  cy.get('button[type="submit"]').click();
});
