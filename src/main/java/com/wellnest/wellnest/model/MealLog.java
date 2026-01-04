package com.wellnest.wellnest.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "meal_logs")
public class MealLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private LocalDate logDate;
    private LocalTime mealTime;

    private String mealType;      // Breakfast / Lunch / Snack / Dinner
    private String description;   // What did you eat?

    private Integer calories;     // optional
    private Integer protein;      // optional (g)
    private Integer carbs;        // optional (g)

    public MealLog() {}

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDate getLogDate() { return logDate; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }

    public LocalTime getMealTime() { return mealTime; }
    public void setMealTime(LocalTime mealTime) { this.mealTime = mealTime; }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getCalories() { return calories; }
    public void setCalories(Integer calories) { this.calories = calories; }

    public Integer getProtein() { return protein; }
    public void setProtein(Integer protein) { this.protein = protein; }

    public Integer getCarbs() { return carbs; }
    public void setCarbs(Integer carbs) { this.carbs = carbs; }
}
