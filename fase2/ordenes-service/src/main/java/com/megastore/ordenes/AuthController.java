package com.megastore.ordenes;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "*")
public class AuthController {

    private final ClienteRepository clienteRepository;

    public AuthController(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<Cliente> found = clienteRepository.findByEmail(request.getEmail());
        boolean isAdmin = request.getEmail().contains("admin");

        Map<String, Object> response = new HashMap<>();
        response.put("id", found.map(c -> "usr-" + c.getId()).orElse("usr-demo"));
        response.put("nombre", found.map(Cliente::getNombre).orElse(isAdmin ? "Administrador Ops" : "Usuario Cliente"));
        response.put("email", request.getEmail());
        response.put("role", isAdmin ? "admin" : "cliente");
        response.put("token", "mock-jwt-token-sgo-logic-2026");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/registro")
    public ResponseEntity<?> registro(@RequestBody RegistroRequest request) {
        if (clienteRepository.existsByEmail(request.getEmail())) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "El correo electrónico ya está registrado.");
            return ResponseEntity.badRequest().body(err);
        }

        Cliente nuevo = new Cliente(
                request.getNombre(),
                request.getEmail(),
                request.getPassword(),
                request.getCanalPreferido() != null ? request.getCanalPreferido() : "Web Store",
                "CLIENTE"
        );
        Cliente guardado = clienteRepository.save(nuevo);
        return ResponseEntity.ok(guardado);
    }
}
