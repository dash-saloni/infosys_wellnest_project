package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.Trainer;
import com.wellnest.wellnest.model.TrainerClient;
import com.wellnest.wellnest.model.User;
import com.wellnest.wellnest.repository.TrainerClientRepository;
import com.wellnest.wellnest.repository.TrainerRepository;
import com.wellnest.wellnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/trainer-client")
@CrossOrigin(origins = "*")
public class TrainerClientController {

    @Autowired
    private TrainerClientRepository trainerClientRepo;

    @Autowired
    private TrainerRepository trainerRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 1. Book a Trainer (User Action)
    @PostMapping("/book")
    public ResponseEntity<?> bookTrainer(@RequestParam Long userId, @RequestParam Long trainerId) {
        Optional<User> userOpt = userRepo.findById(userId);
        Optional<Trainer> trainerOpt = trainerRepo.findById(trainerId);

        if (userOpt.isEmpty() || trainerOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("User or Trainer not found");
        }

        User user = userOpt.get();
        Trainer trainer = trainerOpt.get();

        // Check if user already has an active or pending request
        List<TrainerClient> existingList = trainerClientRepo.findByUser(user);
        for (TrainerClient tc : existingList) {
            String status = tc.getStatus();
            if ("Data Seeder".equals(status)) {
                // Ignore
            } else if ("ACTIVE".equals(status) || "PENDING".equals(status)) {
                return ResponseEntity.status(409).body("You already have a trainer request in " + status + " status.");
            }
        }

        TrainerClient request = new TrainerClient();
        request.setUser(user);
        request.setTrainer(trainer);
        request.setStatus("PENDING");
        request.setEnrolledAt(LocalDateTime.now());
        try {
            trainerClientRepo.save(request);
            return ResponseEntity.ok("Booking request sent successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error saving booking: " + e.getMessage());
        }
    }

    // 2. Get Pending Requests (Trainer Action)
    // 3. Get Active Clients (Trainer Action)
    // Combined endpoint or separate? Let's do separate for clarity.

    @GetMapping("/requests/{trainerId}")
    public List<TrainerClient> getPendingRequests(@PathVariable Long trainerId) {
        Optional<Trainer> t = trainerRepo.findById(trainerId);
        if (t.isEmpty())
            return List.of();
        return trainerClientRepo.findByTrainerAndStatus(t.get(), "PENDING");
    }

    @GetMapping("/clients/{trainerId}")
    public List<TrainerClient> getActiveClients(@PathVariable Long trainerId) {
        Optional<Trainer> t = trainerRepo.findById(trainerId);
        if (t.isEmpty())
            return List.of();
        return trainerClientRepo.findByTrainerAndStatus(t.get(), "ACTIVE");
    }

    @GetMapping("/clients-past/{trainerId}")
    public List<TrainerClient> getPastClients(@PathVariable Long trainerId) {
        Optional<Trainer> t = trainerRepo.findById(trainerId);
        if (t.isEmpty())
            return List.of();
        // Custom query or filter. Since we don't have a direct method for "IN" clause
        // easily without custom repo method,
        // we can fetch all and filter, or add a method.
        // Or simpler: just use native query or multiple calls.
        // Let's rely on simple filtering in memory for now as volume is low, OR add a
        // method in Repo if we could.
        // Actually, let's just use jdbcTemplate for a quick robust query or logic.
        // Better: Find all by trainer and filter.
        List<TrainerClient> all = trainerClientRepo.findByTrainer(t.get());
        return all.stream()
                .filter(c -> "CANCELLED".equals(c.getStatus()) || "REJECTED".equals(c.getStatus())
                        || "INACTIVE".equals(c.getStatus()))
                .toList();
    }

    // 4. Accept/Reject Request (Trainer Action)
    @PostMapping("/respond")
    public ResponseEntity<?> respondToRequest(@RequestParam Long requestId, @RequestParam String status) {
        Optional<TrainerClient> tcOpt = trainerClientRepo.findById(requestId);
        if (tcOpt.isEmpty())
            return ResponseEntity.notFound().build();

        TrainerClient tc = tcOpt.get();
        if ("ACCEPT".equalsIgnoreCase(status)) {
            tc.setStatus("ACTIVE");
        } else if ("REJECT".equalsIgnoreCase(status)) {
            tc.setStatus("REJECTED");
        } else {
            return ResponseEntity.badRequest().body("Invalid status action");
        }

        tc.setRespondedAt(LocalDateTime.now());
        trainerClientRepo.save(tc);
        return ResponseEntity.ok("Request updated to " + tc.getStatus());
    }

    // 5. Get My Trainer (User Action)
    @GetMapping("/my-trainer/{userId}")
    public ResponseEntity<?> getMyTrainer(@PathVariable Long userId) {
        Optional<User> u = userRepo.findById(userId);
        if (u.isEmpty())
            return ResponseEntity.notFound().build();

        Optional<TrainerClient> tc = trainerClientRepo.findByUserAndStatus(u.get(), "ACTIVE");
        if (tc.isPresent()) {
            return ResponseEntity.ok(tc.get());
        } else {
            // Check pending as well?
            Optional<TrainerClient> pending = trainerClientRepo.findByUserAndStatus(u.get(), "PENDING");
            if (pending.isPresent()) {
                return ResponseEntity.ok(Map.of("status", "PENDING", "trainer", pending.get().getTrainer()));
            }
            return ResponseEntity.ok(Map.of("status", "NONE"));
        }
    }

