package com.codementra.platform.repository;

import com.codementra.platform.entity.Session;
import com.codementra.platform.entity.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    List<Session> findByMentorIdOrderByCreatedAtDesc(Long mentorId);
    List<Session> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    Optional<Session> findByInviteToken(String inviteToken);
    List<Session> findByMentorIdAndStatusOrderByCreatedAtDesc(Long mentorId, SessionStatus status);
    List<Session> findByStudentIdAndStatusOrderByCreatedAtDesc(Long studentId, SessionStatus status);
}
