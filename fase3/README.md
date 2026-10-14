# MegaStore SGO-Logic — Fase 3 (Equipo 11)

Sistema de Gestion de Ordenes y Logistica Omnicanal (SGO-Logic) con campana comercial **Buy Now Pay Later (BNPL) 30 dias**, Motor de Scoring Desacoplado, Trazabilidad Reactiva Server-Sent Events (SSE), y Despliegue Cloud en Google Cloud Platform (GCP).

**Institucion:** Universidad de San Carlos de Guatemala (USAC)  
**Facultad:** Facultad de Ingenieria, Escuela de Ciencias y Sistemas  
**Curso:** Analisis y Diseno de Sistemas 2, Seccion B (Segundo Semestre 2026)  

### Despliegue Oficial en Produccion Cloud (Google Cloud Platform)

- **Tienda Web Omnicanal (En Vivo HTTPS / SSL):** [https://megastore-gt.duckdns.org](https://megastore-gt.duckdns.org)
- **Dominio Alternativo (Wildcard DNS):** [http://megastore.35.239.248.226.sslip.io](http://megastore.35.239.248.226.sslip.io)
- **Consola de Eventos RabbitMQ:** [http://megastore-gt.duckdns.org:15672](http://megastore-gt.duckdns.org:15672) (Usuario: guest / Password: guest)

---

## 1. Integrantes del Equipo y Roles

| Carne | Nombre Completo | Rol Asignado |
| :--- | :--- | :--- |
| **202300712** | Melvin Geovanni Garcia Sumala | Scrum Master / Tech Lead (Frontend Omnicanal, BNPL 30d, 5 Unit Tests, CI/CD) |
| **202112109** | Carlos David de Leon Barrios | Backend Facturacion / Scoring (Motor Scoring, ACL AS/400, Docs, 5 E2E Tests) |
| **202300378** | Maria Fernanda Morales Lima | QA / Backend Logistica (Microservicio Logistica, 5 Pruebas de Carga) |
| **202000576** | Susana Paola Gonzalez Contreras | Backend Pagos (Microservicio Pagos, 5 Pruebas de Estres) |
| **202307272** | Bryan Alejandro Anona Paredes | Backend Inventario (Microservicio Inventario, 5 Pruebas de Integracion) |

---

## 2. Requisitos Previos

- **Docker:** Version 24.0 o superior (`docker --version`).
- **Docker Compose:** Version 2.20 o superior (`docker compose version`).
- **Node.js y npm:** Node.js 18+ y npm 9+ (`node -v`, `npm -v`).
- **Java JDK (Opcional para compilacion local):** Java 17 Temurin u OpenJDK con Maven 3.9+.

---

## 3. Despliegue Local con Docker Compose

Para compilar y levantar la arquitectura completa de microservicios, bases de datos y bus de mensajeria:

```bash
cd fase3/
docker compose up -d --build
```

Para verificar el estado y puertos de los contenedores en ejecucion:
```bash
docker compose ps
```
---

## 5. Ejecucion de Pruebas Automatizadas

### 5.1. Pruebas Unitarias del Tech Lead (Carne: 202300712)
Ejecutan con Node.js Test Runner validando la logica financiera y de elegibilidad BNPL:
```bash
cd fase3/frontend/
npm test
```
- Total: 5 pruebas unitarias passing (3.37ms).

### 5.2. Pruebas End-to-End (E2E) con Cypress (Carne: 202112109)
Para ejecucion automatizada headless (utilizada en pipeline CI/CD):
```bash
cd fase3/frontend/
npm run test:e2e
```

Para ejecucion visual e interactiva en el navegador (para demostracion al auxiliar):
```bash
cd fase3/frontend/
npm run test:e2e:open
```
- Total: 14 pruebas E2E pasando en 5 specs independientes (100% exitosas).

### 5.3. Pruebas Backend de Pagos (Maven / Docker)
```bash
docker run --rm -v $(pwd)/pagos-service:/app -w /app maven:3.9.6-eclipse-temurin-17 mvn test
```

---

## 6. Documentacion Oficial del Proyecto

Todos los documentos tecnicos y diagramas de arquitectura se encuentran en el directorio `fase3/`:
- `Manual_Tecnico.md`: Especificacion de arquitectura, contratos OpenAPI, reglas BNPL y topologia GCP.
- `Manual_Usuario.md`: Guia paso a paso para el cliente final y para el administrador de operaciones.
- `ACTUALIZACION-DIAGRAMAS.md`: Documentacion detallada de diagramas arquitectonicos.
- `docs/`: Directorio que contiene las imagenes exportadas de los diagramas de arquitectura (Despliegue GCP, Componentes UML, Secuencia BNPL, Bloques C4, Algoritmo Scoring BNPL, Ciclo de Vida y Resiliencia DLQ).
