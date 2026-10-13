package com.megastore.pagos;

import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * Metodos de pago validos en el sistema SGO-Logic.
 * TARJETA_PAYKLIK -> Pasarela externa (sujeto a Circuit Breaker + DLQ).
 * CREDITO_PROPIO_30D -> Financiamiento diferido propio (sin pasarela, sin Circuit Breaker).
 */
public enum MetodoPago {
    TARJETA_PAYKLIK,
    CREDITO_PROPIO_30D;

    @JsonCreator
    public static MetodoPago fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String v = value.trim();
        if ("CREDITO_PROPIO_30D".equalsIgnoreCase(v) ||
            "credito_propio".equalsIgnoreCase(v) ||
            "BNPL".equalsIgnoreCase(v) ||
            v.toLowerCase().contains("credito") ||
            v.toLowerCase().contains("30 dias") ||
            v.toLowerCase().contains("30 días")) {
            return CREDITO_PROPIO_30D;
        }
        if ("TARJETA_PAYKLIK".equalsIgnoreCase(v) ||
            "PAYKLIK".equalsIgnoreCase(v) ||
            "TARJETA_CREDITO".equalsIgnoreCase(v) ||
            v.toLowerCase().contains("payklik") ||
            v.toLowerCase().contains("tarjeta")) {
            return TARJETA_PAYKLIK;
        }
        for (MetodoPago mp : values()) {
            if (mp.name().equalsIgnoreCase(v)) {
                return mp;
            }
        }
        return null;
    }
}
