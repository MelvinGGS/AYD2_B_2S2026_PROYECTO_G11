# AYD2 — Segundo Semestre 2026 — Grupo 11
## MegaStore SGO-Logic: Sistema de Gestión de Órdenes Omnicanal


## Integrantes Grupo 11

| Carné | Nombre | 
|---|---|
| **202300712** | Melvin Geovanni García Sumalá |
| **202300378** | Maria Fernanda Morales Lima |
| **202000576** | Susana Paola González Contreras | 
| **202307272** | Bryan Alejandro Anona Paredes |
| **202112109** | Carlos David de Leon Barrios |


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

