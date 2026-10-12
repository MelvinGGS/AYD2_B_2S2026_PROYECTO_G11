import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas de Notificaciones Reactivas
const fallosConexion = new Rate('fallos_hub_reactivo');
const tiempoRespuestaBroadcast = new Trend('tiempo_broadcast_ms');
const eventosEmpujados = new Counter('eventos_reactivos_emitidos');

export const options = {
  stages: [
    { duration: '5s', target: 30 },   // Conexión inicial
    { duration: '15s', target: 150 }, // Estrés de clientes suscritos y eventos push
    { duration: '15s', target: 200 }, // Límite de concurrencia en Kestrel .NET 8
    { duration: '5s', target: 0 },    // Cierre ordenado
  ],
  thresholds: {
    'fallos_hub_reactivo': ['rate<0.02'],
    'tiempo_broadcast_ms': ['p(95)<400'],
    'http_req_duration': ['p(95)<400'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8086';

export default function () {
  const vuId = __VU;
  const ordenId = `ORD-ESTRES-${Math.floor(Math.random() * 20) + 1}`;

  // 1. Simular inyección masiva de eventos en el bus reactivo
  const eventoPayload = JSON.stringify({
    tipo: vuId % 2 === 0 ? 'credito.aprobado' : 'tracking.estado_cambiado',
    ordenId: ordenId,
    clienteId: `CLI-${vuId}`,
    titulo: 'Actualización en tiempo real',
    mensaje: `Estado de orden actualizado bajo estrés VU ${vuId}`,
    estado: 'EN_RUTA'
  });

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const resSimular = http.post(`${BASE_URL}/api/notificaciones/simular`, eventoPayload, { headers });
  
  tiempoRespuestaBroadcast.add(resSimular.timings.duration);
  const falloSim = resSimular.status !== 200;
  fallosConexion.add(falloSim);

  if (resSimular.status === 200) {
    eventosEmpujados.add(1);
  }

  check(resSimular, {
    'Evento reactivo aceptado (200)': (r) => r.status === 200,
    'Broadcast < 400ms': (r) => r.timings.duration < 400,
  });

  // 2. Consultar estadísticas de carga y clientes del hub
  const resStats = http.get(`${BASE_URL}/api/notificaciones/stats`);
  check(resStats, {
    'Stats del hub disponibles': (r) => r.status === 200,
  });

  sleep(0.1);
}
