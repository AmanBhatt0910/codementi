package com.codementra.platform.service;

import com.codementra.platform.dto.SessionResponse;
import com.codementra.platform.entity.Session;
import com.codementra.platform.entity.SessionStatus;
import com.codementra.platform.entity.User;
import com.codementra.platform.repository.SessionRepository;
import com.codementra.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    @Transactional
    public SessionResponse createSession(Long mentorId) {
        User mentor = userRepository.findById(mentorId)
                .orElseThrow(() -> new IllegalArgumentException("Mentor not found"));

        Session session = Session.builder()
                .mentor(mentor)
                .status(SessionStatus.PENDING)
                .build();

        session = sessionRepository.save(session);
        log.info("Session created by mentor: {} with token: {}", mentorId, session.getInviteToken());
        return mapToResponse(session);
    }

    @Transactional
    public SessionResponse joinSession(String inviteToken, Long studentId) {
        Session session = sessionRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new IllegalArgumentException("Session not found with token: " + inviteToken));

        if (session.getStatus() == SessionStatus.ENDED) {
            throw new IllegalStateException("Session has already ended");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        session.setStudent(student);
        session.setStatus(SessionStatus.ACTIVE);
        session = sessionRepository.save(session);

        log.info("Student {} joined session {}", studentId, session.getId());
        return mapToResponse(session);
    }

    @Transactional
    public SessionResponse endSession(Long sessionId, Long userId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        session.setStatus(SessionStatus.ENDED);
        session.setEndedAt(LocalDateTime.now());
        session = sessionRepository.save(session);

        log.info("Session {} ended by user {}", sessionId, userId);
        return mapToResponse(session);
    }

    @Transactional(readOnly = true)
    public SessionResponse getSession(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        return mapToResponse(session);
    }

    @Transactional(readOnly = true)
    public SessionResponse getSessionByToken(String inviteToken) {
        Session session = sessionRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new IllegalArgumentException("Session not found with token: " + inviteToken));
        return mapToResponse(session);
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> getSessionsForUser(Long userId) {
        List<Session> mentorSessions = sessionRepository.findByMentorIdOrderByCreatedAtDesc(userId);
        List<Session> studentSessions = sessionRepository.findByStudentIdOrderByCreatedAtDesc(userId);

        // Merge two sorted (descending) lists into one sorted list in O(n) time
        List<Session> merged = new java.util.ArrayList<>(mentorSessions.size() + studentSessions.size());
        int i = 0, j = 0;
        while (i < mentorSessions.size() && j < studentSessions.size()) {
            if (!mentorSessions.get(i).getCreatedAt().isBefore(studentSessions.get(j).getCreatedAt())) {
                merged.add(mentorSessions.get(i++));
            } else {
                merged.add(studentSessions.get(j++));
            }
        }
        while (i < mentorSessions.size()) merged.add(mentorSessions.get(i++));
        while (j < studentSessions.size()) merged.add(studentSessions.get(j++));

        return merged.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private SessionResponse mapToResponse(Session session) {
        return SessionResponse.builder()
                .id(session.getId())
                .mentorId(session.getMentor().getId())
                .mentorName(session.getMentor().getName())
                .studentId(session.getStudent() != null ? session.getStudent().getId() : null)
                .studentName(session.getStudent() != null ? session.getStudent().getName() : null)
                .status(session.getStatus())
                .inviteToken(session.getInviteToken())
                .createdAt(session.getCreatedAt())
                .endedAt(session.getEndedAt())
                .build();
    }
}
