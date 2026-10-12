# Suite de Pruebas de Estrés con k6 — SGO-Logic (Fase 3)

**Proyecto:** Sistema de Gestión de Órdenes y Logística Omnicanal (SGO-Logic)  
**Herramienta:** [Grafana k6](https://k6.io/)

---

## 1. Resumen de las 5 Pruebas de Estrés

Esta suite evalúa los límites de capacidad, concurrencia, resiliencia y tiempos de respuesta (SLA) de la arquitectura orientada a eventos y estilo reactivo de la Fase 3:

| # | Archivo | Microservicio Evaluado | Escenario y Límite Evaluado | Umbral Crítico (SLA) |
|---|---|---|---|---|
| **1** | `prueba1_concurrencia_inventario_stock.js` | `ordenes-service` + `inventario-service` (8081 / 8082) | **120 VUs concurrentes** compitiendo por el mismo SKU (`PROD-001`). Valida resistencia de reserva, bloqueo optimista (`@Version`) y prevención de sobreventas. | `p(95) < 800 ms`<br>`5xx rate < 0.01` |
| **2** | `prueba2_scoring_credito_bnpl.js` | `ordenes-service` (8081) | **250 VUs pico** en el motor de scoring de crédito propio (`POST /api/credito/evaluar`). Verifica el driver de rendimiento QA-1. | **`p(95) < 500 ms`** (Driver QA-1)<br>`errores < 1%` |
| **3** | `prueba3_notificaciones_reactivas_stream.js` | `notificaciones-service` (8086) | **200 conexiones concurrentes** emitiendo y recibiendo eventos en tiempo real vía Server-Sent Events / WebSockets en Kestrel .NET 8. | `p(95) < 400 ms`<br>`fallos < 2%` |
| **4** | `prueba4_resiliencia_payklik_circuit_breaker.js` | `pagos-service` (8083) | **200 VUs** saturando la pasarela de pagos PayKlik. Evalúa comportamiento ante ráfagas extremas y tolerancia a fallos. | `p(95) < 400 ms`<br>`5xx rate < 0.01` |
| **5** | `prueba5_flujo_integral_omnicanal.js` | Flujo E2E Integrado (8081, 8082, 8086) | **200 VUs** ejecutando el recorrido completo: Catálogo unificado → Scoring BNPL → Confirmación de orden → Notificación reactiva. | `p(95) < 1500 ms`<br>`fallos < 2%` |
| **Suite** | `suite_estres_k6.js` | Todos los servicios en paralelo | Ejecución simultánea de los 5 escenarios mediante multi-scenarios de k6. | `p(95) < 800 ms`<br>`fallos < 2%` |

---

## 2. Requisitos Previos

Tener los microservicios de SGO-Logic levantados con Docker Compose:

```bash
cd fase3
docker compose up -d
```

---

## 3. Formas de Ejecución

### Opción A: Usando Docker (Recomendada, sin instalar k6)

Puedes ejecutar cualquier script directamente con el contenedor oficial de k6:

```powershell
# Desde el directorio fase3/pruebas-estres:
cd fase3/pruebas-estres

# 1. Prueba de Inventario y Stock Concurrente
docker run --rm -i --network host grafana/k6 run - < prueba1_concurrencia_inventario_stock.js

# 2. Prueba de Scoring de Crédito Propio (SLA < 500 ms)
docker run --rm -i --network host grafana/k6 run - < prueba2_scoring_credito_bnpl.js

# 3. Prueba de Notificaciones Reactivas
docker run --rm -i --network host grafana/k6 run - < prueba3_notificaciones_reactivas_stream.js

# 4. Prueba de Resiliencia PayKlik
docker run --rm -i --network host grafana/k6 run - < prueba4_resiliencia_payklik_circuit_breaker.js

# 5. Prueba de Flujo Integral Omnicanal E2E
docker run --rm -i --network host grafana/k6 run - < prueba5_flujo_integral_omnicanal.js

# Ejecutar la suite completa unificada
docker run --rm -i --network host grafana/k6 run - < suite_estres_k6.js
```

> **Nota para Windows/Mac con Docker Desktop:** Si `--network host` no resuelve `localhost`, puedes apuntar a `host.docker.internal`:
> ```powershell
> docker run --rm -i -e BASE_URL="http://host.docker.internal:8081" grafana/k6 run - < prueba2_scoring_credito_bnpl.js
> ```

---

### Opción B: Instalando k6 localmente

Si tienes k6 instalado en tu sistema (`winget install k6` en Windows o `brew install k6` en Mac):

```powershell
cd fase3/pruebas-estres

# Ejecución individual
k6 run prueba1_concurrencia_inventario_stock.js
k6 run prueba2_scoring_credito_bnpl.js
k6 run prueba3_notificaciones_reactivas_stream.js
k6 run prueba4_resiliencia_payklik_circuit_breaker.js
k6 run prueba5_flujo_integral_omnicanal.js

# Ejecución de la suite completa
k6 run suite_estres_k6.js
```

---

## 4. Criterios de Aceptación y Resultados Esperados

1. **Sin errores 500 en Inventario:** Ante múltiples usuarios comprando la última unidad, el microservicio debe responder con orden confirmada o rechazo de negocio por stock insuficiente, pero jamás lanzar errores no controlados.
2. **Cumplimiento de QA-1:** La evaluación de crédito en `prueba2` mantiene el percentil 95 (`p(95)`) por debajo de los 500 ms con hasta 250 usuarios concurrentes.
3. **Estabilidad de Kestrel en Notificaciones:** El microservicio de notificaciones mantiene conexiones estables sin agotar descriptores de socket bajo 200 conexiones concurrentes.
