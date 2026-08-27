# Documento de Definición de Arquitectura (DDA)

# Identificación del caso de negocio

## 1.1 ¿Quién es MegaStore y Por Qué Necesita Este Sistema?

MegaStore es una cadena de tiendas que vende productos en tres países: Guatemala, El Salvador y Costa Rica. Tiene **32 tiendas físicas** distribuidas en esas ubicaciones y vende aproximadamente **USD $450 millones al año**.

Actualmente, MegaStore permite que sus clientes compren de varias maneras:
- **En la tienda física**: Yendo directamente a cualquiera de sus 32 sucursales
- **Por internet**: A través de un sitio web
- **Por teléfono**: Llamando a un call center para que un agente tome la orden
- **Por aplicación móvil**: Usando una app en el celular

**El problema**: Cada uno de estos canales de venta funciona de forma separada. No se comunican entre sí. Esto causa problemas como:

- **Inventario desincronizado**: Si un cliente ve un producto disponible en la web, podría llegar a la tienda y no estar disponible
- **Información incompleta**: No hay un historial unificado de todas las compras de un cliente en los diferentes canales
- **Procesos manuales**: Las facturas se generan manualmente (lo que es lento y propenso a errores)
- **Sin rastreo**: Los clientes no saben dónde está su paquete cuando lo envían
- **Falta de coordina**: La logística, finanzas y tiendas no se comunican automáticamente

---

### 1.2 La Solución: SGO-Logic

**SGO-Logic** (Sistema de Gestión de Órdenes y Logística Omnicanal) es el nuevo sistema que MegaStore necesita para conectar todos estos canales de venta en uno solo.

¿Qué significa "omnicanal"? Simplemente que el cliente puede **comprar de cualquier forma** (tienda, web, app, teléfono) y el sistema lo **maneja como si fuera una sola tienda** centralizada.

**Principales beneficios de SGO-Logic:**

1. **Inventario unificado**: Todas las tiendas ve el mismo inventario en tiempo real
2. **Una sola orden**: No importa dónde compre el cliente, su orden se registra en un único lugar
3. **Pagos seguros**: Sistema automático que valida pagos sin errores
4. **Facturas automáticas**: Se generan electrónicamente (conforme a la ley de Guatemala)
5. **Entregas rastreables**: El cliente sabe exactamente dónde está su paquete
6. **Devoluciones fáciles**: El proceso de devoluciones es automático y sin papeleos
7. **Atención integrada**: El call center puede ver todo el historial del cliente
8. **Contabilidad automática**: Los datos de ventas se sincronizan automáticamente con el sistema contable

---

## 2. Visión General: Los 8 Procesos Principales

Pensemos en SGO-Logic como un "director" que coordina 8 procesos principales de negocio:

<div align="center">

![CUN - Alto Nivel](CDU_NYS/imagCDU/cdu_altonivel.png)

**Figura 0**: Los 8 procesos principales de SGO-Logic y sus actores

</div>

### 2.1 Los 8 Procesos Explicados en Simple

**1. Gestionar Compra Omnicanal**
- El cliente puede comprar desde cualquier lugar (tienda, web, app, teléfono)
- Agrega productos al carrito, elige cómo pagar y dónde recibir
- Todo se registra en una sola orden unificada

**2. Gestionar Inventario Unificado**
- Las 32 tiendas comparten un mismo inventario
- Cuando vende un producto en la web, automáticamente las tiendas lo ven
- El cliente siempre ve la disponibilidad correcta

**3. Procesar Pagos**
- El cliente elige cómo pagar (tarjeta, transferencia, billetera digital)
- El sistema valida y autoriza el pago automáticamente
- Si falla, lo reintenta automáticamente

**4. Emitir Facturación**
- Se genera automáticamente una factura electrónica XML
- Se envía a la SAT (organismo tributario) automáticamente
- El cliente recibe su factura por email

**5. Gestionar Despacho y Entrega**
- El sistema decide de dónde enviar (desde qué tienda o centro de distribución)
- Genera automáticamente la guía de envío con LogiExpress (empresa de envíos)
- El cliente recibe un enlace para rastrear su paquete

**6. Gestionar Devoluciones y Reembolsos**
- El cliente puede devolver un producto dentro de 30 días
- El sistema valida automáticamente si es válida
- El dinero se devuelve automáticamente a la tarjeta del cliente

**7. Atender al Cliente**
- Los agentes del call center pueden crear órdenes, consultar estado, procesar devoluciones
- Todos pueden ver el historial completo del cliente
- Se registra cada interacción para consulta futura

**8. Conciliar Ventas con ERP**
- Cada 30 minutos, el sistema envía automáticamente todos los datos de ventas al sistema contable (AS/400)
- Esto mantiene la contabilidad siempre actualizada
- No hay que hacer nada manual

---

## 3. Cómo Se Relacionan Estos 8 Procesos

Imaginemos que un cliente realiza una compra. Aquí es lo que sucede:

<div align="center">

![Releación Procesos](CDU_NYS/imagCDU/relacionCDU.png)

**Figura RL**: la relación de los 8 procesos.

</div>

---

## 4. Quiénes Usan Este Sistema

SGO-Logic tiene diferentes usuarios, cada uno con un rol específico:

**Cliente (El que compra)**
- Puede comprar desde web, app, tienda o teléfono
- Ve su inventario disponible
- Rastrear su pedido
- Solicitar devoluciones

