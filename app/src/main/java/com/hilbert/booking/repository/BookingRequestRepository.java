package com.hilbert.booking.repository;

import com.hilbert.booking.entity.BookingRequest;

import jakarta.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRequestRepository extends JpaRepository<BookingRequest, Integer> {

    @Query(value = "SELECT submit_booking_request(:userId, :flightId)", nativeQuery = true)
    Integer submitBookingRequest(@Param("userId") Integer userId, @Param("flightId") Integer flightId);

    @Modifying
    @Transactional
    @Query(value = "CALL process_flight_queue(:flightId)", nativeQuery = true)
    void processFlightQueue(@Param("flightId") Integer flightId);

    List<BookingRequest> findByUserIdOrderByCreatedAtDesc(Integer userId);
}
