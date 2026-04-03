package com.codementra.platform.controller;

import com.codementra.platform.dto.MessageResponse;
import com.codementra.platform.entity.User;
import com.codementra.platform.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions/{sessionId}/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping
    public ResponseEntity<List<MessageResponse>> getMessages(@PathVariable Long sessionId) {
        return ResponseEntity.ok(messageService.getMessages(sessionId));
    }
}
