package com.hilbert.booking.service.scheduler;

import com.hilbert.booking.entity.Flight;
import com.hilbert.booking.repository.BookingRequestRepository;
import com.hilbert.booking.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class QueueProcessor {

    private final FlightRepository flightRepository;
    private final BookingRequestRepository bookingRequestRepository;

    @Scheduled(fixedDelay = 2000)
    public void processQueues() {
        List<Flight> flightsToProcess = flightRepository.findFlightsWithPendingRequests();

        if (flightsToProcess.isEmpty()) {
            return;
        }

        log.debug("Found {} flights with pending requests", flightsToProcess.size());

        for (Flight flight : flightsToProcess) {
            try {
                bookingRequestRepository.processFlightQueue(flight.getId());
                log.info("Processed queue for flight ID: {}", flight.getId());
            } catch (Exception e) {
                log.error("Error processing queue for flight ID: {}", flight.getId(), e);
            }
        }
    }
}