# Sprint Planning — SGO-Logic Fase 3

**Proyecto:** Sistema de Gestion de Ordenes y Logistica Omnicanal (SGO-Logic)  
**Institucion:** Universidad de San Carlos de Guatemala (USAC)  
**Curso:** Analisis y Diseno de Sistemas 2, Seccion B (2S2026)  
**Equipo:** No. 11  

**Fecha de Sprint Planning:** 24/09/2026  
**Duracion del Sprint:** 24/09/2026 al 09/10/2026 (15 dias de calendario)  
**Entrega y Cierre:** 09/10/2026  

---

## 1. Equipo de Desarrollo y Asignaciones

| Carne | Nombre Completo | Rol Scrum | Responsabilidad Principal en Fase 3 |
| :--- | :--- | :--- | :--- |
| **202300712** | Melvin Geovanni Garcia Sumala | Scrum Master / Tech Lead | Frontend Omnicanal, Checkout BNPL 30 dias, 5 Pruebas Unitarias, CI/CD |
| **202112109** | Carlos David de Leon Barrios | Backend Facturacion / Scoring | Motor Scoring de Credito, ACL AS/400, Docs Tecnicos, 5 Pruebas E2E Cypress |
| **202300378** | Maria Fernanda Morales Lima | QA / Backend Logistica | Microservicio Logistica (.NET 8), Mock LogiExpress, 5 Pruebas de Carga |
| **202000576** | Susana Paola Gonzalez Contreras | Backend Pagos | Microservicio Pagos (Spring Boot), Circuit Breaker Resilience4j, 5 Pruebas de Estres |
| **202307272** | Bryan Alejandro Anona Paredes | Backend Inventario | Microservicio Inventario (Spring Boot), Bloqueo Optimista, 5 Pruebas de Integracion |

---

## 2. Meta del Sprint (Sprint Goal)

Integrar y certificar la campana comercial **Buy Now Pay Later (BNPL) 30 dias (0% interes promocional)** sobre la arquitectura omnicanal de SGO-Logic, habilitando el motor de scoring crediticio, la orquestacion de eventos en RabbitMQ, la trazabilidad reactiva via Server-Sent Events (SSE), la gestion de pedidos y cancelaciones en el Dashboard de Operaciones, y la infraestructura reproducible en Google Cloud Platform (GCP).

---

## 3. Sprint Backlog (50 Puntos de Historia Totales)

### HISTORIA 1: Experiencia de Checkout Omnicanal y Campana BNPL 30 Dias
- **Responsable:** Melvin Geovanni Garcia Sumala (202300712)
- **Estimacion:** 12 Story Points | **Estado:** Done
- **Descripcion:** Implementar en el frontend de React la evaluacion asincrona de scoring y la presentacion preferente de Credito Propio a 30 dias sin exigir tarjeta bancaria, con calculo de vencimiento exacto y 0% de interes.
- **Criterios de Aceptacion (Gherkin / BDD):**
  ```gherkin
  Escenario: Cliente elegible realiza checkout con Credito Propio BNPL
    Dado que el cliente tiene un creditScore mayor o igual a 70
    Y el monto de su orden es menor o igual a su saldo disponible
    Cuando el cliente navega a la pantalla de checkout
    Entonces el sistema preselecciona automaticamente el metodo 'credito_propio'
    Y muestra el banner con fecha limite calculada a 30 dias y 0% interes
    Y no se solicita el ingreso de tarjeta de credito
    Y al confirmar, la orden se crea exitosamente en estado CREADA
  ```

