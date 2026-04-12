package com.hilbert.booking.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CityCreateRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String country;
    private String timezone;
}