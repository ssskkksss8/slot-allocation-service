package com.hilbert.booking.service;

import com.hilbert.booking.config.RabbitConfig;
import com.hilbert.booking.dto.event.BookingEvent;
import com.hilbert.booking.dto.response.BookingRequestResponse;
import com.hilbert.booking.entity.BookingRequest;
import com.hilbert.booking.repository.BookingRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final AmqpTemplate rabbitTemplate;
    private final BookingRequestRepository bookingRequestRepository;

    public void createBookingRequest(Integer userId, Integer flightId) {
        BookingEvent event = new BookingEvent(userId, flightId);

        rabbitTemplate.convertAndSend(
                RabbitConfig.EXCHANGE_BOOKINGS,
                RabbitConfig.ROUTING_KEY_BOOKINGS,
                event);

        log.info("Booking request queued for User {} Flight {}", userId, flightId);
    }

    @Transactional(readOnly = true)
    public List<BookingRequestResponse> getUserBookingRequests(Integer userId) {
        return bookingRequestRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private BookingRequestResponse mapToDto(BookingRequest request) {
        var flight = request.getFlight();

        return BookingRequestResponse.builder()
                .requestId(request.getId())
                .flightId(flight.getId())
                .originCity(flight.getOriginAirport().getCity().getName())
                .originAirport(flight.getOriginAirport().getName())
                .destCity(flight.getDestinationAirport().getCity().getName())
                .destAirport(flight.getDestinationAirport().getName())
                .departureTime(flight.getDepartureTime())
                .price(flight.getPrice())
                .status(request.getStatus().name())
                .calculatedPriority(request.getCalculatedPriority())
                .submittedAt(request.getCreatedAt())
                .processedAt(request.getProcessedAt())
                .build();
    }
}
