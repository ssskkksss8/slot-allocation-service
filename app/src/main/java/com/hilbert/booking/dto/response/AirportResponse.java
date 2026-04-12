package com.hilbert.booking.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AirportResponse {
    private Integer id;
    private String name;
    private String cityName;
    private String country;
}