import { http } from "./http";
import type { BookingRequestResponse } from "../types/dto";

export const bookingsApi = {
    createBooking: async (flightId: number) => {
        const { data } = await http.post<string>("/api/bookings", { flightId });
        return data;
    },
    my: async () => {
        const { data } = await http.get<BookingRequestResponse[]>("/api/bookings/my");
        return data;
    }
};
