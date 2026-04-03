package com.mentorplatform.repository;

import com.mentorplatform.entity.Session;
import com.mentorplatform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    Optional<Session> findBySessionCode(String sessionCode);

    @Query("SELECT s FROM Session s WHERE s.mentor = :user OR s.student = :user ORDER BY s.createdAt DESC")
    List<Session> findAllByUser(User user);

    List<Session> findByMentorOrderByCreatedAtDesc(User mentor);

    List<Session> findByStudentOrderByCreatedAtDesc(User student);

    boolean existsBySessionCode(String sessionCode);
}
