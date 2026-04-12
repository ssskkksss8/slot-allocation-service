SELECT 
    f.total_seats, 
    f.available_seats, 
    (f.total_seats - f.available_seats) AS should_be_sold,
    COUNT(t.id) AS actually_tickets_created
FROM flights f
LEFT JOIN booking_requests br ON br.flight_id = f.id
LEFT JOIN tickets t ON t.booking_request_id = br.id
WHERE f.id = 1
GROUP BY f.id, f.total_seats, f.available_seats;
