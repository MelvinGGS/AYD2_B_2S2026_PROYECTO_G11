package com.megastore.ordenes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
import java.util.HashMap;

@SpringBootApplication
@RestController
public class OrdenesApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrdenesApplication.class, args);
    }

    @GetMapping("/")
    public Map<String, Object> status() {
        Map<String, Object> map = new HashMap<>();
        map.put("servicio", "Servicio de Ordenes (Spring Boot Java)");
        map.put("estado", "OPERATIVO");
        map.put("puerto", 8081);
        return map;
    }
}
