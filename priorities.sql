SELECT 
    status, 
    COUNT(*) as count, 
    AVG(calculated_priority) as avg_deposit 
FROM booking_requests
WHERE flight_id = 1 AND status IN ('APPROVED', 'REJECTED')
GROUP BY status;
