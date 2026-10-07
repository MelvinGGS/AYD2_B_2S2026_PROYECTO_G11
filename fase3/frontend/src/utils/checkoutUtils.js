/**
 * Utilidades de lógica de negocio para Checkout y Crédito Propio (BNPL) - Fase 3
 * Desarrollado por: 202300712 (Melvin García)
 */

/**
 * 1. Evalúa si un cliente califica para la campaña 'Compra ahora, paga en 30 días'
 * @param {Object} cliente - Datos del cliente con historial
 * @param {number} totalOrden - Monto total de la orden
 * @param {number} saldoDisponible - Límite de crédito disponible en cuenta
 * @returns {boolean}
 */
export function validarElegibilidadCredito(cliente, totalOrden, saldoDisponible) {
  if (!cliente || typeof totalOrden !== 'number' || totalOrden <= 0) {
    return false;
  }
  const score = cliente.creditScore ?? 80;
  // Regla de negocio: Score mínimo de 70 y la orden no puede superar el saldo crediticio disponible
  return score >= 70 && totalOrden <= saldoDisponible;
}

/**
 * 2. Calcula la fecha de vencimiento sumando exactamente los días de gracia (30 días)
 * @param {Date|string} fechaBase - Fecha de creación de la orden
 * @param {number} [plazoDias=30] - Días de gracia
 * @returns {string} Fecha formateada YYYY-MM-DD
 */
export function calcularVencimientoCredito(fechaBase, plazoDias = 30) {
  const fecha = new Date(fechaBase);
  if (isNaN(fecha.getTime())) {
    throw new Error('Fecha base inválida');
  }
  fecha.setDate(fecha.getDate() + plazoDias);
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 3. Formatea el resumen financiero de la compra a crédito sin recargo
 * @param {number} total - Total de la orden
 * @param {number} [plazoDias=30] - Plazo en días
 * @param {string} fechaVencimiento - Fecha de cobro
 * @returns {Object}
 */
export function formatearDetalleBNPL(total, plazoDias = 30, fechaVencimiento = '') {
  if (typeof total !== 'number' || total <= 0) {
    throw new Error('Monto de orden inválido');
  }
  return {
    metodo: 'CREDITO_PROPIO_30D',
    montoFinanciado: +(total.toFixed(2)),
    tasaInteres: 0.00,
    recargoApertura: 0.00,
    plazoDias,
    fechaLimitePago: fechaVencimiento,
    descripcion: `Paga Q${total.toFixed(2)} sin intereses antes del ${fechaVencimiento}`
  };
}

/**
 * 4. Filtra y retorna los métodos de pago disponibles según el scoring crediticio
 * @param {Array<string>} metodosBase - Lista estándar de métodos (payklik, transferencia, etc.)
 * @param {boolean} esAptoCredito - Si el cliente aprobó el scoring crediticio
 * @returns {Array<string>}
 */
export function filtrarMetodosPagoDisponibles(metodosBase, esAptoCredito) {
  if (!Array.isArray(metodosBase)) return [];
  const lista = [...metodosBase];
  if (esAptoCredito && !lista.includes('credito_propio')) {
    lista.unshift('credito_propio'); // Colocar Crédito Propio como opción destacada inicial
  }
  return lista;
}

/**
 * 5. Valida si los campos requeridos del Checkout están completos según el método seleccionado
 * @param {Object} datosEnvio - { nombreCompleto, telefono, direccion, tipoEntrega }
 * @param {string} metodoPago - 'credito_propio', 'payklik', 'transferencia', 'billetera'
 * @param {Object} [datosTarjeta] - { numero, vencimiento, cvv }
 * @returns {{ valido: boolean, error?: string }}
 */
export function validarFormularioCheckout(datosEnvio, metodoPago, datosTarjeta = {}) {
  if (!datosEnvio?.nombreCompleto || !datosEnvio?.telefono) {
    return { valido: false, error: 'Por favor completa tus datos de contacto' };
  }
  if (datosEnvio.tipoEntrega === 'domicilio' && !datosEnvio.direccion) {
    return { valido: false, error: 'La dirección de entrega es obligatoria para envío a domicilio' };
  }

  // Si es crédito propio, no se exigen datos de tarjeta
  if (metodoPago === 'credito_propio') {
    return { valido: true };
  }

  // Si es PayKlik tradicional manual, validar tarjeta
  if (metodoPago === 'payklik' && datosTarjeta.manual) {
    if (!datosTarjeta.numero || datosTarjeta.numero.replace(/\s/g, '').length < 15) {
      return { valido: false, error: 'Número de tarjeta inválido' };
    }
    if (!datosTarjeta.vencimiento || datosTarjeta.vencimiento.length < 5) {
      return { valido: false, error: 'Fecha de vencimiento requerida (MM/AA)' };
    }
    if (!datosTarjeta.cvv || datosTarjeta.cvv.length < 3) {
      return { valido: false, error: 'Código CVV requerido' };
    }
  }

  return { valido: true };
}
