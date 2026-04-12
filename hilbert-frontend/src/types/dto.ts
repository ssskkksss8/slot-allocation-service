export type AuthResponse = { token: string };

export type RegisterRequest = {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type CityResponse = {
    id: number;
    name: string;
    country: string;
    timezone?: string | null;
};

export type AirportResponse = {
    id: number;
    name: string;
    cityName: string;
    country: string;
};

export type FlightSearchResponse = {
    flightId: number;
    flightCode: string;
    originCity: string;
    originAirport: string;
    destCity: string;
    destAirport: string;
    departureTime: string; // LocalDateTime JSON
    price: string; // BigDecimal часто приходит строкой
    availableSeats: number;
    status: string;
};

export type FlightStatsResponse = {
    flightId: number;
    totalSeats: number;
    availableSeats: number;
    soldCount: number;
    price: string;
    expectedRevenue: string;
    status: string;
};

export type AdminFlightResponse = {
    flightId: number;
    originCity: string;
    originAirport: string;
    destCity: string;
    destAirport: string;
    departureTime: string;
    arrivalTime: string;
    price: string;
    totalSeats: number;
    availableSeats: number;
    soldSeats: number;
    status: string;
};

export type BookingRequestResponse = {
    requestId: number;
    flightId: number;
    originCity: string;
    originAirport: string;
    destCity: string;
    destAirport: string;
    departureTime: string;
    price: string;
    status: string;
    calculatedPriority?: string | null;
    submittedAt: string;
    processedAt?: string | null;
};

export type NotificationResponse = {
    id: number;
    message: string;
    isRead: boolean;
    sentAt: string;
};

export type TicketResponse = {
    ticketId: number;
    ticketNumber: string;
    originCity: string;
    originAirport: string;
    destCity: string;
    destAirport: string;
    departureTime: string;
    arrivalTime: string;
    price: string;
    isActive: boolean;
};

export type UserProfileResponse = {
    id: number;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    totalSpend: string;
    balance: string;
    roles: string[];
};
