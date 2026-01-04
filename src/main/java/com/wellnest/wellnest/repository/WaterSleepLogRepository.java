package com.wellnest.wellnest.repository;

import com.wellnest.wellnest.model.WaterSleepLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface WaterSleepLogRepository extends JpaRepository<WaterSleepLog, Long> {

    // already used for "today" water/sleep endpoint
    List<WaterSleepLog> findByUserIdAndLogDate(Long userId, LocalDate logDate);

    // ✅ used by weekly analytics
    List<WaterSleepLog> findByUserIdAndLogDateBetween(Long userId, LocalDate start, LocalDate end);
}
