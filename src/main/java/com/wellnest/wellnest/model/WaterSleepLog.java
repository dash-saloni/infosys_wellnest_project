package com.wellnest.wellnest.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "water_sleep_logs")
public class WaterSleepLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private LocalDate logDate;

    private Double waterIntakeLiters;  // e.g. 2.5
    private Double sleepHours;         // e.g. 7.0
    private String sleepQuality;       // Poor / Ok / Good / Excellent

    public WaterSleepLog() {}

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDate getLogDate() { return logDate; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }

    public Double getWaterIntakeLiters() { return waterIntakeLiters; }
    public void setWaterIntakeLiters(Double waterIntakeLiters) { this.waterIntakeLiters = waterIntakeLiters; }

    public Double getSleepHours() { return sleepHours; }
    public void setSleepHours(Double sleepHours) { this.sleepHours = sleepHours; }

    public String getSleepQuality() { return sleepQuality; }
    public void setSleepQuality(String sleepQuality) { this.sleepQuality = sleepQuality; }
}
