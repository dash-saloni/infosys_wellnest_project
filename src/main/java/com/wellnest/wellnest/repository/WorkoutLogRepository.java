package com.wellnest.wellnest.repository;

import com.wellnest.wellnest.model.WorkoutLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface WorkoutLogRepository extends JpaRepository<WorkoutLog, Long> {

    // already used for "today" workouts endpoint
    List<WorkoutLog> findByUserIdAndLogDateOrderByLogDateDesc(Long userId, LocalDate logDate);

    // ✅ used by weekly analytics
    List<WorkoutLog> findByUserIdAndLogDateBetween(Long userId, LocalDate start, LocalDate end);
}
