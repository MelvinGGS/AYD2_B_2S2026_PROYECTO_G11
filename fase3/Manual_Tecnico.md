# Manual Tecnico de Arquitectura y Desarrollo — SGO-Logic Fase 3

**Sistema:** Sistema de Gestion de Ordenes y Logistica Omnicanal (MegaStore SGO-Logic)  
**Institucion:** Universidad de San Carlos de Guatemala (USAC)  
**Facultad:** Facultad de Ingenieria, Escuela de Ciencias y Sistemas  
**Curso:** Analisis y Diseno de Sistemas 2, Seccion B (Segundo Semestre 2026)  
**Equipo:** No. 11  

---

## 1. Informacion General y Responsabilidades del Equipo

El presente documento constituye el Manual Tecnico formal de la **Fase 3** del sistema MegaStore SGO-Logic. En esta fase se implemento la campana de financiamiento propio **Buy Now Pay Later (BNPL) 30 dias con 0% de interes**, el motor desacoplado de evaluacion de riesgo y scoring crediticio, la gestion y trazabilidad reactiva mediante Server-Sent Events (SSE), la persistencia con bloqueo optimista ante alta concurrencia, la Capa Anticorrupcion (ACL) para el ERP legado IBM iSeries AS/400, la facturacion electronica SAT (FEL), y el despliegue de infraestructura cloud en Google Cloud Platform (GCP).

### Integrantes del Equipo
| Carne | Nombre Completo | Rol Asignado | Componentes Principales |
| :--- | :--- | :--- | :--- |
| **202300712** | Melvin Geovanni Garcia Sumala | Scrum Master / Tech Lead | Frontend Omnicanal React, Checkout BNPL 30d, 5 Pruebas Unitarias, CI/CD |
| **202112109** | Carlos David de Leon Barrios | Backend Facturacion / Scoring | Motor Scoring de Credito, ACL AS/400, Docs Tecnicos, 5 Pruebas E2E Cypress |
| **202300378** | Maria Fernanda Morales Lima | QA / Backend Logistica | Microservicio Logistica (.NET 8), Mock Courier LogiExpress, 5 Pruebas de Carga |
| **202000576** | Susana Paola Gonzalez Contreras | Backend Pagos | Microservicio Pagos (Spring Boot), Circuit Breaker Resilience4j, 5 Pruebas de Estres |
| **202307272** | Bryan Alejandro Anona Paredes | Backend Inventario | Microservicio Inventario (Spring Boot), Bloqueo Optimista, 5 Pruebas de Integracion |

---

## 2. Contexto, Drivers Arquitectonicos y Escenarios de Calidad

### Nuevos Actores y Drivers
- **Gerencia General y Mercadeo:** Origina la campana de fidelizacion comercial "Compra ahora y paga en 30 dias sin intereses".
- **Departamento de Finanzas:** Exige que el otorgamiento de lineas de credito propio se base estrictamente en el comportamiento transaccional del cliente, historial de pago y prevencion de morosidad registrada en el ERP.
- **Cliente Omnicanal:** Visualiza la disponibilidad de credito propio segun su score y limites vigentes sin obligarle a ingresar tarjetas bancarias.
- **ERP Legado IBM AS/400:** Registra las cuentas por cobrar generadas sin modificaciones directas en su codigo fuente de los anos noventa.
- **Driver de Rendimiento:** La evaluacion crediticia debe responder en menos de 500 ms para no entorpecer el proceso de compra.
- **Driver de Resiliencia:** Caidas o degradaciones en la pasarela externa PayKlik no deben bloquear las compras; las ordenes se procesan bajo contingencia en colas de reintentos (DLQ).

