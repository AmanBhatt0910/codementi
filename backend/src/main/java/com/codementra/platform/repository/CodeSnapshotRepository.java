package com.codementra.platform.repository;

import com.codementra.platform.entity.CodeSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CodeSnapshotRepository extends JpaRepository<CodeSnapshot, Long> {
    List<CodeSnapshot> findBySessionIdOrderByCreatedAtDesc(Long sessionId);
    Optional<CodeSnapshot> findTopBySessionIdOrderByCreatedAtDesc(Long sessionId);
}
