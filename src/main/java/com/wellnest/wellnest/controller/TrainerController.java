package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.Trainer;
import com.wellnest.wellnest.model.User;
import com.wellnest.wellnest.repository.TrainerRepository;
import com.wellnest.wellnest.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trainers")
public class TrainerController {

    @Autowired
    private TrainerRepository trainerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    // Seeding some dummy data if empty - DISABLED per user request
    @PostConstruct
    public void init() {
        // Remove demo trainers if they exist to clean up
        String[] demoNames = { "Alex Fit", "Sarah Strong", "Zen Master", "Mike Runner", "Emily Balance", "Coach James",
                "Elena Swift" };
        for (String name : demoNames) {
            Trainer t = trainerRepository.findAll().stream().filter(tr -> tr.getName().equals(name)).findFirst()
                    .orElse(null);
            if (t != null) {
                trainerRepository.delete(t);
                // Also remove user?
                userRepository.findByEmail(t.getContactEmail()).ifPresent(u -> userRepository.delete(u));
            }
        }

        // Ensure all trainers have a corresponding User account
        syncTrainersToUsers();
    }

    private void syncTrainersToUsers() {
        List<Trainer> trainers = trainerRepository.findAll();
        for (Trainer t : trainers) {
            if (userRepository.findByEmail(t.getContactEmail()).isEmpty()) {
                User u = new User();
                u.setFullName(t.getName());
                u.setEmail(t.getContactEmail());
                u.setPassword(passwordEncoder.encode("Trainer@123"));
                u.setRole(com.wellnest.wellnest.model.Role.TRAINER);
                userRepository.save(u);
                System.out.println("Synced User account for Trainer: " + t.getName());
            }
        }
    }

    private void createTrainer(String name, String spec, int exp, String bio, String email, String img, String loc,
            String avail) {
        // Disabled
    }

    // Force reset data (to update images)
    @GetMapping("/reset")
    public String resetTrainers() {
        // trainerRepository.deleteAll(); // Disabled to protect real data
        // init();
        return "Reset disabled.";
    }

    @GetMapping
    public List<Trainer> getAllTrainers() {
        return trainerRepository.findAll();
    }

