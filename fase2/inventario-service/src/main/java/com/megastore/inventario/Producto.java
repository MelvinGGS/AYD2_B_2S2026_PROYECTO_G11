package com.megastore.inventario;

import jakarta.persistence.*;

@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @Column(length = 50)
    private String id; // Ejemplo: "PROD-101"

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(nullable = false, length = 50)
    private String categoria;

    @Column(nullable = false)
    private Double precio;

    @Column(name = "precio_anterior")
    private Double precioAnterior;

    private String descripcion;

    private String imagen;

    private String tag;

    public Producto() {}

    public Producto(String id, String nombre, String categoria, Double precio) {
        this.id = id;
        this.nombre = nombre;
        this.categoria = categoria;
        this.precio = precio;
    }

    public Producto(String id, String nombre, String categoria, Double precio, Double precioAnterior, String descripcion, String imagen, String tag) {
        this.id = id;
        this.nombre = nombre;
        this.categoria = categoria;
        this.precio = precio;
        this.precioAnterior = precioAnterior;
        this.descripcion = descripcion;
        this.imagen = imagen;
        this.tag = tag;
    }

    // Getters y Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public Double getPrecio() { return precio; }
    public void setPrecio(Double precio) { this.precio = precio; }
    public Double getPrecioAnterior() { return precioAnterior; }
    public void setPrecioAnterior(Double precioAnterior) { this.precioAnterior = precioAnterior; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public String getImagen() { return imagen; }
    public void setImagen(String imagen) { this.imagen = imagen; }
    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }
}
