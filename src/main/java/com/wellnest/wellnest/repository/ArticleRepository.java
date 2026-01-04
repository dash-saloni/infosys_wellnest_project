package com.wellnest.wellnest.repository;

import com.wellnest.wellnest.model.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findAllByOrderByCreatedAtDesc();

    List<Article> findByTrainerEmailOrderByCreatedAtDesc(String trainerEmail);

    List<Article> findBySpecializationContainingIgnoreCase(String specialization);
}
