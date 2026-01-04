package com.wellnest.wellnest.repository;

import com.wellnest.wellnest.model.MealPlan;
import com.wellnest.wellnest.model.TrainerClient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {
    List<MealPlan> findByClientOrderByAssignedAtDesc(TrainerClient client);
}