### Escenarios de Calidad
| ID | Atributo | Estimulo | Respuesta Esperada | Medida de Exito |
| :--- | :--- | :--- | :--- | :--- |
| **QA-1** | Rendimiento | Cliente navega hacia la pantalla de Checkout | Evaluacion crediticia ejecutada asincronamente en `ordenes-service` | Latencia `< 500 ms` |
| **QA-2** | Disponibilidad | La pasarela externa PayKlik queda fuera de servicio (HTTP 503) | El Circuit Breaker conmuta a fallback, encolando el cobro en `pagos.dlq.queue` | Cero transacciones perdidas |
| **QA-3** | Modificabilidad | Se ajustan las reglas de scoring crediticio o umbrales de aprobacion | El cambio se aplica exclusivamente en `CreditoService.java` | Sin impacto en otros servicios |
| **QA-4** | Interoperabilidad | Se confirma una orden bajo la modalidad BNPL | El adaptador ACL genera el archivo CSV conciliado para el comando `CPYFRMIMPF` | Ingesta batch en AS/400 exitosa |
| **QA-5** | Eficiencia de Red | Se actualiza el estado de despacho logistico de una orden | El frontend recibe la notificacion push reactiva mediante SSE | Cero sondeo periodico por HTTP |

---

## 3. Arquitectura Global del Sistema

El sistema implementa una **Arquitectura de Microservicios Desacoplados Guiada por Eventos (EDA - Event-Driven Architecture)**, complementada por un canal reactivo de Server-Sent Events (SSE) y persistencia distribuida.

### Diagramas de Arquitectura (Directorio `docs/`)
1. **`docs/1-diagrama-bloques.drawio`:** Diagrama de bloques global del sistema, componentes de software, bases de datos y sistemas externos.
2. **`docs/2-diagrama-componentes.drawio`:** Estructura interna de paquetes, clases, controladores, listeners de RabbitMQ y adaptadores de cada microservicio.
3. **`docs/3-diagrama-despliegue.drawio`:** Topologia cloud en Google Cloud Platform (GCP) con Compute Engine e2-standard-4, Nginx y Docker Compose.
4. **`docs/4-diagrama-secuencia.drawio`:** Secuencia integral paso a paso del flujo BNPL estructurada con bloques de accion y transiciones directas.