**Vendedor de Tienda**
- Ayuda a clientes a comprar en la tienda física
- Usa la caja registradora (POS) conectada al sistema

**Agente de Call Center**
- Atiende llamadas de clientes
- Puede crear órdenes, consultar estado, procesar devoluciones
- Ve todo el historial del cliente

**Área de Logística**
- Prepara y empaca los pedidos
- Genera guías de envío
- Rastrean entregas

**Dirección de Finanzas**
- Ve reportes de ventas
- Verifica que las facturas se enviaron a la SAT
- Revisa la conciliación con el sistema contable

**Gerencia**
- Ve reportes de inventario
- Analiza qué productos se venden más
- Toma decisiones basada en datos

---

## 5. Primera Descomposición: De CUN (Procesos de Negocio) a CDU (Casos de Uso del Sistema)

<div align="center">
 
![Primera Descomposición](CDU_NYS/imagCDU/PrimeraDescom.png)

**Figura PD**: Diagrama de descomposición mostrando los 4 niveles (Sistema -> Procesos -> Componentes -> Casos de Uso)

</div>

### 5.1 ¿Qué Es la Descomposición?
 
Cuando planteamos un proceso de negocio (como "Gestionar Compra Omnicanal"), ese proceso es muy general. 
 
La **descomposición** es pasar de ese proceso general a especificar **exactamente qué debe hacer el sistema paso a paso**.
 
**Ejemplo:**
- **CUN (General)**: "Gestionar Compra Omnicanal"
- **CDU (Detallado)**: "El sistema debe permitir que un cliente identifique su usuario, agregue productos al carrito, valide disponibilidad, cree una orden, seleccione método de pago, elija modalidad de entrega y confirme la compra"
### 5.2 Tabla de Descomposición: Cómo Cada Proceso Se Divide en Casos de Uso
 
**Cada Proceso de Negocio (CUN) se convierte en un Caso de Uso del Sistema (CDU)**
 
| # | Proceso de Negocio (CUN) | Código | Caso de Uso del Sistema (CDU) | Lo que el Sistema Hace |
|---|--------------------------|--------|-------------------------------|----------------------|
| 1 | Gestionar Compra Omnicanal | CDU-01 | Gestionar Compra Omnicanal | Cliente compra en cualquier canal (web, app, tienda, call center). Sistema unifica todas las compras |
| 2 | Gestionar Inventario Unificado | CDU-02 | Gestionar Inventario Unificado | Sistema sincroniza inventario de 32 tiendas en tiempo real. Cliente siempre ve disponibilidad correcta |
| 3 | Procesar Pagos | CDU-03 | Procesar Pagos | Sistema valida y autoriza pagos (tarjeta, transferencia, billetera). Reintenta automáticamente si falla |
| 4 | Emitir Facturación | CDU-04 | Facturación Electrónica | Sistema genera XML automáticamente, lo envía a SAT y emite comprobante al cliente |
| 5 | Gestionar Despacho y Entrega | CDU-05 | Gestionar Despacho y Entrega | Sistema genera guía de envío, coordina con LogiExpress, cliente puede rastrear su paquete |
| 6 | Gestionar Devoluciones | CDU-06 | Gestionar Devoluciones y Reembolsos | Sistema procesa devoluciones automáticamente, valida condiciones, devuelve dinero al cliente |
| 7 | Atender al Cliente | CDU-07 | Atender al Cliente | Agente de call center puede crear compras, consultar estado, resolver problemas del cliente |
| 8 | Conciliar Ventas con ERP | CDU-08 | Conciliar Ventas con ERP | Sistema envía automáticamente datos de ventas al sistema contable cada 30 minutos |
 
### 5.3 ¿Por Qué Esta Descomposición Es Importante?
 
Esta descomposición garantiza que:
 
**Nada queda sin especificar**: Cada proceso de negocio tiene su definición detallada en el sistema
 
**El equipo de desarrollo sabe qué hacer**: Los programadores tienen especificaciones claras de lo que deben construir
 
**Se puede probar**: Cada caso de uso puede ser probado para verificar que funciona correctamente
 
**Facilita mantenimiento**: Si algo falla, sabes exactamente en qué caso de uso buscar el problema

---

## 6. Los Sistemas Externos Que Se Conectan

SGO-Logic no funciona solo. Se conecta con otros sistemas:

| Sistema Externo | ¿Para qué? | Protocolo |
|-----------------|-----------|----------|
| **PayKlik** | Autorizar pagos con tarjeta | Conexión directa por internet |
| **SAT** | Validar y registrar facturas fiscales | XML por internet |
| **LogiExpress** | Generar guías y rastrear envíos | Conexión por internet |
| **ERP-Core (AS/400)** | Sincronizar datos contables | Archivos CSV cada 30 minutos |
| **Sistemas POS (32 tiendas)** | Sincronizar inventario | Archivos CSV cada hora |


---

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


---

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


---


### Diagramas de Casos de Uso Expandidos (CDU) - SGO-Logic

---
## Requisitos Funcionales

### ¿Qué Son los Requisitos Funcionales?

Los Requisitos Funcionales definen **QUÉ DEBE HACER el sistema**. En SGO-Logic, son las 8 capacidades principales que hacen funcionar todo el negocio.

### Los 8 Requisitos Funcionales

