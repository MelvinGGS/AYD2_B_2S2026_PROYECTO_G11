# Matrices de Trazabilidad Arquitectónica

Estas matrices garantizan que cada decisión técnica tomada en el diseño de SGO-Logic tenga un respaldo en las necesidades del negocio y los requerimientos de los stakeholders.

## 1. Matriz: Stakeholder → Preocupación → Driver

| Stakeholder | Preocupación | Drivers que la atienden |
|-------------|-------------|----------------------|
| **Dirección / Gerencia General** | No tocar ERP-Core ni POS, rentabilidad del proyecto, presupuesto acotado. | RC-01, RC-02, RC-04 |
| **Carlos Méndez (Gerente TI)** | Continuidad en picos (Black Friday), mantenibilidad por equipo interno, monitoreo de externos. | QA-01, QA-09, RF-10 |
| **Ana Lucía Fuentes (Dir. Finanzas)** | Trazabilidad fiscal, cumplimiento SAT, evidencia de transacción inmediata, conciliación ERP. | QA-04, QA-07, RC-05, RF-06, RF-12 |
| **Roberto Quezada (Jefe Logística)** | Reducción de errores logísticos (70%), visibilidad de inventario y pedidos en tiempo real. | RF-08, RF-09, QA-05 |
| **Directora de Comercialización** | Experiencia consistente, sin silos entre canales, carrito unificado. | RF-01, RF-02, RF-13 |
| **Jefe de Operaciones** | Evitar pérdidas de ingresos por caídas (PayKlik), soporte a demanda 8×. | QA-02, QA-01, RF-04 |
| **Cliente final** | Consultas rápidas (< 5 s), notificaciones de estado, compra fluida en cualquier canal. | QA-03, RF-10, RF-11, RF-01 |
| **SAT (Regulador)** | Obligatoriedad de factura XML con CUI/Serie, auditorías confiables. | RC-05, QA-07, RF-05 |

---

## 2. Matriz: Driver → Decisión Arquitectónica (ADR) → Vista del DDA

| Driver | Decisión (ADR que lo atiende) | Diagrama/Vista donde se refleja |
|--------|------------------------------|--------------------------------|
| **QA-01** (Escalabilidad 8×) | ADR-001 (SOA), ADR-006 (Docker Compose --scale) | Vista de Despliegue (réplicas ×N), Vista de Bloques |
| **QA-02** (Disponibilidad pagos) | ADR-003 (Circuit Breaker + Cola de RabbitMQ) | Vista de Componentes (CB en adaptador), Despliegue (colas durables) |
| **QA-03** (Rendimiento < 5 s) | ADR-009 (CQRS con vistas materializadas) | Vista de Componentes (separación Lectura/Escritura en Órdenes) |
| **QA-04** (Evidencia auditoría < 1s) | ADR-005 (Event Sourcing) | Vista de Componentes (Event Store DB), Despliegue (Stack ELK) |
| **QA-05** (Resiliencia Logística) | ADR-003 (Circuit Breaker y Retry en Logística) | Vista de Componentes (Adaptador LogiExpress con CB y Retry) |
| **QA-06** (Resiliencia Notificaciones) | ADR-010 (Eventos Fire-and-forget) | Vista de Componentes (Consumer desacoplado en Notificaciones) |
| **QA-07** (Auditabilidad SAT) | ADR-005 (Event Sourcing) | Vista de Componentes (JSONB en PostgreSQL), Despliegue (ELK) |
| **QA-08** (Interoperabilidad sin modificar) | ADR-004 (ACL ERP), ADR-008 (ACL POS) | Diagrama de Contexto, Vista de Componentes (Adaptadores Anti-Corruption) |
| **QA-09** (Mantenibilidad TI interno) | ADR-001 (SOA), ADR-002 (RabbitMQ), ADR-006 (Docker) | Vista de Bloques (6 servicios, stack .NET/Java), Despliegue |
| **QA-10** (Portabilidad a Nube) | ADR-006 (Contenedores) | Vista de Despliegue (Abstracción en contenedores Docker) |
| **RC-01** (Restricción ERP) | ADR-004 (Adaptador batch CSV/XML) | Diagrama de Contexto (flechas batch), Vista de Componentes |
| **RC-02** (Restricción POS) | ADR-008 (Lector batch cada 5 min) | Diagrama de Contexto, Vista de Componentes (Servicio Inventario) |
| **RC-03** (Contratos vigentes externos) | ADR-003 (Circuit Breaker a externos) | Vista de Componentes, Diagrama de Contexto |
| **RC-04** (Restricción Presupuesto) | ADR-001, ADR-002, ADR-006 (Open Source) | Vista de Despliegue (Servidores on-prem, Stack libre) |
| **RC-05** (Restricción SAT) | ADR-005, ADR-007 (Facturación asíncrona) | Vista de Componentes (Adaptador SAT + Retry), Despliegue (DLQ) |
| **RC-06** (No almacenar PAN/CVV) | ADR-003 (Manejo delegado a pasarela) | Vista de Componentes (Servicio de Pagos) |
| **RC-07** (Despliegue inicial on-prem) | ADR-006 (Docker Compose) | Vista de Despliegue |
| **RC-08** (UML 2.5.1) | Directriz del DDA general | Todos los diagramas del documento |
| **RC-09** (Black Friday inamovible) | Cronograma iterativo | Documento de gestión / Entregables por sprint |
| **RC-10** (Consumo energético minimizado) | ADR-006 (Contenedores vs VMs) | Vista de Despliegue |
| **RC-11** (Protección de datos y cifrado) | Restricción general de seguridad | Vista de Despliegue (Conexiones HTTPS/TLS implícitas) |
| **RF-01** (Compra Omnicanal) | ADR-001 (SOA + API Gateway) | Diagrama de Contexto, Vista de Bloques (API Gateway único) |
| **RF-02** (Carrito unificado) | ADR-001 (SOA - Módulo Identidad Cliente) | Vista de Componentes (Servicio Órdenes + Redis) |
| **RF-03** (Reserva inventario TTL) | Estándar de diseño del Servicio de Inventario | Vista de Componentes (Servicio de Inventario) |
| **RF-04** (Pagos Multi-método) | ADR-003 (Circuit Breaker y Cola) | Vista de Componentes (Servicio Pagos), Despliegue (RabbitMQ) |
| **RF-05** (Facturación Electrónica SAT) | ADR-007 (Asíncrono) | Vista de Componentes (Servicio Facturación) |
| **RF-06** (Trazabilidad completa) | ADR-005 (Event Sourcing) | Vista de Componentes (Event Store DB) |
| **RF-07** (Devoluciones y reembolsos) | Flujo core de negocio orquestado en Órdenes | Vista de Componentes (Servicio Órdenes) |
| **RF-08** (Fulfillment flexible) | Diseño de Servicio Logística | Vista de Componentes (Servicio Logística) |
| **RF-09** (Inventario Unificado) | ADR-008 (Sincronización POS) | Vista de Componentes (Servicio Inventario) |
| **RF-10** (Consulta de estado orden) | ADR-009 (CQRS) | Vista de Componentes (Órdenes) |
| **RF-11** (Notificaciones multi-canal) | ADR-010 (Fire-and-forget) | Vista de Componentes (Notificaciones) |
| **RF-12** (Sincronización ERP) | ADR-004 (ACL ERP) | Vista de Componentes (Facturación) |
| **RF-13** (Historial consolidado) | ADR-001 (Módulo Identidad) | Vista de Componentes (Órdenes) |

