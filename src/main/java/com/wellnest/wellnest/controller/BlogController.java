package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.Comment;
import com.wellnest.wellnest.model.Post;
import com.wellnest.wellnest.model.User;
import com.wellnest.wellnest.repository.CommentRepository;
import com.wellnest.wellnest.repository.PostRepository;
import com.wellnest.wellnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/blog")
@CrossOrigin(origins = "*")
public class BlogController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommentRepository commentRepository;

    // Get All Posts (or filtered by type)
    @GetMapping
    public List<Post> getAllPosts(@RequestParam(required = false) String type) {
        if (type != null && !type.equals("all")) {
            return postRepository.findByTypeOrderByCreatedAtDesc(type);
        }
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    // Create Post
    // Create Post with Image Upload
    @PostMapping
    public ResponseEntity<?> createPost(
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam("category") String category,
            @RequestParam("type") String type,
            @RequestParam("authorEmail") String authorEmail,
            @RequestParam(value = "image", required = false) org.springframework.web.multipart.MultipartFile image) {

        User user = userRepository.findByEmail(authorEmail).orElse(null);
        if (user == null)
            return ResponseEntity.badRequest().body("User not found");

        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            try {
                // Ensure directory exists
                String uploadDir = System.getProperty("user.dir") + "/src/main/resources/static/uploads/";
                java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir);
                if (!java.nio.file.Files.exists(uploadPath)) {
                    java.nio.file.Files.createDirectories(uploadPath);
                }

                // Save file
                String fileName = java.util.UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
                java.nio.file.Path filePath = uploadPath.resolve(fileName);
                java.nio.file.Files.copy(image.getInputStream(), filePath,
                        java.nio.file.StandardCopyOption.REPLACE_EXISTING);

                // Set URL
                imageUrl = "uploads/" + fileName;

            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(500).body("Error uploading image");
            }
        }

        Post post = new Post();
        post.setTitle(title);
        post.setContent(content);
        post.setCategory(category);
        post.setImageUrl(imageUrl);
        post.setAuthor(user);
        post.setType(type != null ? type : "USER_POST");
        post.setLikesCount(0);

        postRepository.save(post);
        return ResponseEntity.ok("Post created successfully");
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likePost(@PathVariable Long id, @RequestParam String userEmail) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isEmpty())
            return ResponseEntity.notFound().build();

        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null)
            return ResponseEntity.badRequest().body("User not found");

        Post post = postOpt.get();
        java.util.Set<User> likes = post.getLikedBy();
        boolean liked;

        if (likes.contains(user)) {
            // Unlike
            likes.remove(user);
            post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
            liked = false;
        } else {
            // Like
            likes.add(user);
            post.setLikesCount(post.getLikesCount() + 1);
            liked = true;
        }

        postRepository.save(post);
        return ResponseEntity.ok(Map.of("likesCount", post.getLikesCount(), "liked", liked));
    }

    // Add Comment
    @PostMapping("/{id}/comment")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String content = payload.get("content");
            String userEmail = payload.get("userEmail");

            System.out.println("Adding comment to Post ID: " + id + ", User: " + userEmail);

            Optional<Post> postOpt = postRepository.findById(id);
            if (postOpt.isEmpty()) {
                System.out.println("Post not found: " + id);
                return ResponseEntity.notFound().build();
            }

            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user == null) {
                System.out.println("User not found: " + userEmail);
                return ResponseEntity.badRequest().body("User not found");
            }

            Comment comment = new Comment();
            comment.setContent(content);
            comment.setAuthor(user);
            comment.setPost(postOpt.get());

            commentRepository.save(comment);

            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    // Get My Posts
    @GetMapping("/my-posts")
    public List<Post> getMyPosts(@RequestParam String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null)
            return List.of();
        return postRepository.findByAuthorOrderByCreatedAtDesc(user);
    }

    // Update Post
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isEmpty())
            return ResponseEntity.notFound().build();

        Post post = postOpt.get();
        if (payload.containsKey("title"))
            post.setTitle(payload.get("title"));
        if (payload.containsKey("content"))
            post.setContent(payload.get("content"));
        if (payload.containsKey("category"))
            post.setCategory(payload.get("category"));
        if (payload.containsKey("imageUrl"))
            post.setImageUrl(payload.get("imageUrl"));

        postRepository.save(post);
        return ResponseEntity.ok(post);
    }

    // Delete Post
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        if (!postRepository.existsById(id))
            return ResponseEntity.notFound().build();
        postRepository.deleteById(id);
        return ResponseEntity.ok("Post deleted successfully");
    }
}
