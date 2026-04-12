package com.hilbert.booking.service;

import com.hilbert.booking.dto.request.LoginRequest;
import com.hilbert.booking.dto.request.RegisterRequest;
import com.hilbert.booking.dto.response.AuthResponse;
import com.hilbert.booking.entity.User;
import com.hilbert.booking.entity.UserRole;
import com.hilbert.booking.entity.enums.Enums.RoleType;
import com.hilbert.booking.repository.UserRepository;
import com.hilbert.booking.security.JwtService;
import com.hilbert.booking.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class AuthService {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;

        @Transactional
        public AuthResponse register(RegisterRequest request) {
                if (userRepository.existsByEmail(request.getEmail())) {
                        throw new RuntimeException("Email already in use");
                }

                User user = User.builder()
                                .email(request.getEmail())
                                .passwordHash(passwordEncoder.encode(request.getPassword()))
                                .firstName(request.getFirstName())
                                .lastName(request.getLastName())
                                .isActive(true)
                                .roles(new HashSet<>())
                                .build();

                UserRole defaultRole = UserRole.builder()
                                .user(user)
                                .role(RoleType.USER)
                                .assignedAt(LocalDateTime.now())
                                .build();

                user.getRoles().add(defaultRole);

                userRepository.save(user);

                String token = jwtService.generateToken(new UserDetailsImpl(user));

                return AuthResponse.builder()
                                .token(token)
                                .build();
        }

        public AuthResponse login(LoginRequest request) {
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

                User user = userRepository.findByEmailWithRoles(request.getEmail())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                String token = jwtService.generateToken(new UserDetailsImpl(user));

                return AuthResponse.builder()
                                .token(token)
                                .build();
        }
}