export type NavItem = {
    to: string;
    label: string;
    meta: string;
    icon: string;
};

export const userNavigation: NavItem[] = [
    { to: "/app", label: "Дашборд", meta: "Краткая картина системы", icon: "DB" },
    { to: "/app/search", label: "Поиск рейсов", meta: "Сценарий конкурентной покупки", icon: "FL" },
    { to: "/app/requests", label: "Заявки и билеты", meta: "Текущий статус покупок", icon: "RQ" },
    { to: "/app/notifications", label: "Уведомления", meta: "События и результаты", icon: "NT" },
    { to: "/app/profile", label: "Профиль", meta: "Объяснение личного приоритета", icon: "PF" },
    { to: "/app/architecture", label: "Архитектура и симуляция", meta: "Очередь, приоритеты и нагрузка", icon: "AR" },
    { to: "/app/impact", label: "Эффект системы", meta: "До и после: выручка, качество, надёжность", icon: "BI" }
];

export const adminNavigation: NavItem[] = [
    { to: "/app/admin", label: "Обзор администратора", meta: "KPI и проблемные рейсы", icon: "AD" },
    { to: "/app/admin/flights", label: "Рейсы", meta: "Управление и статистика", icon: "FR" },
    { to: "/app/admin/locations", label: "Локации", meta: "Справочник городов и аэропортов", icon: "LC" }
];
