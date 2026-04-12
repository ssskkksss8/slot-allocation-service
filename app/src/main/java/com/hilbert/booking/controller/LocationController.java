package com.hilbert.booking.controller;

import com.hilbert.booking.dto.request.AirportCreateRequest;
import com.hilbert.booking.dto.request.CityCreateRequest;
import com.hilbert.booking.dto.response.AirportResponse;
import com.hilbert.booking.dto.response.CityResponse;
import com.hilbert.booking.service.LocationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping("/cities")
    public ResponseEntity<List<CityResponse>> getCities() {
        return ResponseEntity.ok(locationService.getAllCities());
    }

    @GetMapping("/airports")
    public ResponseEntity<List<AirportResponse>> getAirports() {
        return ResponseEntity.ok(locationService.getAllAirports());
    }

    @PostMapping("/cities")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CityResponse> createCity(@RequestBody @Valid CityCreateRequest request) {
        return ResponseEntity.ok(locationService.createCity(request));
    }

    @PostMapping("/airports")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AirportResponse> createAirport(@RequestBody @Valid AirportCreateRequest request) {
        return ResponseEntity.ok(locationService.createAirport(request));
    }
}