    // Recommend based on user email (and their goal)
    @GetMapping("/recommend")
    public ResponseEntity<?> getRecommended(
            @RequestParam String userEmail,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String availability,
            @RequestParam(required = false) String type) {

        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        String goal = user.getGoal(); // e.g. "Lose Weight"

        List<Trainer> allTrainers = trainerRepository.findAll();

        // Check if explicit filters are active
        boolean isFiltering = (location != null && !location.isEmpty() && !location.equals("All")) ||
                (availability != null && !availability.isEmpty() && !availability.equals("All")) ||
                (type != null && !type.isEmpty() && !type.equals("All"));

        List<Trainer> matches = allTrainers.stream()
                .filter(t -> {
                    boolean match = true;

                    // 1. Goal Match (Skip if explicit Type filter is on)
                    if (type != null && !type.isEmpty() && !type.equals("All")) {
                        if (t.getSpecialization() == null
                                || !t.getSpecialization().toLowerCase().contains(type.toLowerCase())) {
                            match = false;
                        }
                    } else if (!isFiltering && goal != null && !goal.isEmpty()) {
                        // Only use Goal matching if NOT filtering explicitly by type/loc/avail
                        // (Standard Recommendation Mode)
                        // OR we can allow mixing? Let's assume if user Filters, we ignore Goal unless
                        // it helps?
                        // User request: "filter by type/availability/location it should work properly"
                        // So if I select Location=Pune, I expect Pune trainers.
                        // If I DON'T select Type, should it still filter by Goal?
                        // Usually "Filter" implies "Search". "Recommendation" implies "Suggestions".
                        // If isFiltering is true, we should arguably IGNORE goal to let user
                        // wide-search.
                        // Let's Skip goal matching logic if isFiltering is true.

                        String spec = t.getSpecialization().toLowerCase();
                        String g = goal.toLowerCase();

                        if (g.contains("weight") || g.contains("fat")) {
                            if (!(spec.contains("weight") || spec.contains("fat") || spec.contains("cardio")
                                    || spec.contains("hiit")))
                                match = false;
                        } else if (g.contains("muscle") || g.contains("strength")) {
                            if (!(spec.contains("muscle") || spec.contains("strength") || spec.contains("power")
                                    || spec.contains("lift")))
                                match = false;
                        } else if (g.contains("yoga") || g.contains("flexibility")) {
                            if (!(spec.contains("yoga") || spec.contains("flexibility")))
                                match = false;
                        } else if (g.contains("run") || g.contains("cardio") || g.contains("endurance")) {
                            if (!(spec.contains("run") || spec.contains("cardio") || spec.contains("endurance")))
                                match = false;
                        }
                    }

                    // 2. Location
                    if (match && location != null && !location.isEmpty() && !location.equals("All")) {
                        String trLocation = t.getLocation() != null ? t.getLocation() : "Online";
                        if (!trLocation.toLowerCase().contains(location.toLowerCase())) {
                            match = false;
                        }
                    }

                    // 3. Availability
                    if (match && availability != null && !availability.isEmpty() && !availability.equals("All")) {
                        String trAvailability = t.getAvailability() != null ? t.getAvailability() : "Flexible";
                        if (!trAvailability.toLowerCase().contains(availability.toLowerCase())) {
                            match = false;
                        }
                    }

                    return match;
                })
                .toList();

        // Fallback: if no specific matches, return all ONLY IF NOT FILTERING
        if (matches.isEmpty() && !isFiltering) {
            return ResponseEntity.ok(allTrainers);
        }

        return ResponseEntity.ok(matches);
    }

    // Get Single Trainer Profile
    @GetMapping("/profile")
    public ResponseEntity<?> getTrainerProfile(@RequestParam String email) {
        Trainer trainer = trainerRepository.findAll().stream()
                .filter(t -> t.getContactEmail().equalsIgnoreCase(email))
                .findFirst()
                .orElse(null);
        if (trainer == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(trainer);
    }

    // Update Profile
    @PutMapping("/update")
    public ResponseEntity<?> updateTrainer(
            @RequestParam("email") String email,
            @RequestParam("name") String name,
            @RequestParam("specialization") String specialization,
            @RequestParam("bio") String bio,
            @RequestParam("location") String location,
            @RequestParam("experience") int experience,
            @RequestParam("availability") String availability,
            @RequestParam(value = "image", required = false) org.springframework.web.multipart.MultipartFile image) {

        Trainer trainer = trainerRepository.findAll().stream()
                .filter(t -> t.getContactEmail().equalsIgnoreCase(email))
                .findFirst()
                .orElse(null);

        if (trainer == null)
            return ResponseEntity.badRequest().body("Trainer not found");

        trainer.setName(name);
        trainer.setSpecialization(specialization);
        trainer.setBio(bio);
        trainer.setLocation(location);
        trainer.setExperienceYears(experience);
        trainer.setAvailability(availability);

        if (image != null && !image.isEmpty()) {
            try {
                String uploadDir = System.getProperty("user.dir") + "/src/main/resources/static/uploads/";
                java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir);
                if (!java.nio.file.Files.exists(uploadPath)) {
                    java.nio.file.Files.createDirectories(uploadPath);
                }
                String fileName = java.util.UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
                java.nio.file.Path filePath = uploadPath.resolve(fileName);
                java.nio.file.Files.copy(image.getInputStream(), filePath,
                        java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                trainer.setImageUrl("uploads/" + fileName);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        trainerRepository.save(trainer);

        // Sync Name to User Table
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            user.setFullName(name);
            userRepository.save(user);
        }

        return ResponseEntity.ok("Profile updated successfully");
    }
}
