# MegaStore SGO-Logic — Fase 2 (Grupo 11)

Sistema de Gestión de Órdenes Omnicanal (SGO-Logic) con Arquitectura de Microservicios Desacoplados.


## Requisitos Previos

Antes de clonar y levantar el proyecto, asegúrate de tener instalado en tu máquina:
- **Docker** (versión 24.0 o superior): `docker --version`
- **Docker Compose** (versión 2.20 o superior): `docker compose version`
- *(Opcional para desarrollo local sin Docker)*:
  - Java JDK 17 (Eclipse Temurin o OpenJDK)
  - Maven 3.9+
  - .NET SDK 8.0
  - Node.js 18+ y npm

---

## Guía de Replicación Rápida Paso a Paso


### iniciar todo 

Ejecuta el siguiente comando para compilar las imágenes y levantar todos los contenedores en segundo plano:

```bash
cd AYD2_B_2S2026_PROYECTO_G11/fase2/
docker compose up -d --build
```

> **Nota:** La primera vez tardara en lo que se descarga todo

---

### Ver contenedores

```bash
cd AYD2_B_2S2026_PROYECTO_G11/fase2/
docker compose ps
```


---

## links y Credenciales

- **Aplicación Web Frontend (SGO-Logic)**: [http://localhost:3000](http://localhost:3000)
  - Incluye: Catálogo Omnicanal, Carrito de Compras, Proceso de Pago / Checkout, Pantalla de Confirmación de Pedido, Seguimiento de Órdenes en Tiempo Real y Dashboard Ops Administrativo.
- **Panel Web de RabbitMQ**: [http://localhost:15672](http://localhost:15672)
  - Usuario: `guest`
  - Contraseña: `guest`
- **API Servicio de Órdenes (Java)**: `http://localhost:8081/api/ordenes`
- **API Servicio de Notificaciones (.NET 8)**: `http://localhost:8086/api/notificaciones/logs`
- **Base de Datos PostgreSQL**:
  - Host: `localhost` | Puerto: `5432`
  - Base de datos: `sgologic`
  - Usuario: `sgologic_user`
  - Contraseña: `sgologic_pass`
- **Caché Redis**:
  - Host: `localhost` | Puerto: `6379`
