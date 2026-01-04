package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.User;
import com.wellnest.wellnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getProfile(@RequestParam String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        }
        return ResponseEntity.badRequest().body("User not found");
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        if (email == null)
            return ResponseEntity.badRequest().body("Email required");

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Update fields if present
            if (payload.containsKey("fullName"))
                user.setFullName((String) payload.get("fullName"));
            if (payload.containsKey("age"))
                user.setAge(Integer.parseInt(payload.get("age").toString()));
            if (payload.containsKey("weight"))
                user.setWeight(Double.parseDouble(payload.get("weight").toString()));
            if (payload.containsKey("goal"))
                user.setGoal((String) payload.get("goal"));

            userRepository.save(user);
            return ResponseEntity.ok("Profile updated successfully");
        }
        return ResponseEntity.badRequest().body("User not found");
    }
}
