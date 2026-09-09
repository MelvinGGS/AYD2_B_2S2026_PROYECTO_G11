# MegaStore SGO-Logic — Fase 2 (Grupo 11)

Sistema de Gestión de Órdenes Omnicanal (SGO-Logic) con Arquitectura de Microservicios Desacoplados.

## 👥 Integrantes del Grupo 11

| Carné | Nombre | Card Asignada |
|---|---|---|
| **202300712** | Melvin Geovanni García Sumalá | **Card 1: Infraestructura + Órdenes + Notificaciones + Frontend** |
| **202300378** | Maria Fernanda Morales Lima | **Card 2: Servicio de Inventario y Disponibilidad** |
| **202000576** | Susana Paola González Contreras | **Card 3: Servicio de Pagos y Resiliencia** |
| **202307272** | Bryan Alejandro Anona Paredes | **Card 4: Servicio de Facturación y ERP AS/400** |
| **202112109** | Carlos David de Leon Barrios | **Card 5: Servicio de Logística y Despacho** |

---

## 📋 Requisitos Previos

Antes de clonar y levantar el proyecto, asegúrate de tener instalado en tu máquina:
- **Docker** (versión 24.0 o superior): `docker --version`
- **Docker Compose** (versión 2.20 o superior): `docker compose version`
- **Git**: `git --version`
- *(Opcional para desarrollo local sin Docker)*:
  - Java JDK 17 (Eclipse Temurin o OpenJDK)
  - Maven 3.9+
  - .NET SDK 8.0
  - Node.js 18+ y npm

---

## 🚀 Guía de Replicación Rápida Paso a Paso

Sigue estos comandos exactos desde tu terminal Linux / macOS / WSL:

### Paso 1: Clonar el Repositorio y Entrar a la Rama de Trabajo

```bash
# 1. Clonar el repositorio
git clone https://github.com/MelvinGGS/AYD2_B_2S2026_PROYECTO_G11.git

# 2. Entrar a la carpeta del proyecto
cd AYD2_B_2S2026_PROYECTO_G11

# 3. Cambiarse a la rama de desarrollo de la Fase 2
git checkout develop
# O la rama de características correspondiente:
# git checkout feature/front-back-fase2_202300712
```

---

### Paso 2: Ubicarse en el Directorio de la Fase 2

**Ubicación exacta de trabajo:**
```bash
cd ~/AYD2_B_2S2026_PROYECTO_G11/fase2
```

---

### Paso 3: Construir y Levantar Todo con Docker Compose

Ejecuta el siguiente comando para compilar las imágenes y levantar todos los contenedores en segundo plano:

```bash
# Ubicación: ~/AYD2_B_2S2026_PROYECTO_G11/fase2
docker compose up -d --build
```

> **Nota:** La primera vez que se ejecute tomará de 2 a 3 minutos mientras descarga las imágenes base de Docker (Postgres, Redis, RabbitMQ, Eclipse Temurin y .NET SDK). Las siguientes ejecuciones tardarán solo segundos gracias a la caché.

---

### Paso 4: Verificar que Todos los Contenedores Estén Operativos

```bash
# Ubicación: ~/AYD2_B_2S2026_PROYECTO_G11/fase2
docker compose ps
```

Deberás ver los 6 contenedores principales en estado `Up` / `healthy`:

