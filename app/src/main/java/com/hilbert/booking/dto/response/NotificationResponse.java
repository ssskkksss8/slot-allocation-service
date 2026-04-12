package com.hilbert.booking.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationResponse {
    private Integer id;
    private String message;
    private Boolean isRead;
    private LocalDateTime sentAt;
}