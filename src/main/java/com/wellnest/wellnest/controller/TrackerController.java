package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.WorkoutLog;
import com.wellnest.wellnest.model.MealLog;
import com.wellnest.wellnest.model.WaterSleepLog;
import com.wellnest.wellnest.repository.WorkoutLogRepository;
import com.wellnest.wellnest.repository.MealLogRepository;
import com.wellnest.wellnest.repository.WaterSleepLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/tracker")
@CrossOrigin(origins = "*")
public class TrackerController {

        private final WorkoutLogRepository workoutRepo;
        private final MealLogRepository mealRepo;
        private final WaterSleepLogRepository waterSleepRepo;

        public TrackerController(
                        WorkoutLogRepository workoutRepo,
                        MealLogRepository mealRepo,
                        WaterSleepLogRepository waterSleepRepo) {
                this.workoutRepo = workoutRepo;
                this.mealRepo = mealRepo;
                this.waterSleepRepo = waterSleepRepo;
        }

        // ========= WORKOUTS =========

        @PostMapping("/workouts")
        public ResponseEntity<WorkoutLog> logWorkout(@RequestBody Map<String, Object> payload) {
                Long userId = Long.valueOf(payload.get("userId").toString());
                String exerciseType = (String) payload.get("exerciseType");

                Integer duration = payload.get("durationMinutes") != null
                                ? Integer.valueOf(payload.get("durationMinutes").toString())
                                : null;

                Integer calories = payload.get("caloriesBurned") != null
                                ? Integer.valueOf(payload.get("caloriesBurned").toString())
                                : null;

                LocalDate date = payload.get("logDate") != null
                                ? LocalDate.parse(payload.get("logDate").toString())
                                : LocalDate.now();

                WorkoutLog log = new WorkoutLog();
                log.setUserId(userId);
                log.setExerciseType(exerciseType);
                log.setDurationMinutes(duration);
                log.setCaloriesBurned(calories);
                log.setLogDate(date);

                WorkoutLog saved = workoutRepo.save(log);
                return ResponseEntity.ok(saved);
        }

        @GetMapping("/workouts/{userId}/today")
        public List<WorkoutLog> getTodayWorkouts(@PathVariable Long userId) {
                LocalDate today = LocalDate.now();
                return workoutRepo.findByUserIdAndLogDateOrderByLogDateDesc(userId, today);
        }

        // ========= MEALS =========

        @PostMapping("/meals")
        public ResponseEntity<MealLog> logMeal(@RequestBody Map<String, Object> payload) {
                Long userId = Long.valueOf(payload.getOrDefault("userId", "0").toString());
                String mealType = (String) payload.get("mealType");
                String description = (String) payload.get("description");

                Integer calories = payload.get("calories") != null
                                ? Integer.valueOf(payload.get("calories").toString())
                                : null;

                Integer protein = payload.get("protein") != null
                                ? Integer.valueOf(payload.get("protein").toString())
                                : null;

                Integer carbs = payload.get("carbs") != null
                                ? Integer.valueOf(payload.get("carbs").toString())
                                : null;

                LocalDate date = payload.get("logDate") != null
                                ? LocalDate.parse(payload.get("logDate").toString())
                                : LocalDate.now();

                LocalTime time = payload.get("mealTime") != null
                                ? LocalTime.parse(payload.get("mealTime").toString())
                                : LocalTime.now();

                MealLog log = new MealLog();
                log.setUserId(userId);
                log.setMealType(mealType);
                log.setDescription(description);
                log.setCalories(calories);
                log.setProtein(protein);
                log.setCarbs(carbs);
                log.setLogDate(date);
                log.setMealTime(time);

                MealLog saved = mealRepo.save(log);
                return ResponseEntity.ok(saved);
        }

        @GetMapping("/meals/{userId}/today")
        public List<MealLog> getTodayMeals(@PathVariable Long userId) {
                LocalDate today = LocalDate.now();
                return mealRepo.findByUserIdAndLogDateOrderByMealTimeAsc(userId, today);
        }

        // ========= WATER + SLEEP =========

