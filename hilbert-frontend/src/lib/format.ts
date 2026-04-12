export function formatMoney(value?: string | number | null) {
    const amount = Number(value ?? 0);
    return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0
    }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDateTime(value?: string | null) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(value));
}

export function formatDate(value?: string | null) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(new Date(value));
}

export function formatPercent(value: number, digits = 0) {
    return `${value.toFixed(digits)}%`;
}

export function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export function getRequestTone(status: string) {
    switch (status.toUpperCase()) {
        case "APPROVED":
            return "success";
        case "REJECTED":
            return "error";
        case "CANCELLED":
            return "warning";
        default:
            return "info";
    }
}

export function humanizeRequestStatus(status: string) {
    switch (status.toUpperCase()) {
        case "APPROVED":
            return "Куплено";
        case "REJECTED":
            return "Отклонено";
        case "CANCELLED":
            return "Отменено";
        default:
            return "В обработке";
    }
}

export function getFlightTone(status: string) {
    switch (status.toUpperCase()) {
        case "BOARDING":
            return "warning";
        case "COMPLETED":
            return "default";
        case "CANCELLED":
            return "error";
        default:
            return "success";
    }
}

export function humanizeFlightStatus(status: string) {
    switch (status.toUpperCase()) {
        case "BOARDING":
            return "Посадка";
        case "COMPLETED":
            return "Завершён";
        case "CANCELLED":
            return "Отменён";
        default:
            return "Запланирован";
    }
}

export function getTicketTone(isActive: boolean) {
    return isActive ? "success" : "warning";
}

export function humanizeRole(role: string) {
    if (role.toUpperCase().includes("ADMIN")) return "Администратор";
    if (role.toUpperCase().includes("USER")) return "Пользователь";
    return role;
}

export function inferNotificationTone(message: string) {
    const normalized = message.toLowerCase();
    if (normalized.includes("refund") || normalized.includes("возврат")) return "warning";
    if (normalized.includes("reject") || normalized.includes("отклон")) return "error";
    if (normalized.includes("cancel") || normalized.includes("отмен")) return "warning";
    if (normalized.includes("success") || normalized.includes("куплен") || normalized.includes("успеш")) {
        return "success";
    }
    return "info";
}

export function getInitials(value: string) {
    return value
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}
