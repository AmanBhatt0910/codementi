package com.mentorplatform.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.Map;

@RestController
@RequestMapping("/api/execute")
public class ExecutionController {

    private static final String PISTON_URL = "https://piston-api.run/api/v2/execute";

    @PostMapping
    public ResponseEntity<?> execute(@RequestBody Map<String, Object> request) {

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("User-Agent", "CodeMentra/1.0");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<String> response =
                    restTemplate.exchange(PISTON_URL, HttpMethod.POST, entity, String.class);

            return ResponseEntity.ok(response.getBody());

        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of(
                            "error", "Piston error",
                            "details", e.getResponseBodyAsString()
                    ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of(
                            "error", "Internal execution error",
                            "details", e.getMessage()
                    ));
        }
    }
}