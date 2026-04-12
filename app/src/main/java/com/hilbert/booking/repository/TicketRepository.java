package com.hilbert.booking.repository;

import com.hilbert.booking.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Integer> {

    @Query("""
                SELECT t FROM Ticket t
                JOIN FETCH t.bookingRequest br
                JOIN FETCH br.flight f
                JOIN FETCH f.originAirport oa
                JOIN FETCH oa.city
                JOIN FETCH f.destinationAirport da
                JOIN FETCH da.city
                WHERE br.user.id = :userId
                ORDER BY f.departureTime DESC
            """)
    List<Ticket> findAllByUserId(@Param("userId") Integer userId);
}