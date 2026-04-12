import { http } from "./http";
import type { UserProfileResponse } from "../types/dto";

export const usersApi = {
    me: async () => {
        const { data } = await http.get<UserProfileResponse>("/api/users/me");
        return data;
    },
    deposit: async (amount: string) => {
        const { data } = await http.post<string>("/api/users/deposit", { amount });
        return data;
    },
    promoteMe: async () => {
        const { data } = await http.post<string>("/api/users/promote-me");
        return data;
    }
};
