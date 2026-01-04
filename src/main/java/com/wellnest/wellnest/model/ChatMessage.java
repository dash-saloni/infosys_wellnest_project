package com.wellnest.wellnest.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long senderId; // Can be User ID or Trainer ID
    private String senderType; // "USER" or "TRAINER"
    private String senderName;

    // We link by ID but to simplify queries we might store Relationship ID
    @ManyToOne
    @JoinColumn(name = "client_relationship_id")
    private TrainerClient clientRelationship;

    @Column(columnDefinition = "TEXT")
    private String message;

    private LocalDateTime sentAt;

    private boolean isRead = false;

    @PrePersist
    protected void onCreate() {
        this.sentAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getSenderType() {
        return senderType;
    }

    public void setSenderType(String senderType) {
        this.senderType = senderType;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public TrainerClient getClientRelationship() {
        return clientRelationship;
    }

    public void setClientRelationship(TrainerClient clientRelationship) {
        this.clientRelationship = clientRelationship;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }
}
