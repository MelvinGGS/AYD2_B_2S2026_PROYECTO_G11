import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de ejecución multi-escenario para la suite completa de 5 pruebas de estrés
export const options = {
  scenarios: {
    // 1. Concurrencia de Inventario
    escenario_1_inventario: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 20 },
        { duration: '15s', target: 80 },
        { duration: '5s', target: 0 },
      ],
      exec: 'pruebaInventario',
    },
    // 2. Scoring Crédito Propio (SLA < 500ms)
    escenario_2_scoring_bnpl: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 30 },
        { duration: '15s', target: 120 },
        { duration: '5s', target: 0 },
      ],
      exec: 'pruebaScoring',
    },
    // 3. Notificaciones Reactivas
    escenario_3_notificaciones: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 20 },
        { duration: '15s', target: 80 },
        { duration: '5s', target: 0 },
      ],
      exec: 'pruebaNotificaciones',
    },
    // 4. Resiliencia PayKlik
    escenario_4_payklik: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 20 },
        { duration: '15s', target: 80 },
        { duration: '5s', target: 0 },
      ],
      exec: 'pruebaPayKlik',
    },
    // 5. Flujo Integral Omnicanal
    escenario_5_flujo_integral: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 15 },
        { duration: '15s', target: 60 },
        { duration: '5s', target: 0 },
      ],
      exec: 'pruebaFlujoIntegral',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<800'],
    'http_req_failed': ['rate<0.02'],
  },
};

const HOST_ORDENES = __ENV.HOST_ORDENES || 'http://localhost:8081';
const HOST_INVENTARIO = __ENV.HOST_INVENTARIO || 'http://localhost:8082';
const HOST_PAGOS = __ENV.HOST_PAGOS || 'http://localhost:8083';
const HOST_NOTIFICACIONES = __ENV.HOST_NOTIFICACIONES || 'http://localhost:8086';

// 1. Escenario Inventario
export function pruebaInventario() {
  const payload = JSON.stringify({
    clienteId: `CLI-ESTRES-${__VU}`,
    clienteNombre: `Cliente Test ${__VU}`,
    canal: 'WEB',
    metodoPago: 'CREDITO_PROPIO_30D',
    metodoEntrega: 'DELIVERY',
    direccion: 'Zona 10, Guatemala',
    items: [{ id: 'PROD-001', nombre: 'Laptop Dell Pro', precio: 4500.0, cantidad: 1 }]
  });
  const res = http.post(`${HOST_ORDENES}/api/ordenes`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, { 'Inventario/Orden no colapsa (< 500)': (r) => r.status < 500 });
  sleep(0.1);
}

// 2. Escenario Scoring BNPL
export function pruebaScoring() {
  const payload = JSON.stringify({ clienteId: `CLI-${__VU}`, montoOrden: 1500.0 });
  const res = http.post(`${HOST_ORDENES}/api/credito/evaluar`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, {
    'Scoring Status 200': (r) => r.status === 200,
    'Scoring < 500ms (QA-1)': (r) => r.timings.duration < 500,
  });
  sleep(0.1);
}

// 3. Escenario Notificaciones Reactivas
export function pruebaNotificaciones() {
  const payload = JSON.stringify({
    tipo: 'credito.aprobado',
    ordenId: `ORD-${__VU}`,
    titulo: 'Alerta Reactiva',
    mensaje: 'Crédito evaluado exitosamente',
    estado: 'PROCESANDO'
  });
  const res = http.post(`${HOST_NOTIFICACIONES}/api/notificaciones/simular`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, { 'Notificaciones responde 200': (r) => r.status === 200 });
  sleep(0.1);
}

// 4. Escenario PayKlik
export function pruebaPayKlik() {
  const payload = JSON.stringify({
    ordenId: `ORD-PK-${__VU}`,
    monto: 1250.0,
    numeroTarjeta: '4111111111111111'
  });
  const res = http.post(`${HOST_PAGOS}/api/payklik/cobrar`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, { 'Pasarela responde < 500': (r) => r.status < 500 });
  sleep(0.1);
}

// 5. Escenario Flujo Integral
export function pruebaFlujoIntegral() {
  // Catálogo
  http.get(`${HOST_INVENTARIO}/api/inventario/unificado`);
  // Scoring
  http.post(`${HOST_ORDENES}/api/credito/evaluar`, JSON.stringify({ clienteId: `CLI-${__VU}`, montoOrden: 2000.0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
  // Orden
  const resOrden = http.post(`${HOST_ORDENES}/api/ordenes`, JSON.stringify({
    clienteId: `CLI-${__VU}`,
    canal: 'WEB',
    metodoPago: 'PAYKLIK',
    items: [{ id: 'PROD-001', cantidad: 1 }]
  }), { headers: { 'Content-Type': 'application/json' } });
  check(resOrden, { 'Orden procesada': (r) => r.status < 500 });
  sleep(0.2);
}