    // 6. Cancel Request (User Action)
    @DeleteMapping("/cancel/{id}")
    public ResponseEntity<?> cancelRequest(@PathVariable Long id) {
        Optional<TrainerClient> tcOpt = trainerClientRepo.findById(id);
        if (tcOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        TrainerClient tc = tcOpt.get();
        // Allow cancelling PENDING and ACTIVE
        tc.setStatus("CANCELLED");
        tc.setCancelledAt(LocalDateTime.now());
        trainerClientRepo.save(tc);

        return ResponseEntity.ok(Map.of("message", "Request cancelled successfully"));
    }

    // 7. Get History (User Action)
    @GetMapping("/history/{userId}")
    public List<TrainerClient> getClientHistory(@PathVariable Long userId) {
        User user = new User();
        user.setId(userId);
        return trainerClientRepo.findByUser(user);
    }

    // 8. Fix DB Schema (One-time utility) - ROBUST VERSION
    // 8. Fix DB Schema (One-time utility) - ROBUST VERSION (FK Aware)
    @GetMapping("/fix-db")
    public ResponseEntity<?> fixDbSchema() {
        try {
            StringBuilder log = new StringBuilder();

            // 1. Find Foreign Key Name
            String fkSql = "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE " +
                    "WHERE TABLE_NAME = 'trainer_client' AND COLUMN_NAME = 'user_id' " +
                    "AND CONSTRAINT_SCHEMA = 'wellnestdb' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1";
            String fkName = null;
            try {
                fkName = jdbcTemplate.queryForObject(fkSql, String.class);
            } catch (Exception e) {
                log.append("FK not found via Schema query. ");
            }

            // 2. Find Unique Index Name
            String idxSql = "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE " +
                    "WHERE TABLE_NAME = 'trainer_client' AND COLUMN_NAME = 'user_id' " +
                    "AND CONSTRAINT_SCHEMA = 'wellnestdb' AND REFERENCED_TABLE_NAME IS NULL LIMIT 1";
            String idxName = null;
            try {
                idxName = jdbcTemplate.queryForObject(idxSql, String.class);
            } catch (Exception e) {
                // heuristic fallback from user report
                idxName = "UKd2801weicwyecvp0kuj2krkmd";
            }

            // 3. Drop FK if exists
            if (fkName != null) {
                try {
                    jdbcTemplate.execute("ALTER TABLE trainer_client DROP FOREIGN KEY " + fkName);
                    log.append("Dropped FK: ").append(fkName).append(". ");
                } catch (Exception e) {
                    log.append("Failed to drop FK: ").append(e.getMessage()).append(". ");
                }
            }

            // 4. Drop Unique Index
            try {
                // Try dropping the one found, or the one reported
                String targetIndex = (idxName != null) ? idxName : "UKd2801weicwyecvp0kuj2krkmd";
                jdbcTemplate.execute("ALTER TABLE trainer_client DROP INDEX " + targetIndex);
                log.append("Dropped Index: ").append(targetIndex).append(". ");
            } catch (Exception e) {
                // Try generic
                try {
                    jdbcTemplate.execute("ALTER TABLE trainer_client DROP INDEX UK_user_id");
                    log.append("Dropped UK_user_id. ");
                } catch (Exception ex) {
                    log.append("Failed to drop Index: ").append(e.getMessage()).append(". ");
                }
            }

            // 5. Re-add Foreign Key (Non-Unique)
            try {
                jdbcTemplate.execute(
                        "ALTER TABLE trainer_client ADD CONSTRAINT FK_trainer_client_user_v2 FOREIGN KEY (user_id) REFERENCES users(id)");
                log.append("Re-added Generic FK. ");
            } catch (Exception e) {
                log.append("Failed to re-add FK (maybe exists): ").append(e.getMessage());
            }

            return ResponseEntity.ok("DB Fix Attempted: " + log.toString());

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Critical Error: " + e.getMessage());
        }
    }

    // 9. Add Client manually (Trainer Action)
    @PostMapping("/add")
    public ResponseEntity<?> addClient(@RequestParam Long trainerId, @RequestParam String userEmail) {
        Optional<Trainer> trainerOpt = trainerRepo.findById(trainerId);
        if (trainerOpt.isEmpty())
            return ResponseEntity.badRequest().body("Trainer not found");

        Optional<User> userOpt = userRepo.findByEmail(userEmail);
        if (userOpt.isEmpty())
            return ResponseEntity.badRequest().body("User with email " + userEmail + " not found");

        User user = userOpt.get();
        Trainer trainer = trainerOpt.get();

        // Check for existing relationship
        List<TrainerClient> existing = trainerClientRepo.findByUser(user);
        for (TrainerClient tc : existing) {
            if ("ACTIVE".equals(tc.getStatus())) {
                return ResponseEntity.status(409).body("User is already assigned to a trainer.");
            }
            if ("PENDING".equals(tc.getStatus()) && tc.getTrainer().getId().equals(trainerId)) {
                // If pending with THIS trainer, just activate it
                tc.setStatus("ACTIVE");
                tc.setRespondedAt(LocalDateTime.now());
                trainerClientRepo.save(tc);
                return ResponseEntity.ok("Pending request accepted and client added.");
            }
        }

        TrainerClient tc = new TrainerClient();
        tc.setUser(user);
        tc.setTrainer(trainer);
        tc.setStatus("ACTIVE"); // Direct add = Active
        tc.setEnrolledAt(LocalDateTime.now());
        trainerClientRepo.save(tc);

        return ResponseEntity.ok("Client added successfully");
    }
}
