package com.hilbert.booking.entity.enums;

public final class Enums {

    public enum RoleType {
        USER,
        ADMIN,
    }

    public enum RequestStatus {
        PENDING,
        APPROVED,
        REJECTED,
        CANCELLED,
    }

    public enum FlightStatus {
        SCHEDULED,
        BOARDING,
        COMPLETED,
        CANCELLED,
    }

    public enum TransactionType {
        DEPOSIT,
        PURCHASE,
        REFUND,
    }

}
