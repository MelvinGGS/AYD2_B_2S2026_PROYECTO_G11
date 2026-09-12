package com.megastore.inventario;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservas_stock")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ordenId;
    private String productoId;
    private String ubicacionId;
    private Integer cantidad;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaExpiracion;
    private boolean activa;

    public Reserva() {
        this.fechaCreacion = LocalDateTime.now();
        this.fechaExpiracion = this.fechaCreacion.plusMinutes(15);
        this.activa = true;
    }

    public Reserva(String ordenId, String productoId, String ubicacionId, Integer cantidad) {
        this.ordenId = ordenId;
        this.productoId = productoId;
        this.ubicacionId = ubicacionId;
        this.cantidad = cantidad;
        this.fechaCreacion = LocalDateTime.now();
        this.fechaExpiracion = this.fechaCreacion.plusMinutes(15);
        this.activa = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrdenId() { return ordenId; }
    public void setOrdenId(String ordenId) { this.ordenId = ordenId; }
    public String getProductoId() { return productoId; }
    public void setProductoId(String productoId) { this.productoId = productoId; }
    public String getUbicacionId() { return ubicacionId; }
    public void setUbicacionId(String ubicacionId) { this.ubicacionId = ubicacionId; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    public LocalDateTime getFechaExpiracion() { return fechaExpiracion; }
    public void setFechaExpiracion(LocalDateTime fechaExpiracion) { this.fechaExpiracion = fechaExpiracion; }
    public boolean isActiva() { return activa; }
    public void setActiva(boolean activa) { this.activa = activa; }
}
