import { http } from "./http";
import type { AdminFlightResponse, FlightSearchResponse, FlightStatsResponse } from "../types/dto";

export const flightsApi = {
    search: async (params: { origin: string; dest: string; date: string }) => {
        const { data } = await http.get<FlightSearchResponse[]>("/api/flights", { params });
        return data;
    },
    create: async (payload: {
        originAirportId: number;
        destinationAirportId: number;
        departureTime: string;
        arrivalTime: string;
        price: string;
        totalSeats: number;
    }) => {
        const { data } = await http.post<number>("/api/flights/admin", payload);
        return data;
    },
    cancel: async (id: number, reason: string) => {
        await http.delete<void>(`/api/flights/admin/${id}`, { params: { reason } });
    },
    stats: async (id: number) => {
        const { data } = await http.get<FlightStatsResponse>(`/api/flights/${id}/stats`);
        return data;
    },
    adminList: async () => {
        const { data } = await http.get<AdminFlightResponse[]>("/api/flights/admin");
        return data;
    }
};

