package com.wellnest.wellnest.config;

import com.wellnest.wellnest.security.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.Customizer;

@Configuration
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults()) // picks up CorsConfigurationSource bean

                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // Permit all static resources and HTML pages (Client-side routing/auth check)
                        .requestMatchers("/", "/**.html", "/css/**", "/js/**", "/images/**", "/assets/**", "/error")
                        .permitAll()
                        .requestMatchers("/api/auth/**", "/api/password/**", "/api/trainers/**", "/api/articles/**",
                                "/uploads/**", "/api/blog/**", "/api/comments/**", "/api/trainer-client/fix-db",
                                "/api/tips/**",
                                "/api/db-fix/**")
                        .permitAll()
                        .requestMatchers("/api/user/**").hasRole("USER")
                        .requestMatchers("/api/trainer/**").hasRole("TRAINER")
                        .anyRequest().authenticated())

                // JWT FILTER
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

}
