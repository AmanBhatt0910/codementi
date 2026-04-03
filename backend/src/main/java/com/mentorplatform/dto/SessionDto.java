package com.mentorplatform.dto;

import com.mentorplatform.entity.Session;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

public class SessionDto {

    @Data
    public static class CreateRequest {
        @NotBlank(message = "Title is required")
        private String title;
    }

    @Data
    public static class JoinRequest {
        @NotBlank(message = "Session code is required")
        private String sessionCode;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SessionResponse {
        private UUID id;
        private String title;
        private String sessionCode;
        private String status;
        private AuthDto.UserDto mentor;
        private AuthDto.UserDto student;
        private LocalDateTime createdAt;
        private LocalDateTime startedAt;
        private LocalDateTime endedAt;

        public static SessionResponse from(Session session) {
            return SessionResponse.builder()
                    .id(session.getId())
                    .title(session.getTitle())
                    .sessionCode(session.getSessionCode())
                    .status(session.getStatus().name())
                    .mentor(AuthDto.UserDto.from(session.getMentor()))
                    .student(session.getStudent() != null ? AuthDto.UserDto.from(session.getStudent()) : null)
                    .createdAt(session.getCreatedAt())
                    .startedAt(session.getStartedAt())
                    .endedAt(session.getEndedAt())
                    .build();
        }
    }
}
