# Listado de Stakeholders y Preocupaciones Arquitectónicas

Un stakeholder es cualquier persona, grupo u organización con interés en el sistema, ya sea porque lo usa, lo financia, lo regula o se ve afectado por él. Sus preocupaciones determinan directamente los drivers arquitectónicos del sistema.

---

## Tabla de Stakeholders

| ID | Stakeholder | Cargo / Rol | Preocupación Principal | Impacto en la Arquitectura |
|----|-------------|-------------|----------------------|---------------------------|
| SH-01 | **Dirección / Gerencia General** | Gobernanza estratégica y toma de decisiones | No modificar ni reemplazar ERP-Core ni los POS. Maximizar el retorno de la inversión. | Restricción absoluta: todos los sistemas legacy se integran mediante adaptadores sin tocarlos. Presupuesto CAPEX $150k, OPEX <= $1,200/mes. |
| SH-02 | **Carlos Méndez** | Gerente de Tecnología de la Información | Garantizar la continuidad del negocio en Black Friday (8x demanda). Que el equipo interno pueda operar y mantener la solución. Monitoreo constante de los sistemas externos. "Si el sistema explota en el próximo Black Friday, mi puesto está en riesgo." | Stack tecnológico Java/.NET ya conocido por el equipo. Docker Compose en vez de Kubernetes. Prometheus + Grafana para observabilidad. |
| SH-03 | **Ana Lucía Fuentes** | Directora de Finanzas (**poder de veto**) | Trazabilidad total: reconstruir quién ejecutó cada operación, cuándo ocurrió y qué cambios se realizaron. Recuperar evidencia de cualquier transacción en menos de 1 segundo. Cumplimiento fiscal con la SAT. Sincronización confiable con el ERP. | Event Sourcing en Órdenes y Facturación. ELK Stack para búsqueda < 1 s. Adaptador batch CSV/XML al ERP cada 30 min. |
| SH-04 | **Roberto Quezada** | Jefe de Logística | Reducir los errores de despacho en un 70% (actualmente cada envío incorrecto cuesta $25 en logística inversa). Visibilidad oportuna de qué pedidos preparar, desde qué ubicación y a quién entregar. Inventario en tiempo real. | Servicio de Inventario unificado (2 CDs + 32 tiendas). Servicio de Logística con fulfillment flexible. Sincronización de stock desde POS cada 5 min. |
| SH-05 | **Directora de Comercialización** | Dirección Comercial | Que el cliente pueda comprar desde cualquier canal con la misma experiencia. Carrito unificado. "Nuestro cliente compra desde el celular a las 10 pm, desde la tienda a las 3 pm, o llama a las 8 am. La experiencia debe ser la misma. No podemos tener silos." | API Gateway (Kong) como punto de entrada único. Carrito en Redis asociado al ID del cliente, no al canal ni al dispositivo. |
| SH-06 | **Jefe de Operaciones** | Operaciones | Evitar repetir la pérdida de $150,000 en ventas durante los 45 minutos de caída de PayKlik en el último Black Friday. Poder procesar pagos sin que una falla del proveedor paralice el negocio. | Circuit Breaker en el Servicio de Pagos + cola de pagos en RabbitMQ. Cada intento de cobro queda auditado. |
| SH-07 | **Cliente Final** | Usuario del sistema | Consultar el estado de su orden desde cualquier dispositivo en menos de 5 segundos. Recibir notificaciones sobre el estado de su compra. Poder pagar con distintos métodos. Experiencia omnicanal sin interrupciones. | CQRS para consultas rápidas (< 5 s). Notificaciones fire-and-forget. Módulo de Identidad/Cliente para reconocerlo en todos los canales. |
| SH-08 | **Empleado de Tienda / POS** | Usuario operativo | Registrar ventas presenciales sin interrumpir la operativa actual. Recibir actualizaciones de inventario desde SGO-Logic. | El POS no se modifica. SGO-Logic lee archivos de stock del POS cada 5 min mediante un adaptador batch. |
| SH-09 | **Agente de Call Center** | Usuario operativo | Consultar el historial completo de compras, devoluciones e incidencias de cualquier cliente para dar atención oportuna (actualmente las devoluciones tardan hasta 7 días hábiles). | Módulo de Identidad/Cliente con historial consolidado en el Servicio de Órdenes. |
| SH-10 | **SAT (Superintendencia de Administración Tributaria)** | Regulador externo | Recibir facturas electrónicas en XML con CUI y serie autorizada antes de finalizar cada orden. Posibilidad de reconstruir cualquier transacción durante auditorías anuales. | Servicio de Facturación asíncrono con cola + retry. Event Sourcing para auditoría inmutable. |

---

## Mapa de Intereses Contrapuestos

Los siguientes pares de stakeholders tienen intereses que pueden generar tensión en las decisiones arquitectónicas:

| Tensión | Stakeholder A | Stakeholder B | Resolución Arquitectónica |
|---------|--------------|--------------|--------------------------|
| Velocidad vs. Trazabilidad | SH-06 (quiere confirmar ventas rápido) | SH-03 (quiere registrar todo antes de confirmar) | Facturación asíncrona: la orden se confirma al pagar, la factura se emite en background vía cola. |
| Flexibilidad vs. Estabilidad | SH-05 (quiere nuevas funcionalidades omnicanal) | SH-02 (no quiere tocar sistemas que funcionan) | Adaptadores (ACL) que integran lo nuevo con lo legacy sin modificar nada. |
| Disponibilidad vs. Consistencia | SH-07 (quiere que siempre funcione) | SH-03 (quiere datos exactos) | Cola de pagos con reintentos: el cliente no pierde la orden, Finanzas obtiene el registro completo cuando el proveedor vuelve. |
