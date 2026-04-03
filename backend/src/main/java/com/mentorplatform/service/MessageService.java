package com.mentorplatform.service;

import com.mentorplatform.dto.MessageDto;
import com.mentorplatform.entity.Message;
import com.mentorplatform.entity.Session;
import com.mentorplatform.entity.User;
import com.mentorplatform.repository.MessageRepository;
import com.mentorplatform.repository.SessionRepository;
import com.mentorplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    @Transactional
    public MessageDto.ChatMessage saveMessage(UUID sessionId, UUID senderId, String content) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Message message = Message.builder()
                .session(session)
                .sender(sender)
                .message(content)
                .build();

        message = messageRepository.save(message);
        return MessageDto.ChatMessage.from(message);
    }

    public List<MessageDto.ChatMessage> getSessionMessages(UUID sessionId) {
        return messageRepository.findBySessionIdOrderBySentAtAsc(sessionId).stream()
                .map(MessageDto.ChatMessage::from)
                .collect(Collectors.toList());
    }
}
