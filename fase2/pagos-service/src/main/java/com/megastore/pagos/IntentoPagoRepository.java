package com.megastore.pagos;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IntentoPagoRepository extends JpaRepository<IntentoPago, Long> {
    List<IntentoPago> findByOrdenId(String ordenId);
}
