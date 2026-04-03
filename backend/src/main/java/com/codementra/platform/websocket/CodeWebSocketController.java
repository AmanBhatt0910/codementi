package com.codementra.platform.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class CodeWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/session/{sessionId}/code")
    public void handleCodeChange(
            @DestinationVariable Long sessionId,
            @Payload CodeMessage codeMessage) {

        codeMessage.setSessionId(sessionId);
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/code", codeMessage);
        log.debug("Code update broadcast to session {}", sessionId);
    }
}
