package com.codementra.platform.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeMessage {
    private Long sessionId;
    private Long userId;
    private String userName;
    private String code;
    private String language;
    private String delta;
}
