package com.codementra.platform.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignalMessage {
    private Long sessionId;
    private Long senderId;
    private Long targetId;
    private String type;
    private Object payload;
}
