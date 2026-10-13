# Sprint Retrospective — SGO-Logic Fase 3

**Proyecto:** Sistema de Gestion de Ordenes y Logistica Omnicanal (SGO-Logic)  
**Institucion:** Universidad de San Carlos de Guatemala (USAC)  
**Curso:** Analisis y Diseno de Sistemas 2, Seccion B (2S2026)  
**Equipo:** No. 11  
**Fecha:** 09/10/2026  

---

## 1. Objetivos de la Retrospectiva

Evaluar el desempeno del equipo, la calidad del software entregado y la efectividad de las decisiones arquitectonicas tomadas durante la Fase 3 del proyecto, identificando fortalezas clave, dificultades tecnicas superadas y compromisos de mejora continua.

---

## 2. ¿Que Funciono Bien Durante el Sprint?

1. **Alineacion de la Campana Comercial (BNPL 30 Dias):** La integracion entre la evaluacion asincrona de scoring en backend y el Checkout reactivo en React permitio ofrecer una experiencia de usuario fluida, preseleccionando automaticamente el financiamiento propio sin exigir tarjeta de credito cuando el cliente califica.
2. **Suite de Pruebas Unitarias Deterministas:** Las 5 pruebas unitarias del Tech Lead (`checkout.test.js`) ejecutan de manera instantanea en menos de 4 milisegundos con Node.js Test Runner, cubriendo fronteras numericas, calculos de fechas de calendario y validaciones de formulario.
3. **Certificacion End-to-End con Cypress 16:** La estructuracion de 5 specs independientes permitio validar 14 flujos completos de inicio a fin (autenticacion, carrito multilineal, PayKlik con gestion de tarjetas, BNPL 30 dias y Dashboard administrativo de transicion de estados), logrando 100% de exito (0 fallos).
4. **Desacoplamiento Asincrono con RabbitMQ:** La utilizacion de eventos evito llamadas HTTP en cascada, garantizando que operaciones de reserva, facturacion fiscal SAT, despacho courier y notificaciones reactivas SSE se ejecuten sin congelar la interfaz del usuario.
5. **Estandarizacion de Diagramas:** Se crearon los 4 diagramas arquitectonicos en formato nativo Draw.io (`.drawio`) y se documentaron detalladamente en `ACTUALIZACION-DIAGRAMAS.md` con Mermaid.

---

## 3. ¿Que Dificultades se Presentaron y Como se Resolvieron?

### 3.1. Ambiguedad en la Deteccion de Metodos de Pago (La Analogia de la Cuchara)
- **Problema:** En las pantallas de confirmacion y seguimiento, la expresion `orden.metodoPago.toLowerCase().includes('credito')` clasificaba equivocadamente pagos tradicionales con tarjeta como si fueran compras de la campana BNPL, debido a que el texto contenia la palabra "credito" en la frase `PayKlik (Tarjeta de Credito)`. Esto ocultaba el desglose de PayKlik.
- **Solucion Aplicada:** Se refinaron las expresiones en `ConfirmacionPage.jsx`, `SeguimientoPage.jsx` y en los interceptores de Cypress para exigir coincidencia exacta con `credito_propio`, `CREDITO_PROPIO_30D` o cadenas explicitas como `credito propio` o `30 dias`. De esta manera, cada metodo de pago dispone de su conjunto completo de herramientas y vistas sin interferencias.

### 3.2. Sincronizacion Asincrona en el Selector de Pagos
- **Problema:** Al cargar la pantalla de Checkout, la llamada asincrona `evaluarCredito` actualizaba el estado reactivo unos milisegundos despues de montar el componente, lo que en pruebas automatizadas desmontaba el formulario de tarjeta si el cliente calificaba para credito propio.
- **Solucion Aplicada:** Se parametrizo el perfil del cliente en las pruebas tradicionales para simular evaluaciones consistentes, y se aseguro que la interfaz mantenga estados deterministas tanto para clientes aptos como para clientes no elegibles.

### 3.3. Gestion de Sesiones y Contexto en Cypress
- **Problema:** Al visitar rutas protegidas en Cypress (`/checkout` o `/admin/dashboard`), la aplicacion redirigia a `/login` si el estado en `window.localStorage` no estaba precargado antes de inicializar los contextos de React (`AuthContext` y `CartContext`).
- **Solucion Aplicada:** Se implemento el comando personalizado `cy.setSessionUser` sobrescribiendo `cy.visit` con el gancho `onBeforeLoad(win)` para inyectar token, perfil y carrito antes de la carga de los componentes.

---

## 4. Metricas de Calidad Alcanzadas en el Sprint

- **Pruebas Unitarias del Tech Lead (Carne 202300712):** 5 pasadas / 0 falladas (100%).
- **Pruebas End-to-End Cypress (Carne 202112109):** 14 pasadas / 0 falladas (100%).
- **Compilacion Frontend Vite:** Exitosa en 1.35s con 0 advertencias.
- **Compilacion Backend Maven (`pagos-service`):** `BUILD SUCCESS` en contenedor Docker.
- **Diagramas Arquitectonicos Draw.io:** 4 archivos generados (`.drawio`) y documentados.
- **Cumplimiento de Puntos de Historia:** 50 Story Points completados de 50 planificados (100%).

---

## 5. Acuerdos y Compromisos para la Continuidad

1. Mantener la estricta separacion de responsabilidades tecnicas entre los integrantes, respetando las 15 pruebas restantes de carga, estres e integracion para cuando los 3 companeros asignados realicen sus entregas correspondientes.
2. Preservar la regla de oro: Cero emojis en codigo fuente, commits, diagramas y documentacion academica.
3. Garantizar que toda nueva pantalla incluya su contraparte operativa (ejemplo: si el usuario crea un reporte, el administrador debe contar con una vista para gestionarlo y resolverlo).
