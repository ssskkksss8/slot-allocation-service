import { http } from "./http";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types/dto";

export const authApi = {
    register: async (payload: RegisterRequest) => {
        const { data } = await http.post<AuthResponse>("/api/auth/register", payload);
        return data;
    },
    login: async (payload: LoginRequest) => {
        const { data } = await http.post<AuthResponse>("/api/auth/login", payload);
        return data;
    }
};
