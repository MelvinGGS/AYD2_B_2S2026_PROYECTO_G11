# Architecture Decision Record (ADR-005)
## Integración con Sistema Legado ERP AS/400 mediante Capa Anticorrupción (ACL) y Procesamiento Batch

- **Estado:** Aceptado
- **Fecha:** 2026-09-22
- **Autor:** Carlos David de León Barrios (202112109) / Melvin García (202300712)
- **Módulo:** Servicio de Facturación y Sincronización Legacy (facturacion-service)
- **Contexto:** SGO-Logic Fase 2 - MegaStore Retail

---

## 1. Contexto del Problema

La Gerencia General y la Dirección de Finanzas de MegaStore establecieron una restricción inviolable en el enunciado de la Fase 2:
> "Asegurando la continuidad del negocio sin modificar los sistemas legados (AS/400 y POS local) y respetando el presupuesto de $150,000 iniciales y $1,200/mes de infraestructura."

El ERP central de contabilidad opera sobre tecnología IBM AS/400 implementada en la década de 1990. Este sistema no cuenta con APIs modernas (REST, gRPC o SOAP), carece de soporte para colas de mensajería (AMQP/RabbitMQ), y cualquier intento de refactorización o exposición directa de su base de datos DB2 interna presenta un alto riesgo operativo y costos de licenciamiento prohibitivos.

No obstante, la operación omnicanal (ventas en Web Store, App Móvil y Call Center) requiere que cada quetzal facturado sea debidamente conciliado y registrado en el ERP AS/400 para auditoría fiscal, contabilidad general y balances corporativos.

---

## 2. Decisión Arquitectónica

Se implementa el patrón **Anti-Corruption Layer (Capa Anticorrupción - ACL)** mediante un adaptador desatendido tipo Batch programado en el microservicio facturacion-service:

1. **Desacople Absoluto:** El flujo transaccional en tiempo real de los clientes (compra, reserva y cobro) no interactúa jamás de forma síncrona con el AS/400.
2. **Procesamiento Batch Programado:** Mediante la anotación @Scheduled(cron = "${app.erp.export-cron:0 */30 * * * *}") de Spring Boot, se dispara un proceso periódico cada 30 minutos.
3. **Generación de Archivos Estructurados (CSV):** El adaptador extrae el resumen de las ventas confirmadas y facturadas, transformando los modelos de dominio modernos a la estructura fija plana exigida por los programas RPG/CL del AS/400.
4. **Almacenamiento en Volumen Compartido:** Los archivos generados se depositan en el directorio montado /app/uploads (volumen Docker facturas_data), con nomenclatura estandarizada resumen_erp_yyyyMMdd_HHmm.csv.
5. **Ingesta Automática en AS/400:** El motor de transferencia de archivos existente de MegaStore monitorea dicho volumen mediante un daemon SFTP/SMB y ejecuta el comando de carga CPYFRMIMPF hacia los archivos físicos del AS/400 sin intervención humana.

---

## 3. Opciones Consideradas y Descartadas

### Opción A: Modificación directa de programas RPG/DB2 en AS/400
- **Motivo de rechazo:** Violación explícita de las restricciones de la Junta Directiva. Riesgo inaceptable de indisponibilidad contable y costo elevado de consultoría externa especializada en AS/400.

### Opción B: Conexión JDBC directa en tiempo real a DB2/400
- **Motivo de rechazo:** Cada transacción de compra intentaría abrir sockets hacia el mainframe. Ante latencias de red o bloqueos de tabla en el AS/400, el checkout de MegaStore se congelaría, destruyendo el atributo de calidad de disponibilidad en Black Friday.

### Opción C: Integración Batch mediante Capa Anticorrupción (Opción Seleccionada)
- **Ventajas:**
  - Cumplimiento estricto del enunciado y directrices de la Fase 1.
  - Aislamiento total de fallos: si el AS/400 o la red interna están caídos, las ventas continúan sin interrupción.
  - Trazabilidad auditable mediante archivos físicos inmutables en disco.

---

## 4. Consecuencias

### Positivas
- **Cero Riesgo de Regresión Legacy:** El ERP AS/400 continúa operando exactamente como lo ha hecho durante 30 años.
- **Rendimiento Omnicanal:** Las ventas del sitio web y app móvil se confirman en milisegundos sin esperar al ERP.
- **Auditoría Fiscal:** Todos los archivos CSV depositados en el volumen persisten de forma inmutable para revisiones de Finanzas.

### Negativas / Compensaciones Aceptadas
- **Latencia de Conciliación (Eventual Consistency):** El ERP AS/400 tiene un desfase de hasta 30 minutos respecto a las ventas del mundo online. Esta ventana fue formalmente aceptada por la Dirección de Finanzas para el MVP.

---

## 5. Verificación y Evidencia en Código

- **Clase Adaptador:** com.megastore.facturacion.FacturacionService (exportarResumenErpAS400()).
- **Configuración Cron:** fase2/facturacion-service/src/main/resources/application.yml (app.erp.export-cron).
- **Volumen Orquestador:** fase2/docker-compose.yml (facturas_data:/app/uploads).
