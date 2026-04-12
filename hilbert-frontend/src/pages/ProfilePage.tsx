import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api/users";
import { ticketsApi } from "../api/tickets";
import { bookingsApi } from "../api/bookings";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { MetricCard } from "../components/ui/MetricCard";
import { PageIntro } from "../components/ui/PageIntro";
import { BarChart } from "../components/ui/BarChart";
import { formatMoney, humanizeRole } from "../lib/format";

function buildSpendBars(totalSpend: number) {
    const values = [0.12, 0.18, 0.16, 0.22, 0.14, 0.18];
    const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"];
    return months.map((month, index) => ({
        label: month,
        value: Math.round(totalSpend * values[index])
    }));
}

export function ProfilePage() {
    const queryClient = useQueryClient();
    const profileQuery = useQuery({ queryKey: ["me"], queryFn: usersApi.me });
    const bookingsQuery = useQuery({ queryKey: ["bookings"], queryFn: bookingsApi.my });
    const ticketsQuery = useQuery({ queryKey: ["tickets"], queryFn: ticketsApi.my });

    const [amount, setAmount] = useState("10000");
    const [busy, setBusy] = useState(false);
    const [info, setInfo] = useState<string | null>(null);

    const profile = profileQuery.data;
    const requests = bookingsQuery.data ?? [];
    const tickets = ticketsQuery.data ?? [];
    const approvedRequests = requests.filter((request) => request.status === "APPROVED").length;
    const successRate = requests.length ? Math.round((approvedRequests / requests.length) * 100) : 0;
    const totalSpendNumber = Number(profile?.totalSpend ?? 0);

    const handleDeposit = async () => {
        setBusy(true);
        setInfo(null);
        try {
            const response = await usersApi.deposit(amount);
            setInfo(String(response));
            await queryClient.invalidateQueries({ queryKey: ["me"] });
        } catch (error: any) {
            setInfo(String(error?.response?.data || error?.message || "Не удалось выполнить demo-пополнение."));
        } finally {
            setBusy(false);
        }
    };

    const handlePromote = async () => {
        setBusy(true);
        setInfo(null);
        try {
            const response = await usersApi.promoteMe();
            setInfo(String(response));
        } catch (error: any) {
            setInfo(String(error?.response?.data || error?.message || "Не удалось обновить роль."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="hb-stack">
            <PageIntro
                eyebrow="Профиль"
                title="Ваш приоритетный счёт"
                body="Баланс, total spend и факторы, определяющие позицию в конкурентной очереди."
            />

            <div className="hb-metric-grid">
                <MetricCard label="Баланс" value={formatMoney(profile?.balance)} hint="Текущие средства: депозит − покупки + возвраты." />
                <MetricCard label="Total spend" value={formatMoney(profile?.totalSpend)} hint="Суммарные покупки — фактор приоритета." />
                <MetricCard label="Купленные билеты" value={String(tickets.length)} hint="Итоговые покупки, подтверждённые системой." />
                <MetricCard label="Доля успеха" value={`${successRate}%`} hint="Процент заявок выше порога отсечения." />
            </div>

            <div className="hb-grid hb-grid--2">
                <Card eyebrow="Пользователь" title={profile ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || profile.email : "Загрузка профиля"}>
                    {profile ? (
                        <div className="hb-stack">
                            <div><strong>Email:</strong> {profile.email}</div>
                            <div><strong>Роли:</strong> {profile.roles.map(humanizeRole).join(", ")}</div>
                            <div><strong>Баланс:</strong> {formatMoney(profile.balance)}</div>
                            <div><strong>Total spend:</strong> {formatMoney(profile.totalSpend)}</div>
                        </div>
                    ) : (
                        <div className="hb-skeleton" />
                    )}
                </Card>

                <Card eyebrow="История трат" title="Динамика total spend">
                    <BarChart items={buildSpendBars(totalSpendNumber)} />
                </Card>
            </div>

            <div className="hb-grid hb-grid--2">
                <Card
                    eyebrow="Explainability"
                    title="Формула приоритета (10 факторов)"
                    subtitle="Итоговый балл определяет место в очереди внутри конкурентного окна."
                >
                    <div className="hb-status-list">
                        {[
                            { w: "+29.22", label: "Частота покупок", hint: "Число покупок за последние 12 мес. / 20" },
                            { w: "+14.15", label: "Средний чек", hint: "Средняя сумма покупки / 50 000 ₽" },
                            { w: "+11.46", label: "Класс бронирования", hint: "Эконом / бизнес / первый класс" },
                            { w: "+11.43", label: "Корпоративный договор", hint: "1.0 если есть договор, иначе 0" },
                            { w: "+11.00", label: "Статус лояльности", hint: "Уровень 0–3 / 3 (none/silver/gold/platinum)" },
                            { w: "−10.50", label: "Доля отмен", hint: "Отменённые заявки / все заявки" },
                            { w: "−5.53",  label: "Доля no-show", hint: "Неявки / все заявки" },
                            { w: "−2.93",  label: "Дней с последней покупки", hint: "Дней / 365 (чем больше — тем хуже)" },
                            { w: "+2.03",  label: "Бонусный баланс", hint: "Текущий баланс / 100 000 ₽" },
                            { w: "+1.76",  label: "Доп. услуги", hint: "Траты на доп. услуги / 5 000 ₽" },
                        ].map((f) => (
                            <div key={f.label} className="hb-status-list__item">
                                <div>
                                    <strong>{f.label}</strong>
                                    <div className="hb-subtle">{f.hint}</div>
                                </div>
                                <span className="hb-pill hb-mono">{f.w}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card
                    eyebrow="Демо-инструменты"
                    title="Вспомогательные функции для демонстрации"
                    subtitle="Баланс и повышение роли сохранены как вспомогательные инструменты, но больше не доминируют в профиле."
                >
                    <div className="hb-stack">
                        <Input label="Демо-пополнение" value={amount} onChange={(event) => setAmount(event.target.value)} />
                        <div className="hb-action-row">
                            <Button onClick={handleDeposit} disabled={busy}>Пополнить</Button>
                            <Button variant="secondary" onClick={handlePromote} disabled={busy}>Сделать admin для теста</Button>
                        </div>
                        {info ? <div className="hb-callout">{info}</div> : null}
                    </div>
                </Card>
            </div>
        </div>
    );
}
