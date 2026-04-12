import { http } from "./http";
import type { NotificationResponse } from "../types/dto";

export const notificationsApi = {
    list: async (unreadOnly: boolean) => {
        const { data } = await http.get<NotificationResponse[]>("/api/notifications", {
            params: { unreadOnly }
        });
        return data;
    },
    markRead: async (id: number) => {
        await http.patch<void>(`/api/notifications/${id}/read`);
    },
    markAllRead: async () => {
        await http.patch<void>("/api/notifications/read-all");
    }
};
