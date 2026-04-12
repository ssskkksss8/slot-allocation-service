package com.hilbert.booking.controller;

import com.hilbert.booking.dto.request.BookingSubmitRequest;
import com.hilbert.booking.dto.response.BookingRequestResponse;
import com.hilbert.booking.security.UserDetailsImpl;
import com.hilbert.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<String> createBooking(
            @RequestBody @Valid BookingSubmitRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        bookingService.createBookingRequest(currentUser.getUser().getId(), request.getFlightId());

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body("Booking request queued for processing");
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingRequestResponse>> getMyBookings(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(bookingService.getUserBookingRequests(currentUser.getUser().getId()));
    }
}
