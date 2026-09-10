package com.megastore.ordenes;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrdenRepository extends JpaRepository<Orden, String> {
    List<Orden> findByClienteId(String clienteId);
    List<Orden> findAllByOrderByFechaCreacionDesc();
}
