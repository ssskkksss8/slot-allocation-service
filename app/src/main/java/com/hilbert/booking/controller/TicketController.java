package com.hilbert.booking.controller;

import com.hilbert.booking.dto.response.TicketResponse;
import com.hilbert.booking.security.UserDetailsImpl;
import com.hilbert.booking.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping("/my")
    public ResponseEntity<List<TicketResponse>> getMyTickets(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(ticketService.getUserTickets(currentUser.getUser().getId()));
    }
}