---

## 3. Matriz End-to-End: Evidencia de Negocio → Validación Técnica

Esta matriz demuestra el hilo conductor completo, desde el dato puro extraído de la operación comercial hasta cómo será probado y validado en el software construido.

| Evidencia de Negocio (Dato del Caso) | Stakeholder (Quién lo sufre/exige) | Preocupación | Driver (RF/QA/RC) | ADR | Vista / Diagrama | Mecanismo de Validación |
|--------------------------------------|------------------------------------|-------------|-------------------|-----|------------------|-------------------------|
| **Pérdida de $150,000 en 45 min por caída de pasarela** | Jefe de Operaciones | Evitar caídas y órdenes perdidas. Soportar Black Friday. | **QA-02, RF-04** | ADR-003 (CB + Cola) | Componentes, Despliegue | Prueba de inyección de fallos (Simular timeout de PayKlik y validar encolamiento y retry automático). |
| **Crecimiento a 8x ventas en Black Friday** | Carlos Méndez (Gerente TI) | El sistema debe escalar rápido y ser soportado on-premise. | **QA-01, QA-09** | ADR-001 (SOA), ADR-006 (Compose) | Despliegue (Réplicas), Bloques | Pruebas de carga / stress tests simulando demanda 8x para validar latencia < 5s. |
| **Veto por auditoría anual de SAT / Multas fiscales** | Ana Lucía (Finanzas) | Reconstruir cada transacción, quién, cuándo y qué cambió en < 1s. | **QA-04, QA-07, RC-05, RF-06** | ADR-005 (Event Sourcing) | Componentes, Despliegue (ELK) | Auditoría simulada: Búsqueda en Grafana/Kibana de una orden aleatoria validando tiempo de respuesta < 1s. |
| **ERP-Core de 1990 no se reemplazará** | Dirección / Gerencia | Sincronización ineludible con sistema legado sin modificarlo. | **RC-01, RF-12** | ADR-004 (Adaptador ACL Batch) | Contexto, Componentes | Validación de generación de archivos CSV/XML cada 30 min y consumo simulado. |
| **Envíos incorrectos cuestan $25 cada uno** | Roberto Quezada (Logística) | Fulfillment flexible, inventario en tiempo real para evitar doble venta. | **RF-08, RF-09, RF-03** | ADR-008 (POS Sync), ADR-001 | Contexto, Componentes | Prueba End-to-End de compra concurrente de la última unidad disponible (validar que el TTL de 15 min libere el stock y bloquee el 2do cliente). |
| **Silos impiden seguir compra iniciada en otro canal** | Directora Comercial | El carrito debe ser el mismo en cualquier plataforma. | **RF-01, RF-02** | ADR-001 (API Gateway + Redis) | Bloques (Kong + Redis de sesión) | Prueba de usuario cruzada: Iniciar carrito en app, cerrar, abrir en web y completar pago sin perder ítems. |
