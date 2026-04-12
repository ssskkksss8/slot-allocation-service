import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { bookingsApi } from "../api/bookings";
import { ticketsApi } from "../api/tickets";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageIntro } from "../components/ui/PageIntro";
import { Timeline } from "../components/ui/Timeline";
import { demoRequestTimeline } from "../lib/demo";
import { formatDateTime, formatMoney, getRequestTone, getTicketTone, humanizeRequestStatus } from "../lib/format";

function requestReason(status: string) {
    switch (status.toUpperCase()) {
        case "APPROVED":
            return "Заявка прошла отсечение по приоритету и была преобразована в покупку.";
        case "REJECTED":
            return "Билеты закончились раньше, чем очередь дошла до вашей позиции.";
        case "CANCELLED":
            return "Рейс отменён или заявка снята до завершения обработки.";
        default:
            return "Заявка находится в окне приёма или ещё не завершила обработку в очереди.";
    }
}

export function RequestsPage() {
    const [tab, setTab] = useState<"requests" | "tickets">("requests");
    const bookingsQuery = useQuery({ queryKey: ["bookings"], queryFn: bookingsApi.my });
    const ticketsQuery = useQuery({ queryKey: ["tickets"], queryFn: ticketsApi.my });
    const requests = bookingsQuery.data ?? [];
    const tickets = ticketsQuery.data ?? [];

    return (
        <div className="hb-stack">
            <PageIntro
                eyebrow="Мои заявки и билеты"
                title="Разделяем запрос на покупку и фактический билет"
                body="Новый экран не смешивает две сущности. Сначала пользователь видит, как отрабатывает очередь заявок, а затем — какие из них завершились выпуском билета."
            />

            <div className="hb-segmented">
                <button type="button" className={tab === "requests" ? "is-active" : ""} onClick={() => setTab("requests")}>
                    Мои заявки
                </button>
                <button type="button" className={tab === "tickets" ? "is-active" : ""} onClick={() => setTab("tickets")}>
                    Мои билеты
                </button>
            </div>

            {tab === "requests" ? (
                <div className="hb-grid hb-grid--2">
                    <Card
                        eyebrow="Заявки"
                        title="Статусы обработки"
                        subtitle="Показываем время подачи, решение системы и понятную причину итогового статуса."
                    >
                        {requests.length ? (
                            <div className="hb-status-list">
                                {requests.map((request) => (
                                    <div key={request.requestId} className="hb-status-list__item">
                                        <div>
                                            <strong>
                                                {request.originCity} {"->"} {request.destCity}
                                            </strong>
                                            <div className="hb-subtle">
                                                Подана {formatDateTime(request.submittedAt)}
                                                {request.processedAt ? ` | Решение ${formatDateTime(request.processedAt)}` : ""}
                                            </div>
                                            <div className="hb-subtle">
                                                Причина: {requestReason(request.status)}
                                            </div>
                                            {request.calculatedPriority ? (
                                                <div className="hb-subtle">Рассчитанный приоритет: {request.calculatedPriority}</div>
                                            ) : null}
                                        </div>
                                        <Badge tone={getRequestTone(request.status)}>{humanizeRequestStatus(request.status)}</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="hb-empty">Пока нет заявок. После первой покупки здесь появится живая история обработки.</div>
                        )}
                    </Card>

                    <Card
                        eyebrow="Explainability"
                        title="Живая история обработки"
                        subtitle="Для демонстрации проекта и защиты полезно показывать не только результат, но и путь заявки через систему."
                    >
                        <Timeline items={demoRequestTimeline} />
                    </Card>
                </div>
            ) : null}

            {tab === "tickets" ? (
                <Card
                    eyebrow="Билеты"
                    title="Купленные билеты"
                    subtitle="Маршрут, дата, стоимость и статус находятся отдельно от очереди заявок."
                >
                    {tickets.length ? (
                        <div className="hb-grid hb-grid--2">
                            {tickets.map((ticket) => (
                                <div key={ticket.ticketId} className="hb-flight-card">
                                    <div className="hb-flight-card__top">
                                        <div>
                                            <div className="hb-inline">
                                                <Badge tone={getTicketTone(ticket.isActive)}>{ticket.isActive ? "Активный" : "Неактивный"}</Badge>
                                                <Badge tone="accent">{ticket.ticketNumber}</Badge>
                                            </div>
                                            <div className="hb-flight-card__cities">
                                                <div>
                                                    <div className="hb-flight-card__city">{ticket.originCity}</div>
                                                    <div className="hb-flight-card__airport">{ticket.originAirport}</div>
                                                </div>
                                                <div className="hb-flight-card__arrow">to</div>
                                                <div>
                                                    <div className="hb-flight-card__city">{ticket.destCity}</div>
                                                    <div className="hb-flight-card__airport">{ticket.destAirport}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hb-flight-card__meta">
                                        <div className="hb-label-pair">
                                            <div className="hb-label-pair__label">Вылет</div>
                                            <div className="hb-label-pair__value">{formatDateTime(ticket.departureTime)}</div>
                                        </div>
                                        <div className="hb-label-pair">
                                            <div className="hb-label-pair__label">Прилёт</div>
                                            <div className="hb-label-pair__value">{formatDateTime(ticket.arrivalTime)}</div>
                                        </div>
                                        <div className="hb-label-pair">
                                            <div className="hb-label-pair__label">Сумма</div>
                                            <div className="hb-label-pair__value">{formatMoney(ticket.price)}</div>
                                        </div>
                                        <div className="hb-label-pair">
                                            <div className="hb-label-pair__label">Действия</div>
                                            <div className="hb-label-pair__value">Детали и подтверждение</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="hb-empty">Пока нет билетов. Здесь будут показываться только завершённые покупки.</div>
                    )}
                </Card>
            ) : null}
        </div>
    );
}
