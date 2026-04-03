package com.codementra.platform.websocket;

import com.codementra.platform.dto.MessageResponse;
import com.codementra.platform.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;

    @MessageMapping("/session/{sessionId}/chat")
    public void handleChatMessage(
            @DestinationVariable Long sessionId,
            @Payload ChatMessage chatMessage) {

        chatMessage.setSessionId(sessionId);
        chatMessage.setTimestamp(LocalDateTime.now().toString());

        if (chatMessage.getType() == ChatMessage.MessageType.CHAT) {
            try {
                MessageResponse saved = messageService.saveMessage(
                        sessionId, chatMessage.getSenderId(), chatMessage.getContent());
                chatMessage.setTimestamp(saved.getCreatedAt().toString());
            } catch (Exception e) {
                log.error("Failed to persist chat message: {}", e.getMessage());
            }
        }

        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/chat", chatMessage);
        log.debug("Chat message sent to session {}", sessionId);
    }
}
