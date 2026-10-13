package com.megastore.pagos;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "intentos_pago")
public class IntentoPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ordenId;
    private String canal;
    private BigDecimal monto;

    /**
     * Método de pago tipado. Se persiste como String para legibilidad en BD.
     * Valores válidos: TARJETA_PAYKLIK, CREDITO_PROPIO_30D.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago", nullable = false)
    private MetodoPago metodoPago;

    private String ultimosCuatroDigitos; // Cumplimiento PCI-DSS: NO CVV ni numero completo
    private String resultado; // APROBADO, ENCOLADO_CONTINGENCIA, RECHAZADO, APROBADO_CREDITO
    private String referenciaPayklik;
    private LocalDateTime fecha;

    public IntentoPago() {
        this.fecha = LocalDateTime.now();
    }

    public IntentoPago(String ordenId, String canal, BigDecimal monto, MetodoPago metodoPago, String ultimosCuatroDigitos, String resultado, String referenciaPayklik) {
        this.ordenId = ordenId;
        this.canal = canal;
        this.monto = monto;
        this.metodoPago = metodoPago;
        this.ultimosCuatroDigitos = ultimosCuatroDigitos;
        this.resultado = resultado;
        this.referenciaPayklik = referenciaPayklik;
        this.fecha = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrdenId() { return ordenId; }
    public void setOrdenId(String ordenId) { this.ordenId = ordenId; }
    public String getCanal() { return canal; }
    public void setCanal(String canal) { this.canal = canal; }
    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }
    public MetodoPago getMetodoPago() { return metodoPago; }
    public void setMetodoPago(MetodoPago metodoPago) { this.metodoPago = metodoPago; }
    public String getUltimosCuatroDigitos() { return ultimosCuatroDigitos; }
    public void setUltimosCuatroDigitos(String ultimosCuatroDigitos) { this.ultimosCuatroDigitos = ultimosCuatroDigitos; }
    public String getResultado() { return resultado; }
    public void setResultado(String resultado) { this.resultado = resultado; }
    public String getReferenciaPayklik() { return referenciaPayklik; }
    public void setReferenciaPayklik(String referenciaPayklik) { this.referenciaPayklik = referenciaPayklik; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}
