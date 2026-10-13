package com.megastore.ordenes;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class ClienteDataInitializer implements CommandLineRunner {

    private final ClienteRepository clienteRepository;
    private final EventoAuditoriaRepository auditoriaRepository;

    public ClienteDataInitializer(ClienteRepository clienteRepository, EventoAuditoriaRepository auditoriaRepository) {
        this.clienteRepository = clienteRepository;
        this.auditoriaRepository = auditoriaRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (clienteRepository.count() == 0) {
            System.out.println("[AUTH] Inicializando usuarios del sistema en base de datos PostgreSQL...");

            Cliente cliente = new Cliente(
                    "Carlos Aragon",
                    "cliente@megastore.com",
                    "Password123",
                    "Web Store",
                    "CLIENTE"
            );
            cliente.setTelefono("+502 5555 1234");
            cliente.setDireccion("Avenida Reforma 12-01, Zona 10, Ciudad de Guatemala");
            clienteRepository.save(cliente);

            Cliente admin = new Cliente(
                    "Administrador Ops",
                    "admin@megastore.com",
                    "Admin123",
                    "Call Center",
                    "ADMIN"
            );
            clienteRepository.save(admin);

            System.out.println("[AUTH] Usuarios cliente@megastore.com y admin@megastore.com creados con exito.");
        }

        if (!clienteRepository.existsByEmail("riesgo@megastore.com")) {
            Cliente riesgoso = new Cliente(
                    "Roberto Morales",
                    "riesgo@megastore.com",
                    "Riesgo123",
                    "Web Store",
                    "CLIENTE"
            );
            riesgoso.setTelefono("+502 4444 9876");
            riesgoso.setDireccion("Zona 18, Ciudad de Guatemala");
            Cliente guardadoRiesgo = clienteRepository.save(riesgoso);
            String idRiesgo = String.valueOf(guardadoRiesgo.getId());

            auditoriaRepository.save(new EventoAuditoria(
                    idRiesgo,
                    "ERP_AS400",
                    "INCIDENCIA_MORA",
                    "Atraso de 45 dias en liquidacion de factura anterior en ERP AS/400"
            ));
            auditoriaRepository.save(new EventoAuditoria(
                    idRiesgo,
                    "CALL_CENTER",
                    "INCIDENCIA_DEVOLUCION",
                    "Reclamo de cobro rechazado y devolucion no autorizada"
            ));
            System.out.println("[AUTH] Usuario de prueba riesgoso (riesgo@megastore.com, score 55/100) inicializado.");
        }
    }
}
