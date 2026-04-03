package com.codementra.platform.dto;

import com.codementra.platform.entity.SessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {
    private Long id;
    private Long mentorId;
    private String mentorName;
    private Long studentId;
    private String studentName;
    private SessionStatus status;
    private String inviteToken;
    private LocalDateTime createdAt;
    private LocalDateTime endedAt;
}
