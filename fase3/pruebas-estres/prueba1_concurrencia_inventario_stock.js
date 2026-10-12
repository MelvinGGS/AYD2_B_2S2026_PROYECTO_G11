import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas personalizadas
const fallasServidor = new Rate('fallas_servidor_5xx');
const tiempoRespuesta = new Trend('tiempo_creacion_orden_ms');
const ordenesCreadas = new Counter('ordenes_creadas_exitosas');
const conflictosStock = new Counter('conflictos_stock_concurrencia');

// Configuración de la prueba de estrés (Spike & Concurrency)
export const options = {
  stages: [
    { duration: '5s', target: 20 },   // Calentamiento rápido
    { duration: '15s', target: 120 }, // Ráfaga de estrés concurrente (120 VUs compitiendo por SKU)
    { duration: '15s', target: 120 }, // Carga sostenida en el límite
    { duration: '5s', target: 0 },    // Enfriamiento
  ],
  thresholds: {
    // SLA de rendimiento: 95% de peticiones bajo 800 ms
    'tiempo_creacion_orden_ms': ['p(95)<800'],
    // Cero caídas catastróficas del microservicio (5xx)
    'fallas_servidor_5xx': ['rate<0.01'],
    'http_req_duration': ['p(95)<800'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081';

export default function () {
  const clienteNum = Math.floor(Math.random() * 50) + 1;
  const payload = JSON.stringify({
    clienteId: `CLI-${clienteNum}`,
    clienteNombre: `Cliente Estrés ${clienteNum}`,
    canal: 'WEB',
    metodoPago: clienteNum % 2 === 0 ? 'CREDITO_PROPIO_30D' : 'PAYKLIK',
    metodoEntrega: 'DELIVERY',
    direccion: 'Zona 10, Ciudad de Guatemala',
    items: [
      {
        id: 'PROD-001',
        nombre: 'Laptop Dell Pro',
        descripcion: 'Laptop de alta gama',
        precio: 4500.0,
        cantidad: 1,
        imagen: 'laptop.jpg'
      }
    ]
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: '5s',
  };

  const res = http.post(`${BASE_URL}/api/ordenes`, payload, params);

  // Registrar métricas
  tiempoRespuesta.add(res.timings.duration);
  const esError5xx = res.status >= 500;
  fallasServidor.add(esError5xx);

  if (res.status === 200 || res.status === 201) {
    ordenesCreadas.add(1);
  } else if (res.status === 409 || res.status === 400) {
    // Conflicto de bloqueo optimista o stock agotado controlado
    conflictosStock.add(1);
  }

  check(res, {
    'Estado HTTP no es 5xx (Microservicio resiste)': (r) => r.status < 500,
    'Respuesta contiene ordenId o control de error': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id !== undefined || body.ordenId !== undefined || body.error !== undefined || body.mensaje !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(0.1); // Peticiones en ráfaga rápida
}
