import { http } from "./http";
import type { AirportResponse, CityResponse } from "../types/dto";

export const locationsApi = {
    getCities: async () => {
        const { data } = await http.get<CityResponse[]>("/api/locations/cities");
        return data;
    },
    getAirports: async () => {
        const { data } = await http.get<AirportResponse[]>("/api/locations/airports");
        return data;
    },
    createCity: async (payload: { name: string; country: string; timezone?: string }) => {
        const { data } = await http.post<CityResponse>("/api/locations/cities", payload);
        return data;
    },
    createAirport: async (payload: { cityId: number; name: string }) => {
        const { data } = await http.post<AirportResponse>("/api/locations/airports", payload);
        return data;
    }
};
