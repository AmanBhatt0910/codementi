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
public class SignalingWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/session/{sessionId}/signal")
    public void handleSignal(
            @DestinationVariable Long sessionId,
            @Payload SignalMessage signalMessage) {

        signalMessage.setSessionId(sessionId);
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/signal", signalMessage);
        log.debug("WebRTC signal [{}] relayed in session {}", signalMessage.getType(), sessionId);
    }
}
