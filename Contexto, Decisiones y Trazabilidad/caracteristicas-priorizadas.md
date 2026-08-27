# Características del Sistema Priorizadas (MoSCoW)

A partir del análisis de los Drivers Funcionales (RF), Escenarios de Calidad (QA) y Restricciones (RC), se han sintetizado las funcionalidades del sistema agrupándolas en características de negocio de alto nivel. La priorización sigue el modelo MoSCoW, evaluando Valor de negocio, Riesgo, Urgencia (Black Friday) e Impacto en la arquitectura.

## MUST HAVE (Críticas para el lanzamiento / Primer mes)
Estas características son innegociables. Sin ellas, el negocio corre riesgo financiero o legal inmediato, o el sistema simplemente no cumple con su premisa central.

### 1. Compra Omnicanal con Carrito Unificado
- **Descripción:** Permite a los clientes iniciar, continuar y completar una compra independientemente del canal (Tienda, Web, App Móvil, Call Center), manteniendo un único carrito y perfil de usuario persistente.
- **Criterio de Priorización:** **Valor / Impacto Arquitectónico.** Constituye el core del negocio para eliminar los silos comerciales actuales.
- **Drivers Agrupados:** RF-01, RF-02, RF-10, QA-03.

### 2. Resiliencia y Continuidad de Pagos (Protección Black Friday)
- **Descripción:** Procesamiento de pagos (tarjetas, transferencias) que tolera caídas del proveedor externo (PayKlik). Si la pasarela falla, la orden no se pierde, sino que se encola para procesamiento asíncrono.
- **Criterio de Priorización:** **Urgencia / Riesgo.** Previene directamente la repetición de los $150,000 en pérdidas sufridos en el evento de demanda pasada.
- **Drivers Agrupados:** RF-04, QA-02.

### 3. Trazabilidad Estricta y Auditoría Fiscal SAT
- **Descripción:** Emisión asíncrona de facturación electrónica XML (CUI/Serie) y registro inmutable de cada transacción (quién, cuándo, qué cambió). Posibilidad de consultar evidencia transaccional en menos de 1 segundo.
- **Criterio de Priorización:** **Riesgo Legal / Restricción.** Obligatorio por normativa fiscal (SAT) y exigencia (veto) de la Dirección de Finanzas.
- **Drivers Agrupados:** RF-05, RF-06, RF-12, QA-04, QA-07, RC-05, RC-01.

### 4. Inventario Unificado y Reserva Dinámica
- **Descripción:** Consolidación de existencias entre centros de distribución y las 32 tiendas (vía sincronización batch del POS). Implementación de reserva de inventario temporal (15 minutos) durante la compra para evitar quiebres y ventas duplicadas.
- **Criterio de Priorización:** **Valor / Riesgo.** Vital para reducir los errores de despacho actuales y gestionar la concurrencia masiva (8x) en Black Friday.
- **Drivers Agrupados:** RF-03, RF-09, QA-01, RC-02.

## SHOULD HAVE (Importantes pero no bloqueantes para la salida a producción inicial)
Aportan un gran valor y mejoran la experiencia y operación significativamente, pero el sistema puede operar temporalmente mediante contenciones si hubiera retrasos.

### 5. Fulfillment Flexible y Despacho Resiliente
- **Descripción:** Capacidad de definir y modificar el método de entrega post-compra (pickup, envío desde CD, envío desde tienda). Incluye conexión tolerante a fallos (timeouts) con LogiExpress para generación de guías.
- **Criterio de Priorización:** **Valor Operativo.** Objetivo de Logística para reducir en un 70% los costos de $25 por cada despacho fallido.
- **Drivers Agrupados:** RF-08, QA-05.

### 6. Gestión Integral de Devoluciones y Atención al Cliente
- **Descripción:** Historial consolidado disponible para el call center que vincula la compra original, el método de pago, envío, facturación y generación de reembolsos, reduciendo los 7 días hábiles que toma este proceso actualmente.
- **Criterio de Priorización:** **Valor (Experiencia del Cliente).** Agiliza un proceso manual y doloroso, pero SGO-Logic puede procesar ventas (Must) aunque las devoluciones se gestionen parcialmente a mano al inicio.
- **Drivers Agrupados:** RF-07, RF-13.

## COULD HAVE (Deseables para maduración del producto)
Mejoras que incrementan la calidad del servicio al usuario final, pero cuyo impacto en la operación base de la empresa es bajo si fallan temporalmente.

### 7. Motor de Notificaciones Multicanal Proactivas
- **Descripción:** Envío de alertas automatizadas por SMS, Correo o Push a los clientes respecto al estado de su orden (preparada, en tránsito, entregada, incidencias). Implementado en background.
- **Criterio de Priorización:** **Valor Menor / Impacto Arquitectónico Bajo.** Mejora la percepción del cliente, pero se ejecutará como mecanismo *fire-and-forget* para no entorpecer los servicios base.
- **Drivers Agrupados:** RF-11, QA-06.

## WON'T HAVE (Excluidas del alcance del sistema o para iteraciones futuras)
Decisiones explícitas de no construir o modificar funcionalidades específicas para cumplir las restricciones del proyecto.

### 8. Administración Directa del Catálogo Comercial y Precios
- **Descripción:** Mantenimiento (CRUD) de productos, definición de precios, creación de combos promocionales y planes de financiamiento.
- **Criterio de Priorización:** **Restricción de Alcance.** Como se aclara en el diagnóstico, SGO-Logic funcionará exclusivamente como consumidor de un Catálogo Comercial externo; no lo administrará.

### 9. Sustitución de Sistemas Legacy y Despliegue Inicial Cloud
- **Descripción:** Reemplazo de los ERP-Core (AS/400) o POS de piso, y lanzamiento primario de contenedores en la nube pública (AWS/GCP/Azure).
- **Criterio de Priorización:** **Restricciones de Gerencia y TI.** Vetado expresamente por la Dirección y limitado por el presupuesto operativo (OPEX) máximo de $1,200 mensuales. La infraestructura será on-premise mediante Docker Compose.
- **Drivers Agrupados:** RC-01, RC-02, RC-04, RC-07.
