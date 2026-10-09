package com.megastore.facturacion;

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
public class FacturacionApplication {
    public static void main(String[] args) {
        SpringApplication.run(FacturacionApplication.class, args);
    }

    @GetMapping("/")
    public Map<String, Object> status() {
        Map<String, Object> map = new HashMap<>();
        map.put("servicio", "Servicio de Facturacion (Spring Boot Java)");
        map.put("estado", "OPERATIVO");
        map.put("puerto", 8084);
        return map;
    }
}
