package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.Article;
import com.wellnest.wellnest.model.User;
import com.wellnest.wellnest.repository.ArticleRepository;
import com.wellnest.wellnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/articles")
@CrossOrigin(origins = "*")
public class ArticleController {

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private UserRepository userRepository; // To get trainer name if needed

    @Autowired
    private com.wellnest.wellnest.repository.CommentRepository commentRepository;

    // 1. Create Article
    @PostMapping
    public ResponseEntity<?> createArticle(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("specialization") String specialization,
            @RequestParam("trainerEmail") String trainerEmail,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        System.out.println("Creating Article for: " + trainerEmail);

        // Fetch user just to get the name, but don't fail hard if not found (though
        // expected)
        User user = userRepository.findByEmail(trainerEmail).orElse(null);
        String trainerName = (user != null) ? user.getFullName() : "Trainer";

        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            try {
                String uploadDir = System.getProperty("user.dir") + "/src/main/resources/static/uploads/";
                Path uploadPath = Paths.get(uploadDir);
                if (!Files.exists(uploadPath))
                    Files.createDirectories(uploadPath);

                String fileName = UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                imageUrl = "uploads/" + fileName;
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.internalServerError().body("Image upload failed");
            }
        }

        Article article = new Article();
        article.setTitle(title);
        article.setDescription(description);
        article.setSpecialization(specialization);
        article.setTrainerEmail(trainerEmail);
        article.setTrainerName(trainerName);
        article.setImageUrl(imageUrl);

        articleRepository.save(article);
        System.out.println("Article Saved: " + article.getId());

        return ResponseEntity.ok("Article created successfully");
    }

    // 1.1 Update Article (Using POST for safe multipart handling)
    @PostMapping("/update/{id}")
    public ResponseEntity<?> updateArticle(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("specialization") String specialization,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        Optional<Article> articleOpt = articleRepository.findById(id);
        if (articleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Article article = articleOpt.get();
        article.setTitle(title);
        article.setDescription(description);
        article.setSpecialization(specialization);

        if (image != null && !image.isEmpty()) {
            try {
                String uploadDir = System.getProperty("user.dir") + "/src/main/resources/static/uploads/";
                Path uploadPath = Paths.get(uploadDir);
                if (!Files.exists(uploadPath))
                    Files.createDirectories(uploadPath);

                String fileName = UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                article.setImageUrl("uploads/" + fileName);
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.internalServerError().body("Image upload failed");
            }
        }

        articleRepository.save(article);
        return ResponseEntity.ok("Article updated successfully");
    }

    // 2. Get All Articles
    @GetMapping
    public List<Article> getAllArticles() {
        return articleRepository.findAllByOrderByCreatedAtDesc();
    }

    // 3. Get My Articles
    @GetMapping("/my-articles")
    public List<Article> getMyArticles(@RequestParam String email) {
        return articleRepository.findByTrainerEmailOrderByCreatedAtDesc(email);
    }

    // 4. Delete Article
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteArticle(@PathVariable Long id) {
        if (!articleRepository.existsById(id))
            return ResponseEntity.notFound().build();
        articleRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }

    // 5. Like Article
    @PostMapping("/{id}/like")
    public ResponseEntity<?> likeArticle(@PathVariable Long id, @RequestParam String userEmail) {
        Optional<Article> articleOpt = articleRepository.findById(id);
        if (articleOpt.isEmpty())
            return ResponseEntity.notFound().build();

        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null)
            return ResponseEntity.badRequest().body("User not found");

        Article article = articleOpt.get();
        java.util.Set<User> likes = article.getLikedBy();
        boolean liked;

        if (likes.contains(user)) {
            // Unlike
            likes.remove(user);
            article.setLikesCount(Math.max(0, article.getLikesCount() - 1));
            liked = false;
        } else {
            // Like
            likes.add(user);
            article.setLikesCount(article.getLikesCount() + 1);
            liked = true;
        }

        articleRepository.save(article);
        return ResponseEntity.ok(java.util.Map.of("likesCount", article.getLikesCount(), "liked", liked));
    }

    // 5.1 Add Comment
    @PostMapping("/{id}/comment")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload) {
        try {
            String content = payload.get("content");
            String userEmail = payload.get("userEmail");

            System.out.println("Adding comment to ARTICLE ID: " + id + ", User: " + userEmail);

            Optional<Article> opt = articleRepository.findById(id);
            if (opt.isEmpty()) {
                System.out.println("Article not found: " + id);
                return ResponseEntity.notFound().build();
            }

            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user == null) {
                System.out.println("User not found: " + userEmail);
                return ResponseEntity.badRequest().body("User not found");
            }

            com.wellnest.wellnest.model.Comment comment = new com.wellnest.wellnest.model.Comment();
            comment.setContent(content);
            comment.setAuthor(user);
            comment.setArticle(opt.get());

            commentRepository.save(comment);
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    // 6. Get Single Article
    @GetMapping("/{id}")
    public ResponseEntity<?> getArticleById(@PathVariable Long id) {
        return articleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 7. Get Recommended Articles
    @GetMapping("/recommended")
    public List<Article> getRecommendedArticles(@RequestParam String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null || user.getGoal() == null || user.getGoal().isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return articleRepository.findBySpecializationContainingIgnoreCase(user.getGoal());
    }
}
