import { useQuery } from "@tanstack/react-query";
import { flightsApi } from "../api/flights";
import { locationsApi } from "../api/locations";
import { authStore } from "../store/authStore";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { MetricCard } from "../components/ui/MetricCard";
import { PageIntro } from "../components/ui/PageIntro";
import { BarChart } from "../components/ui/BarChart";
import { adminHealthCards, queueLiveSeries } from "../lib/demo";
import { formatDateTime, formatMoney, humanizeFlightStatus } from "../lib/format";

export function AdminDashboardPage() {
    const isAdmin = authStore((s) => s.isAdmin());
    const flightsQuery = useQuery({ queryKey: ["admin-flights"], queryFn: flightsApi.adminList, enabled: isAdmin });
    const citiesQuery = useQuery({ queryKey: ["cities"], queryFn: locationsApi.getCities, enabled: isAdmin });
    const airportsQuery = useQuery({ queryKey: ["airports"], queryFn: locationsApi.getAirports, enabled: isAdmin });

    if (!isAdmin) {
        return (
            <Card eyebrow="Администрирование" title="Доступ ограничен">
                Админ-панель доступна только пользователям с ролью ADMIN.
            </Card>
        );
    }

    const flights = flightsQuery.data ?? [];
    const activeFlights = flights.filter((flight) => !["CANCELLED", "COMPLETED"].includes(flight.status));
    const soldSeats = flights.reduce((sum, flight) => sum + flight.soldSeats, 0);
    const leftSeats = flights.reduce((sum, flight) => sum + flight.availableSeats, 0);
    const averageLoad = flights.length ? Math.round((soldSeats / Math.max(soldSeats + leftSeats, 1)) * 100) : 0;

    return (
        <div className="hb-stack">
            <PageIntro
                eyebrow="Администрирование"
                title="Обзорный центр системы, а не набор форм"
                body="Администратор видит состояние рейсов, нагрузку, глубину очереди и ключевые показатели системы. Часть карточек уже питается от live-данных, а часть честно помечена как демо-предпросмотр аналитики."
            />

            <div className="hb-metric-grid">
                <MetricCard label="Активные рейсы" value={String(activeFlights.length)} hint="Актуальные данные по списку рейсов." />
                <MetricCard label="Города" value={String(citiesQuery.data?.length ?? 0)} hint="Количество городов в справочнике." />
                <MetricCard label="Аэропорты" value={String(airportsQuery.data?.length ?? 0)} hint="Сколько точек отправления и прибытия доступно." />
                <MetricCard label="Средняя загрузка" value={`${averageLoad}%`} hint="Отношение проданных мест к общему объёму seats." />
            </div>

            <div className="hb-grid hb-grid--3">
                {adminHealthCards.map((card) => (
                    <MetricCard key={card.label} label={card.label} value={card.value} hint={card.hint} />
                ))}
            </div>

            <div className="hb-grid hb-grid--2">
                <Card eyebrow="Нагрузка" title="Предпросмотр live-аналитики">
                    <BarChart items={queueLiveSeries.map((item) => ({ label: item.label, value: item.requests }))} />
                </Card>

                <Card eyebrow="Проблемные рейсы" title="Маршруты, требующие внимания">
                    {flights.length ? (
                        <div className="hb-status-list">
                            {flights
                                .filter((flight) => flight.availableSeats <= 10 || flight.status === "CANCELLED")
                                .slice(0, 5)
                                .map((flight) => (
                                    <div key={flight.flightId} className="hb-status-list__item">
                                        <div>
                                            <strong>
                                                {flight.originCity} {"->"} {flight.destCity}
                                            </strong>
                                            <div className="hb-subtle">
                                                Вылет {formatDateTime(flight.departureTime)} | Осталось мест: {flight.availableSeats}
                                            </div>
                                        </div>
                                        <Badge tone={flight.status === "CANCELLED" ? "error" : "warning"}>{humanizeFlightStatus(flight.status)}</Badge>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="hb-empty">После загрузки live-списка рейсов здесь появятся наиболее чувствительные направления.</div>
                    )}
                </Card>
            </div>

            <Card eyebrow="Последние рейсы" title="Актуальный список для администрирования">
                {flights.length ? (
                    <div className="hb-table-wrap">
                        <table className="hb-table">
                            <thead>
                                <tr>
                                    <th>Маршрут</th>
                                    <th>Вылет</th>
                                    <th>Цена</th>
                                    <th>Продано</th>
                                    <th>Осталось</th>
                                    <th>Статус</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flights.slice(0, 8).map((flight) => (
                                    <tr key={flight.flightId}>
                                        <td>{flight.originCity} {"->"} {flight.destCity}</td>
                                        <td>{formatDateTime(flight.departureTime)}</td>
                                        <td>{formatMoney(flight.price)}</td>
                                        <td>{flight.soldSeats}</td>
                                        <td>{flight.availableSeats}</td>
                                        <td><Badge tone="accent">{humanizeFlightStatus(flight.status)}</Badge></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="hb-empty">Список рейсов загружается. Если данных ещё нет, сначала создайте рейс в разделе управления.</div>
                )}
            </Card>
        </div>
    );
}
