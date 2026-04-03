package com.mentorplatform.service;

import com.mentorplatform.dto.AuthDto;
import com.mentorplatform.entity.User;
import com.mentorplatform.repository.UserRepository;
import com.mentorplatform.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();
        userRepository.save(user);
        log.info("New user registered: {} with role {}", user.getEmail(), user.getRole());
        String token = jwtUtil.generateToken(user);
        return AuthDto.AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(AuthDto.UserDto.from(user))
                .build();
    }

    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        String token = jwtUtil.generateToken(user);
        log.info("User logged in: {}", user.getEmail());
        return AuthDto.AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(AuthDto.UserDto.from(user))
                .build();
    }

    public AuthDto.UserDto getMe(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return AuthDto.UserDto.from(user);
    }
}