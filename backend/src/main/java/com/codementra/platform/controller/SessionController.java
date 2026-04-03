package com.codementra.platform.controller;

import com.codementra.platform.dto.SessionResponse;
import com.codementra.platform.entity.User;
import com.codementra.platform.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @PostMapping
    public ResponseEntity<SessionResponse> createSession(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(sessionService.createSession(currentUser.getId()));
    }

    @PostMapping("/join/{inviteToken}")
    public ResponseEntity<SessionResponse> joinSession(
            @PathVariable String inviteToken,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(sessionService.joinSession(inviteToken, currentUser.getId()));
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<SessionResponse> endSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(sessionService.endSession(sessionId, currentUser.getId()));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionResponse> getSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(sessionService.getSession(sessionId));
    }

    @GetMapping("/token/{inviteToken}")
    public ResponseEntity<SessionResponse> getSessionByToken(@PathVariable String inviteToken) {
        return ResponseEntity.ok(sessionService.getSessionByToken(inviteToken));
    }

    @GetMapping("/my")
    public ResponseEntity<List<SessionResponse>> getMySessions(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(sessionService.getSessionsForUser(currentUser.getId()));
    }
}
