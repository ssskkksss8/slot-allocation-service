package com.hilbert.booking.repository;

import com.hilbert.booking.entity.Airport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AirportRepository extends JpaRepository<Airport, Integer> {
    List<Airport> findAllByOrderByNameAsc();

    List<Airport> findByCityId(Integer cityId);
}