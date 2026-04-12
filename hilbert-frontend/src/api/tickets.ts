import { http } from "./http";
import type { TicketResponse } from "../types/dto";

export const ticketsApi = {
    my: async () => {
        const { data } = await http.get<TicketResponse[]>("/api/tickets/my");
        return data;
    }
};
