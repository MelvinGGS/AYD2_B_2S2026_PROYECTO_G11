# Actualizacion de Diagramas de Arquitectura — SGO-Logic Fase 3

**Proyecto:** Sistema de Gestion de Ordenes y Logistica Omnicanal (SGO-Logic)  
**Seccion:** USAC Ingenieria en Ciencias y Sistemas - AYD2 Seccion B (2S2026)  
**Equipo:** No. 11  

---

## 1. Proposito y Evolucion Arquitectonica

El presente documento formaliza la evolucion de la arquitectura del sistema MegaStore SGO-Logic entre la Fase 2 y la Fase 3. Durante esta fase se incorporo el modelo de financiamiento propio **Buy Now Pay Later (BNPL) 30 dias (0% interes)**, el motor desacoplado de evaluacion de scoring crediticio, la gestion y trazabilidad reactiva via Server-Sent Events (SSE), la persistencia transaccional optimista en inventario distribuido y la infraestructura cloud en Google Cloud Platform (GCP).

Los diagramas nativos en formato Draw.io se encuentran almacenados en el directorio `docs/`:
- `docs/1-diagrama-bloques.drawio`
- `docs/2-diagrama-componentes.drawio`
- `docs/3-diagrama-despliegue.drawio`
- `docs/4-diagrama-secuencia.drawio`

---

## 2. Diagrama de Despliegue en GCP (Topologia Cloud)

**Archivo:** `docs/3-diagrama-despliegue.drawio`

### Justificacion Tecnica
El sistema opera en Google Cloud Platform (GCP) en la region `us-central1` sobre una instancia Compute Engine `e2-standard-4` (4 vCPUs, 16 GB RAM y 100 GB SSD). Se implementa una red VPC (`megastore-vpc`) con reglas de firewall restringidas a puertos de operacion publica (80 HTTP, 443 HTTPS) y puerto 22 SSH para despliegue automatizado continuo mediante GitHub Actions Runner.

Un contenedor Nginx actua como Reverse Proxy de alto rendimiento y terminador SSL, aislando los microservicios en una subred interna privada de Docker Bridge (`megastore-net`).

```mermaid
flowchart TD
    subgraph GCP["Google Cloud Platform (us-central1)"]
        subgraph VPC["VPC Network: megastore-vpc (10.0.0.0/16)"]
            FW["Cloud Firewall (Reglas: 80, 443, 22)"]
            GHRunner["GitHub Actions CI/CD Runner (SSH Deploy)"]

            subgraph CE["Compute Engine: e2-standard-4 (Ubuntu 22.04 LTS / 100 GB SSD)"]
                NginxProxy["Nginx Reverse Proxy & SSL (Puertos 80, 443)"]

                subgraph DockerNet["Docker Bridge Network: megastore-net"]
                    Frontend["frontend (React 18 / Nginx SPA)"]
                    MS_Ord["ordenes-service (Spring Boot 17 :8081)"]
                    MS_Inv["inventario-service (Spring Boot 17 :8082)"]
                    MS_Pag["pagos-service (Spring Boot 17 :8083)"]
                    MS_Fac["facturacion-service (Spring Boot 17 :8084)"]
                    MS_Log["logistica-service (.NET 8 :8085)"]
                    MS_Not["notificaciones-service (.NET 8 :8086)"]

                    RMQ["RabbitMQ 3.13 Broker (AMQP 5672 / UI 15672)"]
                    PG["PostgreSQL 15 Cluster (:5432)"]
                    Redis["Redis Cache 7.2 (:6379)"]
                end
            end
        end
    end

    FW --> NginxProxy
    GHRunner -. Despliegue Automatizado .-> CE
    NginxProxy --> Frontend
    NginxProxy --> MS_Ord
    NginxProxy --> MS_Inv
    NginxProxy --> MS_Pag
    NginxProxy --> MS_Fac
    NginxProxy --> MS_Log
    NginxProxy --> MS_Not
    MS_Ord --> RMQ
    MS_Inv --> RMQ
    MS_Pag --> RMQ
    MS_Fac --> RMQ
    MS_Log --> RMQ
    MS_Not --> RMQ
    MS_Ord --> PG
    MS_Inv --> PG
    MS_Pag --> PG
    MS_Ord --> Redis
```

---

## 3. Diagrama de Componentes (UML)

**Archivo:** `docs/2-diagrama-componentes.drawio`

### Justificacion Tecnica
Este diagrama describe la descomposicion funcional del sistema en microservicios autonomos orientados a eventos. Destaca la inclusion del `CreditoController` y `CreditoService` en `ordenes-service`, la Capa Anticorrupcion (`LegacyErpAdapter`) hacia el ERP legado IBM AS/400 en `facturacion-service`, y el Hub de difusion reactiva Server-Sent Events (`NotificationBroadcaster`) en `notificaciones-service`.

