package com.megastore.inventario;

import jakarta.persistence.*;

@Entity
@Table(name = "stock_inventario", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"producto_id", "ubicacion_id"})
})
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(optional = false)
    @JoinColumn(name = "ubicacion_id", nullable = false)
    private Ubicacion ubicacion;

    @Column(nullable = false)
    private Integer cantidad; // Cantidad total física

    @Version
    private Long version; // Fundamental para Lock Optimista

    public Stock() {}

    public Stock(Producto producto, Ubicacion ubicacion, Integer cantidad) {
        this.producto = producto;
        this.ubicacion = ubicacion;
        this.cantidad = cantidad;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    public Ubicacion getUbicacion() { return ubicacion; }
    public void setUbicacion(Ubicacion ubicacion) { this.ubicacion = ubicacion; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