        @PostMapping("/water-sleep")
        public ResponseEntity<WaterSleepLog> logWaterSleep(@RequestBody Map<String, Object> payload) {
                Long userId = Long.valueOf(payload.get("userId").toString());

                Double water = payload.get("waterIntakeLiters") != null
                                ? Double.valueOf(payload.get("waterIntakeLiters").toString())
                                : 0.0;

                Double sleep = payload.get("sleepHours") != null
                                ? Double.valueOf(payload.get("sleepHours").toString())
                                : 0.0;

                String quality = (String) payload.get("sleepQuality");

                LocalDate date = payload.get("logDate") != null
                                ? LocalDate.parse(payload.get("logDate").toString())
                                : LocalDate.now();

                WaterSleepLog log = new WaterSleepLog();
                log.setUserId(userId);
                log.setLogDate(date);
                log.setWaterIntakeLiters(water);
                log.setSleepHours(sleep);
                log.setSleepQuality(quality);

                WaterSleepLog saved = waterSleepRepo.save(log);
                return ResponseEntity.ok(saved);
        }

        @GetMapping("/water-sleep/{userId}/today")
        public List<WaterSleepLog> getTodayWaterSleep(@PathVariable Long userId) {
                LocalDate today = LocalDate.now();
                return waterSleepRepo.findByUserIdAndLogDate(userId, today);

        }// ============ ANALYTICS (Milestone 4) ============

        // ========= DASHBOARD ANALYTICS =========
        @GetMapping("/analytics/{userId}/dashboard")
        public Map<String, Object> getDashboardStats(@PathVariable Long userId) {
                LocalDate today = LocalDate.now();
                LocalDate sevenDaysAgo = today.minusDays(6);

                // 1. Fetch data
                List<WorkoutLog> workouts = workoutRepo.findByUserIdAndLogDateBetween(userId, sevenDaysAgo, today);
                List<WaterSleepLog> waterSleepLogs = waterSleepRepo.findByUserIdAndLogDateBetween(userId, sevenDaysAgo,
                                today);
                List<MealLog> meals = mealRepo.findByUserIdAndLogDateBetween(userId, sevenDaysAgo, today); // Fetch
                                                                                                           // Meals

                // 2. Prepare Date Labels & Indices
                String[] labels = new String[7];
                Map<LocalDate, Integer> dateIndexMap = new HashMap<>();
                for (int i = 0; i < 7; i++) {
                        LocalDate d = sevenDaysAgo.plusDays(i);
                        labels[i] = d.getDayOfWeek().toString().substring(0, 3);
                        dateIndexMap.put(d, i);
                }

                // 3. Process Workouts (Type Breakdown & Total Calories Burned)
                Map<String, int[]> typeDataMap = new HashMap<>(); // Type -> [Sun, Mon...]
                int[] calorieArr = new int[7]; // Burned
                int todayCalories = 0;

                for (WorkoutLog w : workouts) {
                        LocalDate d = w.getLogDate();
                        if (!dateIndexMap.containsKey(d))
                                continue;

                        int idx = dateIndexMap.get(d);
                        int duration = w.getDurationMinutes() != null ? w.getDurationMinutes() : 0;
                        int cals = w.getCaloriesBurned() != null ? w.getCaloriesBurned() : 0;
                        String type = w.getExerciseType() != null ? w.getExerciseType() : "Other";

                        // Add to breakdown
                        typeDataMap.putIfAbsent(type, new int[7]);
                        typeDataMap.get(type)[idx] += duration;

                        // Add to total calories
                        calorieArr[idx] += cals;

                        if (d.equals(today)) {
                                todayCalories += cals;
                        }
                }

                // Convert typeDataMap to List of Maps for frontend
                List<Map<String, Object>> workoutDatasets = new java.util.ArrayList<>();
                for (Map.Entry<String, int[]> entry : typeDataMap.entrySet()) {
                        Map<String, Object> dataset = new HashMap<>();
                        dataset.put("label", entry.getKey());
                        dataset.put("data", entry.getValue());
                        workoutDatasets.add(dataset);
                }

                // 4. Process Meals (Calories Consumed)
                int[] consumedArr = new int[7];
                for (MealLog m : meals) {
                        LocalDate d = m.getLogDate();
                        if (!dateIndexMap.containsKey(d))
                                continue;

                        int idx = dateIndexMap.get(d);
                        int cals = m.getCalories() != null ? m.getCalories() : 0;
                        consumedArr[idx] += cals;
                }

                // 5. Process Water (Today) & Sleep (Last 3 Days)
                Double todayWater = 0.0;
                List<Map<String, Object>> sleepHistory = new java.util.ArrayList<>();

                // Find today's water
                for (WaterSleepLog log : waterSleepLogs) {
                        if (log.getLogDate().equals(today)) {
                                if (log.getWaterIntakeLiters() != null)
                                        todayWater += log.getWaterIntakeLiters();
                        }
                }

                // Find last 3 days sleep (Today, Yesterday, Day Before)
                // We iterate backwards from today
                // Find last 3 days sleep (Today, Yesterday, Day Before)
                for (int i = 0; i < 3; i++) { // 0, 1, 2
                        LocalDate d = today.minusDays(i);

                        // Sum sleep hours for this date
                        double totalSleep = waterSleepLogs.stream()
                                        .filter(l -> l.getLogDate().equals(d))
                                        .mapToDouble(l -> l.getSleepHours() != null ? l.getSleepHours() : 0.0)
                                        .sum();

                        if (totalSleep > 0) {
                                // Calculate quality based on total sleep
                                String quality;
                                if (totalSleep >= 7 && totalSleep <= 9) {
                                        quality = "Excellent";
                                } else if ((totalSleep >= 6 && totalSleep < 7) || totalSleep > 9) {
                                        quality = "Good";
                                } else if (totalSleep >= 5 && totalSleep < 6) {
                                        quality = "Average";
                                } else {
                                        quality = "Poor";
                                }

                                Map<String, Object> s = new HashMap<>();
                                s.put("day", d.getDayOfWeek().toString().substring(0, 3));
                                s.put("hours", totalSleep);
                                s.put("quality", quality);
                                sleepHistory.add(s);
                        }
                }

                Map<String, Object> result = new HashMap<>();
                result.put("labels", labels);
                result.put("workoutDatasets", workoutDatasets); // Granular data
                result.put("calorieData", calorieArr); // Burned
                result.put("caloriesConsumed", consumedArr); // Consumed (NEW)
                result.put("todayCalories", todayCalories);
                result.put("todayWater", todayWater);
                result.put("sleepHistory", sleepHistory); // List of {day, hours, quality}

                return result;
        }

