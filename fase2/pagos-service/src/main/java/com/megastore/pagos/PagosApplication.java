package com.megastore.pagos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.HashMap;

@SpringBootApplication
@RestController
public class PagosApplication {

	public static void main(String[] args) {
		SpringApplication.run(PagosApplication.class, args);
	}

	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}

	@GetMapping("/")
	public Map<String, Object> status() {
		Map<String, Object> map = new HashMap<>();
		map.put("servicio", "Servicio de Pagos (Spring Boot Java)");
		map.put("estado", "OPERATIVO");
		map.put("puerto", 8083);
		return map;
	}
}
