package com.codementra.platform.controller;

import com.codementra.platform.dto.CodeSnapshotResponse;
import com.codementra.platform.service.CodeSnapshotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sessions/{sessionId}/code")
@RequiredArgsConstructor
public class CodeController {

    private final CodeSnapshotService codeSnapshotService;

    @GetMapping("/latest")
    public ResponseEntity<CodeSnapshotResponse> getLatestSnapshot(@PathVariable Long sessionId) {
        return codeSnapshotService.getLatestSnapshot(sessionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/snapshot")
    public ResponseEntity<CodeSnapshotResponse> saveSnapshot(
            @PathVariable Long sessionId,
            @RequestBody Map<String, String> body) {
        String code = body.getOrDefault("code", "");
        String language = body.getOrDefault("language", "javascript");
        return ResponseEntity.ok(codeSnapshotService.saveSnapshot(sessionId, code, language));
    }
}
