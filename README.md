# AYD2 — Segundo Semestre 2026 — Grupo 11

## MegaStore SGO-Logic: Sistema de Gestión de Órdenes Omnicanal

## Integrantes Grupo 11

| Carné         | Nombre                          |
| ------------- | ------------------------------- |
| **202300712** | Melvin Geovanni García Sumalá   |
| **202300378** | Maria Fernanda Morales Lima     |
| **202000576** | Susana Paola González Contreras |
| **202307272** | Bryan Alejandro Anona Paredes   |
| **202112109** | Carlos David de Leon Barrios    |

## Fases del Proyecto

### [Fase 1 — Documento de Definición de Arquitectura (DDA)](fase1/README.md)

Contiene la justificación de decisiones arquitectónicas (ADRs), atributos de calidad (EAC), matriz de trazabilidad, diagramas C4 (contexto, componentes, despliegue, bloques) y mockups iniciales.

- [Ver entregables de la Fase 1](fase1/README.md)

### [Fase 2 — Implementación de Microservicios y MVP Operativo](fase2/README.md)

Contiene el código fuente completo, contenedores Docker, microservicios en Java Spring Boot y C# .NET 8, frontend web reactivo en React 18, caché Redis, base de datos PostgreSQL y bus de eventos RabbitMQ.

## Iniciar toda la fase2

```bash
# Entrar a la carpeta de la fase 2 y levantar todos los contenedores
cd fase2 && docker compose up -d --build
```

- **Frontend SGO-Logic**: [http://localhost:3000](http://localhost:3000)

# ADR-004: Adaptador Anti-Corruption Layer para integración con ERP AS/400

## Estado

Aceptado

## Contexto

El sistema contable de MegaStore (ERP-Core) está construido sobre AS/400 (tecnología legacy de 1990) y no cuenta con APIs modernas (REST/GraphQL). La Junta Directiva ha prohibido explícitamente modificar su código fuente para evitar riesgos operacionales. Sin embargo, el ERP requiere resúmenes de ventas para su cierre contable bajo pena de multas fiscales.

## Decisión

Se implementará un adaptador batch (Anti-Corruption Layer) dentro del Servicio de Facturación utilizando el motor de tareas programadas de Spring Boot (`@Scheduled`).
Cada 30 minutos, el adaptador ejecutará un proceso de extracción sobre la base de datos transaccional, transformará la información de órdenes emitidas al formato esperado por el AS/400, y depositará un archivo físico CSV en el volumen compartido `uploads/`.

## Consecuencias Positivas

- Se respeta al 100% la restricción impuesta por la Junta Directiva (cero impacto al legacy).
- El modelo de dominio de _SGO-Logic_ no se contamina con la estructura obsoleta del ERP.
- Si el AS/400 está caído, nuestro sistema sigue operando (desacoplamiento total).

## Riesgos y Consecuencias Negativas

- El ERP no reflejará ventas en tiempo real, sufriendo una demora de hasta 30 minutos (consistencia eventual). Esto fue notificado y aceptado por el departamento de Finanzas como un tradeoff operacional aceptable.
