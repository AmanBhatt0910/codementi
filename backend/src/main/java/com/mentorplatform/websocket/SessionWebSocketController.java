package com.mentorplatform.websocket;

import com.mentorplatform.dto.MessageDto;
import com.mentorplatform.entity.User;
import com.mentorplatform.repository.UserRepository;
import com.mentorplatform.service.CodeSnapshotService;
import com.mentorplatform.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class SessionWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final CodeSnapshotService codeSnapshotService;
    private final UserRepository userRepository;

    // ─── Chat ────────────────────────────────────────────────────────────────

    @MessageMapping("/session/{sessionId}/chat")
    public void handleChatMessage(
            @DestinationVariable String sessionId,
            @Payload MessageDto.ChatMessage chatMessage,
            Principal principal) {

        try {
            User sender = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            MessageDto.ChatMessage saved = messageService.saveMessage(
                    UUID.fromString(sessionId),
                    sender.getId(),
                    chatMessage.getContent()
            );

            messagingTemplate.convertAndSend(
                    "/topic/session/" + sessionId + "/chat",
                    saved
            );
            log.debug("Chat message in session {}: {}", sessionId, sender.getName());
        } catch (Exception e) {
            log.error("Chat error in session {}: {}", sessionId, e.getMessage());
        }
    }

    // ─── Code Editor ─────────────────────────────────────────────────────────

    @MessageMapping("/session/{sessionId}/code")
    public void handleCodeUpdate(
            @DestinationVariable String sessionId,
            @Payload MessageDto.CodeUpdate codeUpdate,
            Principal principal) {

        try {
            User sender = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            codeUpdate.setSenderId(sender.getId());
            codeUpdate.setSenderName(sender.getName());
            codeUpdate.setSessionId(UUID.fromString(sessionId));
            codeUpdate.setTimestamp(LocalDateTime.now());

            // Persist snapshot periodically (only for full content updates)
            if ("CODE_UPDATE".equals(codeUpdate.getType()) && codeUpdate.getContent() != null) {
                codeSnapshotService.saveSnapshot(
                        UUID.fromString(sessionId),
                        codeUpdate.getContent(),
                        codeUpdate.getLanguage() != null ? codeUpdate.getLanguage() : "javascript"
                );
            }

            // Broadcast to all in session EXCEPT sender
            messagingTemplate.convertAndSend(
                    "/topic/session/" + sessionId + "/code",
                    codeUpdate
            );
        } catch (Exception e) {
            log.error("Code update error in session {}: {}", sessionId, e.getMessage());
        }
    }

    // ─── WebRTC Signaling ─────────────────────────────────────────────────────

    @MessageMapping("/session/{sessionId}/signal")
    public void handleSignaling(
            @DestinationVariable String sessionId,
            @Payload MessageDto.SignalingMessage signalingMessage,
            Principal principal) {

        try {
            User sender = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            signalingMessage.setSenderId(sender.getId());
            signalingMessage.setSenderName(sender.getName());
            signalingMessage.setSessionId(UUID.fromString(sessionId));
            signalingMessage.setTimestamp(LocalDateTime.now());

            messagingTemplate.convertAndSend(
                    "/topic/session/" + sessionId + "/signal",
                    signalingMessage
            );
            log.debug("Signal [{}] in session {} from {}", signalingMessage.getType(), sessionId, sender.getName());
        } catch (Exception e) {
            log.error("Signaling error in session {}: {}", sessionId, e.getMessage());
        }
    }

    // ─── Session Events ───────────────────────────────────────────────────────

    @MessageMapping("/session/{sessionId}/join")
    public void handleUserJoin(
            @DestinationVariable String sessionId,
            Principal principal,
            SimpMessageHeaderAccessor headerAccessor) {

        try {
            User user = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            MessageDto.SessionEvent event = MessageDto.SessionEvent.builder()
                    .type("USER_JOINED")
                    .sessionId(UUID.fromString(sessionId))
                    .userId(user.getId())
                    .userName(user.getName())
                    .userRole(user.getRole().name())
                    .timestamp(LocalDateTime.now())
                    .build();

            messagingTemplate.convertAndSend(
                    "/topic/session/" + sessionId + "/events",
                    event
            );
            log.info("User {} joined session {}", user.getName(), sessionId);
        } catch (Exception e) {
            log.error("Join event error: {}", e.getMessage());
        }
    }

    @MessageMapping("/session/{sessionId}/leave")
    public void handleUserLeave(
            @DestinationVariable String sessionId,
            Principal principal) {

        try {
            User user = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            MessageDto.SessionEvent event = MessageDto.SessionEvent.builder()
                    .type("USER_LEFT")
                    .sessionId(UUID.fromString(sessionId))
                    .userId(user.getId())
                    .userName(user.getName())
                    .userRole(user.getRole().name())
                    .timestamp(LocalDateTime.now())
                    .build();

            messagingTemplate.convertAndSend(
                    "/topic/session/" + sessionId + "/events",
                    event
            );
            log.info("User {} left session {}", user.getName(), sessionId);
        } catch (Exception e) {
            log.error("Leave event error: {}", e.getMessage());
        }
    }
}
