package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.ChatMessage;
import com.wellnest.wellnest.model.TrainerClient;
import com.wellnest.wellnest.repository.ChatMessageRepository;
import com.wellnest.wellnest.repository.TrainerClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private ChatMessageRepository chatRepo;

    @Autowired
    private TrainerClientRepository clientRepo;

    // Send Message
    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> payload) {
        Long relationshipId = Long.valueOf(payload.get("relationshipId").toString());
        Long senderId = Long.valueOf(payload.get("senderId").toString());
        String senderType = (String) payload.get("senderType"); // USER or TRAINER
        String senderName = (String) payload.get("senderName");
        String messageText = (String) payload.get("message");

        Optional<TrainerClient> tc = clientRepo.findById(relationshipId);
        if (tc.isEmpty())
            return ResponseEntity.notFound().build();

        ChatMessage msg = new ChatMessage();
        msg.setClientRelationship(tc.get());
        msg.setSenderId(senderId);
        msg.setSenderType(senderType);
        msg.setSenderName(senderName);
        msg.setMessage(messageText);

        chatRepo.save(msg);
        return ResponseEntity.ok(msg);
    }

    // Get History
    @GetMapping("/{relationshipId}")
    public List<ChatMessage> getChatHistory(@PathVariable Long relationshipId) {
        Optional<TrainerClient> tc = clientRepo.findById(relationshipId);
        if (tc.isEmpty())
            return List.of();
        return chatRepo.findByClientRelationshipOrderBySentAtAsc(tc.get());
    }

    // Get Unread Counts for Trainer (Map of RelationshipID -> Count)
    @GetMapping("/unread/trainer/{trainerId}")
    public Map<Long, Long> getUnreadCountsForTrainer(@PathVariable Long trainerId) {
        // In a real app with custom JPQL this is one query. Here we iterate active
        // clients.
        // 1. Find all active clients for trainer
        List<TrainerClient> clients = clientRepo.findByTrainerIdAndStatus(trainerId, "ACTIVE");
        Map<Long, Long> counts = new java.util.HashMap<>();

        for (TrainerClient tc : clients) {
            // Count messages from USER that are unread
            long count = chatRepo.countByClientRelationshipAndSenderTypeAndIsReadFalse(tc, "USER");
            if (count > 0) {
                counts.put(tc.getId(), count);
            }
        }
        return counts;
    }

    // Get Unread Count for User
    @GetMapping("/unread/user/{userId}")
    public Map<String, Long> getUnreadCountForUser(@PathVariable Long userId) {
        // Find the active relationship
        Optional<TrainerClient> tc = clientRepo.findByUserIdAndStatus(userId, "ACTIVE");
        long count = 0;
        if (tc.isPresent()) {
            // Count messages from TRAINER that are unread
            count = chatRepo.countByClientRelationshipAndSenderTypeAndIsReadFalse(tc.get(), "TRAINER");
        }
        return java.util.Collections.singletonMap("count", count);
    }

    // Mark as Read
    @PutMapping("/{relationshipId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long relationshipId, @RequestParam String readerType) {
        Optional<TrainerClient> tc = clientRepo.findById(relationshipId);
        if (tc.isEmpty())
            return ResponseEntity.notFound().build();

        // If reader is TRAINER, we mark messages from USER as read.
        // If reader is USER, we mark messages from TRAINER as read.
        String targetSenderType = "TRAINER".equals(readerType) ? "USER" : "TRAINER";

        // Fetch unread messages
        // Efficient way: Custom Update Query.
        // Simple way: Fetch, Loop, Save.
        // Since we don't have custom query in Repo yet, let's use the simple way (fetch
        // all unread from X)
        // Ensure "findByClientRelationshipAndSenderTypeAndIsReadFalse" exists or just
        // iterate history?
        // Let's iterate history for simplicity as we don't have the specific list
        // method in repo interface

        List<ChatMessage> history = chatRepo.findByClientRelationshipOrderBySentAtAsc(tc.get());
        boolean updated = false;
        for (ChatMessage m : history) {
            if (m.getSenderType().equals(targetSenderType) && !m.isRead()) {
                m.setRead(true);
                updated = true;
            }
        }
        if (updated) {
            chatRepo.saveAll(history);
        }

        return ResponseEntity.ok().build();
    }
}