```
+-----------------------------------------------------------------------------------+
|                     GOOGLE CLOUD PLATFORM (Compute Engine)                        |
|                                                                                   |
|  +--------------------+       +------------------------------------------------+  |
|  | Nginx Proxy (SSL)  | ----> | Frontend SPA (React 18 / Vite)                 |  |
|  | Puertos 80, 443    |       +------------------------------------------------+  |
|  +---------+----------+                                                           |
|            |                                                                      |
|            +------------------+------------------+------------------+             |
|                               |                  |                  |             |
|  +--------------------+ +-----+------------+ +---+------------+ +---+-----------+ |
|  | ordenes-service    | | inventario-serv. | | pagos-service  | | facturacion-s | |
|  | Port: 8081 (Java)  | | Port: 8082 (Java)| | Port: 8083 (J) | | Port: 8084(J) | |
|  | Scoring BNPL Engine| | Bloqueo Optimista| | BNPL / PayKlik | | FEL / ACL 400 | |
|  +---------+----------+ +-----+------------+ +---+------------+ +---+-----------+ |
|            |                  |                  |                  |             |
|            +------------------+--------+---------+------------------+             |
|                                        |                                          |
|                          +-------------+-------------+                            |
|                          | RabbitMQ Message Broker   |                            |
|                          | Puerto AMQP: 5672         |                            |
|                          +-------------+-------------+                            |
|                                        |                                          |
|            +---------------------------+----------------------------+             |
|            |                                                        |             |
|  +---------+----------+                                  +----------+----------+  |
|  | logistica-service  |                                  | notificaciones-serv |  |
|  | Port: 8085 (.NET)  |                                  | Port: 8086 (.NET)   |  |
|  | Guias LogiExpress  |                                  | Push SSE Reactivo   |  |
|  +--------------------+                                  +---------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 4. Especificacion de Microservicios

### 4.1. Frontend Omnicanal (`fase3/frontend/`)
- **Stack:** React 18, Vite 5.4, React Router v7, Lucide Icons.
- **Capacidades Operativas:**
  - Evaluacion asincrona de scoring en Checkout antes de renderizar formas de pago.
  - Seleccion automatica y anteposicion de la campana `credito_propio` cuando el score supera 70 puntos.
  - Exencion total de ingreso de numero de tarjeta, vencimiento y CVV para pedidos BNPL.
  - Control estricto de rutas: acceso a `/carrito`, `/checkout`, `/seguimiento` y `/dashboard` restringido exclusivamente a usuarios autenticados.
  - Panel administrativo Ops Dashboard (`/dashboard`) con monitoreo en tiempo real y panel de habilitacion/deshabilitacion de servicios para pruebas de resiliencia.

### 4.2. Servicio de Ordenes y Scoring (`fase3/ordenes-service/`)
- **Stack:** Java 17, Spring Boot 3.2, Spring Data JPA, Spring AMQP, PostgreSQL.
- **Capacidades Operativas:**
  - Gestion del ciclo de vida de la orden: `CREADA -> EN_PREPARACION -> EN_TRANSITO -> ENTREGADA -> CANCELADA`.
  - Motor de evaluacion crediticia en `CreditoService.java` (`POST /api/credito/evaluar`).
  - Validacion en servidor para denegar pedidos BNPL a clientes no aprobados (HTTP 400).
  - Bloqueo de cancelacion de pedidos que ya alcanzaron el estado logistico terminal `ENTREGADA`.

### 4.3. Servicio de Inventario Central (`fase3/inventario-service/`)
- **Stack:** Java 17, Spring Boot 3.2, Spring Data JPA, PostgreSQL.
- **Capacidades Operativas:**
  - Visibilidad unificada de existencias en Centros de Distribucion (CD Norte, CD Sur) y 32 tiendas fisicas.
  - Control de concurrencia optimista con anotacion `@Version` para garantizar consistencia transaccional y evitar sobreventas.
  - Consumo del evento `orden.creada` y publicacion de `inventario.reservado` o `inventario.insuficiente`.
  - Mecanismo de reabastecimiento directo (`POST /api/inventario/stock/ajuste`).

### 4.4. Servicio de Pagos y Resiliencia (`fase3/pagos-service/`)
- **Stack:** Java 17, Spring Boot 3.2, Resilience4j, Spring AMQP, PostgreSQL.
- **Capacidades Operativas:**
  - Bifurcacion inteligente de metodos de pago: enruta `CREDITO_PROPIO_30D` directamente a confirmacion sin pasar por PayKlik.
  - Pasarela PayKlik para pagos con tarjeta tradicional, protegida por Circuit Breaker (umbral 50% fallos en ventana de 10 peticiones).
  - Tolerancia a fallos: encolamiento de cobros no procesados en `pagos.dlq.queue` y reprocesamiento manual/automatico (`POST /api/pagos/reprocesar-dlq`).
  - Cumplimiento PCI-DSS: almacenamiento restringido a ultimos 4 digitos enmascarados y franquicia.

### 4.5. Servicio de Facturacion SAT y AS/400 (`fase3/facturacion-service/`)
- **Stack:** Java 17, Spring Boot 3.2, Spring Scheduling, PostgreSQL.
- **Capacidades Operativas:**
  - Emision de Facturas Electronicas DTE segun la normativa FEL de SAT Guatemala.
  - Inyeccion del nodo `<CondicionPago Modalidad="CREDITO_PROPIO_30D" PlazoDias="30" TasaInteres="0.00%" FechaVencimiento="..."/>` para ventas financiadas.
  - Capa Anticorrupcion (ACL) para IBM iSeries AS/400: exportacion periodica cada 30 minutos de archivos `resumen_erp_*.csv` con columnas `METODO_PAGO` y `PLAZO_DIAS` para ingesta mediante `CPYFRMIMPF`.

### 4.6. Servicio de Logistica (`fase3/logistica-service/`)
- **Stack:** C# .NET 8 Web API, Entity Framework Core, RabbitMQ.Client.
- **Capacidades Operativas:**
  - Consumo del evento `despacho.solicitado` emitido por facturacion.
  - Ruteo optimo basado en cercania de centros logisticos (CD Norte / CD Sur).
  - Asignacion automatica de guias de rastreo omnicanal bajo el patron `LEX-[0-9]{6}-GT`.

### 4.7. Servicio de Notificaciones Reactivas (`fase3/notificaciones-service/`)
- **Stack:** C# .NET 8, BackgroundService, Server-Sent Events (SSE).
- **Capacidades Operativas:**
  - Transmision unidireccional y reactiva cliente-servidor mediante el endpoint `/api/notificaciones/stream`.
  - Consumo wildcard (`#`) del exchange topic en RabbitMQ para bitacora de auditoria centralizada.
  - Actualizacion automatica del timeline de seguimiento en el frontend en tiempo real.

---

