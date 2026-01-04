package com.wellnest.wellnest.repository;

import com.wellnest.wellnest.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findAllByOrderByCreatedAtDesc();

    List<Post> findByTypeOrderByCreatedAtDesc(String type);

    List<Post> findByAuthorOrderByCreatedAtDesc(com.wellnest.wellnest.model.User author);
}
