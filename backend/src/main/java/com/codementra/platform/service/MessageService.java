package com.codementra.platform.service;

import com.codementra.platform.dto.MessageResponse;
import com.codementra.platform.entity.Message;
import com.codementra.platform.entity.Session;
import com.codementra.platform.entity.User;
import com.codementra.platform.repository.MessageRepository;
import com.codementra.platform.repository.SessionRepository;
import com.codementra.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    @Transactional
    public MessageResponse saveMessage(Long sessionId, Long senderId, String content) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Message message = Message.builder()
                .session(session)
                .sender(sender)
                .content(content)
                .build();

        message = messageRepository.save(message);
        return mapToResponse(message);
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(Long sessionId) {
        return messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private MessageResponse mapToResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .sessionId(message.getSession().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getName())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
