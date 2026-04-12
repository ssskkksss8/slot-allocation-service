package com.hilbert.booking.repository.projection;

import com.hilbert.booking.entity.enums.Enums.FlightStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface FlightSearchResult {
    Integer getFlight_id();

    String getFlight_code();

    String getOrigin_city();

    String getOrigin_airport();

    String getDest_city();

    String getDest_airport();

    LocalDateTime getDeparture_time();

    BigDecimal getPrice();

    Integer getAvailable_seats();

    FlightStatus getStatus();
}