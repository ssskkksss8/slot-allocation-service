import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { flightsApi } from "../api/flights";
import { locationsApi } from "../api/locations";
import { authStore } from "../store/authStore";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { Badge } from "../components/ui/Badge";
import { PageIntro } from "../components/ui/PageIntro";
import { formatDateTime, formatMoney, getFlightTone, humanizeFlightStatus } from "../lib/format";

function normalizeLocalDateTime(value: string) {
    if (!value) return value;
    return value.length === 16 ? `${value}:00` : value;
}

export function AdminFlightsPage() {
    const isAdmin = authStore((s) => s.isAdmin());
    const queryClient = useQueryClient();

    const flightsQuery = useQuery({ queryKey: ["admin-flights"], queryFn: flightsApi.adminList, enabled: isAdmin });
    const airportsQuery = useQuery({ queryKey: ["airports"], queryFn: locationsApi.getAirports, enabled: isAdmin });

    const [selectedFlightId, setSelectedFlightId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [routeFilter, setRouteFilter] = useState("");
    const [originAirportId, setOriginAirportId] = useState("");
    const [destinationAirportId, setDestinationAirportId] = useState("");
    const [departureTime, setDepartureTime] = useState("");
    const [arrivalTime, setArrivalTime] = useState("");
    const [price, setPrice] = useState("25000");
    const [totalSeats, setTotalSeats] = useState("120");
    const [cancelReason, setCancelReason] = useState("Operational reasons");
    const [feedback, setFeedback] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const statsQuery = useQuery({
        queryKey: ["flight-stats", selectedFlightId],
        enabled: !!selectedFlightId,
        queryFn: () => flightsApi.stats(selectedFlightId as number)
    });

    useEffect(() => {
        if (!selectedFlightId && flightsQuery.data?.length) {
            setSelectedFlightId(flightsQuery.data[0].flightId);
        }
    }, [flightsQuery.data, selectedFlightId]);

    if (!isAdmin) {
        return (
            <Card eyebrow="Администрирование" title="Доступ ограничен">
                Этот раздел требует роль ADMIN.
            </Card>
        );
    }

    const flights = (flightsQuery.data ?? []).filter((flight) => {
        if (statusFilter !== "all" && flight.status !== statusFilter) return false;
        if (routeFilter) {
            const haystack = `${flight.originCity} ${flight.destCity} ${flight.originAirport} ${flight.destAirport}`.toLowerCase();
            if (!haystack.includes(routeFilter.toLowerCase())) return false;
        }
        return true;
    });

    const selectedFlight = flightsQuery.data?.find((flight) => flight.flightId === selectedFlightId) ?? null;

    const createFlight = async () => {
        setBusy(true);
        setFeedback(null);
        try {
            const flightId = await flightsApi.create({
                originAirportId: Number(originAirportId),
                destinationAirportId: Number(destinationAirportId),
                departureTime: normalizeLocalDateTime(departureTime),
                arrivalTime: normalizeLocalDateTime(arrivalTime),
                price,
                totalSeats: Number(totalSeats)
            });
            setFeedback(`Рейс создан. ID: ${flightId}`);
            await queryClient.invalidateQueries({ queryKey: ["admin-flights"] });
        } catch (error: any) {
            setFeedback(String(error?.response?.data || error?.message || "Не удалось создать рейс."));
        } finally {
            setBusy(false);
        }
    };

    const cancelFlight = async () => {
        if (!selectedFlightId) return;
        setBusy(true);
        setFeedback(null);
        try {
            await flightsApi.cancel(selectedFlightId, cancelReason);
            setFeedback("Рейс отменён.");
            await queryClient.invalidateQueries({ queryKey: ["admin-flights"] });
            await queryClient.invalidateQueries({ queryKey: ["flight-stats", selectedFlightId] });
        } catch (error: any) {
            setFeedback(String(error?.response?.data || error?.message || "Не удалось отменить рейс."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="hb-stack">
            <PageIntro
                eyebrow="Администрирование / Рейсы"
                title="Управление рейсами с контекстом, списком и последствиями"
                body="Раздел сочетает live-список рейсов, создание новых маршрутов и отдельный блок с последствиями отмены: сколько мест продано, сколько пользователей затронуто и в каком статусе находится рейс."
            />

            <div className="hb-grid hb-grid--2">
                <Card eyebrow="Реестр рейсов" title="Список и фильтры">
                    <div className="hb-grid hb-grid--2">
                        <Input label="Поиск по маршруту" value={routeFilter} onChange={(event) => setRouteFilter(event.target.value)} />
                        <Select label="Статус" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                            <option value="all">Все</option>
                            <option value="SCHEDULED">Запланирован</option>
                            <option value="BOARDING">Посадка</option>
                            <option value="COMPLETED">Завершён</option>
                            <option value="CANCELLED">Отменён</option>
                        </Select>
                    </div>

                    {flights.length ? (
                        <div className="hb-status-list">
                            {flights.map((flight) => (
                                <button
                                    key={flight.flightId}
                                    type="button"
                                    className="hb-status-list__item"
                                    onClick={() => setSelectedFlightId(flight.flightId)}
                                >
                                    <div>
                                        <strong>
                                            {flight.originCity} {"->"} {flight.destCity}
                                        </strong>
                                        <div className="hb-subtle">
                                            {formatDateTime(flight.departureTime)} | {formatMoney(flight.price)} | продано {flight.soldSeats} / осталось {flight.availableSeats}
                                        </div>
                                    </div>
                                    <Badge tone={getFlightTone(flight.status)}>{humanizeFlightStatus(flight.status)}</Badge>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="hb-empty">Рейсы не найдены. Измените фильтры или создайте новый маршрут.</div>
                    )}
                </Card>

                <div className="hb-stack">
                    <Card eyebrow="Создание" title="Новый рейс">
                        <div className="hb-grid hb-grid--2">
                            <Select label="Аэропорт вылета" value={originAirportId} onChange={(event) => setOriginAirportId(event.target.value)}>
                                <option value="">Выберите</option>
                                {(airportsQuery.data ?? []).map((airport) => (
                                    <option key={airport.id} value={airport.id}>
                                        {airport.name} - {airport.cityName}
                                    </option>
                                ))}
                            </Select>
                            <Select label="Аэропорт назначения" value={destinationAirportId} onChange={(event) => setDestinationAirportId(event.target.value)}>
                                <option value="">Выберите</option>
                                {(airportsQuery.data ?? []).map((airport) => (
                                    <option key={airport.id} value={airport.id}>
                                        {airport.name} - {airport.cityName}
                                    </option>
                                ))}
                            </Select>
                            <Input label="Вылет" type="datetime-local" value={departureTime} onChange={(event) => setDepartureTime(event.target.value)} />
                            <Input label="Прилёт" type="datetime-local" value={arrivalTime} onChange={(event) => setArrivalTime(event.target.value)} />
                            <Input label="Цена" value={price} onChange={(event) => setPrice(event.target.value)} />
                            <Input label="Всего мест" value={totalSeats} onChange={(event) => setTotalSeats(event.target.value)} />
                        </div>
                        <Button onClick={createFlight} disabled={busy}>Создать рейс</Button>
                    </Card>

                    <Card
                        eyebrow="Детали выбранного рейса"
                        title={selectedFlight ? `${selectedFlight.originCity} -> ${selectedFlight.destCity}` : "Выберите рейс"}
                        subtitle="Блок показывает статистику по маршруту и помогает принять решение об отмене."
                    >
                        {selectedFlight ? (
                            <div className="hb-stack">
                                <div className="hb-grid hb-grid--3">
                                    <div className="hb-label-pair">
                                        <div className="hb-label-pair__label">Статус</div>
                                        <div className="hb-label-pair__value"><Badge tone={getFlightTone(selectedFlight.status)}>{humanizeFlightStatus(selectedFlight.status)}</Badge></div>
                                    </div>
                                    <div className="hb-label-pair">
                                        <div className="hb-label-pair__label">Цена</div>
                                        <div className="hb-label-pair__value">{formatMoney(selectedFlight.price)}</div>
                                    </div>
                                    <div className="hb-label-pair">
                                        <div className="hb-label-pair__label">Вылет</div>
                                        <div className="hb-label-pair__value">{formatDateTime(selectedFlight.departureTime)}</div>
                                    </div>
                                </div>

                                {statsQuery.data ? (
                                    <div className="hb-callout">
                                        Продано билетов: <strong>{statsQuery.data.soldCount}</strong>
                                        <br />
                                        Осталось мест: <strong>{statsQuery.data.availableSeats}</strong>
                                        <br />
                                        Потенциальный возврат затронет как минимум количество уже проданных билетов.
                                    </div>
                                ) : null}

                                <Textarea
                                    label="Причина отмены"
                                    value={cancelReason}
                                    onChange={(event) => setCancelReason(event.target.value)}
                                    hint="Эта причина пойдёт в backend и будет использована для обработки отмены."
                                />
                                <Button variant="danger" onClick={cancelFlight} disabled={busy || selectedFlight.status === "CANCELLED"}>
                                    Отменить рейс
                                </Button>
                            </div>
                        ) : (
                            <div className="hb-empty">Выберите рейс слева, чтобы открыть статистику и действия администратора.</div>
                        )}
                    </Card>
                </div>
            </div>

            {feedback ? <div className="hb-callout">{feedback}</div> : null}
        </div>
    );
}