        // ========= WEEKLY ANALYTICS =========
        @GetMapping("/analytics/{userId}/weekly")
        public Map<String, Object> getWeeklyAnalytics(@PathVariable Long userId) {

                LocalDate endDate = LocalDate.now();
                LocalDate startDate = endDate.minusDays(6); // last 7 days

                // ✅ these method names MUST match the repositories above
                List<WorkoutLog> workouts = workoutRepo.findByUserIdAndLogDateBetween(userId, startDate, endDate);

                List<MealLog> meals = mealRepo.findByUserIdAndLogDateBetween(userId, startDate, endDate);

                List<WaterSleepLog> waterSleepLogs = waterSleepRepo.findByUserIdAndLogDateBetween(userId, startDate,
                                endDate);

                int totalWorkoutMinutes = workouts.stream()
                                .filter(w -> w.getDurationMinutes() != null)
                                .mapToInt(WorkoutLog::getDurationMinutes)
                                .sum();

                int totalWorkoutSessions = workouts.size();

                int totalMealCalories = meals.stream()
                                .filter(m -> m.getCalories() != null)
                                .mapToInt(MealLog::getCalories)
                                .sum();

                double avgWaterIntake = waterSleepLogs.stream()
                                .filter(ws -> ws.getWaterIntakeLiters() != null)
                                .mapToDouble(WaterSleepLog::getWaterIntakeLiters)
                                .average()
                                .orElse(0.0);

                double avgSleepHours = waterSleepLogs.stream()
                                .filter(ws -> ws.getSleepHours() != null)
                                .mapToDouble(WaterSleepLog::getSleepHours)
                                .average()
                                .orElse(0.0);

                Map<String, Object> result = new HashMap<>();
                result.put("startDate", startDate);
                result.put("endDate", endDate);
                result.put("totalWorkoutMinutes", totalWorkoutMinutes);
                result.put("totalWorkoutSessions", totalWorkoutSessions);
                result.put("totalMealCalories", totalMealCalories);
                result.put("avgWaterIntake", avgWaterIntake);
                result.put("avgSleepHours", avgSleepHours);

                return result;
        }

}
