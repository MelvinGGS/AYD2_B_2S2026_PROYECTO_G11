package com.megastore.pagos;

import java.math.BigDecimal;

/**
 * DTO para solicitar un pago desde el endpoint REST.
 * El campo metodoPago es tipado con el enum para garantizar valores válidos.
 */
public class PagoRequest {

    private String ordenId;
    private BigDecimal monto;
    private String canal;

    /**
     * Valores aceptados: TARJETA_PAYKLIK o CREDITO_PROPIO_30D.
     */
    private MetodoPago metodoPago;

    /**
     * Obligatorio solo cuando metodoPago = TARJETA_PAYKLIK.
     * NO almacenar completo por PCI-DSS; solo los últimos 4 dígitos se guardan.
     */
    private String numeroTarjeta;

    private String direccionDestino;

    // ---- Getters y Setters ----
    public String getOrdenId() { return ordenId; }
    public void setOrdenId(String ordenId) { this.ordenId = ordenId; }
    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }
    public String getCanal() { return canal; }
    public void setCanal(String canal) { this.canal = canal; }
    public MetodoPago getMetodoPago() { return metodoPago; }
    public void setMetodoPago(MetodoPago metodoPago) { this.metodoPago = metodoPago; }
    public String getNumeroTarjeta() { return numeroTarjeta; }
    public void setNumeroTarjeta(String numeroTarjeta) { this.numeroTarjeta = numeroTarjeta; }
    public String getDireccionDestino() { return direccionDestino; }
    public void setDireccionDestino(String direccionDestino) { this.direccionDestino = direccionDestino; }
}