### HISTORIA 2: Motor de Evaluacion de Riesgo Crediticio y Certificacion E2E
- **Responsable:** Carlos David de Leon Barrios (202112109)
- **Estimacion:** 10 Story Points | **Estado:** Done
- **Descripcion:** Exponer el endpoint `POST /api/credito/evaluar` desacoplado en `ordenes-service`, integrando reglas de saldo y scoring, documentar contratos OpenAPI y estructurar la suite de 5 pruebas End-to-End con Cypress.
- **Criterios de Aceptacion (Gherkin / BDD):**
  ```gherkin
  Escenario: Solicitud de evaluacion crediticia para cliente riesgoso
    Dado que un cliente con historial negativo (clienteId = 'riesgo') solicita credito
    Cuando se invoca el endpoint POST /api/credito/evaluar
    Entonces el servicio retorna aprobado: false con score de 45 puntos
    Y la interfaz web deshabilita la opcion BNPL ofreciendo PayKlik como alternativa
  ```

### HISTORIA 3: Resiliencia en Pagos y Flujo de Transiciones Logisticas
- **Responsable:** Susana Paola Gonzalez Contreras (202000576)
- **Estimacion:** 9 Story Points | **Estado:** Done
- **Descripcion:** Implementar el procesador de pagos diferidos a 30 dias en `pagos-service`, mantener la pasarela PayKlik con proteccion de Circuit Breaker Resilience4j y habilitar la recepcion de eventos de pago en RabbitMQ.
- **Criterios de Aceptacion (Gherkin / BDD):**
  ```gherkin
  Escenario: Procesamiento de pago diferido BNPL
    Dado un evento de inventario.reservado para una orden con credito propio
    Cuando pagos-service consume el evento
    Entonces registra la transaccion diferida con recargo 0.00
    Y emite el evento pago.aprobado hacia el exchange sgo.pagos.events
  ```

### HISTORIA 4: Inventario Unificado y Bloqueo Optimista Concurrente
- **Responsable:** Bryan Alejandro Anona Paredes (202307272)
- **Estimacion:** 10 Story Points | **Estado:** Done
- **Descripcion:** Consolidar existencias en CD Norte, CD Sur y 32 tiendas fisicas. Incorporar control de concurrencia con `@Version` en PostgreSQL y soporte para liberacion automatica de existencias ante cancelacion de pedido.
- **Criterios de Aceptacion (Gherkin / BDD):**
  ```gherkin
  Escenario: Cancelacion de orden y liberacion de stock
    Dado un pedido en estado CREADA con existencias reservadas
    Cuando el administrador cancela la orden desde el Dashboard
    Entonces el estado cambia a CANCELADA
    Y se publica un evento que restituye inmediatamente el inventario en el CD correspondiente
  ```

### HISTORIA 5: Integracion de Transporte LogiExpress y Monitoreo SSE
- **Responsable:** Maria Fernanda Morales Lima (202300378)
- **Estimacion:** 9 Story Points | **Estado:** Done
- **Descripcion:** Generacion automatica de numeros de guia `LEX-XXXXXX-GT` mediante `logistica-service` y emision reactiva de notificaciones al cliente via Server-Sent Events en `notificaciones-service`.
- **Criterios de Aceptacion (Gherkin / BDD):**
  ```gherkin
  Escenario: Actualizacion de estado en vivo para el cliente
    Dado que el administrador cambia el estado de una orden a EN_TRANSITO
    Cuando el cambio es persistido en ordenes-service
    Entonces notificaciones-service emite el evento SSE al navegador del cliente
    Y la pantalla de seguimiento actualiza la barra de progreso sin recargar la pagina
  ```

---

## 4. Definicion de Hecho (Definition of Done - DoD)

Una historia de usuario se considera terminada cuando cumple los siguientes requisitos:
1. El codigo fuente cumple con los estandares de codificacion del proyecto, sin funciones huerfanas ni valores fijos arbitrarios.
2. Las pruebas unitarias y de integracion asociadas ejecutan con 100% de exito (`npm test`, `mvn test`).
3. El frontend compila de forma limpia en modo produccion sin advertencias bloqueantes (`npm run build`).
4. Las pruebas E2E en Cypress ejecutan de manera determinista pasando los 14 tests de los 5 specs.
5. Se ha documentado la funcionalidad en el Manual Tecnico y Manual de Usuario sin incluir emojis.