## 5. Motor de Scoring Crediticio (BNPL)

### Ubicacion Arquitectonica
Implementado en `fase3/ordenes-service/src/main/java/com/megastore/ordenes/CreditoService.java` y expuesto a traves de `CreditoController.java`.

### Algoritmo y Reglas de Puntuacion
```
Score Base: 85 puntos
+ 5 puntos si el cliente registra 2 o mas ordenes previas
+ 5 puntos si el monto acumulado historico es >= $500.00
- 15 puntos por cada incidencia registrada en auditoria (mora en AS/400, reclamos)
Rango de salida: acotado entre 0 y 100 puntos
```

### Reglas de Aprobacion
Una solicitud de credito se aprueba si y solo si:
1. `score >= 70`
2. `montoOrden <= saldoDisponible` (Limite maximo: `$5,000.00` menos deuda activa no liquidada)

### Matriz de Casos de Prueba del Scoring
| Caso | Ordenes Previas | Incidencias ERP | Score Resultante | Resultado Evaluacion |
| :--- | :--- | :--- | :--- | :--- |
| **Cliente Frecuente Sin Incidencias** | 3 ordenes | 0 incidencias | 95 / 100 | Aprobado con cupo total |
| **Cliente Estandar Inicial** | 0 ordenes | 0 incidencias | 85 / 100 | Aprobado con cupo total |
| **Cliente con 1 Incidencia Leve** | 2 ordenes | 1 incidencia | 75 / 100 | Aprobado (supera umbral 70) |
| **Cliente Riesgo con Mora en ERP** | 0 ordenes | 2 incidencias | 55 / 100 | Rechazado (score menor a 70) |

---

## 6. Contratos de API REST Principales

### 6.1. Evaluacion de Credito
- **Metodo y Ruta:** `POST /api/credito/evaluar`
- **Payload de Entrada:**
  ```json
  {
    "clienteId": "1",
    "montoOrden": 519.00
  }
  ```
- **Respuesta Aprobada (HTTP 200):**
  ```json
  {
    "clienteId": "1",
    "score": 90,
    "aprobado": true,
    "limiteCredito": 5000.00,
    "saldoDisponible": 4481.00,
    "saldoDeudor": 519.00,
    "plazoDias": 30,
    "fechaVencimiento": "2026-11-12",
    "tasaInteres": 0.0,
    "mensaje": "Credito propio aprobado por 30 dias sin intereses"
  }
  ```

### 6.2. Creacion de Orden
- **Metodo y Ruta:** `POST /api/ordenes`
- **Payload de Entrada (Credito Propio):**
  ```json
  {
    "clienteId": "1",
    "clienteNombre": "Carlos Aragon",
    "canal": "Web Store",
    "metodoEntrega": "Envio a Domicilio",
    "metodoPago": "credito_propio",
    "direccion": "Zona 10, Ciudad de Guatemala",
    "items": [
      {
        "productoId": "PROD-001",
        "nombre": "Lavadora Mabe 20kg",
        "cantidad": 1,
        "precio": 450.00
      }
    ]
  }
  ```

### 6.3. Control de Resiliencia y Pasarela PayKlik
- **Metodo y Ruta:** `POST /api/payklik/modo`
- **Payload:** `{"deshabilitado": true}`
- **Respuesta:** `{"deshabilitado": true, "estadoServicio": "DESHABILITADO"}`

### 6.4. Reprocesamiento de Pagos en Contingencia (DLQ)
- **Metodo y Ruta:** `POST /api/pagos/reprocesar-dlq`
- **Respuesta:** `{"reprocesados": 1, "ordenesRecuperadas": ["ORD-2026-66019"]}`

---

## 7. Arquitectura de Mensajeria (RabbitMQ)

- **Exchange Principal:** `sgologic.exchange` (Tipo: `topic`, Durable)
- **Colas y Enrutamiento:**
  | Cola | Routing Key | Consumidor | Proposito |
  | :--- | :--- | :--- | :--- |
  | `inventario.orden.queue` | `orden.creada` | `inventario-service` | Bloqueo y reserva de unidades |
  | `pagos.orden.queue` | `inventario.reservado` | `pagos-service` | Procesamiento del cobro |
  | `facturacion.pago.queue` | `pago.confirmado` | `facturacion-service` | Generacion de DTE y lote contable |
  | `logistica.despacho.queue` | `despacho.solicitado` | `logistica-service` | Asignacion de guia Courier |
  | `pagos.dlq.queue` | `pago.fallido` / DLQ | `pagos-service` | Almacenamiento de pagos en contingencia |
  | `notificaciones.eventos.queue` | `#` | `notificaciones-service` | Bitacora y difusion SSE |