```mermaid
flowchart LR
    subgraph Frontend Omnicanal
        FE_UI["React 18 SPA"]
        FE_Auth["AuthContext & CartContext"]
        FE_Check["CheckoutPage (BNPL & PayKlik)"]
        FE_Dash["DashboardPage (Ops Admin)"]
    end

    subgraph ordenes_service["ordenes-service (8081)"]
        OrdCtrl["OrdenesController"]
        CredCtrl["CreditoController"]
        CredSvc["CreditoService (Scoring BNPL)"]
        OrdEventPub["RabbitMQSender"]
    end

    subgraph inventario_service["inventario-service (8082)"]
        InvCtrl["InventarioController"]
        StockLock["InventarioService (@Version)"]
        StockUnif["CleanupScheduler (15 min)"]
    end

    subgraph pagos_service["pagos-service (8083)"]
        PagCtrl["PagosController"]
        BNPLProc["PagosService (Bifurcacion BNPL)"]
        PayKlikAdp["CircuitBreaker (Resilience4j)"]
        DLQHandler["encolarPagoFallback (DLQ)"]
    end

    subgraph facturacion_service["facturacion-service (8084)"]
        FacCtrl["FacturaController"]
        SatAdp["FacturacionService (DTE FEL XML)"]
        AS400Acl["LegacyErpAdapter (ACL AS/400)"]
    end

    subgraph logistica_service["logistica-service (8085)"]
        LogCtrl["LogisticaController"]
        LogiExpAdp["MockLogiExpressService"]
    end

    subgraph notificaciones_service["notificaciones-service (8086)"]
        NotHub["NotificationBroadcaster (SSE /stream)"]
        NotSub["RabbitMQConsumerService"]
    end

    subgraph MessageBroker["RabbitMQ Event Broker"]
        ExOrd["sgologic.exchange (Topic)"]
        DLQ["pagos.dlq.queue (Dead Letter Queue)"]
    end

    FE_UI --> OrdCtrl
    FE_UI --> CredCtrl
    FE_UI --> InvCtrl
    FE_UI --> NotHub

    CredCtrl --> CredSvc
    OrdCtrl --> OrdEventPub
    OrdEventPub --> ExOrd

    ExOrd --> StockLock
    StockLock --> ExOrd
    ExOrd --> BNPLProc
    ExOrd --> PayKlikAdp
    PayKlikAdp --> DLQHandler
    DLQHandler --> DLQ
    ExOrd --> SatAdp
    ExOrd --> LogCtrl
    ExOrd --> NotSub

    SatAdp --> AS400Acl
    LogCtrl --> LogiExpAdp
```

---

## 4. Diagrama de Secuencia — Flujo Integral BNPL 30 Dias (0% Interes)

**Archivo:** `docs/4-diagrama-secuencia.drawio`

### Justificacion Tecnica
Modela la interaccion asincrona completa de la compra diferida bajo la campana Buy Now Pay Later 30 dias mediante una secuencia estructurada de bloques rectangulares y transiciones directas:
1. El cliente inicia Checkout e invoca scoring crediticio.
2. `ordenes-service` evalua historial y confirma aprobacion (Score >= 70, saldo >= total).
3. React presenta la opcion de credito propio eximiendo el ingreso de tarjeta.
4. El cliente confirma orden diferida y el bus RabbitMQ orquesta reserva, cobro diferido, facturacion SAT y guia courier.
5. El cliente recibe actualizacion reactiva en tiempo real via Server-Sent Events (SSE).

```mermaid
flowchart TD
    P1["Paso 1: Cliente Inicia Checkout en React\nRevisa articulos en carrito e ingresa datos de envio"]
    P2["Paso 2: Consulta Scoring Crediticio BNPL\nPOST /api/credito/evaluar { clienteId, monto }"]
    P3["Paso 3: Evaluacion Historica en ERP AS/400\nVerifica compras previas, incidencias y calcula Score >= 70"]
    P4["Paso 4: Respuesta Aprobatoria de Scoring\n{ aprobado: true, limite: 5000.00, plazoDias: 30, interes: 0.0% }"]
    P5["Paso 5: Despliegue de Banner BNPL en Frontend\nReact antepone Credito Propio 30 Dias y oculta formulario de tarjeta"]
    P6["Paso 6: Cliente Confirma Compra sin Tarjeta\nPOST /api/ordenes con metodoPago='credito_propio'"]
    P7["Paso 7: ordenes-service Guarda Orden (CREADA)\nPersiste en PostgreSQL y publica evento 'orden.creada' a RabbitMQ"]
    P8["Paso 8: inventario-service Reserva Stock (15 min)\nAplica bloqueo optimista @Version y publica 'inventario.reservado'"]
    P9["Paso 9: pagos-service Bifurca Credito Propio\nOmite pasarela PayKlik, asigna ref 'BNPL-30D-*' y publica 'pago.confirmado'"]
    P10["Paso 10: facturacion-service Genera FEL y Lote AS/400\nInyecta CondicionPago 30d en XML SAT y registra cuenta por cobrar en ERP"]
    P11["Paso 11: logistica-service Genera Guia Courier\nAsigna codigo LEX-GT y transiciona orden a 'EN_PREPARACION'"]
    P12["Paso 12: notificaciones-service Emite Push SSE en Vivo\nTransmite eventos en tiempo real via Server-Sent Events (/stream)"]
    P13["Paso 13: Confirmacion y Seguimiento Omnicanal\nReact recibe push, muestra comprobante con vencimiento 30d y tracking"]

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
    P5 --> P6
    P6 --> P7
    P7 --> P8
    P8 --> P9
    P9 --> P10
    P10 --> P11
    P11 --> P12
    P12 --> P13
```

