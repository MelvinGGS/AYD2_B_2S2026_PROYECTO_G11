package com.megastore.ordenes;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class ClienteDataInitializer implements CommandLineRunner {

    private final ClienteRepository clienteRepository;

    public ClienteDataInitializer(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
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
            clienteRepository.save(cliente);

            Cliente admin = new Cliente(
                    "Administrador Ops",
                    "admin@megastore.com",
                    "Admin123",
                    "Web Store",
                    "ADMIN"
            );
            clienteRepository.save(admin);

            System.out.println("[AUTH] Usuarios cliente@megastore.com y admin@megastore.com creados con exito.");
        }
    }
}