| # | Requisito | Descripción |
|---|-----------|-------------|
| **RF-01** | Gestionar Compra Omnicanal | Permitir compras desde web, app, tienda y call center de forma unificada |
| **RF-02** | Gestionar Inventario Unificado | Sincronizar inventario en tiempo real en las 32 tiendas |
| **RF-03** | Procesar Pagos | Autorizar pagos automáticamente (tarjeta, transferencia, billetera digital) |
| **RF-04** | Emitir Facturación Electrónica | Generar facturas XML y enviarlas a SAT automáticamente |
| **RF-05** | Gestionar Despacho y Entrega | Organizar envíos con LogiExpress y permitir rastreo en tiempo real |
| **RF-06** | Gestionar Devoluciones y Reembolsos | Procesar devoluciones automáticamente y reembolsar dinero |
| **RF-07** | Atender al Cliente | Permitir que call center cree órdenes y resuelva problemas |
| **RF-08** | Conciliar Ventas con ERP | Sincronizar datos de ventas con sistema contable cada 30 minutos |

### Relación: Requisitos Funcionales vs Drivers vs CDU

```
Requisito Funcional (QUÉ)
        |
Driver de Requisito Funcional (Los más críticos)
        |
CDU (Especificación detallada con diagramas y flujos)
```

**Ejemplo:**
- **RF**: "El sistema debe permitir que clientes compren"
- **Driver RF**: "Gestionar Compra Omnicanal es crítico para el negocio"
- **CDU-01**: Especificación con 9 pasos, actores, flujos alternativos, etc.


---
### ¿Qué Son los Drivers de Requisitos Funcionales?

Los **Drivers de Requisitos Funcionales** especifican **QUÉ DEBE HACER el sistema**. Es decir, definen todas las funcionalidades que el sistema SGO-Logic debe tener para satisfacer las necesidades del negocio.

Estos requisitos se expresan mediante **Casos de Uso del Sistema (CDU)**, diagramas y descripciones detalladas que explican paso a paso cómo el sistema interactúa con sus usuarios y sistemas externos.

#### ¿Cuál Es la Diferencia Entre CUN y CDU?

| Aspecto | CUN | CDU |
|--------|-----|-----|
| **Nivel** | Alto nivel, general | Técnico, detallado |
| **Audiencia** | Gerentes, clientes, stakeholders | Desarrolladores, testers, arquitectos |
| **Contenido** | "Qué necesita el negocio" | "Cómo el sistema lo hace" |
| **Ejemplo** | "Gestionar Compra Omnicanal" | "CDU-01: Flujo paso a paso de compra con validaciones" |
| **Detalle** | Mínimo | Completo (flujo, precondiciones, alternativas) |

**Relación:**
```
CUN (Visión de Negocio)
        |
   DESCOMPOSICIÓN
        |
CDU (Especificación Técnica del Sistema)
```

#### ¿Qué Contiene Cada CDU?

Cada Caso de Uso del Sistema está especificado con:

1. **Diagrama UML**: Visualización de actores, sistema y relaciones
2. **Descripción General**: Explicación en palabras simples
3. **Actores Involucrados**: Quiénes interactúan y sus roles
4. **Flujo Principal**: Los pasos que ocurren cuando todo funciona correctamente
5. **Precondiciones**: Qué debe ser verdad ANTES de que comience
6. **Postcondiciones**: Qué cambia DESPUÉS de que termina
7. **Flujos Alternativos**: Qué pasa si falla o el usuario elige otra opción

#### Importancia de los CDU

Los CDU son críticos porque:

**Especificación Clara**: El equipo de desarrollo sabe exactamente qué construir sin ambigüedades

**Pruebas Sistemáticas**: Cada CDU se puede probar para verificar que funciona según lo especificado

**Trazabilidad Completa**: Se puede rastrear cada requisito de negocio hasta su implementación en código

**Comunicación Uniforme**: Desarrolladores, testers, gerentes y stakeholders hablan el mismo idioma

**Mantenimiento Eficiente**: Si algo falla en producción, se sabe exactamente en qué CDU buscar el problema

---

## 1. Introducción

Los Requisitos Funcionales representan todas las capacidades y funcionalidades que el sistema SGO-Logic debe implementar para satisfacer las necesidades del negocio. Estos requisitos se expresan a través de Casos de Uso del Sistema (CDU), que son descripciones detalladas de cómo el sistema interactúa con sus actores (usuarios, sistemas externos) para lograr objetivos específicos.

### 1.1 Propósito de este Documento

Este documento presenta los 8 Casos de Uso principales del sistema SGO-Logic, acompañados de:
- **Diagramas UML**: Representación visual de los actores, casos de uso y relaciones
- **Descripciones textuales**: Explicación detallada del flujo de cada proceso
- **Especificaciones**: Precondiciones, postcondiciones y flujos alternativos

### 1.2 Alcance

El sistema SGO-Logic (Sistema de Gestión de Órdenes y Logística Omnicanal) cubre:
- Gestión integral de compras omnicanal (web, móvil, tienda física, call center)
- Inventario centralizado y sincronizado
- Procesamiento seguro de pagos
- Facturación electrónica automática
- Gestión logística de despachos y entregas
- Atención al cliente integrada
- Conciliación automática con sistemas contables

---

## 2. Diagrama de Casos de Uso de Negocio (CUN) - Visión de Alto Nivel

<div align="center">

### Sistema SGO-Logic: Visión General

![CUN - Alto Nivel](CDU_NYS/imagCDU/cdu_altonivel.png)

**Figura 1**: Diagrama de Casos de Uso de Negocio (CUN) - Descomposición de alto nivel

