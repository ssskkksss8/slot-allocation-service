import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/ui/Card";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { PageIntro } from "../components/ui/PageIntro";
import { flightsApi } from "../api/flights";
import { locationsApi } from "../api/locations";
import { bookingsApi } from "../api/bookings";
import { usersApi } from "../api/users";
import { formatDateTime, formatMoney, getFlightTone, humanizeFlightStatus } from "../lib/format";
import type { FlightSearchResponse } from "../types/dto";

function demandLabel(flight: FlightSearchResponse) {
    if (flight.availableSeats <= 5) return { text: "Высокий спрос", tone: "error" as const };
    if (flight.availableSeats <= 20) return { text: "Спрос растёт", tone: "warning" as const };
    return { text: "Свободное окно", tone: "success" as const };
}

function saleWindowLabel(status: string) {
    switch (status.toUpperCase()) {
        case "BOARDING":
            return "Окно закрывается скоро";
        case "CANCELLED":
            return "Продажа остановлена";
        case "COMPLETED":
            return "Рейс завершён";
        default:
            return "Окно конкурентной покупки открыто";
    }
}

export function SearchFlightsPage() {
    const citiesQuery = useQuery({ queryKey: ["cities"], queryFn: locationsApi.getCities });
    const profileQuery = useQuery({ queryKey: ["me"], queryFn: usersApi.me });

    const [origin, setOrigin] = useState("");
    const [dest, setDest] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [maxPrice, setMaxPrice] = useState("");
    const [onlyAvailable, setOnlyAvailable] = useState(true);
    const [sort, setSort] = useState("time");
    const [searchParams, setSearchParams] = useState<{ origin: string; dest: string; date: string } | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [busyFlightId, setBusyFlightId] = useState<number | null>(null);
    const [selectedFlightId, setSelectedFlightId] = useState<number | null>(null);

    const flightsQuery = useQuery({
        queryKey: ["flights", searchParams],
        enabled: !!searchParams,
        queryFn: async () => {
            if (!searchParams) return [];
            return flightsApi.search(searchParams);
        }
    });

    const flights = [...(flightsQuery.data ?? [])]
        .filter((flight) => (onlyAvailable ? flight.availableSeats > 0 : true))
        .filter((flight) => (maxPrice ? Number(flight.price) <= Number(maxPrice) : true))
        .sort((left, right) => {
            if (sort === "price") return Number(left.price) - Number(right.price);
            if (sort === "availability") return right.availableSeats - left.availableSeats;
            return left.departureTime.localeCompare(right.departureTime);
        });

    const selectedFlight = flights.find((flight) => flight.flightId === selectedFlightId) ?? flights[0] ?? null;

    const handleSearch = () => {
        setMessage(null);
        if (!origin || !dest) {
            setMessage("Выберите город вылета и назначения, чтобы построить сцену покупки.");
            return;
        }
        if (origin === dest) {
            setMessage("Маршрут должен состоять из двух разных городов.");
            return;
        }
        setSearchParams({ origin, dest, date });
    };

    const handleSubmitRequest = async (flightId: number) => {
        setMessage(null);
        setBusyFlightId(flightId);
        try {
            const response = await bookingsApi.createBooking(flightId);
            setMessage(String(response));
        } catch (error: any) {
            setMessage(String(error?.response?.data || error?.message || "Не удалось поставить заявку в очередь."));
        } finally {
            setBusyFlightId(null);
        }
    };

    return (
        <div className="hb-stack">
            <PageIntro
                eyebrow="Поиск рейсов"
                title="Рабочая сцена конкурентной покупки"
                body="Результаты поиска показывают не только маршрут и цену, но и контекст очереди: остаток мест, давление спроса, статус окна продаж и то, как заявка будет обработана после отправки."
            />

            <Card
                eyebrow="Фильтры"
                title="Найти рейс"
                subtitle="Компактная панель для поиска и клиентской фильтрации найденных вариантов."
                actions={<Button variant="secondary" onClick={handleSearch}>Обновить поиск</Button>}
            >
                <div className="hb-grid hb-grid--3">
                    <Select label="Город вылета" value={origin} onChange={(event) => setOrigin(event.target.value)}>
                        <option value="">Выберите город</option>
                        {(citiesQuery.data ?? []).map((city) => (
                            <option key={city.id} value={city.name}>
                                {city.name} ({city.country})
                            </option>
                        ))}
                    </Select>

                    <Select label="Город назначения" value={dest} onChange={(event) => setDest(event.target.value)}>
                        <option value="">Выберите город</option>
                        {(citiesQuery.data ?? []).map((city) => (
                            <option key={city.id} value={city.name}>
                                {city.name} ({city.country})
                            </option>
                        ))}
                    </Select>

                    <Input label="Дата вылета" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                    <Input
                        label="Максимальная цена"
                        type="number"
                        value={maxPrice}
                        onChange={(event) => setMaxPrice(event.target.value)}
                        placeholder="Не ограничивать"
                    />
                    <Select label="Только доступные" value={onlyAvailable ? "yes" : "no"} onChange={(event) => setOnlyAvailable(event.target.value === "yes")}>
                        <option value="yes">Да</option>
                        <option value="no">Показать все</option>
                    </Select>
                    <Select label="Сортировка" value={sort} onChange={(event) => setSort(event.target.value)}>
                        <option value="time">По времени</option>
                        <option value="price">По цене</option>
                        <option value="availability">По доступности</option>
                    </Select>
                </div>

                {message ? <div className="hb-callout">{message}</div> : null}
            </Card>

            <div className="hb-grid hb-grid--2">
                <Card
                    eyebrow="Результаты"
                    title="Список рейсов"
                    subtitle="Каждая карточка показывает маршрут, стоимость, остаток мест и индикатор текущего давления спроса."
                >
                    {flightsQuery.isLoading ? (
                        <div className="hb-stack">
                            <div className="hb-skeleton" />
                            <div className="hb-skeleton" />
                            <div className="hb-skeleton" />
                        </div>
                    ) : null}

                    {!flightsQuery.isLoading && !flights.length ? (
                        <div className="hb-empty">
                            Пока нет результатов. Выполните поиск или ослабьте фильтры, чтобы увидеть доступные маршруты.
                        </div>
                    ) : null}

                    <div className="hb-stack">
                        {flights.map((flight) => {
                            const demand = demandLabel(flight);
                            return (
                                <button
                                    key={flight.flightId}
                                    type="button"
                                    className="hb-flight-card"
                                    onClick={() => setSelectedFlightId(flight.flightId)}
                                >
                                    <div className="hb-flight-card__top">
                                        <div className="hb-flight-card__route">
                                            <div className="hb-inline">
                                                <Badge tone="accent">{flight.flightCode}</Badge>
                                                <Badge tone={getFlightTone(flight.status)}>{humanizeFlightStatus(flight.status)}</Badge>
                                                <Badge tone={demand.tone}>{demand.text}</Badge>
                                            </div>
                                            <div className="hb-flight-card__cities">
                                                <div>
                                                    <div className="hb-flight-card__city">{flight.originCity}</div>
                                                    <div className="hb-flight-card__airport">{flight.originAirport}</div>
                                                </div>
                                                <div className="hb-flight-card__arrow">to</div>
                                                <div>
                                                    <div className="hb-flight-card__city">{flight.destCity}</div>
                                                    <div className="hb-flight-card__airport">{flight.destAirport}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="hb-inline">
                                            <Badge tone="info">{saleWindowLabel(flight.status)}</Badge>
                                        </div>
                                    </div>

                                    <div className="hb-flight-card__meta">
                                        <div className="hb-label-pair">
                                            <div className="hb-label-pair__label">Вылет</div>
                                            <div className="hb-label-pair__value">{formatDateTime(flight.departureTime)}</div>
                                        </div>
                                        <div className="hb-label-pair">
                                            <div className="hb-label-pair__label">Цена</div>
                                            <div className="hb-label-pair__value">{formatMoney(flight.price)}</div>
                                        </div>
                                        <div className="hb-label-pair">
                                            <div className="hb-label-pair__label">Остаток мест</div>
                                            <div className="hb-label-pair__value">{flight.availableSeats}</div>
                                        </div>
                                        <div className="hb-label-pair">
                                            <div className="hb-label-pair__label">Подробнее</div>
                                            <div className="hb-label-pair__value">Открыть сценарий покупки</div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </Card>

                <Card
                    eyebrow="Экран рейса"
                    title={selectedFlight ? `${selectedFlight.originCity} -> ${selectedFlight.destCity}` : "Выберите рейс"}
                    subtitle={
                        selectedFlight
                            ? "Карточка объясняет, как именно система обработает заявку после нажатия на кнопку покупки."
                            : "После выбора рейса здесь появится сценарий покупки и explainability-блок."
                    }
                >
                    {selectedFlight ? (
                        <div className="hb-stack">
                            <div className="hb-flight-card">
                                <div className="hb-flight-card__top">
                                    <div className="hb-flight-card__route">
                                        <div className="hb-inline">
                                            <Badge tone="accent">{selectedFlight.flightCode}</Badge>
                                            <Badge tone={getFlightTone(selectedFlight.status)}>{humanizeFlightStatus(selectedFlight.status)}</Badge>
                                        </div>
                                        <div className="hb-flight-card__cities">
                                            <div>
                                                <div className="hb-flight-card__city">{selectedFlight.originCity}</div>
                                                <div className="hb-flight-card__airport">{selectedFlight.originAirport}</div>
                                            </div>
                                            <div className="hb-flight-card__arrow">to</div>
                                            <div>
                                                <div className="hb-flight-card__city">{selectedFlight.destCity}</div>
                                                <div className="hb-flight-card__airport">{selectedFlight.destAirport}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="hb-label-pair">
                                        <div className="hb-label-pair__label">Ваш показатель total spend</div>
                                        <div className="hb-label-pair__value">{formatMoney(profileQuery.data?.totalSpend)}</div>
                                    </div>
                                </div>

                                <div className="hb-flight-card__meta">
                                    <div className="hb-label-pair">
                                        <div className="hb-label-pair__label">Стоимость</div>
                                        <div className="hb-label-pair__value">{formatMoney(selectedFlight.price)}</div>
                                    </div>
                                    <div className="hb-label-pair">
                                        <div className="hb-label-pair__label">Доступно мест</div>
                                        <div className="hb-label-pair__value">{selectedFlight.availableSeats}</div>
                                    </div>
                                    <div className="hb-label-pair">
                                        <div className="hb-label-pair__label">Ограничение аккаунта</div>
                                        <div className="hb-label-pair__value">До 6 билетов по продуктовой модели</div>
                                    </div>
                                    <div className="hb-label-pair">
                                        <div className="hb-label-pair__label">Текущее live API</div>
                                        <div className="hb-label-pair__value">1 заявка = 1 билет</div>
                                    </div>
                                </div>
                            </div>

                            <div className="hb-priority-note">
                                <strong>Как будет принята заявка</strong>
                                <div>
                                    При высокой конкуренции запрос уходит в очередь, участвует в конкурентном окне 5-10 секунд и затем сортируется по
                                    total spend. Высокий total spend поднимает позицию в очереди, но не гарантирует место заранее.
                                </div>
                            </div>

                            <div className="hb-pipeline__row">
                                {[
                                    "Заявка принята",
                                    "Помещена в очередь",
                                    "Приоритет рассчитан",
                                    "Заявка обработана",
                                    "Результат отправлен"
                                ].map((step, index) => (
                                    <div key={step} className="hb-step">
                                        <div className="hb-step__index">{index + 1}</div>
                                        <div className="hb-step__title">{step}</div>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={() => handleSubmitRequest(selectedFlight.flightId)}
                                disabled={selectedFlight.availableSeats <= 0 || busyFlightId === selectedFlight.flightId}
                            >
                                {busyFlightId === selectedFlight.flightId ? "Отправляем заявку..." : "Отправить в приоритетную обработку"}
                            </Button>
                        </div>
                    ) : (
                        <div className="hb-empty">
                            Выберите карточку слева, чтобы открыть экран рейса, посмотреть механизм обработки и отправить заявку.
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
