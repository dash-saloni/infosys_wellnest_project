package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.Comment;
import com.wellnest.wellnest.model.User;
import com.wellnest.wellnest.repository.ArticleRepository;
import com.wellnest.wellnest.repository.CommentRepository;
import com.wellnest.wellnest.repository.PostRepository;
import com.wellnest.wellnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin(origins = "*")
public class CommentController {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private ArticleRepository articleRepository;

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComment(@PathVariable Long id, @RequestParam String userEmail) {
        Optional<Comment> commentOpt = commentRepository.findById(id);
        if (commentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Comment comment = commentOpt.get();
        User requester = userRepository.findByEmail(userEmail).orElse(null);

        if (requester == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        boolean authorized = false;

        // 1. Check if requester is the author of the comment
        if (comment.getAuthor() != null && comment.getAuthor().getId().equals(requester.getId())) {
            authorized = true;
        }

        if (!authorized) {
            return ResponseEntity.status(403).body("Unauthorized to delete this comment");
        }

        commentRepository.delete(comment);
        return ResponseEntity.ok("Comment deleted successfully");
    }
}