</div>

### 2.1 Descripción de la Visión de Alto Nivel

El diagrama anterior muestra los 8 procesos de negocio principales que soporta SGO-Logic, sus actores principales y las relaciones básicas entre ellos. Estos procesos representan las operaciones críticas de la cadena retail omnicanal:

| Actor | Procesos Asociados | Responsabilidad |
|-------|-------------------|-----------------|
| **Cliente** | Compra, Inventario, Pagos | Realiza compras y consultas |
| **Operaciones** | Gestionar Compra | Crea órdenes en tienda |
| **Dirección Financiera** | Facturación, Devoluciones, Conciliación | Gestiona aspectos fiscales y financieros |
| **Logística** | Despacho y Entrega | Administra envíos y distribución |
| **Call Center** | Atender Cliente | Soporte y gestión de compras remotas |

---

## 3. Casos de Uso del Sistema (CDU) - Especificaciones Detalladas

---

## CDU-01: Gestionar Compra Omnicanal

<div align="center">

![CDU-01](CDU_NYS/imagCDU/cdu01.png)

**Figura 2**: Diagrama de Caso de Uso CDU-01

</div>

### 3.1.1 Descripción General

Este caso de uso permite a los clientes realizar compras a través de múltiples canales de distribución (en línea, tienda física, aplicación móvil o call center). El sistema SGO-Logic gestiona de manera centralizada todas las compras sin importar el canal de origen, garantizando una experiencia consistente y uniforme para el cliente. El proceso incluye desde la identificación del cliente hasta la confirmación final de la compra y la iniciación del proceso de pago.

### 3.1.2 Actores Involucrados

- **Cliente**: Usuario final que realiza la compra
- **Vendedor de Tienda**: Personal de tienda que asiste en la compra presencial
- **Agente de Call Center**: Representante que asiste compras telefónicas
- **Sistema de Inventario**: Verifica disponibilidad de productos
- **Pasarela de Pagos**: Procesa métodos de pago

### 3.1.3 Flujo Principal (Happy Path)

1. **Identificación de Cliente**: El cliente se identifica en el sistema mediante credenciales o como usuario nuevo
2. **Consulta de Catálogo**: Navega y consulta el catálogo de productos disponibles
3. **Gestión de Carrito**: Agrega productos al carrito unificado (válido en cualquier canal)
4. **Verificación de Disponibilidad**: El sistema consulta el inventario centralizado
5. **Reserva de Inventario**: Los productos se reservan con estado "pendiente"
6. **Creación de Orden**: Se genera número único de orden (OD-XXXXX)
7. **Selección de Método de Pago**: Cliente elige entre tarjeta, transferencia o billetera digital
8. **Selección de Modalidad de Entrega**: Cliente elige entre domicilio, pickup en tienda o despacho desde CD
9. **Confirmación de Compra**: Se genera comprobante y se inicia proceso de pago

### 3.1.4 Precondiciones

- El cliente debe estar registrado o crear perfil en el sistema
- Al menos un producto debe estar disponible en inventario
- El cliente debe aceptar los términos y condiciones
- Debe haber un método de pago válido configurado

### 3.1.5 Postcondiciones

- Número de orden generado y asignado
- Reserva de inventario confirmada (24-48 horas)
- Cliente recibe confirmación por email/SMS
- Se inicia proceso de procesamiento de pago
- Estado de orden = "Pendiente de Pago"

### 3.1.6 Flujos Alternativos

**Alternativa A - Producto No Disponible**
- A1: Si no hay stock de un producto solicitado
- A2: Sistema sugiere productos similares o notifica cuándo estará disponible
- A3: Cliente puede elegir esperar o continuar sin ese producto

**Alternativa B - Pago Rechazado**
- B1: Si la validación de pago falla
- B2: Se notifica al cliente y se permite reintentar con otro método
- B3: Si reintentos fallan, se cancela automáticamente

**Alternativa C - Cliente Cancela**
- C1: Antes de confirmar: se descartan todos los datos
- C2: Después de confirmar: se libera la reserva de inventario inmediatamente

---

## CDU-02: Gestionar Inventario Unificado

<div align="center">

![CDU-02](CDU_NYS/imagCDU/cdu02.png)

**Figura 3**: Diagrama de Caso de Uso CDU-02

</div>

### 3.2.1 Descripción General

Este caso de uso gestiona el inventario centralizado del sistema. Se sincroniza automáticamente con todos los Puntos de Venta (POS) de las 32 tiendas físicas, garantizando que la información de disponibilidad sea uniforme en todos los canales. El sistema mantiene visibilidad completa del stock en tiempo real.

### 3.2.2 Actores Involucrados

- **Cliente**: Consulta disponibilidad de productos
- **Área de Logística**: Gestiona movimientos de inventario
- **Gerencia**: Consulta reportes de inventario
- **Sistema POS**: Sincronización automática de tiendas
- **ERP-Core**: Sistema contable de referencia

### 3.2.3 Flujo Principal

1. Cliente consulta disponibilidad de un producto específico
2. Sistema consulta base de datos centralizada en tiempo real
3. Se obtiene: cantidad disponible, ubicaciones, reservas pendientes
4. Si hay compra: Se realiza reserva (estado "Reservado")
5. Cambios se sincronizan automáticamente a todos los POS (cada 5 minutos)
6. Sistema valida si hay stock mínimo y genera alertas
7. Gerencia recibe reportes automáticos de niveles críticos
8. Se mantiene historial de movimientos para auditoría

