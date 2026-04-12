package com.hilbert.booking.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CityResponse {
    private Integer id;
    private String name;
    private String country;
    private String timezone;
}