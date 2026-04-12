package com.hilbert.booking.repository;

import com.hilbert.booking.entity.Flight;
import com.hilbert.booking.repository.projection.FlightSearchResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Integer> {

        List<Flight> findAllByOrderByDepartureTimeAsc();

        @Query(value = "SELECT * FROM search_flights(:origin, :dest, :date)", nativeQuery = true)
        List<FlightSearchResult> searchFlights(
                        @Param("origin") String originCity,
                        @Param("dest") String destCity,
                        @Param("date") LocalDate date);

        @Modifying
        @Query(value = "CALL cancel_flight_by_admin(:adminId, :flightId, :reason)", nativeQuery = true)
        void cancelFlightByAdmin(
                        @Param("adminId") Integer adminId,
                        @Param("flightId") Integer flightId,
                        @Param("reason") String reason);

        @Query("SELECT DISTINCT f FROM Flight f JOIN BookingRequest br ON br.flight.id = f.id WHERE br.status = 'PENDING'")
        List<Flight> findFlightsWithPendingRequests();

        @Query("SELECT f FROM Flight f WHERE f.status <> 'CANCELLED' AND f.status <> 'COMPLETED'")
        List<Flight> findActiveFlights();
}
