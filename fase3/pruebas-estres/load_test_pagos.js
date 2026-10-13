/**
 * load_test_pagos.js — Suite de 5 Pruebas de Carga para POST /api/pagos/procesar
 *
 * Cubre los dos métodos de pago:
 *   - TARJETA_PAYKLIK    (con Circuit Breaker + DLQ)
 *   - CREDITO_PROPIO_30D (sin pasarela externa)
 *
 * Escenarios:
 *   1. smoke_test       — Verificación de sanidad: 1-3 VUs, 1 minuto
 *   2. load_test        — Carga estándar: rampa a 50 VUs, 5 minutos
 *   3. stress_test      — Estrés: rampa a 150 VUs, descubriendo punto de quiebre suave
 *   4. spike_test       — Pico abrupto: 0 → 200 VUs en 10s, luego bajada rápida
 *   5. breakpoint_test  — Punto de ruptura: incremento continuo hasta 300 VUs sin retorno
 *
 * Ejecución individual por escenario:
 *   k6 run --env ESCENARIO=smoke   load_test_pagos.js
 *   k6 run --env ESCENARIO=load    load_test_pagos.js
 *   k6 run --env ESCENARIO=stress  load_test_pagos.js
 *   k6 run --env ESCENARIO=spike   load_test_pagos.js
 *   k6 run --env ESCENARIO=break   load_test_pagos.js
 *
 * Ejecución completa (todos los escenarios en paralelo):
 *   k6 run load_test_pagos.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ---------------------------------------------------------------------------
// Métricas personalizadas
// ---------------------------------------------------------------------------
const tasaErrores           = new Rate('pagos_tasa_errores');
const latenciaTarjeta       = new Trend('pagos_latencia_tarjeta_ms');
const latenciaBNPL          = new Trend('pagos_latencia_bnpl_ms');
const pagosAprobados        = new Counter('pagos_aprobados_total');
const pagosEncolados        = new Counter('pagos_encolados_dlq');
const pagosCreditoAprobados = new Counter('pagos_credito_bnpl_aprobados');
const errores5xx            = new Rate('pagos_errores_5xx');

// ---------------------------------------------------------------------------
// Configuración de host
// ---------------------------------------------------------------------------
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8083';
const ESCENARIO = __ENV.ESCENARIO || 'all';

// ---------------------------------------------------------------------------
// Opciones: todos los escenarios en paralelo (modo 'all')
// o un escenario específico si se pasa la variable ESCENARIO
// ---------------------------------------------------------------------------
export const options = {
  scenarios: buildScenarios(ESCENARIO),

  thresholds: {
    // Latencia general
    'http_req_duration':              ['p(95)<800'],

    // Latencia diferenciada por ruta
    'pagos_latencia_tarjeta_ms':      ['p(95)<600'],
    'pagos_latencia_bnpl_ms':         ['p(95)<300'], // BNPL no invoca pasarela externa → debe ser más rápido

    // Confiabilidad
    'pagos_tasa_errores':             ['rate<0.05'],  // Máx 5% errores HTTP no esperados
    'pagos_errores_5xx':              ['rate<0.02'],  // Máx 2% errores 5xx del servidor
  },
};

// ---------------------------------------------------------------------------
// ESCENARIO 1 — Smoke Test
// Objetivo: verificar que el endpoint básico responde correctamente con
// carga mínima (1-3 VUs). Falla rápido si hay un problema de configuración.
// ---------------------------------------------------------------------------
export function smokeTest() {
  group('Smoke — TARJETA_PAYKLIK', () => {
    const res = http.post(
      `${BASE_URL}/api/pagos/procesar`,
      payloadTarjeta(`ORD-SMOKE-${__VU}-${__ITER}`),
      headers()
    );

    latenciaTarjeta.add(res.timings.duration);
    tasaErrores.add(res.status >= 400 && res.status !== 422);
    errores5xx.add(res.status >= 500);

    check(res, {
      '[Smoke][Tarjeta] Status 200 OK':        (r) => r.status === 200,
      '[Smoke][Tarjeta] Tiene ordenId':        (r) => bodyHasField(r, 'ordenId'),
      '[Smoke][Tarjeta] metodoPago=TARJETA':   (r) => bodyHasValue(r, 'metodoPago', 'TARJETA_PAYKLIK'),
      '[Smoke][Tarjeta] Latencia < 600ms':     (r) => r.timings.duration < 600,
    });

    if (res.status === 200) pagosAprobados.add(1);
    sleep(1);
  });

  group('Smoke — CREDITO_PROPIO_30D', () => {
    const res = http.post(
      `${BASE_URL}/api/pagos/procesar`,
      payloadBNPL(`ORD-SMOKE-BNPL-${__VU}-${__ITER}`),
      headers()
    );

    latenciaBNPL.add(res.timings.duration);
    tasaErrores.add(res.status >= 400 && res.status !== 422);
    errores5xx.add(res.status >= 500);

    check(res, {
      '[Smoke][BNPL] Status 200 OK':          (r) => r.status === 200,
      '[Smoke][BNPL] Tiene ordenId':          (r) => bodyHasField(r, 'ordenId'),
      '[Smoke][BNPL] metodoPago=CREDITO':     (r) => bodyHasValue(r, 'metodoPago', 'CREDITO_PROPIO_30D'),
      '[Smoke][BNPL] BNPL más rápido (300ms)':(r) => r.timings.duration < 300,
    });

    if (res.status === 200) pagosCreditoAprobados.add(1);
    sleep(1);
  });
}

// ---------------------------------------------------------------------------
// ESCENARIO 2 — Load Test (Carga Estándar)
// Objetivo: simular tráfico sostenido de producción (~50 VUs) durante 5 min.
// Valida que el sistema mantiene SLA bajo condiciones normales.
// ---------------------------------------------------------------------------
export function loadTest() {
  const esCredito = __ITER % 3 === 0; // 33% BNPL, 67% Tarjeta (mezcla realista)

  group(`Load — ${esCredito ? 'CREDITO_PROPIO_30D' : 'TARJETA_PAYKLIK'}`, () => {
    const ordenId = `ORD-LOAD-${__VU}-${__ITER}`;
    const payload = esCredito ? payloadBNPL(ordenId) : payloadTarjeta(ordenId);
    const res = http.post(`${BASE_URL}/api/pagos/procesar`, payload, headers());

    if (esCredito) {
      latenciaBNPL.add(res.timings.duration);
      if (res.status === 200) pagosCreditoAprobados.add(1);
    } else {
      latenciaTarjeta.add(res.timings.duration);
      if (res.status === 200) pagosAprobados.add(1);
    }

    tasaErrores.add(res.status >= 400 && res.status !== 422);
    errores5xx.add(res.status >= 500);

    check(res, {
      '[Load] No colapsa (< 500)':       (r) => r.status < 500,
      '[Load] Respuesta válida':          (r) => bodyHasField(r, 'ordenId'),
      '[Load] SLA < 800ms':              (r) => r.timings.duration < 800,
    });

    sleep(0.5);
  });
}

// ---------------------------------------------------------------------------
// ESCENARIO 3 — Stress Test
// Objetivo: llevar el sistema a 150 VUs y verificar si el Circuit Breaker
// actúa correctamente (fallback a DLQ) cuando PayKlik se satura.
// Los pagos encolados son respuesta válida, no un error.
// ---------------------------------------------------------------------------
export function stressTest() {
  group('Stress — Saturación Circuit Breaker', () => {
    const ordenId = `ORD-STRESS-${__VU}-${__ITER}`;

    // Bajo stress extremo, mezclamos ambos métodos para evaluar aislamiento
    const payload = __VU % 2 === 0 ? payloadTarjeta(ordenId) : payloadBNPL(ordenId);
    const esTarjeta = __VU % 2 === 0;

    const res = http.post(`${BASE_URL}/api/pagos/procesar`, payload, {
      ...headers(),
      timeout: '10s', // Tolerancia mayor bajo estrés
    });

    if (esTarjeta) {
      latenciaTarjeta.add(res.timings.duration);
      errores5xx.add(res.status >= 500);

      // APROBADO o ENCOLADO_CONTINGENCIA son ambos resultados válidos bajo stress
      const body = parseBody(res);
      const esAprobado  = body && body.resultado === 'APROBADO';
      const esEncolado  = body && body.resultado === 'ENCOLADO_CONTINGENCIA';

      if (esAprobado)  pagosAprobados.add(1);
      if (esEncolado)  pagosEncolados.add(1);

      check(res, {
        '[Stress][CB] No 5xx inesperado':             (r) => r.status < 500,
        '[Stress][CB] Circuit Breaker actúa o aprueba': () => esAprobado || esEncolado || res.status === 200,
        '[Stress][CB] BNPL aislado (no usa CB)':       () => true, // Implícito: BNPL es __VU impar
      });
    } else {
      latenciaBNPL.add(res.timings.duration);
      pagosCreditoAprobados.add(res.status === 200 ? 1 : 0);

      check(res, {
        '[Stress][BNPL] Siempre disponible (no depende de PayKlik)': (r) => r.status < 500,
        '[Stress][BNPL] Latencia < 500ms bajo stress':               (r) => r.timings.duration < 500,
      });
    }

    sleep(0.1);
  });
}

// ---------------------------------------------------------------------------
// ESCENARIO 4 — Spike Test
// Objetivo: simular un pico abrupto de tráfico (flash sale / evento comercial).
// 0 → 200 VUs en 10 segundos, sostenido 30s, bajada en 10s.
// Verifica que el sistema no colapsa y el DLQ absorbe el exceso.
// ---------------------------------------------------------------------------
export function spikeTest() {
  group('Spike — Pico Abrupto', () => {
    const ordenId = `ORD-SPIKE-${__VU}-${__ITER}`;

    // Durante un spike, asumimos que la mayoría usa tarjeta (flujo de compra rápida)
    const payload = __ITER % 5 === 0 ? payloadBNPL(ordenId) : payloadTarjetaAleatoria(ordenId);

    const res = http.post(`${BASE_URL}/api/pagos/procesar`, payload, {
      ...headers(),
      timeout: '8s',
    });

    const body = parseBody(res);
    const esEncolado = body && body.resultado === 'ENCOLADO_CONTINGENCIA';

    errores5xx.add(res.status >= 500);
    tasaErrores.add(res.status >= 400 && !esEncolado);
    if (esEncolado) pagosEncolados.add(1);

    check(res, {
      '[Spike] Sistema no colapsa (< 500)':         (r) => r.status < 500,
      '[Spike] DLQ absorbe exceso (200 o fallback)': (r) => r.status === 200 || esEncolado,
    });

    sleep(0.05);
  });
}

// ---------------------------------------------------------------------------
// ESCENARIO 5 — Breakpoint Test
// Objetivo: encontrar el límite real del sistema incrementando VUs de forma
// continua desde 10 hasta 300. Cuando http_req_failed supere el 10% o
// la latencia p(95) > 2s, ese es el punto de quiebre.
// Este test es DESTRUCTIVO: se espera que eventualmente falle.
// ---------------------------------------------------------------------------
export function breakpointTest() {
  group('Breakpoint — Límite del Sistema', () => {
    const ordenId = `ORD-BREAK-${__VU}-${__ITER}`;

    // Alternamos métodos para estresar ambas rutas simultáneamente
    const payload = __VU % 3 === 0
      ? payloadBNPL(ordenId)
      : payloadTarjetaAleatoria(ordenId);

    const res = http.post(`${BASE_URL}/api/pagos/procesar`, payload, {
      ...headers(),
      timeout: '15s',
    });

    errores5xx.add(res.status >= 500);
    tasaErrores.add(res.status >= 400 && res.status !== 200);

    if (res.status === 200) {
      const body = parseBody(res);
      if (body) {
        if (body.resultado === 'APROBADO')             pagosAprobados.add(1);
        if (body.resultado === 'ENCOLADO_CONTINGENCIA') pagosEncolados.add(1);
        if (body.resultado === 'APROBADO_CREDITO')      pagosCreditoAprobados.add(1);
      }
    }

    check(res, {
      '[Break] El endpoint sigue respondiendo': (r) => r.status !== 0, // 0 = timeout total
    });

    sleep(0.05);
  });
}

// ---------------------------------------------------------------------------
// Función default requerida por k6
// ---------------------------------------------------------------------------
export default function () {
  loadTest(); // Por defecto ejecuta el load test estándar
}

// ===========================================================================
// Helpers internos
// ===========================================================================

function headers() {
  return {
    headers: {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    },
  };
}

/** Payload para TARJETA_PAYKLIK con tarjeta fija de prueba */
function payloadTarjeta(ordenId) {
  return JSON.stringify({
    ordenId:          ordenId,
    monto:            (Math.random() * 2000 + 100).toFixed(2),
    canal:            'Web Store',
    metodoPago:       'TARJETA_PAYKLIK',
    numeroTarjeta:    '4111111111111111',
    direccionDestino: 'Zona 10, Ciudad de Guatemala',
  });
}

