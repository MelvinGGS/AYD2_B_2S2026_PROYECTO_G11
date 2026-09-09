# AYD2 — Segundo Semestre 2026 — Grupo 11
## MegaStore SGO-Logic: Sistema de Gestión de Órdenes Omnicanal

Repositorio oficial del Grupo 11 para el proyecto de Análisis y Diseño de Sistemas 2 (AYD2), Facultad de Ingeniería, Universidad de San Carlos de Guatemala.

---

## 👥 Integrantes del Grupo 11

| Carné | Nombre | Correo Institucional |
|---|---|---|
| **202300712** | Melvin Geovanni García Sumalá | 202300712@ingenieria.usac.edu.gt |
| **202300378** | Maria Fernanda Morales Lima | 202300378@ingenieria.usac.edu.gt |
| **202000576** | Susana Paola González Contreras | 202000576@ingenieria.usac.edu.gt |
| **202307272** | Bryan Alejandro Anona Paredes | 202307272@ingenieria.usac.edu.gt |
| **202112109** | Carlos David de Leon Barrios | 202112109@ingenieria.usac.edu.gt |

---

## 📂 Fases del Proyecto

### 📌 [Fase 1 — Documento de Definición de Arquitectura (DDA)](fase1/README.md)
Contiene la justificación de decisiones arquitectónicas (ADRs), atributos de calidad (EAC), matriz de trazabilidad, diagramas C4 (contexto, componentes, despliegue, bloques) y mockups iniciales.
- **Acceso:** 👉 [Ver entregables de la Fase 1](fase1/README.md)

---

### 🚀 [Fase 2 — Implementación de Microservicios y MVP Operativo](fase2/README.md)
Contiene el código fuente completo, contenedores Docker, microservicios en Java Spring Boot y C# .NET 8, frontend web reactivo en React 18, caché Redis, base de datos PostgreSQL y bus de eventos RabbitMQ.
- **Guía de Replicación Rápida con Comandos Exactos:** 👉 [Ver Guía de Replicación de Fase 2](fase2/README.md)

---

## ⚡ Arranque Rápido de la Fase 2 (En 1 solo paso)

```bash
# Entrar a la carpeta de la fase 2 y levantar todos los contenedores
cd fase2 && docker compose up -d --build
```

- **Frontend SGO-Logic**: [http://localhost:3000](http://localhost:3000)
- **Panel RabbitMQ**: [http://localhost:15672](http://localhost:15672) (guest / guest)
- **API Órdenes (Java)**: [http://localhost:8081/api/ordenes](http://localhost:8081/api/ordenes)
- **API Notificaciones (.NET 8)**: [http://localhost:8086/api/notificaciones/logs](http://localhost:8086/api/notificaciones/logs)
