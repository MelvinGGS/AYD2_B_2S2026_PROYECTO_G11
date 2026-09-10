package com.megastore.ordenes;

import java.util.List;

public class CrearOrdenRequest {
    private String clienteId;
    private String clienteNombre;
    private String canal;
    private String metodoPago;
    private String metodoEntrega;
    private String direccion;
    private List<CarritoItemDto> items;

    public CrearOrdenRequest() {}

    // Getters and Setters
    public String getClienteId() { return clienteId; }
    public void setClienteId(String clienteId) { this.clienteId = clienteId; }
    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }
    public String getCanal() { return canal; }
    public void setCanal(String canal) { this.canal = canal; }
    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }
    public String getMetodoEntrega() { return metodoEntrega; }
    public void setMetodoEntrega(String metodoEntrega) { this.metodoEntrega = metodoEntrega; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    public List<CarritoItemDto> getItems() { return items; }
    public void setItems(List<CarritoItemDto> items) { this.items = items; }
}
