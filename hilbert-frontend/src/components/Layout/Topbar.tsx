import { Link, useLocation } from "react-router-dom";
import { authStore } from "../../store/authStore";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { formatMoney, humanizeRole } from "../../lib/format";

const routeMeta: Record<string, { eyebrow: string; title: string; subtitle: string }> = {
    "/app": {
        eyebrow: "Сводка",
        title: "Пользовательский дашборд",
        subtitle: "Короткий обзор нагрузки, ближайших действий и объяснение механики приоритета."
    },
    "/app/search": {
        eyebrow: "Покупка",
        title: "Поиск и конкурентная покупка рейса",
        subtitle: "Пользовательский сценарий с объяснением окна приёма, очереди и распределения мест."
    },
    "/app/requests": {
        eyebrow: "Исполнение",
        title: "Мои заявки и билеты",
        subtitle: "Раздельный обзор статусов заявок, результатов обработки и купленных билетов."
    },
    "/app/notifications": {
        eyebrow: "События",
        title: "Центр уведомлений",
        subtitle: "Результаты обработки, возвраты и системные события в едином event center."
    },
    "/app/profile": {
        eyebrow: "Приоритет",
        title: "Профиль пользователя",
        subtitle: "Почему система принимает именно такое решение и как total spend влияет на исход."
    },
    "/app/architecture": {
        eyebrow: "Технологическая витрина",
        title: "Архитектура и симуляция",
        subtitle: "Интерактивная карта системы, жизненный цикл заявки и демо-сценарий нагрузочного теста."
    },
    "/app/admin": {
        eyebrow: "Администрирование",
        title: "Обзор администратора",
        subtitle: "KPI очереди, активные рейсы и общая картина системы для демонстрации и контроля."
    },
    "/app/admin/flights": {
        eyebrow: "Администрирование",
        title: "Управление рейсами",
        subtitle: "Список рейсов, действия администратора и статистика конкурентной покупки."
    },
    "/app/admin/locations": {
        eyebrow: "Администрирование",
        title: "Справочник локаций",
        subtitle: "Города и аэропорты как полноценный каталог, а не набор разрозненных форм."
    }
};

export function Topbar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
    const location = useLocation();
    const profile = authStore((s) => s.profile);
    const logout = authStore((s) => s.logout);
    const meta = routeMeta[location.pathname] ?? routeMeta["/app"];

    return (
        <header className="hb-topbar">
            <div className="hb-topbar__group">
                <Button variant="secondary" size="small" onClick={onToggle}>
                    {collapsed ? "Меню" : "Свернуть"}
                </Button>
                <div className="hb-topbar__title">
                    <div className="hb-topbar__eyebrow">{meta.eyebrow}</div>
                    <div className="hb-topbar__headline">{meta.title}</div>
                    <div className="hb-topbar__subline">{meta.subtitle}</div>
                </div>
            </div>

            <div className="hb-topbar__actions">
                {profile ? (
                    <>
                        <Badge tone="accent">{profile.roles.map(humanizeRole).join(", ")}</Badge>
                        <Badge tone="success">Баланс: {formatMoney(profile.balance)}</Badge>
                        <Badge tone="info">Total spend: {formatMoney(profile.totalSpend)}</Badge>
                    </>
                ) : null}
                <Link to="/app/architecture">
                    <Button variant="ghost" size="small">Архитектура</Button>
                </Link>
                <Button variant="secondary" size="small" onClick={() => logout()}>
                    Выйти
                </Button>
            </div>
        </header>
    );
}