### 3.2.4 Precondiciones

- Producto debe estar en catálogo activo
- Conexión funcional entre servidor central y POS de tiendas
- Base de datos central accesible

### 3.2.5 Postcondiciones

- Información de inventario actualizada en tiempo real
- Todos los POS reflejan cambios dentro de 5 minutos
- Movimiento registrado en historial con timestamp
- Alertas generadas si stock ≤ mínimo configurado

### 3.2.6 Flujos Alternativos

**Alternativa A - Producto Agotado**
- A1: Stock llega a cero
- A2: Se marca como "No Disponible" automáticamente en todos los canales
- A3: Se notifica a gerencia y área de compras

**Alternativa B - Discrepancias de Inventario**
- B1: Diferencia entre POS y central detectada
- B2: Se genera reporte de auditoría inmediato
- B3: Se solicita conteo físico en tienda

**Alternativa C - Cancelación de Compra**
- C1: Cliente cancela compra
- C2: Reserva se libera inmediatamente
- C3: Stock se incremente en todos los canales

---

## CDU-03: Procesar Pagos

<div align="center">

![CDU-03](CDU_NYS/imagCDU/cdu03.png)

**Figura 4**: Diagrama de Caso de Uso CDU-03

</div>

### 3.3.1 Descripción General

Este caso de uso gestiona el procesamiento seguro de pagos en múltiples métodos. Integra la pasarela de pagos PayKlik para autorización de tarjetas y soporta transferencias bancarias y billeteras digitales. Incluye mecanismos de resiliencia (encolamiento y reintentos automáticos) para garantizar confiabilidad.

### 3.3.2 Actores Involucrados

- **Cliente**: Selecciona método de pago
- **Sistema de Validación**: Verifica datos
- **PayKlik**: Pasarela de pagos externa
- **Cola de Procesamiento**: Resiliencia (RabbitMQ)
- **Banco**: Confirmación de transferencias

### 3.3.3 Flujo Principal

1. Cliente selecciona método de pago durante checkout
2. Sistema valida formato y datos básicos del pago
3. Según método de pago seleccionado:
   - **Tarjeta**: Se envía a PayKlik con datos encriptados
   - **Transferencia**: Se registra como "Pendiente" en el sistema
   - **Billetera Digital**: Se procesa llamada directa a billetera
4. Pago se encola en sistema de resiliencia
5. Se registra intento en audit log con timestamp
6. Sistema espera respuesta de PayKlik (timeout: 30 segundos)
7. Si es exitoso (status=200): Estado = "Confirmado"
8. Si falla: Estado = "Rechazado"

### 3.3.4 Precondiciones

- Cliente ha completado proceso de checkout
- Datos de pago válidos según formato esperado
- Conexión a PayKlik disponible (si es tarjeta)
- Orden existe en estado "Pendiente de Pago"

### 3.3.5 Postcondiciones

- Intento de pago registrado con ID único
- Comprobante de pago generado
- Estado de orden actualizado
- Si exitoso: Se inicia proceso de facturación y despacho
- Notificación enviada al cliente vía email

### 3.3.6 Flujos Alternativos

**Alternativa A - Tarjeta Rechazada**
- A1: PayKlik devuelve estado "Rechazada"
- A2: Cliente recibe notificación de rechazo
- A3: Se permite reintentar (máximo 3 intentos)
- A4: Cliente puede cambiar a otro método

**Alternativa B - PayKlik No Responde**
- B1: Timeout de 30 segundos sin respuesta
- B2: Pago se encola automáticamente para reintentos
- B3: Se reintentan cada 5 minutos (máximo 5 veces)
- B4: Después de 5 fallos: Se notifica a gerencia

**Alternativa C - Transferencia Bancaria**
- C1: Se registra como "Pendiente Confirmación"
- C2: Sistema espera confirmación del banco
- C3: Cuando se confirma: Estado = "Confirmado"
- C4: Si pasan 24 horas sin confirmar: Se cancela automáticamente

---

## CDU-04: Facturación Electrónica

<div align="center">

![CDU-04](CDU_NYS/imagCDU/cdu04.png)

**Figura 5**: Diagrama de Caso de Uso CDU-04

</div>

### 3.4.1 Descripción General

Genera automáticamente facturas electrónicas en formato XML conforme a estándares fiscales y las envía a la SAT. Sincroniza información con ERP-Core para mantener registros contables actualizados. Cumple con requisitos legales de Guatemala.

### 3.4.2 Flujo Principal

1. Pago confirmado → Sistema genera factura XML automáticamente
2. Se envía a SAT para registro fiscal (integración SOAP/REST)
3. SAT devuelve folio fiscal único si es válida
4. Se registra evento con resultado en audit log
5. Se asocia folio a número de orden original
6. Si es devolución: Se emite Nota de Crédito con referencia
7. Datos se sincronizan a ERP-Core vía interfaz batch CSV
8. Se registra timestamp de sincronización
9. Cliente recibe factura en email y puede descargar PDF

### 3.4.3 Precondiciones

- Pago confirmado (CDU-03 exitoso)
- Datos fiscales válidos en sistema
- Conexión a SAT disponible
- Empresa registrada ante SAT con credenciales activas

### 3.4.4 Postcondiciones

- Folio fiscal único generado por SAT
- Factura visible en historial del cliente
- Datos en ERP actualizados (máximo 1 hora)
- Auditoría completa registrada

