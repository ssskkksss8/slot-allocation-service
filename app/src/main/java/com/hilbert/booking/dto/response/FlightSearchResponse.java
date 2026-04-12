package com.hilbert.booking.dto.response;

import com.hilbert.booking.entity.enums.Enums.FlightStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class FlightSearchResponse {
    private Integer flightId;
    private String flightCode;
    private String originCity;
    private String originAirport;
    private String destCity;
    private String destAirport;
    private LocalDateTime departureTime;
    private BigDecimal price;
    private Integer availableSeats;
    private FlightStatus status;
}