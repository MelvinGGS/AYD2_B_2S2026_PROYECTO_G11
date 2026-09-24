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
  - Usuario: `sgologic`
  - Contraseña: `sgologic2026`
- **Caché Redis**:
  - Host: `localhost` | Puerto: `6379`

---

## Comandos rápidos

### Verificación de Salud de Microservicios (Puertos 8081 - 8086)
```bash
for port in 8081 8082 8083 8084 8085 8086; do
  echo -n "Port $port: "
  curl -s http://localhost:$port/
  echo ""
done
```

### Verificación de Colas y Consumidores RabbitMQ
```bash
docker exec -i sgologic-rabbitmq rabbitmqctl list_queues name messages consumers
```
- Panel web: [http://localhost:15672](http://localhost:15672) (Usuario: guest / Password: guest)

### 5. Verificación de Inventario Unificado Multi-Nodo (PostgreSQL)
```bash
curl -s http://localhost:8082/api/inventario/unificado
```

### 6. Verificación de Auditoría en Base de Datos PostgreSQL
```bash
docker exec -i sgologic-postgres psql -U sgologic -d sgologic -c "SELECT id, orden_id, tipo_evento, detalle, fecha FROM eventos_auditoria ORDER BY id DESC LIMIT 5;"
```
