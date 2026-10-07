package com.megastore.ordenes;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "eventos_auditoria")
public class EventoAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ordenId;
    private String canal;
    private String tipoEvento; // ORDEN_CREADA, CARRITO_ACTUALIZADO, LOGIN
    
    @Column(columnDefinition = "TEXT")
    private String detalle;
    
    private LocalDateTime fecha;

    public EventoAuditoria() {
        this.fecha = LocalDateTime.now();
    }

    public EventoAuditoria(String ordenId, String canal, String tipoEvento, String detalle) {
        this.ordenId = ordenId;
        this.canal = canal;
        this.tipoEvento = tipoEvento;
        this.detalle = detalle;
        this.fecha = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrdenId() { return ordenId; }
    public void setOrdenId(String ordenId) { this.ordenId = ordenId; }
    public String getCanal() { return canal; }
    public void setCanal(String canal) { this.canal = canal; }
    public String getTipoEvento() { return tipoEvento; }
    public void setTipoEvento(String tipoEvento) { this.tipoEvento = tipoEvento; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}
