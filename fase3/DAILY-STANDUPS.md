# Bitacora de Daily Standups — SGO-Logic Fase 3

**Proyecto:** Sistema de Gestion de Ordenes y Logistica Omnicanal (SGO-Logic)  
**Institucion:** Universidad de San Carlos de Guatemala (USAC)  
**Curso:** Analisis y Diseno de Sistemas 2, Seccion B (2S2026)  
**Equipo:** No. 11  

---

## Daily 1: Miercoles 24/09/2026 (Kick-off del Sprint)
- **Melvin Garcia (202300712):** Defini la arquitectura frontend de Fase 3 y la estructura del checkout para la campana BNPL 30 dias. Hoy configurare las ramas y la maqueta visual del banner crediticio. Impedimentos: Ninguno.
- **Carlos David de Leon (202112109):** Revise la integracion de facturacion de Fase 2. Hoy iniciare la especificacion del modelo de scoring en `ordenes-service`. Impedimentos: Ninguno.
- **Maria Fernanda Morales (202300378):** Prepare el entorno de `logistica-service`. Hoy iniciare la integracion con el mock de LogiExpress. Impedimentos: Ninguno.
- **Susana Paola Gonzalez (202000576):** Analice el impacto de BNPL en `pagos-service`. Hoy definire los eventos de pago diferido. Impedimentos: Ninguno.
- **Bryan Alejandro Anona (202307272):** Audite la entidad `Producto` en `inventario-service`. Hoy anadire la anotacion `@Version` para el bloqueo optimista. Impedimentos: Ninguno.

---

## Daily 2: Viernes 26/09/2026 (Modelado de Scoring y Estados)
- **Melvin Garcia (202300712):** Implemente el modulo `checkoutUtils.js` con las funciones de validacion de credito, calculo de vencimiento y formato de orden. Hoy iniciare las pruebas unitarias. Impedimentos: Ninguno.
- **Carlos David de Leon (202112109):** Implemente el controlador `CreditoController` y expuse el endpoint `/api/credito/evaluar`. Hoy sincronizare el contrato con el frontend. Impedimentos: Ninguno.
- **Maria Fernanda Morales (202300378):** Configure el generador de codigos de rastreo `LEX-XXXXXX-GT`. Hoy validare los endpoints de creacion de despacho. Impedimentos: Ninguno.
- **Susana Paola Gonzalez (202000576):** Implemente el procesador contable BNPL con 0% recargo. Hoy ajustare las colas de RabbitMQ. Impedimentos: Ninguno.
- **Bryan Alejandro Anona (202307272):** Realice pruebas de bloqueo optimista para evitar sobreventa bajo concurrencia. Impedimentos: Ninguno.

---

## Daily 3: Lunes 29/09/2026 (Flujo de Checkout y Exencion de Tarjeta)
- **Melvin Garcia (202300712):** Modifique `CheckoutPage.jsx` para evaluar credito asincronamente y seleccionar Credito Propio por defecto. Se eximio la tarjeta de credito para compras BNPL. Hoy probare el flujo de navegacion a `/confirmacion`. Impedimentos: Ninguno.
- **Carlos David de Leon (202112109):** Instale Cypress 16 en el entorno de frontend y elabore la estructura base de los specs E2E. Impedimentos: Resolver aislamiento de `localStorage` en iframe de Cypress.
- **Maria Fernanda Morales (202300378):** Avance en la definicion de las pruebas de carga con Locust. Impedimentos: Esperar estabilizacion de endpoints en los otros servicios.
- **Susana Paola Gonzalez (202000576):** Ajuste la tolerancia de fallos de PayKlik con Resilience4j. Impedimentos: Ninguno.
- **Bryan Alejandro Anona (202307272):** Prepare el endpoint de inventario unificado para 32 tiendas fisicas y 2 Centros de Distribucion. Impedimentos: Ninguno.

---

## Daily 4: Miercoles 01/10/2026 (Dashboard Operativo y Cancelaciones)
- **Melvin Garcia (202300712):** Integre en `DashboardPage.jsx` el estado `CANCELADA` con distintivo rojo y el filtro de pedidos por metodo de pago. Hoy certificare las 5 pruebas unitarias con Node.js Test Runner. Impedimentos: Ninguno.
- **Carlos David de Leon (202112109):** Desarrolle las specs `01_autenticacion_y_sesion.cy.js` y `02_catalogo_carrito_multiproducto.cy.js`. Hoy trabajare en el checkout tradicional con PayKlik. Impedimentos: Sincronizar el desmontado de componentes al evaluar credito.
- **Maria Fernanda Morales (202300378):** Verifique la emision de eventos SSE desde `notificaciones-service`. Impedimentos: Ninguno.
- **Susana Paola Gonzalez (202000576):** Valide que las transacciones en contingencia se enruten a `pagos.dlq`. Impedimentos: Ninguno.
- **Bryan Alejandro Anona (202307272):** Conecte el consumidor de eventos para liberacion automatica de stock al cancelar pedidos. Impedimentos: Ninguno.