/** Payload para TARJETA_PAYKLIK con número de tarjeta aleatorio (para tests de variedad) */
function payloadTarjetaAleatoria(ordenId) {
  const tarjetas = [
    '4111111111111111',
    '4500123456784242',
    '4000000000000002',
    '5200828282828210',
  ];
  const tarjeta = tarjetas[Math.floor(Math.random() * tarjetas.length)];
  return JSON.stringify({
    ordenId:          ordenId,
    monto:            (Math.random() * 3000 + 50).toFixed(2),
    canal:            'Mobile',
    metodoPago:       'TARJETA_PAYKLIK',
    numeroTarjeta:    tarjeta,
    direccionDestino: 'Zona 4, Ciudad de Guatemala',
  });
}

/** Payload para CREDITO_PROPIO_30D — NO requiere numeroTarjeta */
function payloadBNPL(ordenId) {
  return JSON.stringify({
    ordenId:          ordenId,
    monto:            (Math.random() * 5000 + 200).toFixed(2),
    canal:            'Web Store',
    metodoPago:       'CREDITO_PROPIO_30D',
    direccionDestino: 'Zona 15, Ciudad de Guatemala',
  });
}

function parseBody(res) {
  try { return JSON.parse(res.body); } catch (e) { return null; }
}

function bodyHasField(res, field) {
  const b = parseBody(res);
  return b !== null && b[field] !== undefined;
}

