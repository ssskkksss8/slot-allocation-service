package com.hilbert.booking.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.hilbert.booking.entity.enums.Enums.RequestStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "booking_requests")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_id", nullable = false)
    private Flight flight;

    @Column(name = "calculated_priority")
    private BigDecimal calculatedPriority;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(columnDefinition = "request_status")
    private RequestStatus status = RequestStatus.PENDING;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}
