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

![CUN - Alto Nivel](imagCDU/cdu_altonivel.png)

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

![Releación Procesos](imagCDU/relacionCDU.png)

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
 
![Primera Descomposición](imagCDU/PrimeraDescom.png)

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
