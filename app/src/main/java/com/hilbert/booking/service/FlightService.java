package com.hilbert.booking.service;

import com.hilbert.booking.dto.request.FlightCreateRequest;
import com.hilbert.booking.dto.response.AdminFlightResponse;
import com.hilbert.booking.dto.response.FlightSearchResponse;
import com.hilbert.booking.dto.response.FlightStatsResponse;
import com.hilbert.booking.entity.Flight;
import com.hilbert.booking.entity.enums.Enums.FlightStatus;
import com.hilbert.booking.repository.AirportRepository;
import com.hilbert.booking.repository.FlightRepository;
import com.hilbert.booking.repository.projection.FlightSearchResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlightService {

    private final FlightRepository flightRepository;
    private final AirportRepository airportRepository;

    @Transactional
    public Integer createFlight(FlightCreateRequest request) {
        if (request.getArrivalTime().isBefore(request.getDepartureTime())) {
            throw new IllegalArgumentException("Arrival time cannot be before departure time");
        }

        var origin = airportRepository.findById(request.getOriginAirportId())
                .orElseThrow(() -> new RuntimeException("Origin airport not found"));

        var dest = airportRepository.findById(request.getDestinationAirportId())
                .orElseThrow(() -> new RuntimeException("Destination airport not found"));

        Flight flight = Flight.builder()
                .originAirport(origin)
                .destinationAirport(dest)
                .departureTime(request.getDepartureTime())
                .arrivalTime(request.getArrivalTime())
                .price(request.getPrice())
                .totalSeats(request.getTotalSeats())
                .availableSeats(request.getTotalSeats())
                .status(FlightStatus.SCHEDULED)
                .build();

        flight = flightRepository.save(flight);
        return flight.getId();
    }

    @Transactional(readOnly = true)
    public List<FlightSearchResponse> searchFlights(String origin, String dest, LocalDate date) {
        List<FlightSearchResult> results = flightRepository.searchFlights(origin, dest, date);

        return results.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelFlight(Integer adminId, Integer flightId, String reason) {
        flightRepository.cancelFlightByAdmin(adminId, flightId, reason);
    }

    private FlightSearchResponse mapToResponse(FlightSearchResult result) {
        return FlightSearchResponse.builder()
                .flightId(result.getFlight_id())
                .flightCode(result.getFlight_code())
                .originCity(result.getOrigin_city())
                .originAirport(result.getOrigin_airport())
                .destCity(result.getDest_city())
                .destAirport(result.getDest_airport())
                .departureTime(result.getDeparture_time())
                .price(result.getPrice())
                .availableSeats(result.getAvailable_seats())
                .status(result.getStatus())
                .build();
    }

    @Transactional(readOnly = true)
    public FlightStatsResponse getFlightStats(Integer flightId) {
        var flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new RuntimeException("Flight not found"));

        int soldCount = flight.getTotalSeats() - flight.getAvailableSeats();

        return FlightStatsResponse.builder()
                .flightId(flight.getId())
                .totalSeats(flight.getTotalSeats())
                .availableSeats(flight.getAvailableSeats())
                .soldCount(soldCount)
                .price(flight.getPrice())
                .expectedRevenue(flight.getPrice().multiply(new BigDecimal(soldCount)))
                .status(flight.getStatus().name())
                .build();
    }

    @Transactional(readOnly = true)
    public List<Flight> getActiveFlights() {
        return flightRepository.findActiveFlights();
    }

    @Transactional(readOnly = true)
    public List<AdminFlightResponse> getAdminFlights() {
        return flightRepository.findAllByOrderByDepartureTimeAsc().stream()
                .map(flight -> AdminFlightResponse.builder()
                        .flightId(flight.getId())
                        .originCity(flight.getOriginAirport().getCity().getName())
                        .originAirport(flight.getOriginAirport().getName())
                        .destCity(flight.getDestinationAirport().getCity().getName())
                        .destAirport(flight.getDestinationAirport().getName())
                        .departureTime(flight.getDepartureTime())
                        .arrivalTime(flight.getArrivalTime())
                        .price(flight.getPrice())
                        .totalSeats(flight.getTotalSeats())
                        .availableSeats(flight.getAvailableSeats())
                        .soldSeats(flight.getTotalSeats() - flight.getAvailableSeats())
                        .status(flight.getStatus().name())
                        .build())
                .collect(Collectors.toList());
    }
}
