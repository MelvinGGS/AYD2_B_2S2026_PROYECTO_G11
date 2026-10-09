package com.megastore.ordenes;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EventoAuditoriaRepository extends JpaRepository<EventoAuditoria, Long> {
    List<EventoAuditoria> findByOrdenId(String ordenId);
    List<EventoAuditoria> findByTipoEventoStartingWithOrderByFechaDesc(String prefix);
}
