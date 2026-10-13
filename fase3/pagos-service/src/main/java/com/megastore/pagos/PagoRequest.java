package com.megastore.pagos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * DTO para solicitar un pago desde el endpoint REST.
 * El campo metodoPago es tipado con el enum para garantizar valores válidos.
 * Si el cliente envía un valor inválido, Spring devuelve automáticamente un 400 Bad Request.
 */
public class PagoRequest {

    @NotBlank(message = "ordenId es obligatorio")
    private String ordenId;

    @NotNull(message = "monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a cero")
    private BigDecimal monto;

    private String canal;

    /**
     * Valores aceptados: TARJETA_PAYKLIK o CREDITO_PROPIO_30D.
     */
    @NotNull(message = "metodoPago es obligatorio. Valores validos: TARJETA_PAYKLIK, CREDITO_PROPIO_30D")
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
