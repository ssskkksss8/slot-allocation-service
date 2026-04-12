package com.hilbert.booking.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingSubmitRequest {
    @NotNull(message = "Flight ID is required")
    private Integer flightId;
}