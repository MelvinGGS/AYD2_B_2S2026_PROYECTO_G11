# Justificación de Decisiones Arquitectónicas (DDA)

El diseño de la arquitectura para el Sistema de Gestión de Órdenes y Logística Omnicanal (SGO-Logic) responde directamente a las necesidades críticas del negocio de MegaStore, enfocándose en la resiliencia operativa, la trazabilidad fiscal y la escalabilidad ante eventos de alta demanda. A continuación, se detallan las decisiones fundamentales que dan forma a esta arquitectura.

## 1. Estilo Arquitectónico y Comunicación (SOA + EDA)
Para resolver la necesidad de un sistema escalable y mantenible (soportando una carga 8x en el próximo Black Friday), se adoptó una **Arquitectura Orientada a Servicios (SOA) Modular combinada con un enfoque Event-Driven (EDA)**. 
- **Decisión**: La solución se divide en 6 servicios de dominio autónomos que se comunican de forma asíncrona mediante un bus de eventos (**RabbitMQ**) y síncrona mediante REST para consultas. Se descartaron los microservicios puros debido a la complejidad operativa y el costo de infraestructura (Kubernetes), lo cual excedería las capacidades actuales del equipo interno y el OPEX permitido de $1,200/mes.
- **Consecuencias**: Esto permite escalar individualmente los servicios críticos (Órdenes, Pagos) aislando fallos, garantizando una curva de adopción rápida para el equipo existente que ya domina Java y .NET. 

## 2. Resiliencia en Integraciones Críticas
MegaStore depende de proveedores externos (PayKlik para pagos, LogiExpress para logística y la SAT para facturación) que presentan inestabilidades comprobadas o tiempos de respuesta variables.
- **Decisión**: Se implementó el patrón **Circuit Breaker** (con Resilience4j) y **reintentos asíncronos mediante RabbitMQ con Dead Letter Queues (DLQ)**. Específicamente, en lugar de bloquear el flujo cuando un proveedor falla, los intentos se encolan.
- **Alternativas descartadas**: Realizar llamadas síncronas sin tolerancia a fallos habría provocado pérdida de ventas y cuellos de botella (como ocurrió previamente con los $150,000 en pérdidas). Tampoco era posible cambiar de proveedores debido a contratos vigentes.
- **Consecuencias**: Las órdenes de los clientes nunca se pierden; si la pasarela cae, se procesan en segundo plano al recuperarse el servicio. La facturación electrónica se maneja de forma totalmente asíncrona, desvinculando la confirmación de la orden de los tiempos de respuesta de la SAT.

## 3. Trazabilidad y Auditoría Fiscal Estricta
Ante el riesgo regulatorio y el poder de veto de la Directora de Finanzas, el sistema debía garantizar una auditoría inquebrantable.
- **Decisión**: Se aplicó el patrón **Event Sourcing** en los módulos de Órdenes y Facturación. Cada cambio de estado, compra o modificación se almacena como un evento inmutable en PostgreSQL. Estos eventos se indexan en un stack ELK.
- **Alternativas descartadas**: Un registro de logs tradicional o tablas de auditoría con *triggers* no ofrecían la riqueza contextual, la inmutabilidad garantizada ni la velocidad de recuperación de datos requerida (< 1 segundo).
- **Consecuencias**: Cumplimiento absoluto ante auditorías de la SAT, logrando reconstruir el historial transaccional instantáneamente, a costa de un incremento en la capacidad de almacenamiento requerida (asumible dada la elección de bases de datos open-source).

## 4. Convivencia con Sistemas Legacy (ERP y POS)
Una restricción estricta de Gerencia fue la prohibición de modificar o reemplazar los sistemas ERP-Core (AS/400) y los POS de las tiendas.
- **Decisión**: Se desarrollaron adaptadores que funcionan como **Anti-Corruption Layers (ACL)**. Para el ERP, un componente batch consolida las ventas omnicanal y genera archivos CSV/XML cada 30 minutos. Para el POS, un job automatizado lee los archivos locales de inventario cada 5 minutos sin interferir con la operativa original de la tienda.
- **Consecuencias**: Cero impacto en los sistemas críticos heredados, mitigando riesgos organizacionales. La contraparte aceptada es un retraso de hasta 30 minutos en la conciliación final y de 5 minutos en la visibilidad del inventario de piso.

## 5. Rendimiento en Consultas e Inventario Unificado
Para brindar una experiencia omnicanal donde los clientes puedan verificar su orden en menos de 5 segundos, y el personal evitar llamadas telefónicas por quiebres de stock:
- **Decisión**: Se implementó el patrón **CQRS** (Command Query Responsibility Segregation) en el servicio de órdenes, usando vistas materializadas para lectura, y un control de inventario unificado mediante locks optimistas y **Time-To-Live (TTL)** de 15 minutos en las reservas.
- **Consecuencias**: Evita la doble venta de unidades, unifica el carrito en un datastore ultrarrápido (Redis) y separa el estrés de la alta concurrencia de lecturas del flujo crítico de transacciones de compra.

## 6. Despliegue y Eficiencia de Infraestructura
- **Decisión**: Despliegue inicial on-premises utilizando **Docker Compose**. Los servicios corren en contenedores replicables (`--scale`), apoyados por bases de datos con *streaming replication* para cumplir con un RTO ≤ 2h y RPO ≤ 5 min.
- **Consecuencias**: Maximiza la rentabilidad manteniéndose por debajo de los límites de OPEX ($1,200/mes) y CAPEX ($150k), preparando la infraestructura para una migración limpia hacia la nube (Cloud Run/ECS) en el futuro, sin requerir reescritura de aplicaciones ni altos consumos energéticos (VMs tradicionales).

---
### Valor de Negocio y Conclusión
Estas decisiones arquitectónicas no son arbitrarias; responden directamente a los catalizadores financieros y operativos de MegaStore. Al adoptar un bus de eventos y Circuit Breakers, **se blindan los ingresos** de la compañía, evitando repetir la pérdida de $150,000 provocada por caídas externas. El uso de Event Sourcing y adaptadores no intrusivos elimina la fricción con la gerencia y satisface las **estrictas exigencias fiscales** que condicionan la viabilidad del proyecto. Todo esto, orquestado bajo un stack open-source y Docker Compose, garantiza la preparación inmediata para el Black Friday dentro del presupuesto estipulado, ofreciendo un sistema resiliente, escalable y, sobre todo, gobernable por el equipo interno.
