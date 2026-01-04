package com.wellnest.wellnest.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "articles")
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title; // Caption

    @Column(columnDefinition = "TEXT")
    private String description;

    private String specialization;

    private String imageUrl;

    private String trainerName;

    private String trainerEmail;

    private LocalDateTime createdAt;

    private int likesCount = 0;

    @ManyToMany
    @JoinTable(name = "article_likes", joinColumns = @JoinColumn(name = "article_id"), inverseJoinColumns = @JoinColumn(name = "user_id"))
    private java.util.Set<User> likedBy = new java.util.HashSet<>();

    @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<Comment> comments = new java.util.ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getTrainerName() {
        return trainerName;
    }

    public void setTrainerName(String trainerName) {
        this.trainerName = trainerName;
    }

    public String getTrainerEmail() {
        return trainerEmail;
    }

    public void setTrainerEmail(String trainerEmail) {
        this.trainerEmail = trainerEmail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public int getLikesCount() {
        return likesCount;
    }

    public void setLikesCount(int likesCount) {
        this.likesCount = likesCount;
    }

    public java.util.Set<User> getLikedBy() {
        return likedBy;
    }

    public void setLikedBy(java.util.Set<User> likedBy) {
        this.likedBy = likedBy;
    }

    public java.util.List<Comment> getComments() {
        return comments;
    }

    public void setComments(java.util.List<Comment> comments) {
        this.comments = comments;
    }
}
