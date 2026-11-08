# AYD2 — Segundo Semestre 2026 — Grupo 11

## MegaStore SGO-Logic: Sistema de Gestion de Ordenes y Logistica Omnicanal

### Despliegue Oficial en la Nube (Google Cloud Platform)

- **Tienda Web Omnicanal (Produccion Cloud HTTPS / SSL):** [https://megastore-gt.duckdns.org](https://megastore-gt.duckdns.org)
- **Dominio Alternativo (Wildcard DNS):** [http://megastore.35.239.248.226.sslip.io](http://megastore.35.239.248.226.sslip.io)
- **Consola RabbitMQ Ops:** [http://megastore-gt.duckdns.org:15672](http://megastore-gt.duckdns.org:15672) (Usuario: guest / Password: guest)

---

## Integrantes Grupo 11

| Carne | Nombre | Rol Principal |
| :--- | :--- | :--- |
| **202300712** | Melvin Geovanni Garcia Sumala | Lider Tecnico / Frontend Omnicanal / BNPL / CI/CD |
| **202300378** | Maria Fernanda Morales Lima | Microservicio Logistica / Pruebas de Carga |
| **202000576** | Susana Paola Gonzalez Contreras | Microservicio Pagos / Resiliencia / Pruebas de Estres |
| **202307272** | Bryan Alejandro Anona Paredes | Microservicio Inventario / Pruebas de Integracion |
| **202112109** | Carlos David de Leon Barrios | Microservicio Facturacion / Motor Scoring / Pruebas E2E |

---

## Fases del Proyecto

### [Fase 3 — Campana BNPL 30 dias, Pruebas Automatizadas y Despliegue Cloud (GCP)](fase3/README.md)

- **Plataforma en Vivo:** [http://megastore-gt.duckdns.org](http://megastore-gt.duckdns.org)
- **Documentacion Oficial:**
  - [Manual Tecnico de la Fase 3](fase3/Manual_Tecnico.md)
  - [Manual de Usuario de la Fase 3](fase3/Manual_Usuario.md)
  - [Actualizacion y Diagramas de Arquitectura](fase3/ACTUALIZACION-DIAGRAMAS.md)
  - [Guia de Inicio Rapido y Ejecucion](fase3/README.md)

Contiene la evolucion arquitectonica con la campana comercial **Buy Now Pay Later (BNPL) 30 dias (0% interes)**, motor de scoring crediticio desacoplado, trazabilidad reactiva via Server-Sent Events (SSE), persistencia con bloqueo optimista ante alta concurrencia, capa anticorrupcion (ACL) para ERP AS/400, facturacion electronica SAT (FEL), suite de 25 pruebas automatizadas (unitarias, integracion, E2E, estres y carga), CI/CD automatizado con GitHub Actions y despliegue en Google Cloud Platform (GCP).

### [Fase 2 — Implementacion de Microservicios y MVP Operativo](fase2/README.md)

Contiene la base transaccional inicial de microservicios en Java Spring Boot y C# .NET 8, frontend web reactivo en React 18, cache Redis, base de datos PostgreSQL y bus de eventos RabbitMQ.

- [Ver entregables de la Fase 2](fase2/README.md)

### [Fase 1 — Documento de Definicion de Arquitectura (DDA)](fase1/README.md)

Contiene la justificacion de decisiones arquitectonicas (ADRs), atributos de calidad (EAC), matriz de trazabilidad, diagramas C4 y mockups de diseno inicial.

- [Ver entregables de la Fase 1](fase1/README.md)

---

## Credenciales de Acceso a la Plataforma Desplegada

| Rol | Correo Electronico | Contrasena | Descripcion de Pruebas |
| :--- | :--- | :--- | :--- |
| **Cliente Apto BNPL** | `cliente@megastore.com` | `Password123` | Score crediticio 85/100, cupo $5,000.00 USD, plazo de 30 dias sin intereses. |
| **Cliente Riesgo / No Apto** | `riesgo@megastore.com` | `Riesgo123` | Score crediticio 55/100 (mora en ERP). BNPL bloqueado; habilita PayKlik / Transferencia. |
| **Administrador Ops** | `admin@megastore.com` | `Admin123` | Acceso a `/admin/dashboard` para gestion de inventario, pedidos y soporte. |

---

## Verificacion de Servicios en la Nube (Google Cloud Platform)

```bash
# Verificacion de Catalogo e Inventario
curl -s http://megastore-gt.duckdns.org:8082/api/inventario/productos

# Evaluacion de Scoring Crediticio BNPL
curl -s -X POST http://megastore-gt.duckdns.org:8081/api/credito/evaluar \
  -H "Content-Type: application/json" \
  -d '{"clienteId": "cliente@megastore.com", "monto": 250.0}'
```

<!-- verified-ci-sync -->
