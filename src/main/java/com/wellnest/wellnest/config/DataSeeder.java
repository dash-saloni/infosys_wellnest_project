package com.wellnest.wellnest.config;

import com.wellnest.wellnest.model.Role;
import com.wellnest.wellnest.model.User;
import com.wellnest.wellnest.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner demoData(UserRepository userRepo, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepo.existsByEmail("demo@wellnest.com")) {
                User user = new User();
                user.setFullName("Demo User");
                user.setEmail("demo@wellnest.com");
                user.setPassword(passwordEncoder.encode("password123"));
                user.setRole(Role.USER);
                user.setAge(25);
                user.setWeight(70.0);
                user.setGoal("Stay Fit");
                userRepo.save(user);
                System.out.println("Seeded Demo User: demo@wellnest.com / password123");
            }
        };
    }
}
