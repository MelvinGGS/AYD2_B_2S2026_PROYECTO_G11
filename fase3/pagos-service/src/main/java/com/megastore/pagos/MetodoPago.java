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
        String lower = v.toLowerCase();
        if ("TARJETA_PAYKLIK".equalsIgnoreCase(v) ||
            "PAYKLIK".equalsIgnoreCase(v) ||
            "TARJETA_CREDITO".equalsIgnoreCase(v) ||
            lower.contains("payklik") ||
            lower.contains("tarjeta") ||
            lower.contains("transferencia") ||
            lower.contains("billetera")) {
            return TARJETA_PAYKLIK;
        }
        if ("CREDITO_PROPIO_30D".equalsIgnoreCase(v) ||
            "credito_propio".equalsIgnoreCase(v) ||
            "BNPL".equalsIgnoreCase(v) ||
            lower.contains("credito propio") ||
            lower.contains("crédito propio") ||
            lower.contains("credito_propio") ||
            lower.contains("30 dias") ||
            lower.contains("30 días") ||
            lower.contains("bnpl")) {
            return CREDITO_PROPIO_30D;
        }
        for (MetodoPago mp : values()) {
            if (mp.name().equalsIgnoreCase(v)) {
                return mp;
            }
        }
        return null;
    }
}
