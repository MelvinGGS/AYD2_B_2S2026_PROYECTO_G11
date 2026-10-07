package com.megastore.ordenes;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CarritoService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String KEY_PREFIX = "carrito:";

    public CarritoService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @SuppressWarnings("unchecked")
    public List<CarritoItemDto> getCarrito(String clienteId) {
        Object data = redisTemplate.opsForValue().get(KEY_PREFIX + clienteId);
        if (data instanceof List) {
            return (List<CarritoItemDto>) data;
        }
        return new ArrayList<>();
    }

    public void guardarCarrito(String clienteId, List<CarritoItemDto> items) {
        redisTemplate.opsForValue().set(KEY_PREFIX + clienteId, items);
    }

    public void agregarOActualizarItem(String clienteId, CarritoItemDto nuevoItem) {
        List<CarritoItemDto> actual = getCarrito(clienteId);
        boolean encontrado = false;

        for (CarritoItemDto item : actual) {
            if (item.getId().equals(nuevoItem.getId())) {
                item.setCantidad(item.getCantidad() + nuevoItem.getCantidad());
                encontrado = true;
                break;
            }
        }

        if (!encontrado) {
            actual.add(nuevoItem);
        }

        guardarCarrito(clienteId, actual);
    }

    public void vaciarCarrito(String clienteId) {
        redisTemplate.delete(KEY_PREFIX + clienteId);
    }
}