---

## Daily 5: Viernes 03/10/2026 (Pruebas Unitarias y Desacoplamiento)
- **Melvin Garcia (202300712):** Certifique las 5 pruebas unitarias en `frontend/test/checkout.test.js` con 100% de aprobacion. Hoy construire el build de produccion con Vite para verificar que no existan errores de empaquetado. Impedimentos: Ninguno.
- **Carlos David de Leon (202112109):** Ajuste el interceptor de Cypress para distinguir de forma estricta `credito_propio` frente a cadenas de tarjeta con la palabra credito. Impedimentos: Resuelto con evaluacion precisa en regex/includes.
- **Maria Fernanda Morales (202300378):** Estructure los escenarios de prueba de despacho con tiempos simulados de entrega. Impedimentos: Ninguno.
- **Susana Paola Gonzalez (202000576):** Ejecute `mvn test` en `pagos-service` confirmando la logica de cuentas por cobrar a 30 dias. Impedimentos: Ninguno.
- **Bryan Alejandro Anona (202307272):** Documente la topologia de bases de datos PostgreSQL para el Manual Tecnico. Impedimentos: Ninguno.

---

## Daily 6: Lunes 06/10/2026 (Certificacion E2E y Diagramas Draw.io)
- **Melvin Garcia (202300712):** Valide que `npm run build` genera la distribucion sin advertencias en 1.35 segundos. Hoy colaborare en la creacion de los diagramas de arquitectura en formato nativo Draw.io. Impedimentos: Ninguno.
- **Carlos David de Leon (202112109):** Conclui las 5 specs E2E de Cypress logrando 14 pruebas pasando de 14 totales (100% efectividad). Hoy redactare la seccion de contratos de API. Impedimentos: Ninguno.
- **Maria Fernanda Morales (202300378):** Afine la infraestructura del mock de LogiExpress. Impedimentos: Ninguno.
- **Susana Paola Gonzalez (202000576):** Verifique la configuracion de Docker Compose con los nuevos puertos de microservicios. Impedimentos: Ninguno.
- **Bryan Alejandro Anona (202307272):** Valide que las reservas de inventario respeten el tiempo limite de caducidad. Impedimentos: Ninguno.

---

## Daily 7: Miercoles 08/10/2026 (Topologia GCP y Documentacion)
- **Melvin Garcia (202300712):** Diseñe el diagrama de despliegue en Google Cloud Platform (Compute Engine e2-standard-4, Nginx y Docker) y documente la arquitectura en `ACTUALIZACION-DIAGRAMAS.md`. Hoy redactare el Manual Tecnico y el Manual de Usuario. Impedimentos: Ninguno.
- **Carlos David de Leon (202112109):** Finalice la documentacion de los diagramas de secuencia UML y bloques C4 en formato Draw.io. Impedimentos: Ninguno.
- **Maria Fernanda Morales (202300378):** Revise los criterios de aceptacion de las historias de usuario de QA. Impedimentos: Ninguno.
- **Susana Paola Gonzalez (202000576):** Compile las dependencias de Maven en contenedores Docker para garantizar reproducibilidad total. Impedimentos: Ninguno.
- **Bryan Alejandro Anona (202307272):** Realice la auditoria de consistencia en nombres de tablas e indices en PostgreSQL. Impedimentos: Ninguno.

---

## Daily 8: Jueves 09/10/2026 (Cierre de Sprint y Auditoria Final)
- **Melvin Garcia (202300712):** Realice la auditoria general del repositorio: verifique que las 5 pruebas unitarias ejecuten en 3.37ms, las 14 pruebas E2E pasen en 12s, y todos los manuales y artefactos Scrum esten redactados con rigor academico y cero emojis. Sprint concluido exitosamente.
- **Carlos David de Leon (202112109):** Entregue la documentacion de scoring, ACL AS/400 y los archivos `.drawio`.
- **Maria Fernanda Morales (202300378):** Modulos de logistica verificados y listos para recepcion de pruebas posteriores.
- **Susana Paola Gonzalez (202000576):** Pagos verificados en backend con compilacion Maven exitosa.
- **Bryan Alejandro Anona (202307272):** Modulo de inventario unificado operativo.
