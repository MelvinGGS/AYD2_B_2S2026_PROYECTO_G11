package com.megastore.ordenes;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "*")
public class AuthController {

    private final ClienteRepository clienteRepository;
    private final OrdenRepository ordenRepository;
    private final CreditoService creditoService;

    public AuthController(ClienteRepository clienteRepository,
                          OrdenRepository ordenRepository,
                          CreditoService creditoService) {
        this.clienteRepository = clienteRepository;
        this.ordenRepository = ordenRepository;
        this.creditoService = creditoService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listarClientes() {
        List<Cliente> clientes = clienteRepository.findAll();
        List<Map<String, Object>> response = clientes.stream().map(c -> {
            String cid = String.valueOf(c.getId());
            List<Orden> ordenesCli = ordenRepository.findByClienteId(cid);
            long totalOrdenes = ordenesCli.stream()
                    .filter(o -> !"CANCELADA".equalsIgnoreCase(o.getEstado()))
                    .count();
            java.math.BigDecimal gasto = ordenesCli.stream()
                    .filter(o -> !"CANCELADA".equalsIgnoreCase(o.getEstado()))
                    .map(o -> o.getTotal() != null ? o.getTotal() : java.math.BigDecimal.ZERO)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

            Map<String, Object> eval = creditoService.evaluarCredito(cid, java.math.BigDecimal.ZERO);
            int score = eval.get("score") instanceof Number ? ((Number) eval.get("score")).intValue() : 85;
            boolean aptoBnpl = Boolean.TRUE.equals(eval.get("aprobado"));

            String clasificacion = "ADMIN".equalsIgnoreCase(c.getRol())
                    ? "Admin Ops"
                    : (!aptoBnpl || score < 70
                        ? "Riesgo Crediticio"
                        : (gasto.compareTo(new java.math.BigDecimal("500.00")) >= 0 ? "VIP" : "Activo"));

            Map<String, Object> map = new HashMap<>();
            map.put("id", "CLI-" + c.getId());
            map.put("clienteId", cid);
            map.put("nombre", c.getNombre());
            map.put("email", c.getEmail());
            map.put("canal", c.getCanalPreferido() != null ? c.getCanalPreferido() : "Web Store");
            map.put("rol", c.getRol());
            map.put("telefono", c.getTelefono() != null ? c.getTelefono() : "");
            map.put("direccion", c.getDireccion() != null ? c.getDireccion() : "");
            map.put("ordenes", totalOrdenes);
            map.put("totalGasto", gasto.doubleValue());
            map.put("score", score);
            map.put("aptoBnpl", aptoBnpl);
            map.put("saldoDeudor", eval.get("saldoDeudor"));
            map.put("saldoDisponible", eval.get("saldoDisponible"));
            map.put("estado", clasificacion);
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Correo y contrasenia son requeridos."));
        }

        Optional<Cliente> found = clienteRepository.findByEmail(request.getEmail().trim());
        if (found.isEmpty() || !found.get().getPassword().equals(request.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Credenciales invalidas. Verifique su correo o contrasenia."));
        }

        Cliente cliente = found.get();
        boolean isAdmin = "ADMIN".equalsIgnoreCase(cliente.getRol()) || cliente.getEmail().contains("admin");

        String token = generarJwtToken(cliente);

        Map<String, Object> response = new HashMap<>();
        response.put("id", String.valueOf(cliente.getId()));
        response.put("nombre", cliente.getNombre());
        response.put("email", cliente.getEmail());
        response.put("role", isAdmin ? "admin" : "cliente");
        response.put("canalPreferido", cliente.getCanalPreferido());
        response.put("telefono", cliente.getTelefono() != null ? cliente.getTelefono() : "");
        response.put("direccion", cliente.getDireccion() != null ? cliente.getDireccion() : "");
        response.put("token", token);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/registro")
    public ResponseEntity<?> registro(@RequestBody RegistroRequest request) {
        if (clienteRepository.existsByEmail(request.getEmail())) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "El correo electronico ya esta registrado.");
            return ResponseEntity.badRequest().body(err);
        }

        Cliente nuevo = new Cliente(
                request.getNombre(),
                request.getEmail(),
                request.getPassword(),
                request.getCanalPreferido() != null ? request.getCanalPreferido() : "Web Store",
                "CLIENTE"
        );
        if (request.getTelefono() != null) {
            nuevo.setTelefono(request.getTelefono());
        }
        if (request.getDireccion() != null) {
            nuevo.setDireccion(request.getDireccion());
        }
        Cliente guardado = clienteRepository.save(nuevo);
        String token = generarJwtToken(guardado);

        Map<String, Object> response = new HashMap<>();
        response.put("id", String.valueOf(guardado.getId()));
        response.put("nombre", guardado.getNombre());
        response.put("email", guardado.getEmail());
        response.put("role", "cliente");
        response.put("canalPreferido", guardado.getCanalPreferido());
        response.put("telefono", guardado.getTelefono() != null ? guardado.getTelefono() : "");
        response.put("direccion", guardado.getDireccion() != null ? guardado.getDireccion() : "");
        response.put("token", token);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/perfil")
    public ResponseEntity<?> actualizarPerfil(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<Cliente> opt = clienteRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Cliente cliente = opt.get();
        if (body.containsKey("nombre") && body.get("nombre") != null) cliente.setNombre(body.get("nombre"));
        if (body.containsKey("telefono")) cliente.setTelefono(body.get("telefono"));
        if (body.containsKey("direccion")) cliente.setDireccion(body.get("direccion"));
        if (body.containsKey("canalPreferido")) cliente.setCanalPreferido(body.get("canalPreferido"));
        Cliente actualizado = clienteRepository.save(cliente);

        Map<String, Object> response = new HashMap<>();
        response.put("id", String.valueOf(actualizado.getId()));
        response.put("nombre", actualizado.getNombre());
        response.put("email", actualizado.getEmail());
        response.put("role", "ADMIN".equalsIgnoreCase(actualizado.getRol()) ? "admin" : "cliente");
        response.put("canalPreferido", actualizado.getCanalPreferido());
        response.put("telefono", actualizado.getTelefono() != null ? actualizado.getTelefono() : "");
        response.put("direccion", actualizado.getDireccion() != null ? actualizado.getDireccion() : "");

        return ResponseEntity.ok(response);
    }

    private String generarJwtToken(Cliente cliente) {
        try {
            String header = Base64.getUrlEncoder().withoutPadding().encodeToString(
                    "{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
            long exp = System.currentTimeMillis() + (86400000L * 7); // 7 dias de vigencia
            String payloadJson = String.format(
                    "{\"sub\":\"%d\",\"id\":%d,\"nombre\":\"%s\",\"email\":\"%s\",\"role\":\"%s\",\"exp\":%d}",
                    cliente.getId(), cliente.getId(), cliente.getNombre(), cliente.getEmail(), cliente.getRol(), exp);
            String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));

            String dataToSign = header + "." + payload;
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec("SGO_LOGIC_MEGASTORE_JWT_SECRET_2026_PROD".getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac.init(secretKey);
            byte[] signatureBytes = hmac.doFinal(dataToSign.getBytes(StandardCharsets.UTF_8));
            String signature = Base64.getUrlEncoder().withoutPadding().encodeToString(signatureBytes);

            return header + "." + payload + "." + signature;
        } catch (Exception e) {
            return Base64.getUrlEncoder().withoutPadding().encodeToString(
                    (cliente.getEmail() + ":" + System.currentTimeMillis()).getBytes(StandardCharsets.UTF_8));
        }
    }
}
