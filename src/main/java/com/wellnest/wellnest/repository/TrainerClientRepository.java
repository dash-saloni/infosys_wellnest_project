package com.wellnest.wellnest.repository;

import com.wellnest.wellnest.model.TrainerClient;
import com.wellnest.wellnest.model.Trainer;
import com.wellnest.wellnest.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TrainerClientRepository extends JpaRepository<TrainerClient, Long> {
    Optional<TrainerClient> findByUserAndStatus(User user, String status);

    List<TrainerClient> findByUser(User user); // General check

    List<TrainerClient> findByTrainerAndStatus(Trainer trainer, String status);

    List<TrainerClient> findByTrainer(Trainer trainer);

    // Added to support ID-based lookups
    List<TrainerClient> findByTrainerIdAndStatus(Long trainerId, String status);

    Optional<TrainerClient> findByUserIdAndStatus(Long userId, String status);
}
