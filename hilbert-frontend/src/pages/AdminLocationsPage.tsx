import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { locationsApi } from "../api/locations";
import { authStore } from "../store/authStore";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { PageIntro } from "../components/ui/PageIntro";

export function AdminLocationsPage() {
    const isAdmin = authStore((s) => s.isAdmin());
    const queryClient = useQueryClient();

    const citiesQuery = useQuery({ queryKey: ["cities"], queryFn: locationsApi.getCities, enabled: isAdmin });
    const airportsQuery = useQuery({ queryKey: ["airports"], queryFn: locationsApi.getAirports, enabled: isAdmin });

    const [cityName, setCityName] = useState("");
    const [country, setCountry] = useState("");
    const [timezone, setTimezone] = useState("");
    const [airportName, setAirportName] = useState("");
    const [cityId, setCityId] = useState("");
    const [filter, setFilter] = useState("");
    const [feedback, setFeedback] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    if (!isAdmin) {
        return (
            <Card eyebrow="Администрирование" title="Доступ ограничен">
                Этот раздел требует роль ADMIN.
            </Card>
        );
    }

    const filteredCities = (citiesQuery.data ?? []).filter((city) => {
        const haystack = `${city.name} ${city.country} ${city.timezone ?? ""}`.toLowerCase();
        return haystack.includes(filter.toLowerCase());
    });

    const filteredAirports = (airportsQuery.data ?? []).filter((airport) => {
        const haystack = `${airport.name} ${airport.cityName} ${airport.country}`.toLowerCase();
        return haystack.includes(filter.toLowerCase());
    });

    const createCity = async () => {
        setBusy(true);
        setFeedback(null);
        try {
            await locationsApi.createCity({ name: cityName, country, timezone: timezone || undefined });
            setFeedback("Город создан.");
            setCityName("");
            setCountry("");
            setTimezone("");
            await queryClient.invalidateQueries({ queryKey: ["cities"] });
        } catch (error: any) {
            setFeedback(String(error?.response?.data || error?.message || "Не удалось создать город."));
        } finally {
            setBusy(false);
        }
    };

    const createAirport = async () => {
        setBusy(true);
        setFeedback(null);
        try {
            await locationsApi.createAirport({ cityId: Number(cityId), name: airportName });
            setFeedback("Аэропорт создан.");
            setAirportName("");
            setCityId("");
            await queryClient.invalidateQueries({ queryKey: ["airports"] });
        } catch (error: any) {
            setFeedback(String(error?.response?.data || error?.message || "Не удалось создать аэропорт."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="hb-stack">
            <PageIntro
                eyebrow="Администрирование / Локации"
                title="Справочник городов и аэропортов"
                body="Локации больше не выглядят как две тяжёлые формы на одном экране. Новый раздел сочетает поиск по каталогу и создание новых сущностей в понятном контексте."
            />

            <div className="hb-grid hb-grid--2">
                <Card eyebrow="Каталог" title="Поиск по справочнику">
                    <Input label="Фильтр" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Город, страна или аэропорт" />

                    <div className="hb-grid hb-grid--2">
                        <div className="hb-stack">
                            <strong>Города</strong>
                            <div className="hb-status-list">
                                {filteredCities.map((city) => (
                                    <div key={city.id} className="hb-status-list__item">
                                        <div>
                                            <strong>{city.name}</strong>
                                            <div className="hb-subtle">
                                                {city.country}
                                                {city.timezone ? ` | ${city.timezone}` : ""}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="hb-stack">
                            <strong>Аэропорты</strong>
                            <div className="hb-status-list">
                                {filteredAirports.map((airport) => (
                                    <div key={airport.id} className="hb-status-list__item">
                                        <div>
                                            <strong>{airport.name}</strong>
                                            <div className="hb-subtle">
                                                {airport.cityName} | {airport.country}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="hb-stack">
                    <Card eyebrow="Создание" title="Новый город">
                        <div className="hb-grid hb-grid--2">
                            <Input label="Название города" value={cityName} onChange={(event) => setCityName(event.target.value)} />
                            <Input label="Страна" value={country} onChange={(event) => setCountry(event.target.value)} />
                            <Input label="Часовой пояс" value={timezone} onChange={(event) => setTimezone(event.target.value)} />
                        </div>
                        <Button onClick={createCity} disabled={busy}>Создать город</Button>
                    </Card>

                    <Card eyebrow="Создание" title="Новый аэропорт">
                        <div className="hb-grid hb-grid--2">
                            <Select label="Город" value={cityId} onChange={(event) => setCityId(event.target.value)}>
                                <option value="">Выберите город</option>
                                {(citiesQuery.data ?? []).map((city) => (
                                    <option key={city.id} value={city.id}>
                                        {city.name} ({city.country})
                                    </option>
                                ))}
                            </Select>
                            <Input label="Название аэропорта" value={airportName} onChange={(event) => setAirportName(event.target.value)} />
                        </div>
                        <Button onClick={createAirport} disabled={busy}>Создать аэропорт</Button>
                    </Card>
                </div>
            </div>

            {feedback ? <div className="hb-callout">{feedback}</div> : null}
        </div>
    );
}
