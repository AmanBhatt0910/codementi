package com.codementra.platform.service;

import com.codementra.platform.dto.CodeSnapshotResponse;
import com.codementra.platform.entity.CodeSnapshot;
import com.codementra.platform.entity.Session;
import com.codementra.platform.repository.CodeSnapshotRepository;
import com.codementra.platform.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CodeSnapshotService {

    private final CodeSnapshotRepository codeSnapshotRepository;
    private final SessionRepository sessionRepository;

    @Transactional
    public CodeSnapshotResponse saveSnapshot(Long sessionId, String code, String language) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        CodeSnapshot snapshot = CodeSnapshot.builder()
                .session(session)
                .code(code)
                .language(language)
                .build();

        snapshot = codeSnapshotRepository.save(snapshot);
        log.info("Code snapshot saved for session {}", sessionId);
        return mapToResponse(snapshot);
    }

    @Transactional(readOnly = true)
    public Optional<CodeSnapshotResponse> getLatestSnapshot(Long sessionId) {
        return codeSnapshotRepository.findTopBySessionIdOrderByCreatedAtDesc(sessionId)
                .map(this::mapToResponse);
    }

    private CodeSnapshotResponse mapToResponse(CodeSnapshot snapshot) {
        return CodeSnapshotResponse.builder()
                .id(snapshot.getId())
                .sessionId(snapshot.getSession().getId())
                .code(snapshot.getCode())
                .language(snapshot.getLanguage())
                .createdAt(snapshot.getCreatedAt())
                .build();
    }
}
