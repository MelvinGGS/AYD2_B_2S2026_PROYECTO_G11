## Drivers de Calidad (Escenarios de Atributos de Calidad - EAC)

A continuación se presentan los Escenarios de Atributos de Calidad estructurados en seis partes (Fuente, Estímulo, Artefacto, Entorno, Respuesta y Medida de Respuesta). 

### QA-01: Escalabilidad (Picos de Demanda)
*   **Fuente del estímulo:** Usuarios finales (Clientes).
*   **Estímulo:** La concurrencia aumenta repentinamente generando una demanda hasta 8 veces superior a la de un día normal (40,000 órdenes/día).
*   **Artefacto:** Servicios críticos (Órdenes, Pagos) y API Gateway (Kong).
*   **Entorno:** Operación en eventos comerciales extremos (Black Friday).
*   **Respuesta:** El sistema orquesta el escalado horizontal levantando nuevas instancias de los contenedores críticos y el API Gateway balancea el tráfico para evitar sobrecarga.
*   **Medida de respuesta:** El tiempo de respuesta se mantiene en $\le$ 5 segundos bajo la carga 8x sin denegación de servicio.

### QA-02: Disponibilidad y Tolerancia a Fallos (Pagos)
*   **Fuente del estímulo:** Proveedor externo de pasarela de pagos (PayKlik).
*   **Estímulo:** La pasarela presenta latencias superiores a 5 segundos, timeout o caída total (indisponibilidad de hasta 45 minutos).
*   **Artefacto:** Adaptador de PayKlik en el Servicio de Pagos y Message Broker.
*   **Entorno:** Operación en condiciones de alta demanda o falla externa.
*   **Respuesta:** El sistema interrumpe las llamadas al proveedor (abre el circuito), encola las transacciones pendientes de pago de forma persistente y las procesa automáticamente cuando el proveedor se recupera.
*   **Medida de respuesta:** 0 órdenes perdidas por la caída del proveedor; el 100% de los intentos fallidos quedan auditados.

### QA-03: Rendimiento (Consulta de Órdenes)
*   **Fuente del estímulo:** Cliente o Personal de Atención (Call Center).
*   **Estímulo:** Solicita consultar el estado actualizado o el historial de una orden.
*   **Artefacto:** Módulo de consultas del Servicio de Órdenes (Base de datos).
*   **Entorno:** Operación bajo concurrencia normal y picos de tráfico.
*   **Respuesta:** El sistema elude la carga de los componentes transaccionales leyendo directamente desde una vista materializada optimizada (patrón CQRS).
*   **Medida de respuesta:** La información se presenta en la interfaz en menos de 5 segundos desde cualquier dispositivo.

### QA-04: Rendimiento y Auditabilidad (Búsqueda Financiera)
*   **Fuente del estímulo:** Directora de Finanzas.
*   **Estímulo:** Ejecuta una búsqueda para recuperar la evidencia y trazabilidad de una transacción específica.
*   **Artefacto:** Base de datos inmutable de eventos y motor de indexación (ELK Stack).
*   **Entorno:** Operación normal durante actividades de conciliación o cierre mensual.
*   **Respuesta:** El sistema procesa la consulta cruzando el identificador del cliente o de la orden a través del registro centralizado de logs y eventos inmutables.
*   **Medida de respuesta:** La evidencia completa (quién, cuándo y qué cambió) se recupera en menos de 1 segundo.

### QA-05: Resiliencia (Despacho Logístico)
*   **Fuente del estímulo:** Proveedor logístico (LogiExpress).
*   **Estímulo:** La API del proveedor devuelve errores de "Timeout" al intentar generar una guía de envío.
*   **Artefacto:** Adaptador de LogiExpress en el Servicio de Logística.
*   **Entorno:** Operación continua (se presenta en 2% de las solicitudes).
*   **Respuesta:** El sistema reintenta la comunicación aplicando un retroceso exponencial (backoff). Si falla definitivamente, traslada el mensaje a una cola de mensajes muertos (DLQ) para intervención.
*   **Medida de respuesta:** 0 guías perdidas; se ejecutan un máximo de 3 reintentos automáticos antes de requerir acción manual.

### QA-06: Resiliencia (Notificaciones)
*   **Fuente del estímulo:** Proveedor externo de SMS y correos.
*   **Estímulo:** El proveedor de notificaciones se encuentra inaccesible.
*   **Artefacto:** Servicio de Notificaciones y Bus de Eventos.
*   **Entorno:** Operación continua.
*   **Respuesta:** El flujo principal de SGO-Logic continúa sin interrupciones. Las notificaciones fallidas se retienen en el broker para envío diferido.
*   **Medida de respuesta:** 0 ventas afectadas o bloqueadas debido a fallas en el envío de notificaciones.

### QA-07: Auditabilidad y Cumplimiento (SAT)
*   **Fuente del estímulo:** Entidad reguladora (SAT).
*   **Estímulo:** Requiere la reconstrucción de las operaciones realizadas en una ventana de tiempo durante una auditoría anual.
*   **Artefacto:** Repositorios de datos del Servicio de Facturación y Órdenes.
*   **Entorno:** Auditoría externa en operación normal.
*   **Respuesta:** El sistema extrae el historial basado en la técnica de almacenamiento de eventos (Event Sourcing) asegurando que no se han alterado registros pasados.
*   **Medida de respuesta:** 100% de las transacciones son reconstruibles, manteniendo el CUI y serie autorizada.

### QA-08: Interoperabilidad
*   **Fuente del estímulo:** Restricción de Gobernanza / Junta Directiva.
*   **Estímulo:** Necesidad de sincronizar SGO-Logic con sistemas Legacy (AS/400 y 32 instancias POS).
*   **Artefacto:** Capa Anticorrupción (Adaptadores batch/CSV/XML).
*   **Entorno:** Despliegue e integración en infraestructura de TI existente.
*   **Respuesta:** SGO-Logic consume e inyecta archivos en los intervalos de tiempo definidos a través de los adaptadores sin invadir la lógica de los sistemas Legacy.
*   **Medida de respuesta:** 0 modificaciones a los sistemas ERP-Core y POS actuales.

### QA-09: Mantenibilidad
*   **Fuente del estímulo:** Gerencia de TI.
*   **Estímulo:** Pase a producción y transferencia operativa al equipo interno.
*   **Artefacto:** Repositorio de código y scripts de infraestructura.
*   **Entorno:** Fase de adopción tecnológica y mantenimiento evolutivo.
*   **Respuesta:** La arquitectura se diseña en un stack tecnológico ya dominado por el personal (Java, .NET, Docker básico) evitando orquestadores hiper-complejos (ej. Kubernetes).
*   **Medida de respuesta:** El equipo interno es capaz de operar y mantener la solución de forma autónoma, sin requerir presupuesto de consultoría o capacitación externa.

### QA-10: Portabilidad
*   **Fuente del estímulo:** Crecimiento esperado de la operación comercial.
*   **Estímulo:** Decisión de migrar la infraestructura local hacia un entorno Cloud para absorber la expansión regional.
*   **Artefacto:** Contenedores de software (Imágenes Docker).
*   **Entorno:** Transición planificada futura.
*   **Respuesta:** Los servicios se empaquetan de forma agnóstica a la infraestructura subyacente.
*   **Medida de respuesta:** La migración a servicios gestionados en la nube (ej. Cloud Run/ECS) requiere 0 reescritura del código fuente de los microservicios.

---


