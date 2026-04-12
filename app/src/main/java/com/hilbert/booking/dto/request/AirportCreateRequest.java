package com.hilbert.booking.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AirportCreateRequest {
    @NotNull
    private Integer cityId;
    @NotBlank
    private String name;
}