---

## 8. Estrategia de Calidad y Pruebas Automatizadas

### 8.1. Pruebas Unitarias del Frontend (Node.js Test Runner)
Ubicadas en `fase3/frontend/test/checkout.test.js` (5 pruebas a cargo del carnet 202300712):
1. `validarElegibilidadCredito`: evaluacion estricta de fronteras (score 70, limites de cupo).
2. `calcularVencimientoCredito`: calculo exacto de 30 dias considerando cambios de mes bisiesto y fin de ano.
3. `formatearDetalleBNPL`: desglose financiero con 0% recargo y redondeo a 2 decimales.
4. `filtrarMetodosPagoDisponibles` y `esMetodoCreditoPropio`: clasificacion univoca entre tarjeta y BNPL.
5. `validarFormularioCheckout`: exencion de validacion de tarjeta bancaria cuando el metodo es credito propio.

### 8.2. Pruebas End-to-End (Cypress)
Ubicadas en `fase3/frontend/cypress/e2e/` (15 pruebas en 5 especificaciones a cargo del carnet 202112109):
- `01_autenticacion_y_sesion.cy.js`: autenticacion de cliente, proteccion de rutas no autenticadas, rol admin y cierre de sesion.
- `02_catalogo_carrito_multiproducto.cy.js`: navegacion de catalogo, filtros por categoria, busqueda dinamica y persistencia de carrito.
- `03_checkout_tradicional_payklik.cy.js`: flujo tradicional con pasarela PayKlik, validacion de campos y confirmacion.
- `04_checkout_credito_propio_bnpl.cy.js`: flujo integral BNPL 30 dias con evaluacion de scoring y confirmacion sin tarjeta.
- `05_admin_dashboard_y_gestion_estados.cy.js`: acceso a dashboard operativo, transicion de estados logisticos, cancelacion con liberacion de stock y panel de resiliencia (habilitar/deshabilitar servicios).

---

## 9. Despliegue en GCP y Pipeline CI/CD

### Topologia Cloud
- **Proveedor:** Google Cloud Platform (GCP).
- **Instancia:** Compute Engine `e2-standard-4` (4 vCPUs, 16 GB memoria RAM, disco SSD 50 GB).
- **Sistema Operativo:** Ubuntu 22.04 LTS con Docker Engine 26 y Docker Compose v2.
- **Acceso:** Dominio protegido mediante Nginx Reverse Proxy con certificados SSL Let's Encrypt (HTTPS 443).

### Pipeline de Entrega Continua (GitHub Actions)
Definido en `.github/workflows/ci-cd.yml`:
1. **Etapa 1 (Build & Test Frontend):** Compilacion del bundle Vite y ejecucion de las 5 pruebas unitarias (`npm test`).
2. **Etapa 2 (Build & Test Microservicios):** Compilacion con Maven de los servicios Spring Boot y compilacion de proyectos .NET 8.
3. **Etapa 3 (Pruebas E2E Cypress):** Ejecucion de la suite completa en modo headless contra el stack levantado.
4. **Etapa 4 (Despliegue Continuo a GCP):** Conexion segura via SSH al host en Google Cloud y ejecucion de `docker compose up -d --build`.

---

## 10. Guia de Replicacion Local

Para compilar y levantar el ecosistema completo en un entorno local:

```bash
# 1. Posicionarse en la carpeta de Fase 3
cd AYD2_B_2S2026_PROYECTO_G11/fase3

# 2. Reconstruir y levantar los 10 contenedores en segundo plano
docker compose up -d --build

# 3. Verificar estado de los contenedores
docker compose ps

# 4. Acceder al sistema web
# URL: http://localhost:3000
# Credenciales Cliente Demo: cliente@megastore.com / Password123
# Credenciales Cliente Riesgo: riesgo@megastore.com / Riesgo123
# Credenciales Ops Admin: admin@megastore.com / Admin123
```
