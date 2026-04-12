package com.hilbert.booking.service.consumer;

import com.hilbert.booking.config.RabbitConfig;
import com.hilbert.booking.dto.event.BookingEvent;
import com.hilbert.booking.entity.Notification;
import com.hilbert.booking.repository.BookingRequestRepository;
import com.hilbert.booking.repository.NotificationRepository;
import com.hilbert.booking.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class BookingEventListener {

    private final BookingRequestRepository bookingRequestRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @RabbitListener(queues = RabbitConfig.QUEUE_BOOKINGS)
    public void handleBookingRequest(BookingEvent event) {
        try {
            log.info("Received booking event: {}", event);

            Integer requestId = bookingRequestRepository.submitBookingRequest(event.getUserId(), event.getFlightId());

            log.info("Successfully created Booking Request ID: {} in DB", requestId);

        } catch (Exception e) {
            String errorMessage = e.getMessage();
            if (e.getCause() != null) {
                errorMessage += " " + e.getCause().getMessage();
            }

            log.warn("Booking failed for User {} Flight {}: {}", event.getUserId(), event.getFlightId(), errorMessage);

            if (errorMessage.contains("Limit exceeded")) {
                sendLimitNotification(event.getUserId());
            }

        }
    }

    private void sendLimitNotification(Integer userId) {
        try {
            var userRef = userRepository.getReferenceById(userId);

            Notification notification = Notification.builder()
                    .user(userRef)
                    .message(
                            "Error: Booking limit exceeded. Maximum 6 tickets per flight per person allowed.")
                    .isRead(false)
                    .bookingRequest(null)
                    .build();

            notificationRepository.save(notification);
        } catch (Exception ex) {
            log.error("Failed to save notification for user {}", userId, ex);
        }
    }
}