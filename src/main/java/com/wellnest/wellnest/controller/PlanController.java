package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.MealPlan;
import com.wellnest.wellnest.model.TrainerClient;
import com.wellnest.wellnest.model.WorkoutPlan;
import com.wellnest.wellnest.repository.MealPlanRepository;
import com.wellnest.wellnest.repository.TrainerClientRepository;
import com.wellnest.wellnest.repository.WorkoutPlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/plans")
@CrossOrigin(origins = "*")
public class PlanController {

    @Autowired
    private WorkoutPlanRepository workoutRepo;

    @Autowired
    private MealPlanRepository mealRepo;

    @Autowired
    private TrainerClientRepository clientRepo;

    // Assign Workout
    @PostMapping("/workout")
    public ResponseEntity<?> assignWorkout(@RequestBody Map<String, Object> payload) {
        Long relationshipId = Long.valueOf(payload.get("relationshipId").toString());
        String title = (String) payload.get("title");
        String overview = (String) payload.get("overview");
        String exercises = (String) payload.get("exercises");

        Optional<TrainerClient> tc = clientRepo.findById(relationshipId);
        if (tc.isEmpty())
            return ResponseEntity.notFound().build();

        WorkoutPlan plan = new WorkoutPlan();
        plan.setClient(tc.get());
        plan.setTitle(title);
        plan.setOverview(overview);
        plan.setExercises(exercises);

        workoutRepo.save(plan);
        return ResponseEntity.ok(plan);
    }

    // Assign Meal Plan
    @PostMapping("/meal")
    public ResponseEntity<?> assignMealPlan(@RequestBody Map<String, Object> payload) {
        Long relationshipId = Long.valueOf(payload.get("relationshipId").toString());
        String title = (String) payload.get("title");
        String calorieTarget = (String) payload.get("dailyCalorieTarget"); // String for flexibility (e.g. "2000 kcal")
        String meals = (String) payload.get("meals");

        Optional<TrainerClient> tc = clientRepo.findById(relationshipId);
        if (tc.isEmpty())
            return ResponseEntity.notFound().build();

        MealPlan plan = new MealPlan();
        plan.setClient(tc.get());
        plan.setTitle(title);
        plan.setDailyCalorieTarget(calorieTarget);
        plan.setMeals(meals);

        mealRepo.save(plan);
        return ResponseEntity.ok(plan);
    }

    // Get assigned plans for a client relationship
    @GetMapping("/workout/{relationshipId}")
    public List<WorkoutPlan> getWorkouts(@PathVariable Long relationshipId) {
        Optional<TrainerClient> tc = clientRepo.findById(relationshipId);
        if (tc.isEmpty())
            return List.of();
        return workoutRepo.findByClientOrderByAssignedAtDesc(tc.get());
    }

    @GetMapping("/meal/{relationshipId}")
    public List<MealPlan> getMeals(@PathVariable Long relationshipId) {
        Optional<TrainerClient> tc = clientRepo.findById(relationshipId);
        if (tc.isEmpty())
            return List.of();
        return mealRepo.findByClientOrderByAssignedAtDesc(tc.get());
    }
}
