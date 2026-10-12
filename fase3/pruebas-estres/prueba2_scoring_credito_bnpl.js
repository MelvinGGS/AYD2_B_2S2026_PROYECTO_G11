import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas del Motor de Scoring (QA-1)
const tasaError = new Rate('tasa_errores_scoring');
const latenciaScoring = new Trend('latencia_evaluacion_scoring_ms');
const creditosAprobados = new Counter('creditos_evaluados_aprobados');
const creditosRechazados = new Counter('creditos_evaluados_rechazados');

// Configuración de estrés evaluando el SLA estricto de < 500 ms (QA-1)
export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Carga base (50 VUs)
    { duration: '15s', target: 200 }, // Rampa hacia estrés (200 VUs)
    { duration: '15s', target: 250 }, // Pico extremo en el límite (250 VUs)
    { duration: '5s', target: 0 },    // Descenso
  ],
  thresholds: {
    // Driver de rendimiento QA-1: Evaluación de scoring < 500 ms
    'latencia_evaluacion_scoring_ms': ['p(95)<500', 'p(99)<700'],
    'http_req_duration': ['p(95)<500'],
    'tasa_errores_scoring': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081';

export default function () {
  // Casos alternados: clientes elegibles vs no elegibles, y diferentes montos de compra
  const idRandom = Math.floor(Math.random() * 20) + 1;
  const montos = [350.0, 1200.0, 2800.0, 4900.0, 7500.0];
  const monto = montos[Math.floor(Math.random() * montos.length)];

  const payload = JSON.stringify({
    clienteId: `CLI-ESTRES-${idRandom}`,
    montoOrden: monto
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: '3s'
  };

  const res = http.post(`${BASE_URL}/api/credito/evaluar`, payload, params);

  latenciaScoring.add(res.timings.duration);
  const fallo = res.status !== 200;
  tasaError.add(fallo);

  if (res.status === 200) {
    try {
      const data = JSON.parse(res.body);
      if (data.aprobado === true) {
        creditosAprobados.add(1);
      } else {
        creditosRechazados.add(1);
      }
    } catch (e) {}
  }

  check(res, {
    'Status 200 OK en Scoring': (r) => r.status === 200,
    'Cumple SLA QA-1 (< 500ms)': (r) => r.timings.duration < 500,
    'Respuesta incluye campo aprobado': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.aprobado === 'boolean';
      } catch (e) {
        return false;
      }
    },
  });

  sleep(0.05); // Tráfico continuo de alta intensidad
}