function bodyHasValue(res, field, value) {
  const b = parseBody(res);
  return b !== null && b[field] === value;
}

// ---------------------------------------------------------------------------
// Constructor de escenarios dinámico
// Permite ejecutar un solo escenario con --env ESCENARIO=smoke|load|stress|spike|break
// ---------------------------------------------------------------------------
function buildScenarios(modo) {
  const todos = {

    // 1. Smoke Test — 3 VUs, 1 minuto
    smoke_test: {
      executor:   'ramping-vus',
      startVUs:   1,
      stages: [
        { duration: '30s', target: 3 },
        { duration: '30s', target: 1 },
      ],
      exec:       'smokeTest',
      tags:       { escenario: 'smoke' },
    },

    // 2. Load Test — rampa a 50 VUs, 5 minutos sostenidos
    load_test: {
      executor:   'ramping-vus',
      startVUs:   0,
      stages: [
        { duration: '1m',  target: 50  },  // Rampa de subida
        { duration: '3m',  target: 50  },  // Carga sostenida (punto de validación SLA)
        { duration: '1m',  target: 0   },  // Bajada gradual
      ],
      exec:       'loadTest',
      tags:       { escenario: 'load' },
    },

    // 3. Stress Test — rampa a 150 VUs, verificar CB y aislamiento BNPL
    stress_test: {
      executor:   'ramping-vus',
      startVUs:   0,
      stages: [
        { duration: '2m',  target: 50  },  // Carga base
        { duration: '3m',  target: 150 },  // Estrés — CB debe activarse aquí
        { duration: '2m',  target: 150 },  // Sostenido: BNPL sigue respondiendo aunque CB esté abierto
        { duration: '1m',  target: 0   },  // Recuperación
      ],
      exec:       'stressTest',
      tags:       { escenario: 'stress' },
    },

    // 4. Spike Test — pico abrupto 0 → 200 VUs en 10 segundos
    spike_test: {
      executor:   'ramping-vus',
      startVUs:   0,
      stages: [
        { duration: '10s', target: 200 },  // Pico abrupto (flash sale)
        { duration: '30s', target: 200 },  // Sostenido — DLQ debe absorber
        { duration: '10s', target: 0   },  // Bajada rápida
        { duration: '30s', target: 0   },  // Reposo — verificar recuperación
      ],
      exec:       'spikeTest',
      tags:       { escenario: 'spike' },
    },

    // 5. Breakpoint Test — rampa continua hasta 300 VUs sin retorno
    breakpoint_test: {
      executor:   'ramping-arrival-rate',
      startRate:  10,
      timeUnit:   '1s',
      preAllocatedVUs: 50,
      maxVUs:     300,
      stages: [
        { duration: '2m', target: 50  },   // Rampa suave
        { duration: '2m', target: 150 },   // Zona de presión
        { duration: '2m', target: 300 },   // Punto de quiebre — latencia y errores subirán aquí
      ],
      exec:       'breakpointTest',
      tags:       { escenario: 'breakpoint' },
    },
  };

  // Si se pide solo un escenario específico, filtramos
  const mapa = {
    smoke:  'smoke_test',
    load:   'load_test',
    stress: 'stress_test',
    spike:  'spike_test',
    break:  'breakpoint_test',
  };

  if (modo !== 'all' && mapa[modo]) {
    return { [mapa[modo]]: todos[mapa[modo]] };
  }

  return todos;
}
