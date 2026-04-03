package com.mentorplatform.dto;

import com.mentorplatform.entity.Message;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

public class MessageDto {

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ChatMessage {
        private String type; // CHAT, JOIN, LEAVE
        private UUID sessionId;
        private UUID senderId;
        private String senderName;
        private String senderRole;
        private String content;
        private LocalDateTime timestamp;

        public static ChatMessage from(Message message) {
            return ChatMessage.builder()
                    .type("CHAT")
                    .sessionId(message.getSession().getId())
                    .senderId(message.getSender().getId())
                    .senderName(message.getSender().getName())
                    .senderRole(message.getSender().getRole().name())
                    .content(message.getMessage())
                    .timestamp(message.getSentAt())
                    .build();
        }
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CodeUpdate {
        private String type; // CODE_UPDATE, LANGUAGE_CHANGE, CURSOR_MOVE
        private UUID sessionId;
        private UUID senderId;
        private String senderName;
        private String content;
        private String language;
        private Integer cursorLine;
        private Integer cursorColumn;
        private byte[] yUpdate; // Yjs binary update
        private LocalDateTime timestamp;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SignalingMessage {
        private String type; // OFFER, ANSWER, ICE_CANDIDATE, CALL_REQUEST, CALL_ACCEPTED, CALL_REJECTED, CALL_ENDED
        private UUID sessionId;
        private UUID senderId;
        private String senderName;
        private Object payload; // SDP or ICE candidate
        private LocalDateTime timestamp;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SessionEvent {
        private String type; // USER_JOINED, USER_LEFT, SESSION_STARTED, SESSION_ENDED
        private UUID sessionId;
        private UUID userId;
        private String userName;
        private String userRole;
        private LocalDateTime timestamp;
    }
}
