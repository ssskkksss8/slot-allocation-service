package com.hilbert.booking.dto.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookingEvent implements Serializable {
    private Integer userId;
    private Integer flightId;
}