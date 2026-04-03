package com.mentorplatform.service;

import com.mentorplatform.dto.SessionDto;
import com.mentorplatform.entity.Session;
import com.mentorplatform.entity.User;
import com.mentorplatform.repository.SessionRepository;
import com.mentorplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    @Transactional
    public SessionDto.SessionResponse createSession(SessionDto.CreateRequest request, String mentorEmail) {
        User mentor = userRepository.findByEmail(mentorEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (mentor.getRole() != User.Role.MENTOR) {
            throw new IllegalArgumentException("Only mentors can create sessions");
        }

        String sessionCode = generateUniqueCode();

        Session session = Session.builder()
                .title(request.getTitle())
                .mentor(mentor)
                .sessionCode(sessionCode)
                .status(Session.SessionStatus.WAITING)
                .build();

        session = sessionRepository.save(session);
        log.info("Session created: {} by mentor {}", session.getSessionCode(), mentorEmail);
        return SessionDto.SessionResponse.from(session);
    }

    @Transactional
    public SessionDto.SessionResponse joinSession(String sessionCode, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Session session = sessionRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (session.getStatus() == Session.SessionStatus.ENDED) {
            throw new IllegalStateException("Session has already ended");
        }

        if (session.getStudent() != null && !session.getStudent().getId().equals(student.getId())) {
            throw new IllegalStateException("Session is already occupied");
        }

        session.setStudent(student);
        session.setStatus(Session.SessionStatus.ACTIVE);
        session.setStartedAt(LocalDateTime.now());

        session = sessionRepository.save(session);
        log.info("Student {} joined session {}", studentEmail, sessionCode);
        return SessionDto.SessionResponse.from(session);
    }

    @Transactional
    public SessionDto.SessionResponse endSession(UUID sessionId, String userEmail) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        boolean isMentor = session.getMentor().getId().equals(user.getId());
        boolean isStudent = session.getStudent() != null && session.getStudent().getId().equals(user.getId());

        if (!isMentor && !isStudent) {
            throw new IllegalArgumentException("Not authorized to end this session");
        }

        session.setStatus(Session.SessionStatus.ENDED);
        session.setEndedAt(LocalDateTime.now());

        session = sessionRepository.save(session);
        log.info("Session {} ended by {}", sessionId, userEmail);
        return SessionDto.SessionResponse.from(session);
    }

    public List<SessionDto.SessionResponse> getMySessions(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return sessionRepository.findAllByUser(user).stream()
                .map(SessionDto.SessionResponse::from)
                .collect(Collectors.toList());
    }

    public SessionDto.SessionResponse getSession(UUID sessionId) {
        return sessionRepository.findById(sessionId)
                .map(SessionDto.SessionResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
    }

    public SessionDto.SessionResponse getSessionByCode(String code) {
        return sessionRepository.findBySessionCode(code)
                .map(SessionDto.SessionResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
    }

    private String generateUniqueCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        String code;
        do {
            StringBuilder sb = new StringBuilder(8);
            for (int i = 0; i < 8; i++) {
                sb.append(chars.charAt(random.nextInt(chars.length())));
            }
            code = sb.toString();
        } while (sessionRepository.existsBySessionCode(code));
        return code;
    }
}
