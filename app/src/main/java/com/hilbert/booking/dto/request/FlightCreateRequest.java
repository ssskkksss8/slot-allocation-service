package com.hilbert.booking.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class FlightCreateRequest {
    @NotNull
    private Integer originAirportId;

    @NotNull
    private Integer destinationAirportId;

    @NotNull
    @Future(message = "Departure must be in future")
    private LocalDateTime departureTime;

    @NotNull
    @Future(message = "Arrival must be in future")
    private LocalDateTime arrivalTime;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal price;

    @NotNull
    @Min(1)
    private Integer totalSeats;
}