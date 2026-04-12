import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { PageIntro } from "../components/ui/PageIntro";
import { notificationsApi } from "../api/notifications";
import { formatDateTime, inferNotificationTone } from "../lib/format";

const toneToLabel: Record<string, string> = {
    success: "Покупка",
    error: "Отказ",
    warning: "Возврат или отмена",
    info: "Системное"
};

export function NotificationsPage() {
    const queryClient = useQueryClient();
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [toneFilter, setToneFilter] = useState("all");

    const notificationsQuery = useQuery({
        queryKey: ["notifications", unreadOnly],
        queryFn: () => notificationsApi.list(unreadOnly)
    });

    const notifications = (notificationsQuery.data ?? []).filter((notification) => {
        if (toneFilter === "all") return true;
        return inferNotificationTone(notification.message) === toneFilter;
    });

    const handleMarkRead = async (id: number) => {
        await notificationsApi.markRead(id);
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    const handleMarkAllRead = async () => {
        await notificationsApi.markAllRead();
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    return (
        <div className="hb-stack">
            <PageIntro
                eyebrow="Центр событий"
                title="Уведомления как центр событий, а не сухой список"
                body="Новый экран группирует сообщения по смыслу: успешная покупка, отказ из-за нехватки мест, отмена рейса, возврат средств и системные уведомления."
            />

            <Card
                eyebrow="Фильтры"
                title="Управление потоком уведомлений"
                actions={<Button variant="secondary" size="small" onClick={handleMarkAllRead}>Отметить всё прочитанным</Button>}
            >
                <div className="hb-inline">
                    <div className="hb-segmented">
                        <button type="button" className={unreadOnly ? "is-active" : ""} onClick={() => setUnreadOnly(true)}>
                            Только непрочитанные
                        </button>
                        <button type="button" className={!unreadOnly ? "is-active" : ""} onClick={() => setUnreadOnly(false)}>
                            Все
                        </button>
                    </div>

                    <div className="hb-segmented">
                        {["all", "success", "error", "warning", "info"].map((tone) => (
                            <button
                                key={tone}
                                type="button"
                                className={toneFilter === tone ? "is-active" : ""}
                                onClick={() => setToneFilter(tone)}
                            >
                                {tone === "all" ? "Все типы" : toneToLabel[tone]}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            <Card eyebrow="События" title="Лента уведомлений">
                {notifications.length ? (
                    <div className="hb-status-list">
                        {notifications.map((notification) => {
                            const tone = inferNotificationTone(notification.message);
                            return (
                                <div key={notification.id} className="hb-status-list__item">
                                    <div>
                                        <div className="hb-inline">
                                            <Badge tone={tone}>{toneToLabel[tone]}</Badge>
                                            {!notification.isRead ? <Badge tone="accent">Непрочитано</Badge> : null}
                                        </div>
                                        <strong>{notification.message}</strong>
                                        <div className="hb-subtle">{formatDateTime(notification.sentAt)}</div>
                                    </div>
                                    {!notification.isRead ? (
                                        <Button size="small" onClick={() => handleMarkRead(notification.id)}>
                                            Прочитать
                                        </Button>
                                    ) : (
                                        <Badge tone="default">Обработано</Badge>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="hb-empty">
                        Подходящих уведомлений пока нет. Когда backend начнёт присылать события, экран будет сразу группировать их по смыслу.
                    </div>
                )}
            </Card>
        </div>
    );
}
