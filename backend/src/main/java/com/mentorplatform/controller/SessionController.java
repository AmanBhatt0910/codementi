package com.mentorplatform.controller;

import com.mentorplatform.dto.MessageDto;
import com.mentorplatform.dto.SessionDto;
import com.mentorplatform.entity.CodeSnapshot;
import com.mentorplatform.service.CodeSnapshotService;
import com.mentorplatform.service.MessageService;
import com.mentorplatform.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final MessageService messageService;
    private final CodeSnapshotService codeSnapshotService;

    @PostMapping
    public ResponseEntity<SessionDto.SessionResponse> createSession(
            @Valid @RequestBody SessionDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sessionService.createSession(request, userDetails.getUsername()));
    }

    @PostMapping("/join")
    public ResponseEntity<SessionDto.SessionResponse> joinSession(
            @Valid @RequestBody SessionDto.JoinRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sessionService.joinSession(request.getSessionCode(), userDetails.getUsername()));
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<SessionDto.SessionResponse> endSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sessionService.endSession(sessionId, userDetails.getUsername()));
    }

    @GetMapping("/me")
    public ResponseEntity<List<SessionDto.SessionResponse>> getMySessions(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sessionService.getMySessions(userDetails.getUsername()));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionDto.SessionResponse> getSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(sessionService.getSession(sessionId));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<SessionDto.SessionResponse> getSessionByCode(@PathVariable String code) {
        return ResponseEntity.ok(sessionService.getSessionByCode(code));
    }

    @GetMapping("/{sessionId}/messages")
    public ResponseEntity<List<MessageDto.ChatMessage>> getMessages(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(messageService.getSessionMessages(sessionId));
    }

    @GetMapping("/{sessionId}/snapshot")
    public ResponseEntity<?> getCodeSnapshot(@PathVariable UUID sessionId) {
        Optional<CodeSnapshot> snapshot = codeSnapshotService.getSnapshot(sessionId);
        if (snapshot.isPresent()) {
            CodeSnapshot cs = snapshot.get();
            return ResponseEntity.ok(Map.of(
                "content", cs.getContent() != null ? cs.getContent() : "",
                "language", cs.getLanguage() != null ? cs.getLanguage() : "javascript",
                "updatedAt", cs.getUpdatedAt()
            ));
        }
        return ResponseEntity.ok(Map.of("content", "", "language", "javascript"));
    }
}