### 3.4.5 Flujos Alternativos

**Alternativa A - SAT Rechaza Factura**
- A1: SAT devuelve error de validación
- A2: Sistema reintentas automáticamente cada 10 min (máx. 5 veces)
- A3: Si falla definitivamente: Notifica a Dirección Financiera

**Alternativa B - Nota de Crédito (Devolución)**
- B1: Se emite automáticamente al procesar devolución
- B2: Referencia factura original con folio
- B3: Se envía a SAT como "Anulación" o "Nota de Crédito"

**Alternativa C - Error en ERP**
- C1: Datos no se sincronizan en 1 hora
- C2: Se genera alerta para corrección manual
- C3: Factura sigue siendo válida, pero se requiere ajuste contable

---

## CDU-05: Gestionar Despacho y Entrega

<div align="center">

![CDU-05](CDU_NYS/imagCDU/cdu05.png)

**Figura 6**: Diagrama de Caso de Uso CDU-05

</div>

### 3.5.1 Descripción General

Organiza y controla el despacho de productos desde centro de distribución, tiendas o preparación para pickup. Integra con LogiExpress para logística de envío. Proporciona rastreo en tiempo real al cliente.

### 3.5.2 Flujo Principal

1. Sistema asigna ubicación óptima (CD, tienda local, o pickup)
2. Se genera guía de envío LogiExpress automáticamente
3. Según canal: Despacho desde CD, Tienda o Pickup en tienda
4. Productos se empacan y se escanean
5. LogiExpress recibe envío y lo integra a su sistema
6. Cliente recibe enlace de rastreo en tiempo real
7. Evento de entrega: Cliente recibe notificación
8. Si hay incidencia: Sistema notifica e inicia protocolo
9. Entrega confirmada: Inventario se actualiza final

### 3.5.3 Precondiciones

- Orden confirmada y pagada
- Productos disponibles en ubicación de despacho
- LogiExpress accesible (API funcional)
- Cliente ha seleccionado modalidad de entrega

### 3.5.4 Postcondiciones

- Guía generada con número único
- Cliente tiene acceso a rastreo
- LogiExpress tiene orden integrada
- Inventario actualizado en ubicación receptora

### 3.5.5 Flujos Alternativos

**Alternativa A - Pickup en Tienda**
- A1: Cliente selecciona retiro en tienda
- A2: Se prepara en bodega de tienda específica
- A3: Notificación a cliente cuando esté listo
- A4: Cliente retira en horario de atención

**Alternativa B - Problema en Envío**
- B1: LogiExpress reporta incidencia (daño, dirección incorrecta)
- B2: Sistema notifica a cliente y ofrece opciones
- B3: Reenvío o devolución según caso

**Alternativa C - Cliente Modifica Entrega**
- C1: Antes de despacho: cambio de dirección/tienda permitido
- C2: Sistema actualiza guía automáticamente
- C3: Después de despacho: coordinación con LogiExpress

---

## CDU-06: Gestionar Devoluciones y Reembolsos

<div align="center">

![CDU-06](CDU_NYS/imagCDU/cdu06.png)

**Figura 7**: Diagrama de Caso de Uso CDU-06

</div>

### 3.6.1 Descripción General

Gestiona solicitudes de devolución dentro de plazo permitido (30 días). Valida condiciones, genera etiqueta de retorno LogiExpress, recibe producto e inmediatamente procesa reembolso automático.

### 3.6.2 Flujo Principal

1. Cliente inicia solicitud de devolución en sistema
2. Valida: plazo (máx. 30 días), condiciones (original, sin uso)
3. Se genera número de devolución (DEV-XXXXX)
4. Se crea etiqueta retorno LogiExpress automáticamente
5. Cliente imprime etiqueta y envía producto
6. Logística recibe en bodega y escanea etiqueta
7. Se inspecciona condición física del producto
8. Si cumple: Procesa reembolso a cuenta original
9. Se emite nota de crédito fiscal
10. Actualiza inventario y notifica al cliente

### 3.6.3 Precondiciones

- Orden de compra debe existir en historial
- Dentro de plazo de devolución (≤ 30 días)
- Producto cumple condiciones: original, sin daño
- Cliente tiene acceso a etiqueta de retorno

### 3.6.4 Postcondiciones

- Número de devolución asignado
- Reembolso procesado (1-3 días hábiles)
- Nota de crédito emitida a SAT
- Inventario incrementado
- Cliente recibe confirmación

### 3.6.5 Flujos Alternativos

**Alternativa A - Producto Fuera de Plazo**
- A1: Compra hace más de 30 días
- A2: Sistema rechaza automáticamente
- A3: Se notifica a cliente con opciones de garantía

**Alternativa B - Producto no Cumple Condiciones**
- B1: Inspección detecta daño o uso
- B2: Devolución se rechaza
- B3: Se ofrece opciones de reparación

**Alternativa C - Producto con Defecto**
- C1: Inspección detecta defecto del fabricante
- C2: Se ofrece: Reemplazo nuevo o reembolso
- C3: Cliente elige opción y se procesa

---

## CDU-07: Atender al Cliente

<div align="center">

![CDU-07](CDU_NYS/imagCDU/cdu07.png)

**Figura 8**: Diagrama de Caso de Uso CDU-07

</div>

### 3.7.1 Descripción General

