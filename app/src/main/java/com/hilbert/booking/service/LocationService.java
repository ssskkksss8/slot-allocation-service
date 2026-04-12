package com.hilbert.booking.service;

import com.hilbert.booking.dto.request.AirportCreateRequest;
import com.hilbert.booking.dto.request.CityCreateRequest;
import com.hilbert.booking.dto.response.AirportResponse;
import com.hilbert.booking.dto.response.CityResponse;
import com.hilbert.booking.entity.Airport;
import com.hilbert.booking.entity.City;
import com.hilbert.booking.repository.AirportRepository;
import com.hilbert.booking.repository.CityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final CityRepository cityRepository;
    private final AirportRepository airportRepository;

    @Transactional(readOnly = true)
    public List<CityResponse> getAllCities() {
        return cityRepository.findAllByOrderByNameAsc().stream()
                .map(city -> CityResponse.builder()
                        .id(city.getId())
                        .name(city.getName())
                        .country(city.getCountry())
                        .timezone(city.getTimezone())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AirportResponse> getAllAirports() {
        return airportRepository.findAllByOrderByNameAsc().stream()
                .map(airport -> AirportResponse.builder()
                        .id(airport.getId())
                        .name(airport.getName())
                        .cityName(airport.getCity().getName())
                        .country(airport.getCity().getCountry())
                        .build())
                .collect(Collectors.toList());
    }


    @Transactional
    public CityResponse createCity(CityCreateRequest request) {
        City city = City.builder()
                .name(request.getName())
                .country(request.getCountry())
                .timezone(request.getTimezone())
                .build();

        city = cityRepository.save(city);

        return CityResponse.builder()
                .id(city.getId())
                .name(city.getName())
                .country(city.getCountry())
                .timezone(city.getTimezone())
                .build();
    }

    @Transactional
    public AirportResponse createAirport(AirportCreateRequest request) {
        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new RuntimeException("City not found"));

        Airport airport = Airport.builder()
                .city(city)
                .name(request.getName())
                .build();

        airport = airportRepository.save(airport);

        return AirportResponse.builder()
                .id(airport.getId())
                .name(airport.getName())
                .cityName(city.getName())
                .country(city.getCountry())
                .build();
    }
}