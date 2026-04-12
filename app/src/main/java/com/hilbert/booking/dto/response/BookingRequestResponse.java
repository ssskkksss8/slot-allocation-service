package com.hilbert.booking.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BookingRequestResponse {
    private Integer requestId;
    private Integer flightId;
    private String originCity;
    private String originAirport;
    private String destCity;
    private String destAirport;
    private LocalDateTime departureTime;
    private BigDecimal price;
    private String status;
    private BigDecimal calculatedPriority;
    private LocalDateTime submittedAt;
    private LocalDateTime processedAt;
}
