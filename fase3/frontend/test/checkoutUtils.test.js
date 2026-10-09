import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validarElegibilidadCredito,
  calcularVencimientoCredito,
  formatearDetalleBNPL,
  filtrarMetodosPagoDisponibles,
  validarFormularioCheckout
} from '../src/utils/checkoutUtils.js';

describe('Suite de 5 Pruebas Unitarias — Checkout y Crédito Propio (BNPL) - Carné 202300712', () => {

  // PRUEBA UNITARIA 1: Validación de Elegibilidad Crediticia
  test('1. validarElegibilidadCredito: aprueba únicamente cuando el score >= 70 y la orden no excede el saldo', () => {
    const clienteBueno = { id: 1, nombre: 'Ana Gómez', creditScore: 85 };
    const clienteMalo = { id: 2, nombre: 'Carlos Riesgo', creditScore: 45 };

    // Caso 1: Aprobado (score 85 >= 70 y total Q1,500 <= Q3,000)
    assert.strictEqual(validarElegibilidadCredito(clienteBueno, 1500, 3000), true);

    // Caso 2: Denegado por saldo insuficiente (total Q4,000 > Q3,000)
    assert.strictEqual(validarElegibilidadCredito(clienteBueno, 4000, 3000), false);

    // Caso 3: Denegado por mal score crediticio (score 45 < 70)
    assert.strictEqual(validarElegibilidadCredito(clienteMalo, 500, 3000), false);
  });

  // PRUEBA UNITARIA 2: Cálculo de Fecha de Vencimiento a 30 Días
  test('2. calcularVencimientoCredito: suma exactamente 30 días respetando cambios de mes', () => {
    // 06 de Octubre de 2026 + 30 días = 05 de Noviembre de 2026
    const fechaInicio = '2026-10-06T12:00:00Z';
    const vencimiento = calcularVencimientoCredito(fechaInicio, 30);
    assert.strictEqual(vencimiento, '2026-11-05');

    // Validación de error ante entrada inválida
    assert.throws(() => calcularVencimientoCredito('fecha-invalida'), /Fecha base inválida/);
  });

  // PRUEBA UNITARIA 3: Estructura Financiera BNPL (0% Interés y Desglose)
  test('3. formatearDetalleBNPL: genera desglose con 0% recargo y plazo de 30 días', () => {
    const total = 1299.50;
    const fechaVence = '2026-11-05';
    const detalle = formatearDetalleBNPL(total, 30, fechaVence);

    assert.strictEqual(detalle.metodo, 'CREDITO_PROPIO_30D');
    assert.strictEqual(detalle.montoFinanciado, 1299.50);
    assert.strictEqual(detalle.tasaInteres, 0.00);
    assert.strictEqual(detalle.recargoApertura, 0.00);
    assert.strictEqual(detalle.plazoDias, 30);
    assert.strictEqual(detalle.fechaLimitePago, fechaVence);
    assert.match(detalle.descripcion, /Paga Q1299.50 sin intereses/);
  });

  // PRUEBA UNITARIA 4: Filtrado Dinámico de Métodos de Pago según Scoring
  test('4. filtrarMetodosPagoDisponibles: antepone credito_propio si califica y lo excluye si no', () => {
    const metodosBase = ['payklik', 'transferencia', 'billetera'];

    // Cliente apto: credito_propio aparece como primera opción destacada
    const listaConCredito = filtrarMetodosPagoDisponibles(metodosBase, true);
    assert.strictEqual(listaConCredito[0], 'credito_propio');
    assert.strictEqual(listaConCredito.length, 4);

    // Cliente no apto: no contiene credito_propio
    const listaSinCredito = filtrarMetodosPagoDisponibles(metodosBase, false);
    assert.strictEqual(listaSinCredito.includes('credito_propio'), false);
    assert.strictEqual(listaSinCredito.length, 3);
  });

  // PRUEBA UNITARIA 5: Validación de Campos de Formulario Checkout
  test('5. validarFormularioCheckout: no exige tarjeta de crédito cuando el método es credito_propio', () => {
    const envioValido = {
      nombreCompleto: 'Melvin García',
      telefono: '5555-1234',
      tipoEntrega: 'domicilio',
      direccion: 'Ciudad de Guatemala'
    };

    // Caso A: Con crédito propio, no necesita tarjeta -> Válido
    const resCredito = validarFormularioCheckout(envioValido, 'credito_propio', {});
    assert.strictEqual(resCredito.valido, true);

    // Caso B: Con PayKlik manual sin tarjeta -> Inválido
    const resPayKlik = validarFormularioCheckout(envioValido, 'payklik', { manual: true, numero: '' });
    assert.strictEqual(resPayKlik.valido, false);
    assert.strictEqual(resPayKlik.error, 'Número de tarjeta inválido');

    // Caso C: Datos de contacto incompletos -> Inválido
    const resIncompleto = validarFormularioCheckout({ nombreCompleto: '' }, 'credito_propio');
    assert.strictEqual(resIncompleto.valido, false);
    assert.strictEqual(resIncompleto.error, 'Por favor completa tus datos de contacto');
  });

});
