package com.hilbert.booking.service;

import com.hilbert.booking.dto.response.TicketResponse;
import com.hilbert.booking.entity.Ticket;
import com.hilbert.booking.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;

    @Transactional(readOnly = true)
    public List<TicketResponse> getUserTickets(Integer userId) {
        return ticketRepository.findAllByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private TicketResponse mapToDto(Ticket t) {
        var flight = t.getBookingRequest().getFlight();
        return TicketResponse.builder()
                .ticketId(t.getId())
                .ticketNumber(t.getTicketNumber())
                .originCity(flight.getOriginAirport().getCity().getName())
                .originAirport(flight.getOriginAirport().getName())
                .destCity(flight.getDestinationAirport().getCity().getName())
                .destAirport(flight.getDestinationAirport().getName())
                .departureTime(flight.getDepartureTime())
                .arrivalTime(flight.getArrivalTime())
                .price(flight.getPrice())
                .isActive(t.getIsActive())
                .build();
    }
}