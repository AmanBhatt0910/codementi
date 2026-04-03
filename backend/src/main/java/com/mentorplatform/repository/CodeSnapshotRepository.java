package com.mentorplatform.repository;

import com.mentorplatform.entity.CodeSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CodeSnapshotRepository extends JpaRepository<CodeSnapshot, UUID> {
    Optional<CodeSnapshot> findBySessionId(UUID sessionId);
}
