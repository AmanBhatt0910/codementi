package com.mentorplatform.service;

import com.mentorplatform.entity.CodeSnapshot;
import com.mentorplatform.entity.Session;
import com.mentorplatform.repository.CodeSnapshotRepository;
import com.mentorplatform.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodeSnapshotService {

    private final CodeSnapshotRepository codeSnapshotRepository;
    private final SessionRepository sessionRepository;

    @Transactional
    public void saveSnapshot(UUID sessionId, String content, String language) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        Optional<CodeSnapshot> existing = codeSnapshotRepository.findBySessionId(sessionId);

        if (existing.isPresent()) {
            CodeSnapshot snapshot = existing.get();
            snapshot.setContent(content);
            snapshot.setLanguage(language);
            codeSnapshotRepository.save(snapshot);
        } else {
            CodeSnapshot snapshot = CodeSnapshot.builder()
                    .session(session)
                    .content(content)
                    .language(language)
                    .build();
            codeSnapshotRepository.save(snapshot);
        }
    }

    public Optional<CodeSnapshot> getSnapshot(UUID sessionId) {
        return codeSnapshotRepository.findBySessionId(sessionId);
    }
}
