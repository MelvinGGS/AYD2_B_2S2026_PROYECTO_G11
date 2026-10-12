import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas del flujo E2E
const duracionFlujoCompleto = new Trend('duracion_flujo_completo_ms');
const tasaFallosGlobal = new Rate('tasa_fallos_global');
const comprasEfectuadas = new Counter('flujos_compras_completados');

export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Entrada progresiva de compradores
    { duration: '20s', target: 150 }, // Campaña de alta demanda (150 VUs concurrentes)
    { duration: '15s', target: 200 }, // Estrés pico del sistema omnicanal
    { duration: '10s', target: 0 },   // Cierre ordenado de sesiones
  ],
  thresholds: {
    'duracion_flujo_completo_ms': ['p(95)<1500'],
    'tasa_fallos_global': ['rate<0.02'],
    'http_req_duration': ['p(95)<800'],
  },
};

const HOST_ORDENES = __ENV.HOST_ORDENES || 'http://localhost:8081';
const HOST_INVENTARIO = __ENV.HOST_INVENTARIO || 'http://localhost:8082';
const HOST_NOTIFICACIONES = __ENV.HOST_NOTIFICACIONES || 'http://localhost:8086';

export default function () {
  const tInicio = Date.now();
  let exitoFlujo = true;
  const clienteId = `CLI-FULL-${__VU}`;

  // 1. Exploración de catálogo y disponibilidad de stock unificado
  group('1. Catalogo e Inventario', function () {
    const resCatalogo = http.get(`${HOST_INVENTARIO}/api/inventario/unificado`);
    const ok = check(resCatalogo, {
      'Inventario responde 200': (r) => r.status === 200,
    });
    if (!ok) exitoFlujo = false;
  });

  // 2. Evaluación de crédito propio a 30 días en el checkout
  group('2. Evaluacion BNPL', function () {
    const payloadCredito = JSON.stringify({
      clienteId: clienteId,
      montoOrden: 4500.0
    });
    const resCredito = http.post(`${HOST_ORDENES}/api/credito/evaluar`, payloadCredito, {
      headers: { 'Content-Type': 'application/json' },
    });
    const ok = check(resCredito, {
      'Scoring responde < 500ms': (r) => r.timings.duration < 500,
      'Scoring status 200': (r) => r.status === 200,
    });
    if (!ok) exitoFlujo = false;
  });

  // 3. Confirmación y creación de la orden (dispara reserva y eventos)
  let ordenGeneradaId = null;
  group('3. Confirmacion de Orden', function () {
    const payloadOrden = JSON.stringify({
      clienteId: clienteId,
      clienteNombre: `Comprador Omnicanal ${__VU}`,
      canal: 'WEB',
      metodoPago: __VU % 2 === 0 ? 'CREDITO_PROPIO_30D' : 'PAYKLIK',
      metodoEntrega: 'DELIVERY',
      direccion: 'Avenida Las Américas, Zona 13, Guatemala',
      items: [
        {
          id: 'PROD-001',
          nombre: 'Laptop Dell Pro',
          descripcion: 'Laptop corporativa',
          precio: 4500.0,
          cantidad: 1,
          imagen: 'laptop.jpg'
        }
      ]
    });

    const resOrden = http.post(`${HOST_ORDENES}/api/ordenes`, payloadOrden, {
      headers: { 'Content-Type': 'application/json' },
    });

    const ok = check(resOrden, {
      'Orden procesada (200 o 201)': (r) => r.status === 200 || r.status === 201,
      'No hay 5xx en ordenes': (r) => r.status < 500,
    });

    if (ok) {
      try {
        const body = JSON.parse(resOrden.body);
        ordenGeneradaId = body.id || body.ordenId;
      } catch (e) {}
    } else {
      exitoFlujo = false;
    }
  });

  // 4. Verificación reactiva en log de notificaciones
  group('4. Auditoria y Tracking', function () {
    const resLogs = http.get(`${HOST_NOTIFICACIONES}/api/notificaciones/logs`);
    check(resLogs, {
      'Logs reactivos accesibles': (r) => r.status === 200,
    });
  });

  const tiempoTotal = Date.now() - tInicio;
  duracionFlujoCompleto.add(tiempoTotal);
  tasaFallosGlobal.add(!exitoFlujo);

  if (exitoFlujo) {
    comprasEfectuadas.add(1);
  }

  sleep(0.2);
}
