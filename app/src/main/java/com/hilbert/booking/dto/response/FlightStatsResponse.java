package com.hilbert.booking.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class FlightStatsResponse {
    private Integer flightId;
    private Integer totalSeats;
    private Integer availableSeats;
    private Integer soldCount;
    private BigDecimal price;
    private BigDecimal expectedRevenue;
    private String status;
}