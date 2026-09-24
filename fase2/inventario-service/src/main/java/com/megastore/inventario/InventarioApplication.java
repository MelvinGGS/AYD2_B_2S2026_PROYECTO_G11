package com.megastore.inventario;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
import java.util.HashMap;

@SpringBootApplication
@EnableScheduling
@RestController
public class InventarioApplication {
    public static void main(String[] args) {
        SpringApplication.run(InventarioApplication.class, args);
    }

    @GetMapping("/")
    public Map<String, Object> status() {
        Map<String, Object> map = new HashMap<>();
        map.put("servicio", "Servicio de Inventario (Spring Boot Java)");
        map.put("estado", "OPERATIVO");
        map.put("puerto", 8082);
        return map;
    }
}
