import { create } from "zustand";
import type { UserProfileResponse } from "../types/dto";
import { usersApi } from "../api/users";

type AuthState = {
    token: string | null;
    profile: UserProfileResponse | null;
    setToken: (t: string | null) => void;
    loadProfile: () => Promise<UserProfileResponse>;
    logout: () => void;
    isAdmin: () => boolean;
};

const LS_KEY = "priority_token";

export const authStore = create<AuthState>((set, get) => ({
    token: localStorage.getItem(LS_KEY),
    profile: null,

    setToken: (t) => {
        if (t) localStorage.setItem(LS_KEY, t);
        else localStorage.removeItem(LS_KEY);
        set({ token: t, profile: null });
    },

    loadProfile: async () => {
        const me = await usersApi.me();
        set({ profile: me });
        return me;
    },

    logout: () => {
        localStorage.removeItem(LS_KEY);
        set({ token: null, profile: null });
    },

    isAdmin: () => {
        const roles = get().profile?.roles ?? [];
        return roles.some((r) => r.toUpperCase().includes("ADMIN"));
    }
}));