Agente del Call Center ejecuta operaciones en nombre del cliente. Puede crear compras, consultar estado de órdenes, resolver incidencias y procesar devoluciones. Todas las interacciones se registran para historial y calidad.

### 3.7.2 Flujo Principal

1. Agente identifica cliente con teléfono/número de orden
2. Busca historial de compras en sistema
3. Según solicitud del cliente:
   - **Nueva Compra**: Crea orden igual a CDU-01
   - **Consultar Orden**: Muestra estado completo con tracking
   - **Resolver Incidencia**: Abre ticket de soporte
   - **Procesar Devolución**: Inicia CDU-06
   - **Consultar Disponibilidad**: Verifica inventario real
   - **Promociones**: Información vigente del período
4. Agente ejecuta acción solicitada
5. Se registra interacción completa con timestamp
6. Cliente recibe confirmación verbal y por email

### 3.7.3 Precondiciones

- Cliente identificado en sistema
- Agente con credenciales válidas y activas
- Sistema de órdenes accesible
- Conexión telefónica establecida

### 3.7.4 Postcondiciones

- Interacción registrada en historial
- Acción completada (compra, ticket, etc.)
- Cliente informado de resultado
- Ticket generado si fue necesario

### 3.7.5 Flujos Alternativos

**Alternativa A - Problema Técnico**
- A1: Sistema no responde durante la llamada
- A2: Agente registra los datos manualmente
- A3: Se crea ticket para sincronizar después

**Alternativa B - Escalamiento a Gerencia**
- B1: Cliente solicita hablar con supervisor
- B2: Se transfiere llamada a gerencia
- B3: Se registra como "Escalamiento" en ticket

**Alternativa C - Cliente Irado/Reclamo**
- C1: Se crea ticket de "Reclamo" automáticamente
- C2: Se asigna a equipo de atención especial
- C3: Se da seguimiento dentro de 24 horas

---

## CDU-08: Conciliar Ventas con ERP

<div align="center">

![CDU-08](CDU_NYS/imagCDU/cdu08.png)

**Figura 9**: Diagrama de Caso de Uso CDU-08

</div>

### 3.8.1 Descripción General

Proceso automático que se ejecuta cada 30 minutos para sincronizar datos de ventas SGO-Logic con ERP-Core. Garantiza registros contables actualizados. Ejecutado por Job Batch sin intervención humana.

### 3.8.2 Flujo Principal

1. Job Batch se ejecuta automáticamente cada 30 minutos
2. Extrae datos de todas las ventas del período (últimas 30 min)
3. Valida integridad: sin valores nulos, formatos correctos
4. Transforma al formato ERP (CSV batch o XML)
5. Compara con último envío para evitar duplicados
6. Reconcilia: busca discrepancias (diferencias de montos, cantidades)
7. Si todas las validaciones OK: Envía batch a ERP-Core vía SFTP
8. Espera confirmación de recepción (timeout: 5 minutos)
9. Registra resultado en audit log
10. Genera reporte con estadísticas de conciliación

### 3.8.3 Precondiciones

- Ventas registradas en período
- Conexión a ERP-Core disponible
- Credenciales SFTP válidas
- Datos de ventas completamente validados

### 3.8.4 Postcondiciones

- Datos sincronizados a ERP (máximo 1 hora)
- Reporte de conciliación generado
- Event log actualizado
- Registros contables del ERP reflejan ventas

### 3.8.5 Flujos Alternativos

**Alternativa A - Discrepancias Detectadas**
- A1: Diferencia en monto o cantidad
- A2: Sistema ejecuta reintentos automáticos (máx. 5 veces, cada 5 min)
- A3: Si persiste: Alerta a Dirección Financiera para revisión manual
- A4: Se genera reporte detallado de la discrepancia

**Alternativa B - ERP-Core No Responde**
- B1: Sin respuesta después de 5 minutos
- B2: Se encola para reintentar próxima ejecución (30 min)
- B3: Máximo 3 reintentos
- B4: Si falla definitivamente: Notificación a IT

**Alternativa C - Error en Datos**
- C1: Validación rechaza datos inválidos
- C2: Se registra en log de errores
- C3: Se genera alerta para corrección manual
- C4: Se reintenta en siguiente ejecución

---

## 4. Conclusión y Resumen
 
### 4.1 Integración del Sistema

Cada CDU está diseñado para interactuar coherentemente con los demás:
- CDU-01 inicia el flujo
- CDU-02 y CDU-03 se ejecutan en paralelo
- CDU-04 genera registros fiscales
- CDU-05 gestiona distribución
- CDU-06 cubre devoluciones
- CDU-07 proporciona soporte integral
- CDU-08 sincroniza con backend contable

### 4.2 Garantías de Calidad

El sistema garantiza:
- **Trazabilidad completa**: Todos los procesos se registran en audit log
- **Resilencia**: Reintentos automáticos en operaciones críticas
- **Validación**: Múltiples niveles de validación en cada CDU
- **Disponibilidad**: Soporte multicanal 24/7
- **Seguridad**: Encriptación y validación de datos de pago
- **Conformidad**: Cumplimiento con normativas fiscales (SAT)

---






---

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




---

# Drivers de Restricción

Los drivers de restricción son condiciones que el equipo de arquitectura no puede cambiar. Delimitan el espacio de soluciones posibles y deben ser respetados por todas las decisiones de diseño.

---

## Tabla de Restricciones

