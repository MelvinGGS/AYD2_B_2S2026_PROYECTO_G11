package com.megastore.pagos;

/**
 * Métodos de pago válidos en el sistema SGO-Logic.
 * TARJETA_PAYKLIK → Pasarela externa (sujeto a Circuit Breaker + DLQ).
 * CREDITO_PROPIO_30D → Financiamiento diferido propio (sin pasarela, sin Circuit Breaker).
 */
public enum MetodoPago {
    TARJETA_PAYKLIK,
    CREDITO_PROPIO_30D
}
