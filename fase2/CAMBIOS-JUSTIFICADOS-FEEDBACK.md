# Cambios Justificados a partir del Feedback Técnico — SGO-Logic Fase 2


**Equipo No. 11**  

---

## Matriz Resumen de Cambios Técnicos

| # | Área de Impacto | Observación / Feedback Fase 1 | Solución Aplicada en Fase 2 | Justificación Técnica |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Comunicación Inter-Servicios** | Cuello de botella en checkout por llamadas REST encadenadas síncronas. | Migración a Arquitectura Basada en Eventos (EDA) con RabbitMQ. | Desacopla la transacción de compra. La orden se confirma en <500ms; facturación, inventario y despacho procesan de forma asíncrona. |
| **2** | **Resiliencia en Pagos** | Caídas o latencias >5s en PayKlik bloqueaban las conexiones de la tienda. | Circuit Breaker con Resilience4j + Fallback a cola de contingencia `pagos.dlq`. | Si PayKlik falla en 50% de llamadas, el circuito abre, almacena en contingencia y no rechaza la venta del cliente. Cumple PCI-DSS. |
| **3** | **Integración ERP Legado** | Riesgo de alterar el código RPG de 1990 del AS/400 o gastar presupuesto de consultoría. | Capa Anticorrupción (ACL) con exportador Batch CSV programado cada 30 min (ADR-005). | El AS/400 no expone APIs. Se genera un archivo plano estructurado que el mainframe ingesta nativamente vía `CPYFRMIMPF` sin modificar su lógica. |
| **4** | **Consistencia de Inventario** | Riesgo de sobreventa (overbooking) en productos promocionales concurrentes. | Bloqueo optimista con `@Version` en PostgreSQL y reservas con expiración a 15 min. | Bloqueo optimista evita deadlocks en BD; la reserva retiene stock solo el tiempo prudente para pagar antes de liberarlo automáticamente. |
| **5** | **Omnicanalidad del Carrito** | Carrito volátil almacenado en memoria/cookies locales de una sola sesión web. | Persistencia centralizada en memoria con Redis indexada por `clienteId`. | El carrito pertenece al cliente (`carrito:{clienteId}`), manteniéndose intacto si cambia entre web, móvil o tienda física. |
| **6** | **Emisión Fiscal SAT FEL** | Si la SAT demora >3s en certificar, el usuario experimentaba timeouts en la compra. | Generación asíncrona de XML DTE con reintentos exponenciales (1s, 2s, 4s). | La compra del cliente ya está garantizada; el proceso tributario se reintenta automáticamente en segundo plano sin congelar la pantalla. |

---

## Detalle de Cambios Técnicos Justificados

### 1. Comunicación Asíncrona con RabbitMQ vs HTTP Sincrónico
* **Problema en Fase 1:** El diseño contemplaba llamadas HTTP en cascada: `Frontend -> Ordenes -> Inventario -> Pagos -> Facturación -> Logística`. Una demora en cualquier proveedor externo provocaba latencias acumuladas >10 segundos, violando el atributo de calidad de respuesta rápida.
* **Solución en Fase 2:** Se implementó un Topic Exchange central (`sgologic.exchange`) en RabbitMQ. Al pagar, `ordenes-service` emite `orden.creada` y responde al cliente de inmediato. Los demás servicios consumen sus eventos correspondientes de forma asíncrona.
* **Justificación Técnica:** Garantiza alta disponibilidad y desacoplamiento temporal. Si el servicio de despacho o facturación se reinicia, la orden del cliente no se pierde ni se cancela, ya que los mensajes esperan de forma persistente en las colas.
* **Verificación en vivo:**
  ```bash
  # Ver los eventos fluyendo en las colas de RabbitMQ
  curl -s -u guest:guest http://localhost:15672/api/queues | jq '.[].name'
  ```

---

### 2. Resiliencia en Pagos (Resilience4j Circuit Breaker + DLQ)
* **Problema en Fase 1:** Si la pasarela PayKlik fallaba o tardaba más de 5 segundos en eventos de alta demanda (ej. Black Friday), los hilos de ejecución de Tomcat se saturaban hasta tirar el microservicio completo.
* **Solución en Fase 2:** Se configuró Resilience4j sobre el endpoint de cobro con una ventana de 10 peticiones. Si el 50% falla, el circuito se abre y dispara el método `encolarPagoFallback`, guardando el pago en estado `ENCOLADO_CONTINGENCIA` y enviándolo a `pagos.dlq`.
* **Justificación Técnica:** Previene la falla en cascada en todo el sistema. El cliente recibe confirmación de recepción y la transacción se procesa tan pronto como el proveedor se restablece. Además, solo se persisten los últimos 4 dígitos de la tarjeta para estricto cumplimiento de la norma PCI-DSS.
* **Verificación en vivo:**
  ```bash
  # Estado de salud del Circuit Breaker en Pagos
  curl -s http://localhost:8083/actuator/health | jq '.components.circuitBreakers'
  ```

