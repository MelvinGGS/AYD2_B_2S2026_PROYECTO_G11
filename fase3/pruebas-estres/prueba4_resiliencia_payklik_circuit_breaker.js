import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas de la pasarela y resiliencia
const transaccionesAutorizadas = new Counter('pagos_payklik_autorizados');
const transaccionesRechazadas = new Counter('pagos_payklik_rechazados_controlados');
const latenciaCobro = new Trend('latencia_cobro_payklik_ms');
const erroresCriticos = new Rate('errores_criticos_pasarela_5xx');

export const options = {
  stages: [
    { duration: '5s', target: 25 },   // Carga inicial
    { duration: '15s', target: 150 }, // Estrés severo hacia la pasarela
    { duration: '15s', target: 200 }, // Saturación límite de concurrencia
    { duration: '5s', target: 0 },    // Recuperación del servicio
  ],
  thresholds: {
    'latencia_cobro_payklik_ms': ['p(95)<400'],
    'errores_criticos_pasarela_5xx': ['rate<0.01'],
    'http_req_duration': ['p(95)<400'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8083';

export default function () {
  const i = Math.floor(Math.random() * 100);
  // Simular transacciones normales y ocasionales montos límite
  const monto = i % 15 === 0 ? 0.0 : (Math.random() * 2500 + 50).toFixed(2);

  const payload = JSON.stringify({
    ordenId: `ORD-PK-${__VU}-${__ITER}`,
    monto: parseFloat(monto),
    numeroTarjeta: '4111111111111111',
    cvv: '123',
    titular: 'Usuario Concurrente PayKlik'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: '4s'
  };

  const res = http.post(`${BASE_URL}/api/payklik/cobrar`, payload, params);

  latenciaCobro.add(res.timings.duration);
  const es5xx = res.status >= 500;
  erroresCriticos.add(es5xx);

  if (res.status === 200) {
    transaccionesAutorizadas.add(1);
  } else if (res.status === 400) {
    transaccionesRechazadas.add(1);
  }

  check(res, {
    'Pasarela responde sin colapso (no 5xx)': (r) => r.status < 500,
    'Respuesta estructurada de cobro': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(0.08);
}
