package com.wellnest.wellnest.repository;

import com.wellnest.wellnest.model.HealthTip;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface HealthTipRepository extends JpaRepository<HealthTip, Long> {
    Optional<HealthTip> findByTipDate(LocalDate date);
}
