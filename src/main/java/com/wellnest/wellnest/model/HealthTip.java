package com.wellnest.wellnest.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "health_tips")
public class HealthTip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String text;

    private String category;

    private LocalDate tipDate;

    public HealthTip() {
    }

    public HealthTip(String text, String category, LocalDate tipDate) {
        this.text = text;
        this.category = category;
        this.tipDate = tipDate;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDate getTipDate() {
        return tipDate;
    }

    public void setTipDate(LocalDate tipDate) {
        this.tipDate = tipDate;
    }
}