| Contenedor | Servicio | Imagen | Puerto Expuesto |
|---|---|---|---|
| `sgologic-frontend` | Frontend Web React | `fase2-frontend` | `http://localhost:3000` |
| `sgologic-ordenes` | Órdenes (Java Spring Boot) | `fase2-ordenes-service` | `http://localhost:8081` |
| `sgologic-notificaciones` | Notificaciones (.NET 8 C#) | `fase2-notificaciones-service` | `http://localhost:8086` |
| `sgologic-postgres` | Base de Datos Relacional | `postgres:16` | `localhost:5432` |
| `sgologic-redis` | Carrito de Compras en Memoria | `redis:7-alpine` | `localhost:6379` |
| `sgologic-rabbitmq` | Bus de Mensajería Asíncrono | `rabbitmq:3.13-management` | `localhost:5672` (Panel: `15672`) |

---

## 🌐 Enlaces de Acceso y Credenciales

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

---

## 🧪 Pruebas de Funcionamiento Inmediatas (Comandos cURL)

Puedes validar todo el flujo de compra y mensajería ejecutando estas llamadas desde tu terminal:

### 1. Probar Health de Notificaciones (.NET 8)
```bash
curl -s http://localhost:8086/ | jq .
```
*Respuesta esperada:*
```json
{
  "servicio": "Notificaciones Service (.NET 8 C#)",
  "estado": "OPERATIVO",
  "puerto": 8086
}
```

### 2. Probar Inicio de Sesión Omnicanal
```bash
curl -s -X POST http://localhost:8081/api/clientes/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos.tienda@megastore.com","password":"password123"}' | jq .
```

### 3. Crear una Orden de Compra (Publica automáticamente evento en RabbitMQ)
```bash
curl -s -X POST http://localhost:8081/api/ordenes \
  -H "Content-Type: application/json" \
  -d '{
    "clienteId": "CLI-1001",
    "clienteNombre": "Cliente de Prueba",
    "canal": "WEB",
    "items": [
      {"nombreProducto": "Smart TV 55 UHD 4K", "precioUnitario": 4500.00, "cantidad": 1, "subtotal": 4500.00}
    ],
    "subtotal": 4500.00,
    "impuestos": 540.00,
    "envio": 0.00,
    "total": 5040.00,
    "direccion": "Avenida Reforma 10-00, Zona 9, Guatemala",
    "metodoPago": "TARJETA",
    "metodoEntrega": "Envío a Domicilio"
  }' | jq .
```

### 4. Verificar Recepción del Evento en Tiempo Real en Notificaciones (.NET)
```bash
curl -s http://localhost:8086/api/notificaciones/logs | jq .
```
*Respuesta esperada:* Verás el evento `orden.creada` recibido a través del exchange `sgologic.exchange` con el código de rastreo generado automáticamente.

---

## 🛠️ Guía para que Cada Integrante Trabaje en su Microservicio

Para facilitar el trabajo en grupo, cada integrante tiene su carpeta lista con las **2 implementaciones más difíciles ya creadas** como apoyo técnico.

### Estructura de Carpetas:
```text
fase2/
├── docker-compose.yml
├── ordenes-service/         <- Card 1 (Melvin #202300712) [COMPLETO]
├── notificaciones-service/  <- Card 1 (Melvin #202300712) [COMPLETO]
├── inventario-service/      <- Card 2 (Maria Fernanda #202300378)
├── pagos-service/           <- Card 3 (Susana Paola #202000576)
├── facturacion-service/     <- Card 4 (Bryan Alejandro #202307272)
├── logistica-service/       <- Card 5 (Carlos David #202112109)
└── frontend/                <- Vistas e interfaz gráfica en React
```

---

### 📦 Card 2: Servicio de Inventario (Puerto 8082)
- **Integrante:** Maria Fernanda Morales Lima (#202300378)
- **Ubicación:** `~/AYD2_B_2S2026_PROYECTO_G11/fase2/inventario-service`
- **Tecnología:** Java 17 + Spring Boot 3
- **Lo que ya está hecho (base difícil):**
  - `InventarioService.java`: Listener concurrente de RabbitMQ para reserva atómica de stock.
  - `InventarioService.java`: Tarea programada `@Scheduled` que libera reservas expiradas (>15 minutos) para evitar sobreventas.
- **Lo que debes programar:**
  - Entidades `Producto`, `Ubicacion` y `Stock`.
  - Controlador `InventarioController` con endpoints de catálogo y disponibilidad en 32 tiendas.
  - Cargar datos semilla.
- **Cómo probarlo localmente:**
  ```bash
  cd ~/AYD2_B_2S2026_PROYECTO_G11/fase2/inventario-service
  mvn spring-boot:run
  ```
- **Cómo activarlo en Docker:**
  En `fase2/docker-compose.yml`, descomenta el bloque de `inventario-service` y ejecuta `docker compose up -d --build inventario-service`.

---

### 💳 Card 3: Servicio de Pagos (Puerto 8083)
- **Integrante:** Susana Paola González Contreras (#202000576)
- **Ubicación:** `~/AYD2_B_2S2026_PROYECTO_G11/fase2/pagos-service`
- **Tecnología:** Java 17 + Spring Boot 3
- **Lo que ya está hecho (base difícil):**
  - `PagosService.java`: Circuito de resiliencia con `@CircuitBreaker` de Resilience4j protegiendo PayKlik ante timeouts > 5s.
  - `PagosService.java`: Cola de contingencia Dead Letter Queue (`pagos.dlq`) y cumplimiento de normativa PCI-DSS (solo últimos 4 dígitos, sin CVV).
- **Lo que debes programar:**
  - Mock de pasarela PayKlik (`POST /mock/payklik/cobrar`).
  - Listener de RabbitMQ para solicitudes de pago automáticas.
  - Endpoint de auditoría financiera para Finanzas (`GET /api/pagos/orden/{id}`).
- **Cómo probarlo localmente:**
  ```bash
  cd ~/AYD2_B_2S2026_PROYECTO_G11/fase2/pagos-service
  mvn spring-boot:run
  ```
- **Cómo activarlo en Docker:**
  En `fase2/docker-compose.yml`, descomenta el bloque de `pagos-service` y ejecuta `docker compose up -d --build pagos-service`.

---

### 🧾 Card 4: Servicio de Facturación (Puerto 8084)
- **Integrante:** Bryan Alejandro Anona Paredes (#202307272)
- **Ubicación:** `~/AYD2_B_2S2026_PROYECTO_G11/fase2/facturacion-service`
- **Tecnología:** Java 17 + Spring Boot 3
- **Lo que ya está hecho (base difícil):**
  - `FacturacionService.java`: Generador de XML DTE SAT con 3 reintentos y política de backoff exponencial (1s, 2s, 4s).
  - `FacturacionService.java`: Adaptador / conector programado para ERP AS/400 (`@Scheduled` cada 30 min) generando archivos planos consolidados CSV en `uploads/`.
- **Lo que debes programar:**
  - Endpoint mock de SAT (`POST /mock/sat/validar`).
  - Endpoints de consulta y descarga de XML emitidos (`GET /api/facturas/orden/{id}`).
  - Documento de Arquitectura ADR justificando el conector AS/400.
- **Cómo probarlo localmente:**
  ```bash
  cd ~/AYD2_B_2S2026_PROYECTO_G11/fase2/facturacion-service
  mvn spring-boot:run
  ```
- **Cómo activarlo en Docker:**
  En `fase2/docker-compose.yml`, descomenta el bloque de `facturacion-service` y ejecuta `docker compose up -d --build facturacion-service`.

---

### 🚚 Card 5: Servicio de Logística (Puerto 8085)
- **Integrante:** Carlos David de Leon Barrios (#202112109)
- **Ubicación:** `~/AYD2_B_2S2026_PROYECTO_G11/fase2/logistica-service`
- **Tecnología:** C# / .NET 8 Web API
- **Lo que ya está hecho (base difícil):**
  - `LogisticaManagerService.cs`: Algoritmo de selección de origen óptimo (asignación inteligente entre CD Norte, CD Sur o Tienda según dirección).
  - `LogisticaManagerService.cs`: Máquina de estados de tracking (`PENDIENTE` ➔ `PREPARADO` ➔ `EN_TRANSITO` ➔ `ENTREGADO`).
- **Lo que debes programar:**
  - Controlador `LogisticaController` con mock de LogiExpress (`POST /mock/logiexpress/guia`) con 2% de timeout simulado.
  - Endpoints de consulta de guía de rastreo y actualización de estado.
  - Persistencia de envíos en PostgreSQL con Entity Framework Core.
  - Liderar la prueba final punto a punto (E2E) con el equipo.
- **Cómo probarlo localmente:**
  ```bash
  cd ~/AYD2_B_2S2026_PROYECTO_G11/fase2/logistica-service
  dotnet run
  ```
- **Cómo activarlo en Docker:**
  En `fase2/docker-compose.yml`, descomenta el bloque de `logistica-service` y ejecuta `docker compose up -d --build logistica-service`.

---

## 📌 Reglas de Git para el Equipo (OBLIGATORIO)

Para mantener el control y cumplir con los lineamientos de calificación de AYD2:

1. **Crear tu rama de trabajo desde develop**:
   ```bash
   # Ubicación: ~/AYD2_B_2S2026_PROYECTO_G11
   git checkout develop
   git pull origin develop
   git checkout -b feature/nombre-modulo_NUMERODECARNET
   ```
   *Ejemplo para Inventario:*
   ```bash
   git checkout -b feature/inventario-service_202300378
   ```

2. **Formato estricto de Commit con Carné**:
   Todos los commits deben iniciar con `#CARNET:`:
   ```bash
   git add .
   git commit -m "#202300378: implementar catalogo de productos y stock por tienda fisica"
   git push origin feature/inventario-service_202300378
   ```

---

## 🔧 Comandos Útiles de Mantenimiento Docker

```bash
# Ver los logs en vivo de un microservicio específico:
docker compose logs -f ordenes-service
docker compose logs -f notificaciones-service
docker compose logs -f frontend

# Reiniciar un solo contenedor:
docker compose restart ordenes-service

# Detener todos los contenedores:
docker compose down

# Detener y limpiar volúmenes (reiniciar la base de datos y redis desde cero):
docker compose down -v
```