---

### 3. Integración con ERP IBM AS/400 (Capa Anticorrupción ACL - ADR-005)
* **Problema en Fase 1:** El cliente exigió una restricción de negocio inviolable: **no modificar los sistemas legados (IBM AS/400)** para evitar altos costos de consultoría especializada o riesgos de regresión en la contabilidad central.
* **Solución en Fase 2:** Se implementó una Capa Anticorrupción (ACL) mediante una tarea programada `@Scheduled(cron = "0 */30 * * * *")` en `facturacion-service`. Esta genera un archivo plano estructurado `resumen_erp_yyyyMMdd_HHmm.csv` en la carpeta compartida `/app/uploads` (volumen Docker `facturas_data`).
* **Justificación Técnica:** El mainframe IBM AS/400 ingesta archivos por lotes de manera nativa mediante su comando RPG `CPYFRMIMPF`. De esta forma no se abren puertos directos a la base DB2/400 ni se altera el software legado, cumpliendo la restricción al 100%.
* **Verificación en vivo:**
  ```bash
  # Verificar el último lote CSV generado para el AS/400
  curl -s http://localhost:8084/api/facturas/as400/ultimo-csv
  ```

---

### 4. Bloqueo Optimista y TTL de Reserva de Stock
* **Problema en Fase 1:** Con múltiples usuarios intentando comprar el mismo artículo promocional de forma concurrente, existía el riesgo crítico de sobreventa (*overbooking*).
* **Solución en Fase 2:** Se implementó control de concurrencia optimista mediante `@Version` en la entidad `Stock` de JPA. Adicionalmente, al crearse la orden se genera una `Reserva` con expiración a los 15 minutos, liberada automáticamente por un cron job `@Scheduled` si el pago no se completa.
* **Justificación Técnica:** Los bloqueos pesimistas (`SELECT FOR UPDATE`) provocan contención severa y bloqueos mutuos (*deadlocks*) en la base de datos bajo alta concurrencia. El bloqueo optimista junto con la reserva temporal garantiza integridad sin degradar el rendimiento del catálogo.
* **Verificación en vivo:**
  ```bash
  # Consultar stock y reservas activas de un producto
  curl -s http://localhost:8082/api/inventario/disponibilidad/1
  ```

---

### 5. Persistencia Omnicanal del Carrito en Redis
* **Problema en Fase 1:** El carrito de compras se almacenaba localmente en la memoria del navegador o en cookies de una sola pestaña web, impidiendo una experiencia omnicanal real.
* **Solución en Fase 2:** El carrito se almacena en memoria centralizada con **Redis 7**, indexado bajo la llave `carrito:{clienteId}` con expiración configurable (TTL).
* **Justificación Técnica:** Redis ofrece lecturas y escrituras en submilisegundos en memoria RAM. Al estar indexado por el ID del cliente, un usuario puede iniciar su compra en la tienda web, continuar en su aplicación móvil o completarla en el punto de venta de una tienda física.
* **Verificación en vivo:**
  ```bash
  # Inspeccionar llaves activas de carritos en Redis
  docker exec -it sgologic_redis redis-cli keys "carrito:*"
  ```

---

### 6. Emisión Asíncrona de Facturas SAT FEL con Reintentos Exponenciales
* **Problema en Fase 1:** La certificación electrónica de facturas con la SAT es propensa a fluctuaciones y lentitud en los servidores fiscales externos. Detener la compra del cliente mientras la SAT responde degradaba la experiencia de compra.
* **Solución en Fase 2:** La generación del XML DTE (con CUI, número de autorización y firma simulada) se procesa de forma asíncrona tras la confirmación del pago, ejecutando reintentos con retraso exponencial (1s, 2s, 4s). Si la SAT falla de forma persistente, la factura se envía a la cola DLQ para reprocesamiento.
* **Justificación Técnica:** El cliente recibe su recibo de compra garantizado al instante. La obligación tributaria se resuelve en segundo plano sin trasladarle al usuario la latencia ni los errores transitorios de la entidad tributaria.
* **Verificación en vivo:**
  ```bash
  # Descargar el XML DTE de una factura generada
  curl -s http://localhost:8084/api/facturas/orden/ORD-TEST-001/xml
  ```
