package com.codementra.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeSnapshotResponse {
    private Long id;
    private Long sessionId;
    private String code;
    private String language;
    private LocalDateTime createdAt;
}
