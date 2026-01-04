package com.wellnest.wellnest.model;

import jakarta.persistence.*;

@Entity
public class Trainer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String specialization; // e.g., "Weight Loss", "Muscle Gain", "Yoga", "General Fitness"
    private int experienceYears;
    private String bio;
    private String contactEmail;
    private String imageUrl; // For profile picture placeholder

    @com.fasterxml.jackson.annotation.JsonIgnore
    private String password; // Redundant hashed password as requested

    private String location; // e.g. "New York", "Online", "London"
    private String availability; // e.g. "Morning", "Evening", "Weekends"

    public Trainer() {
    }

    public Trainer(String name, String specialization, int experienceYears, String bio, String contactEmail,
            String imageUrl) {
        this.name = name;
        this.specialization = specialization;
        this.experienceYears = experienceYears;
        this.bio = bio;
        this.contactEmail = contactEmail;
        this.imageUrl = imageUrl;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public int getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(int experienceYears) {
        this.experienceYears = experienceYears;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAvailability() {
        return availability;
    }

    public void setAvailability(String availability) {
        this.availability = availability;
    }
}
