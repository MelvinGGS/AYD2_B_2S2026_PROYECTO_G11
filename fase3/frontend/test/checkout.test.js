import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validarElegibilidadCredito,
  calcularVencimientoCredito,
  formatearDetalleBNPL,
  filtrarMetodosPagoDisponibles,
  validarFormularioCheckout
} from '../src/utils/checkoutUtils.js';

describe('Suite de 5 Pruebas Unitarias - Checkout y Credito Propio (BNPL) - Carne 202300712', () => {

  // PRUEBA UNITARIA 1: Validacion de Elegibilidad Crediticia y Casos Borde
  test('1. validarElegibilidadCredito: valida reglas de score y saldo con evaluacion rigurosa de fronteras', () => {
    const clienteBueno = { id: 1, nombre: 'Ana Gomez', creditScore: 85 };
    const clienteMalo = { id: 2, nombre: 'Carlos Riesgo', creditScore: 45 };
    const clienteFronteraExacta = { id: 3, nombre: 'Frontera Score', creditScore: 70 };
    const clienteFronteraBaja = { id: 4, nombre: 'Frontera Reprobada', creditScore: 69 };
    const clienteSinScore = { id: 5, nombre: 'Sin Score Previo' }; // Usa default 80

    // Caso 1: Aprobado estandar (score 85 >= 70 y total Q1,500 <= Q3,000)
    assert.strictEqual(validarElegibilidadCredito(clienteBueno, 1500, 3000), true);

    // Caso 2: Denegado por saldo insuficiente (total Q4,000 > Q3,000)
    assert.strictEqual(validarElegibilidadCredito(clienteBueno, 4000, 3000), false);

    // Caso 3: Denegado por mal score crediticio (score 45 < 70)
    assert.strictEqual(validarElegibilidadCredito(clienteMalo, 500, 3000), false);

    // Caso 4: Frontera exacta aprobatoria (score exacto 70)
    assert.strictEqual(validarElegibilidadCredito(clienteFronteraExacta, 2000, 2000), true);

    // Caso 5: Frontera inferior reprobada (score 69)
    assert.strictEqual(validarElegibilidadCredito(clienteFronteraBaja, 100, 5000), false);

    // Caso 6: Saldo disponible exactamente igual al total de orden
    assert.strictEqual(validarElegibilidadCredito(clienteBueno, 3500, 3500), true);

    // Caso 7: Cliente sin campo creditScore utiliza valor predeterminado 80 (aprobado si monto es valido)
    assert.strictEqual(validarElegibilidadCredito(clienteSinScore, 1000, 2000), true);

    // Caso 8: Entradas nulas, montos negativos o valores no numericos
    assert.strictEqual(validarElegibilidadCredito(null, 1500, 3000), false);
    assert.strictEqual(validarElegibilidadCredito(undefined, 1500, 3000), false);
    assert.strictEqual(validarElegibilidadCredito(clienteBueno, -500, 3000), false);
    assert.strictEqual(validarElegibilidadCredito(clienteBueno, 0, 3000), false);
    assert.strictEqual(validarElegibilidadCredito(clienteBueno, 'invalido', 3000), false);
    assert.strictEqual(validarElegibilidadCredito(clienteBueno, 1500, -100), false);
  });

  // PRUEBA UNITARIA 2: Calculo de Fecha de Vencimiento a 30 Dias y Robustez Temporal
  test('2. calcularVencimientoCredito: suma exactamente 30 dias respetando cambios de mes y plazo variable', () => {
    // 06 de Octubre de 2026 + 30 dias = 05 de Noviembre de 2026
    const fechaInicioOctubre = '2026-10-06T12:00:00Z';
    const vencimientoOctubre = calcularVencimientoCredito(fechaInicioOctubre, 30);
    assert.strictEqual(vencimientoOctubre, '2026-11-05');

    // 15 de Febrero de 2026 + 30 dias = 17 de Marzo de 2026 (ano no bisiesto de 28 dias)
    const fechaFebrero = '2026-02-15T12:00:00Z';
    assert.strictEqual(calcularVencimientoCredito(fechaFebrero, 30), '2026-03-17');

    // Fin de ano: 15 de Diciembre de 2026 + 30 dias = 14 de Enero de 2027
    const fechaFinAno = '2026-12-15T12:00:00Z';
    assert.strictEqual(calcularVencimientoCredito(fechaFinAno, 30), '2027-01-14');

    // Plazo por defecto (30 dias) omitiendo segundo argumento
    assert.strictEqual(calcularVencimientoCredito('2026-05-01T12:00:00Z'), '2026-05-31');

    // Plazo personalizado (60 dias)
    assert.strictEqual(calcularVencimientoCredito('2026-01-01T12:00:00Z', 60), '2026-03-02');

    // Validacion de error ante fecha invalida
    assert.throws(() => calcularVencimientoCredito('fecha-invalida'), /Fecha base inválida/);
    assert.throws(() => calcularVencimientoCredito(''), /Fecha base inválida/);
  });

  // PRUEBA UNITARIA 3: Estructura Financiera BNPL (0% Interes, Precision y Desglose)
  test('3. formatearDetalleBNPL: genera desglose con 0% recargo, 2 decimales y gestion de errores', () => {
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

    // Verificacion de redondeo a 2 decimales
    const detalleDecimal = formatearDetalleBNPL(99.999, 30, '2026-11-05');
    assert.strictEqual(detalleDecimal.montoFinanciado, 100.00);

    // Casos de excepcion: monto invalido, cero o negativo
    assert.throws(() => formatearDetalleBNPL(0, 30, fechaVence), /Monto de orden inválido/);
    assert.throws(() => formatearDetalleBNPL(-150, 30, fechaVence), /Monto de orden inválido/);
    assert.throws(() => formatearDetalleBNPL('cien', 30, fechaVence), /Monto de orden inválido/);
  });

  // PRUEBA UNITARIA 4: Filtrado Dinamico de Metodos de Pago segun Scoring
  test('4. filtrarMetodosPagoDisponibles: antepone credito_propio si califica y lo excluye si no califica', () => {
    const metodosBase = ['payklik', 'transferencia', 'billetera'];

    // Cliente apto: credito_propio aparece como primera opcion destacada sin duplicar
    const listaConCredito = filtrarMetodosPagoDisponibles(metodosBase, true);
    assert.strictEqual(listaConCredito[0], 'credito_propio');
    assert.strictEqual(listaConCredito.length, 4);

    // Cliente apto cuando credito_propio ya estaba en la lista: no duplica
    const listaYaIncluida = filtrarMetodosPagoDisponibles(['credito_propio', 'payklik'], true);
    assert.strictEqual(listaYaIncluida[0], 'credito_propio');
    assert.strictEqual(listaYaIncluida.filter(m => m === 'credito_propio').length, 1);

    // Cliente no apto: no contiene credito_propio
    const listaSinCredito = filtrarMetodosPagoDisponibles(metodosBase, false);
    assert.strictEqual(listaSinCredito.includes('credito_propio'), false);
    assert.strictEqual(listaSinCredito.length, 3);

    // Cliente no apto pero el arreglo base contenia credito_propio: debe removerse forzosamente
    const listaForzada = filtrarMetodosPagoDisponibles(['credito_propio', 'payklik'], false);
    assert.strictEqual(listaForzada.includes('credito_propio'), false);
    assert.deepStrictEqual(listaForzada, ['payklik']);

    // Resiliencia ante entrada invalida (no arreglo)
    assert.deepStrictEqual(filtrarMetodosPagoDisponibles(null, true), []);
    assert.deepStrictEqual(filtrarMetodosPagoDisponibles(undefined, false), []);
  });

  // PRUEBA UNITARIA 5: Validacion de Campos de Formulario Checkout
  test('5. validarFormularioCheckout: exime tarjeta para credito_propio y valida reglas de contacto y entrega', () => {
    const envioDomicilioValido = {
      nombreCompleto: 'Melvin Garcia',
      telefono: '5555-1234',
      tipoEntrega: 'domicilio',
      direccion: 'Ciudad de Guatemala'
    };

    const envioTiendaValido = {
      nombreCompleto: 'Melvin Garcia',
      telefono: '5555-1234',
      tipoEntrega: 'tienda',
      direccion: ''
    };

    // Caso A: Con credito propio y envio a domicilio -> Valido sin requerir tarjeta
    const resCredito = validarFormularioCheckout(envioDomicilioValido, 'credito_propio', {});
    assert.strictEqual(resCredito.valido, true);

    // Caso B: Con credito propio y recogida en tienda sin direccion -> Valido
    const resCreditoTienda = validarFormularioCheckout(envioTiendaValido, 'credito_propio');
    assert.strictEqual(resCreditoTienda.valido, true);

    // Caso C: Datos de contacto incompletos (nombre faltante) -> Invalido
    const resSinNombre = validarFormularioCheckout({ nombreCompleto: '', telefono: '5555-1234' }, 'credito_propio');
    assert.strictEqual(resSinNombre.valido, false);
    assert.strictEqual(resSinNombre.error, 'Por favor completa tus datos de contacto');

    // Caso D: Envio a domicilio sin direccion obligatoria -> Invalido
    const resSinDireccion = validarFormularioCheckout(
      { nombreCompleto: 'Melvin Garcia', telefono: '5555-1234', tipoEntrega: 'domicilio', direccion: '' },
      'credito_propio'
    );
    assert.strictEqual(resSinDireccion.valido, false);
    assert.strictEqual(resSinDireccion.error, 'La dirección de entrega es obligatoria para envío a domicilio');

    // Caso E: PayKlik con tarjeta guardada (manual = false) -> Valido
    const resPayKlikToken = validarFormularioCheckout(envioDomicilioValido, 'payklik', { manual: false });
    assert.strictEqual(resPayKlikToken.valido, true);

    // Caso F: PayKlik manual con numero invalido (< 15 digitos) -> Invalido
    const resTarjetaCorta = validarFormularioCheckout(envioDomicilioValido, 'payklik', { manual: true, numero: '4532 0000' });
    assert.strictEqual(resTarjetaCorta.valido, false);
    assert.strictEqual(resTarjetaCorta.error, 'Número de tarjeta inválido');

    // Caso G: PayKlik manual con vencimiento faltante o menor a 5 caracteres -> Invalido
    const resVencimientoCorto = validarFormularioCheckout(
      envioDomicilioValido,
      'payklik',
      { manual: true, numero: '4532 0000 0000 4242', vencimiento: '12/' }
    );
    assert.strictEqual(resVencimientoCorto.valido, false);
    assert.strictEqual(resVencimientoCorto.error, 'Fecha de vencimiento requerida (MM/AA)');

    // Caso H: PayKlik manual con CVV invalido (< 3 digitos) -> Invalido
    const resCvvCorto = validarFormularioCheckout(
      envioDomicilioValido,
      'payklik',
      { manual: true, numero: '4532 0000 0000 4242', vencimiento: '12/28', cvv: '1' }
    );
    assert.strictEqual(resCvvCorto.valido, false);
    assert.strictEqual(resCvvCorto.error, 'Código CVV requerido');

    // Caso I: PayKlik manual con todos los campos correctos -> Valido
    const resTarjetaOk = validarFormularioCheckout(
      envioDomicilioValido,
      'payklik',
      { manual: true, numero: '4532 0000 0000 4242', vencimiento: '12/28', cvv: '888' }
    );
    assert.strictEqual(resTarjetaOk.valido, true);
  });

});