---

## 5. Diagrama de Bloques / C4 de Contenedores

**Archivo:** `docs/1-diagrama-bloques.drawio`

### Justificacion Tecnica
Proporciona la vista de nivel 2 del modelo C4, ilustrando los contenedores que conforman el limite del sistema SGO-Logic, sus responsabilidades de almacenamiento y procesamiento, y sus interacciones con sistemas externos heredados y gubernamentales.

```mermaid
flowchart TD
    subgraph Actores
        UserCli["Cliente Omnicanal\n(Web / Movil)"]
        UserAdm["Operador Ops Admin\n(Control y Logistica)"]
    end

    subgraph SGO_Logic["Limite del Sistema SGO-Logic (Fase 3)"]
        SPA["Frontend Omnicanal\n(React 18 SPA + Vite)\nPuerto: 80 / 5173"]
        
        API_Ord["ordenes-service\n(Spring Boot 17)\nPuerto: 8081\nScoring BNPL"]
        API_Inv["inventario-service\n(Spring Boot 17)\nPuerto: 8082\nStock Unificado"]
        API_Pag["pagos-service\n(Spring Boot 17)\nPuerto: 8083\nBNPL & PayKlik"]
        API_Fac["facturacion-service\n(Spring Boot 17)\nPuerto: 8084\nFEL & AS/400"]
        API_Log["logistica-service\n(.NET 8 Web API)\nPuerto: 8085\nDespacho"]
        API_Not["notificaciones-service\n(.NET 8 Minimal API)\nPuerto: 8086\nSSE Hub"]

        Bus_RMQ["RabbitMQ Broker\n(AMQP 5672 / HTTP 15672)\nEventos y Colas DLQ"]
        DB_PG["PostgreSQL 15 Cluster\n(Puerto: 5432)\nBases transaccionales"]
        Cache_Redis["Redis Cache 7.2\n(Puerto: 6379)\nSesiones y Caching"]
    end

    subgraph Externos["Sistemas Externos"]
        Sys_AS400["IBM AS/400 ERP\n(Lotes Batch CSV cada 30 min)"]
        Sys_SAT["SAT Guatemala\n(Servicio FEL DTE XML)"]
        Sys_PayKlik["PayKlik Gateway\n(API Tarjetas de Credito)"]
        Sys_LogiExp["LogiExpress Courier\n(API Guias de Despacho)"]
    end

    UserCli --> SPA
    UserAdm --> SPA

    SPA --> API_Ord
    SPA --> API_Inv
    SPA --> API_Pag
    SPA --> API_Not

    API_Ord --> Bus_RMQ
    API_Inv --> Bus_RMQ
    API_Pag --> Bus_RMQ
    API_Fac --> Bus_RMQ
    API_Log --> Bus_RMQ
    API_Not --> Bus_RMQ

    API_Ord --> DB_PG
    API_Inv --> DB_PG
    API_Pag --> DB_PG
    API_Ord --> Cache_Redis

    API_Fac -. Lotes CSV .-> Sys_AS400
    API_Fac -. Web Service .-> Sys_SAT
    API_Pag -. Rest API / CB .-> Sys_PayKlik
    API_Log -. Rest API .-> Sys_LogiExp
```

---

## 6. Resumen de Decisiones y Criterios de Diseno

1. **Aislamiento de Pagos vs Financiamiento:** La campana BNPL opera bajo un modelo de cuenta corriente interna MegaStore respaldado por el motor de scoring desacoplado, eximiendo al cliente de ingresar datos de tarjeta y reduciendo friccion de conversion.
2. **Resiliencia ante Fallos Externos:** En caso de degradacion en PayKlik, entra en operacion Circuit Breaker (Resilience4j) enrutando transacciones a cola de contingencia `pagos.dlq`.
3. **Integracion no Invasiva con AS/400:** El ERP heredado no recibe peticiones sincronas; la capa ACL exporta lotes consolidados en formato CSV cada 30 minutos sin alterar los procedimientos batch de IBM iSeries.
4. **Despliegue Estandarizado:** La composicion en Docker Compose y Kubernetes permite ejecucion identica en entornos locales y en Google Cloud Platform Compute Engine.
