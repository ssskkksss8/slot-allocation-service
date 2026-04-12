import axios from "axios";
import { API_BASE_URL } from "../config";
import { authStore } from "../store/authStore";

export const http = axios.create({
    baseURL: API_BASE_URL || "",
    timeout: 15000
});

http.interceptors.request.use((config) => {
    const token = authStore.getState().token;
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

http.interceptors.response.use(
    (r) => r,
    (err) => {
        const status = err?.response?.status;
        if (status === 401) {
            authStore.getState().logout();
            if (window.location.pathname !== "/auth") window.location.href = "/auth";
        }
        return Promise.reject(err);
    }
);
