import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { MetricCard } from "../components/ui/MetricCard";
import { PageIntro } from "../components/ui/PageIntro";
import { BarChart } from "../components/ui/BarChart";
import { usersApi } from "../api/users";
import { ticketsApi } from "../api/tickets";
import { notificationsApi } from "../api/notifications";
import { bookingsApi } from "../api/bookings";
import { queueLiveSeries } from "../lib/demo";
import { formatDateTime, formatMoney, getRequestTone, getTicketTone, humanizeRequestStatus } from "../lib/format";

export function DashboardPage() {
    const profileQuery = useQuery({ queryKey: ["me"], queryFn: usersApi.me });
    const ticketsQuery = useQuery({ queryKey: ["tickets"], queryFn: ticketsApi.my });
    const bookingsQuery = useQuery({ queryKey: ["bookings"], queryFn: bookingsApi.my });
    const notificationsQuery = useQuery({ queryKey: ["notifications", false], queryFn: () => notificationsApi.list(false) });

    const profile = profileQuery.data;
    const tickets = ticketsQuery.data ?? [];
    const requests = bookingsQuery.data ?? [];
    const notifications = notificationsQuery.data ?? [];
    const approvedRequests = requests.filter((request) => request.status === "APPROVED").length;
    const successRate = requests.length ? Math.round((approvedRequests / requests.length) * 100) : 0;
    const nextTicket = [...tickets].sort((a, b) => a.departureTime.localeCompare(b.departureTime))[0];

    return (
        <div className="hb-stack">
            <PageIntro
                eyebrow="Пользовательский режим"
                title="Дашборд"
                body="Баланс, total spend, заявки и ближайшие рейсы."
            />

            <div className="hb-metric-grid">
                <MetricCard label="Баланс" value={formatMoney(profile?.balance)} hint="Текущие средства на счёте (депозит − покупки)." />
                <MetricCard label="Total spend" value={formatMoney(profile?.totalSpend)} hint="Влияет на приоритет в конкурентном окне." />
                <MetricCard label="Купленные билеты" value={String(tickets.length)} hint="Успешно обработанные заявки." />
                <MetricCard label="Успех покупок" value={`${successRate}%`} hint="Доля заявок выше порога отсечения." />
            </div>

            <div className="hb-grid hb-grid--2">
                <Card
                    eyebrow="Быстрые действия"
                    title="Следующий шаг"
                    subtitle="Главный сценарий пользователя начинается с поиска рейса, а затем продолжается на экране покупки и в отслеживании статусов."
                >
                    <div className="hb-action-row">
                        <Link to="/app/search">
                            <Button>Найти рейс</Button>
                        </Link>
                        <Link to="/app/requests">
                            <Button variant="secondary">Мои заявки и билеты</Button>
                        </Link>
                        <Link to="/app/architecture">
                            <Button variant="ghost">Архитектура и симуляция</Button>
                        </Link>
                    </div>
                    <div className="hb-callout">
                        Приоритет рассчитывается по 10 факторам: частота покупок, средний чек, статус лояльности, корпоративный договор и другие. Чем выше балл — тем раньше вы в очереди.
                    </div>
                </Card>

                <Card eyebrow="Ближайший рейс" title="Что уже куплено">
                    {nextTicket ? (
                        <div className="hb-flight-card">
                            <div className="hb-flight-card__top">
                                <div className="hb-flight-card__route">
                                    <div className="hb-flight-card__cities">
                                        <div>
                                            <div className="hb-flight-card__city">{nextTicket.originCity}</div>
                                            <div className="hb-flight-card__airport">{nextTicket.originAirport}</div>
                                        </div>
                                        <div className="hb-flight-card__arrow">to</div>
                                        <div>
                                            <div className="hb-flight-card__city">{nextTicket.destCity}</div>
                                            <div className="hb-flight-card__airport">{nextTicket.destAirport}</div>
                                        </div>
                                    </div>
                                </div>
                                <Badge tone={getTicketTone(nextTicket.isActive)}>{nextTicket.isActive ? "Активный билет" : "Неактивный"}</Badge>
                            </div>
                            <div className="hb-flight-card__meta">
                                <div className="hb-label-pair">
                                    <div className="hb-label-pair__label">Вылет</div>
                                    <div className="hb-label-pair__value">{formatDateTime(nextTicket.departureTime)}</div>
                                </div>
                                <div className="hb-label-pair">
                                    <div className="hb-label-pair__label">Прилёт</div>
                                    <div className="hb-label-pair__value">{formatDateTime(nextTicket.arrivalTime)}</div>
                                </div>
                                <div className="hb-label-pair">
                                    <div className="hb-label-pair__label">Цена</div>
                                    <div className="hb-label-pair__value">{formatMoney(nextTicket.price)}</div>
                                </div>
                                <div className="hb-label-pair">
                                    <div className="hb-label-pair__label">Номер</div>
                                    <div className="hb-label-pair__value hb-mono">{nextTicket.ticketNumber}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="hb-empty">
                            Пока нет купленных билетов. Новый интерфейс показывает путь от запроса в очередь до итогового билета и уведомления.
                        </div>
                    )}
                </Card>
            </div>

            <div className="hb-grid hb-grid--2">
                <Card eyebrow="Активность" title="Текущие заявки">
                    {requests.length ? (
                        <div className="hb-status-list">
                            {requests.slice(0, 4).map((request) => (
                                <div key={request.requestId} className="hb-status-list__item">
                                    <div>
                                        <strong>
                                            {request.originCity} {"->"} {request.destCity}
                                        </strong>
                                        <div className="hb-subtle">
                                            Подана {formatDateTime(request.submittedAt)} | Вылет {formatDateTime(request.departureTime)}
                                        </div>
                                    </div>
                                    <Badge tone={getRequestTone(request.status)}>{humanizeRequestStatus(request.status)}</Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="hb-empty">
                            У вас пока нет заявок. После первой конкурентной покупки здесь появится история обработки.
                        </div>
                    )}
                </Card>

                <Card eyebrow="Система" title="Как выглядит очередь в live preview">
                    <BarChart items={queueLiveSeries.map((item) => ({ label: item.label, value: item.requests }))} />
                </Card>
            </div>

            <Card eyebrow="Последние события" title="Центр уведомлений">
                {notifications.length ? (
                    <div className="hb-status-list">
                        {notifications.slice(0, 4).map((notification) => (
                            <div key={notification.id} className="hb-status-list__item">
                                <div>
                                    <strong>{notification.message}</strong>
                                    <div className="hb-subtle">{formatDateTime(notification.sentAt)}</div>
                                </div>
                                <Badge tone={notification.isRead ? "default" : "accent"}>
                                    {notification.isRead ? "Прочитано" : "Новое"}
                                </Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="hb-empty">Уведомлений пока нет. Здесь будут появляться результаты покупки, отказы и системные события.</div>
                )}
            </Card>
        </div>
    );
}
