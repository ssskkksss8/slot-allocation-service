package com.hilbert.booking.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class TicketResponse {
    private Integer ticketId;
    private String ticketNumber;
    private String originCity;
    private String originAirport;
    private String destCity;
    private String destAirport;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private BigDecimal price;
    private Boolean isActive;
}