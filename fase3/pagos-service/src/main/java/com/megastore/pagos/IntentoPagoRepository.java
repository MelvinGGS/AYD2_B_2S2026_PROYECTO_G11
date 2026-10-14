package com.megastore.pagos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface IntentoPagoRepository extends JpaRepository<IntentoPago, Long> {
    List<IntentoPago> findByOrdenId(String ordenId);
    List<IntentoPago> findTop100ByResultadoIgnoreCaseOrderByIdDesc(String resultado);
    List<IntentoPago> findByResultadoIgnoreCase(String resultado);
    long countByResultadoIgnoreCase(String resultado);

    @Query("SELECT ip FROM IntentoPago ip WHERE UPPER(ip.resultado) = 'ENCOLADO_CONTINGENCIA' AND ip.ordenId LIKE 'ORD-2026-%' ORDER BY ip.id DESC")
    List<IntentoPago> findOrdenesRealesEnContingencia();
}
