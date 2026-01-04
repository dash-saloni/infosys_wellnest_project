package com.wellnest.wellnest.repository;

import com.wellnest.wellnest.model.ChatMessage;
import com.wellnest.wellnest.model.TrainerClient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByClientRelationshipOrderBySentAtAsc(TrainerClient clientRelationship);

    long countByClientRelationshipAndSenderTypeAndIsReadFalse(TrainerClient clientRelationship, String senderType);

    // Custom query to get unread counts for a specific trainer (grouped by
    // relationship)
    // Actually, JPA makes grouping hard in method names. We can just fetch all
    // unread for a trainer?
    // Or simplified: Just find count per relationship

    // For Trainer Dashboard (all clients)
    // we will likely pull *all* active relationships for the trainer, then for
    // each, call count.
    // That is N+1 but simplest given JPA Repo limitations without custom JPQL.
    // Let's add JPQL for efficiency.
    // "SELECT c.clientRelationship.id, COUNT(c) FROM ChatMessage c WHERE
    // c.clientRelationship.trainer.id = :trainerId AND c.senderType = 'USER' AND
    // c.isRead = false GROUP BY c.clientRelationship.id"

    // For now, let's just stick to the simple count method and loop in Controller.
    // It's not performance critical for < 50 clients.
}
