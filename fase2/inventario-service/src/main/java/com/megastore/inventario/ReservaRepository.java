package com.megastore.inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    List<Reserva> findByOrdenIdAndActivaTrue(String ordenId);
    List<Reserva> findByActivaTrueAndFechaExpiracionBefore(LocalDateTime now);
}
