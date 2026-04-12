package com.hilbert.booking.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminFlightResponse {
    private Integer flightId;
    private String originCity;
    private String originAirport;
    private String destCity;
    private String destAirport;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private BigDecimal price;
    private Integer totalSeats;
    private Integer availableSeats;
    private Integer soldSeats;
    private String status;
}
