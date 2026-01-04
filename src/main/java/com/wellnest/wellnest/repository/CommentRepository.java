package com.wellnest.wellnest.repository;

import com.wellnest.wellnest.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {
}
