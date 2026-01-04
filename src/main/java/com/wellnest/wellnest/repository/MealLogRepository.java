package com.wellnest.wellnest.repository;

import com.wellnest.wellnest.model.MealLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MealLogRepository extends JpaRepository<MealLog, Long> {

    // already used for "today" meals endpoint
    List<MealLog> findByUserIdAndLogDateOrderByMealTimeAsc(Long userId, LocalDate logDate);

    // ✅ used by weekly analytics
    List<MealLog> findByUserIdAndLogDateBetween(Long userId, LocalDate start, LocalDate end);
}
