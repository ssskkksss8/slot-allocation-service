package com.hilbert.booking.controller;

import com.hilbert.booking.dto.request.FlightCreateRequest;
import com.hilbert.booking.dto.response.AdminFlightResponse;
import com.hilbert.booking.dto.response.FlightSearchResponse;
import com.hilbert.booking.dto.response.FlightStatsResponse;
import com.hilbert.booking.entity.Flight;
import com.hilbert.booking.security.UserDetailsImpl;
import com.hilbert.booking.service.FlightService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/flights")
@RequiredArgsConstructor
public class FlightController {

    private final FlightService flightService;

    @GetMapping
    public ResponseEntity<List<FlightSearchResponse>> searchFlights(
            @RequestParam String origin,
            @RequestParam String dest,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(flightService.searchFlights(origin, dest, date));
    }

    @GetMapping("/active")
    public ResponseEntity<List<Flight>> getActiveFlights() {
        List<Flight> flights = flightService.getActiveFlights();
        return ResponseEntity.ok(flights);
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> cancelFlight(
            @PathVariable Integer id,
            @RequestParam String reason,
            @AuthenticationPrincipal UserDetailsImpl admin) {
        flightService.cancelFlight(admin.getUser().getId(), id, reason);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Integer> createFlight(@RequestBody @Valid FlightCreateRequest request) {
        return ResponseEntity.ok(flightService.createFlight(request));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminFlightResponse>> getAdminFlights() {
        return ResponseEntity.ok(flightService.getAdminFlights());
    }

    @GetMapping("/{id}/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightStatsResponse> getStats(
            @PathVariable Integer id) {
        return ResponseEntity.ok(flightService.getFlightStats(id));
    }
}
