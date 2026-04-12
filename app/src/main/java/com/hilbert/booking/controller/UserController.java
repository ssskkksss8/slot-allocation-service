package com.hilbert.booking.controller;

import com.hilbert.booking.dto.request.DepositRequest;
import com.hilbert.booking.dto.response.UserProfileResponse;
import com.hilbert.booking.security.UserDetailsImpl;
import com.hilbert.booking.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(userService.getUserProfile(currentUser.getUser().getId()));
    }

    @PostMapping("/promote-me")
    public ResponseEntity<String> promoteMeToAdmin(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        userService.promoteToAdmin(currentUser.getUser().getId());
        return ResponseEntity.ok("Success! Please re-login to update your token with new roles.");
    }

    @PostMapping("/deposit")
    public ResponseEntity<String> deposit(@RequestBody @Valid DepositRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        userService.deposit(currentUser.getUser().getId(), request.getAmount());
        return ResponseEntity.ok("Deposit successful");
    }
}