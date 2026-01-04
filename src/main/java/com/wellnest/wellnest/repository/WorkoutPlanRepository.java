package com.wellnest.wellnest.repository;

import com.wellnest.wellnest.model.WorkoutPlan;
import com.wellnest.wellnest.model.TrainerClient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, Long> {
    List<WorkoutPlan> findByClientOrderByAssignedAtDesc(TrainerClient client);
}