| ID | Restricción | Tipo | Origen | Implicación en el Diseño |
|----|-------------|------|--------|--------------------------|
| RC-01 | El ERP-Core (AS/400, década de 1990) no será reemplazado ni modificado dentro del horizonte de esta iniciativa. Su único mecanismo de integración disponible es la recepción de archivos CSV o XML en intervalos de 30 minutos. | Técnica / Organizacional | Decisión de Junta Directiva | Se diseña un adaptador batch (Anti-Corruption Layer) dentro del Servicio de Facturación que genera los archivos CSV/XML cada 30 minutos y los deposita vía SFTP/filesystem. Cero cambios al AS/400. |
| RC-02 | Las 32 instancias del sistema POS (Punto de Venta) en las tiendas físicas no forman parte de un programa de reemplazo. | Técnica / Organizacional | Enunciado del proyecto | El POS exporta archivos de inventario local. SGO-Logic los consume mediante un job de lectura batch cada 5 minutos. No se modifica el POS; solo se leen sus archivos de salida ya existentes. |
| RC-03 | El contrato con PayKlik (pasarela de pagos) tiene vigencia de 3 años y no puede rescindirse. Su interfaz disponible es REST con latencia nominal de ~800 ms y picos de hasta 5 segundos. | Contractual | Contrato vigente | SGO-Logic debe integrar obligatoriamente PayKlik. Se diseña un adaptador resiliente con Circuit Breaker (Resilience4j) y cola de pagos en RabbitMQ para tolerar sus caídas. |
| RC-04 | El contrato con LogiExpress (proveedor logístico) tiene vigencia de 2 años. Su interfaz disponible es REST. Aproximadamente 1 de cada 50 solicitudes termina por timeout. | Contractual | Contrato vigente | SGO-Logic debe integrar obligatoriamente LogiExpress. Se diseña un adaptador con retry y backoff exponencial más Dead Letter Queue para gestionar el 2% de timeouts. |
| RC-05 | Presupuesto fijo: CAPEX total de $150,000 para el proyecto. OPEX operativo no debe superar $1,200 mensuales sin justificación y aprobación adicional. | Financiera | Gerencia / Junta Directiva | Stack tecnológico 100% open-source (Java OpenJDK, .NET, PostgreSQL, RabbitMQ, Redis, Kong, Docker, ELK, Prometheus, Grafana). CAPEX estimado: ~$23k-$37k. OPEX estimado: ~$270-$450/mes. |
| RC-06 | Cumplimiento fiscal SAT: es obligatorio emitir facturas electrónicas en XML con CUI y serie autorizada. Cada documento debe conservar su CUI y serie. | Regulatoria / Legal | Normativa SAT Guatemala | Servicio de Facturación con cola asíncrona más retry ante la SAT. Event Sourcing para mantener registro inmutable de cada factura y nota de crédito. |
| RC-07 | Protección de datos de pago (PCI-DSS): no se almacenan números completos de tarjeta (PAN) ni códigos CVV. Solo se guardan tokens de referencia del proveedor (PayKlik). | Regulatoria / Seguridad | Políticas corporativas + PCI-DSS | El Servicio de Pagos almacena únicamente tokens de referencia de PayKlik. Toda la lógica de datos sensibles de tarjeta reside exclusivamente en PayKlik. |
| RC-08 | Normativa de protección de datos personales aplicable en Guatemala, El Salvador y Costa Rica. | Regulatoria / Legal | Marco legal regional | Cifrado en tránsito (TLS 1.2+), cifrado en reposo (AES-256). Minimización de datos personales recolectados. Retención definida: datos transaccionales 5 años (SAT), datos personales purgables a solicitud del titular. |
| RC-09 | El despliegue se realizará en infraestructura local para aprovechar la inversión existente y mantener control operativo durante la adopción. La arquitectura debe permitir migración planificada a la nube conforme aumente la demanda. | Técnica / Financiera | Decisión de Gerencia de TI | Todos los servicios se empaquetan como imágenes Docker. Orquestación inicial con Docker Compose. Migración futura: mismas imágenes a Cloud Run / ECS / AKS. RabbitMQ a CloudAMQP. PostgreSQL a Cloud SQL / RDS. |
| RC-10 | El equipo interno tiene experiencia principalmente en Java y .NET y conocimientos básicos de Docker. Una alternativa que requiera competencias distintas debe incluir impacto de adopción, capacitación y operación. | Técnica / Organizacional | Perfil del equipo de TI | Servicios core en Java 17 + Spring Boot 3. Servicios secundarios en .NET 8 + ASP.NET Core. Docker Compose en vez de Kubernetes. Sin tecnologías exóticas que requieran curvas de aprendizaje extensas. |
| RC-11 | La organización desea minimizar el consumo energético de la infraestructura. | Ambiental / Operacional | Política organizacional | Contenedores Docker (más eficientes que VMs). Escalado bajo demanda: réplicas adicionales solo durante picos (Black Friday), se reducen después. Consolidación en 2-3 servidores en vez de uno por servicio. |
| RC-12 | La fecha del evento comercial Black Friday es noviembre y no puede trasladarse. El enunciado exige contar durante el primer mes con una ruta viable para proteger los procesos de pagos y facturación. | Temporal / Operacional | Calendario comercial | Semanas 1-2: Pagos resilientes (Circuit Breaker + cola). Semanas 3-4: Facturación asíncrona. Mes 2: Inventario y Órdenes omnicanal. Mes 3: Logística, Notificaciones y Monitoreo completo. |



---

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

