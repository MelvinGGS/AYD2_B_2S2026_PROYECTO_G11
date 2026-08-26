# Prototipo de Alto Nivel — SGO-Logic

Este documento presenta los mockups no funcionales del Sistema de Gestión de Órdenes y Logística Omnicanal (SGO-Logic). Las pantallas están organizadas de forma secuencial según el flujo de interacción del usuario y la operación del negocio.

---

## Flujo Secuencial del Prototipo

```
[1. Login] -> [2. Catálogo] -> [3. Carrito] -> [4. Checkout] -> [5. Confirmación] -> [6. Seguimiento]
                                                                                        |
                                                                              [7. Dashboard Admin]
```

---

## 1. Login e Identificación Omnicanal

Permite a los usuarios identificarse en el sistema. Soporta el acceso de clientes finales (web/móvil), empleados de tienda física y agentes de call center. El sistema asocia la sesión al perfil único del cliente para garantizar la continuidad omnicanal.

![1. Login e Identificación](MegaStore%20%E2%80%94%20Login.jpg)

---

## 2. Catálogo de Productos Omnicanal

Muestra el listado de productos, precios, ofertas y combos. La información se obtiene en tiempo real mediante consultas al sistema externo de Catálogo Comercial.

![2. Catálogo de Productos](MegaStore%20%E2%80%94%20Cat%C3%A1logo.jpg)

---

## 3. Carrito Unificado

Almacena los productos seleccionados por el usuario. El carrito está respaldado en memoria mediante Redis y asociado directamente al ID del cliente, permitiendo iniciar la compra en un dispositivo y continuarla en otro o en tienda física.

![3. Carrito Unificado](MegaStore%20%E2%80%94%20Carrito.jpg)

---

## 4. Checkout (Procesamiento de Pago y Elección de Entrega)

Pantalla donde el cliente selecciona el método de pago y la modalidad de cumplimiento de la orden (fulfillment).

![4. Checkout](MegaStore%20%E2%80%94%20Checkout.jpg)

---

## 5. Confirmación de Orden

Muestra el resultado inmediato tras la confirmación de la compra. Genera el código único de orden y notifica al usuario sobre la recepción y procesamiento de su pedido.

![5. Confirmación de Orden](MegaStore%20%E2%80%94%20Confirmaci%C3%B3n.jpg)

---

## 6. Seguimiento de Orden en Tiempo Real

Permite al cliente y al personal de atención (call center) verificar el estado actualizado de la compra en cualquier momento.

![6. Seguimiento de Orden](MegaStore%20%E2%80%94%20Seguimiento%20pedido.jpg)

---

## 7. Dashboard Operativo y Monitoreo (Administración)

Panel de control de uso interno para la Gerencia de TI, Jefatura de Logística y Operaciones. Proporciona visibilidad global sobre la operación de SGO-Logic y el estado de los servicios externos.

![7. Dashboard Operativo](MegaStore%20%E2%80%94%20Admin%20Dashboard.jpg)
