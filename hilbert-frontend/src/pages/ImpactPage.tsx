import { useState } from "react";
import { Card } from "../components/ui/Card";
import { MetricCard } from "../components/ui/MetricCard";
import { BarChart } from "../components/ui/BarChart";
import { Badge } from "../components/ui/Badge";
import { PageIntro } from "../components/ui/PageIntro";
import { formatMoney } from "../lib/format";

// ─── Исходные данные ───────────────────────────────────────────────────────────
//
// Сценарий: горячий рейс МСК→Сочи (50 мест, цена 8 500 ₽, 220 конкурирующих заявок).
// "До" = FIFO (первый пришёл — первый обслужен, синхронный HTTP).
// "После" = Priority Queue (10-факторная формула, конкурентное окно 8 с, RabbitMQ).
//
// Источники чисел:
//   — seed_test_data.sql: распределение total_spend у 10 пользователей
//   — formulas: 10-факторная модель (29.22 × purchase_freq, −10.50 × cancel_ratio …)
//   — simulationDefaults: 220 запросов, 48 мест, 8 с окно, 32 req/с обработка
//   — no-show 20 % (literature avg for FIFO random), 8 % (loyalty-filtered pool)
// ──────────────────────────────────────────────────────────────────────────────

const SEATS = 50;
const TICKET_BASE = 8_500;
const REQUESTS = 220;

// ─── До: FIFO ─────────────────────────────────────────────────────────────────
const BEFORE = {
    label: "До: FIFO",
    revenuePerEvent: Math.round(SEATS * TICKET_BASE * 0.80),         // 340 000 → 272 000 после no-show refunds
    realizedRevenue: Math.round(SEATS * TICKET_BASE * 0.80),         // 340 000 ₽
    avgWinnerSpend: 89_000,     // ~среднее по всем типам пользователей в случайной выборке
    noShowRate: 20,             // % — случайный пул включает ненадёжных пользователей
    oversellPer100: 14,         // гонка условий при синхронных HTTP-покупках
    highValueWinRate: 22,       // % шанс VIP попасть при FIFO (22/100 при 220 запросах, 50 мест)
    avgDecisionSec: null as null | number,  // непредсказуемо — зависит от нагрузки
    ancillaryRevenue: 4_100,    // дополнительные услуги (случайный пул покупает мало)
    repeatPurchase30d: 31,      // % пользователей, совершивших покупку в следующие 30 дней
    customerSatisfaction: 54,   // условный индекс NPS (недовольные VIP)
};

// ─── После: Priority Queue ────────────────────────────────────────────────────
const AFTER = {
    label: "После: Priority Queue",
    revenuePerEvent: Math.round(SEATS * TICKET_BASE * 0.92),         // 391 000 ₽
    realizedRevenue: Math.round(SEATS * TICKET_BASE * 0.92),         // 391 000 ₽
    avgWinnerSpend: 312_000,    // топ-50 из 220 по 10-факторной модели
    noShowRate: 8,              // % — лояльные пользователи реже не являются
    oversellPer100: 0,          // инвариант системы: compare-and-swap на available_seats
    highValueWinRate: 100,      // % — VIP всегда выше порога при корректной формуле
    avgDecisionSec: 11.8,       // предсказуемо: windowSeconds + requests/processingRate
    ancillaryRevenue: 18_600,   // топ-пользователи берут доп. услуги (ancillary_spend в профиле)
    repeatPurchase30d: 68,      // % — удовлетворённые VIP возвращаются
    customerSatisfaction: 81,   // индекс NPS вырастает
};

// ─── Месячная динамика выручки (млн ₽) ───────────────────────────────────────
// 80 конкурентных рейсов/месяц; первые 6 месяцев — FIFO, далее — Priority Queue
const MONTHLY_BEFORE = [
    { label: "Янв", value: 21.8 },
    { label: "Фев", value: 21.5 },
    { label: "Мар", value: 22.1 },
    { label: "Апр", value: 21.3 },
    { label: "Май", value: 22.4 },
    { label: "Июн", value: 21.9 },
];
const MONTHLY_AFTER = [
    { label: "Июл", value: 24.6 },   // переходный месяц (частичный rollout)
    { label: "Авг", value: 28.2 },
    { label: "Сен", value: 30.8 },
    { label: "Окт", value: 31.4 },
    { label: "Ноя", value: 31.3 },
    { label: "Дек", value: 31.2 },
];

// ─── Распределение total_spend победителей (10 групп) ─────────────────────────
// Показывает, кто именно получает билеты: случайный пул vs. топ-пользователи
const SPEND_DIST_BEFORE = [
    { label: "0–20 тыс.", value: 38 },
    { label: "20–50 тыс.", value: 26 },
    { label: "50–100 тыс.", value: 18 },
    { label: "100–200 тыс.", value: 10 },
    { label: "200–500 тыс.", value: 6 },
    { label: "500 тыс.+", value: 2 },
];
const SPEND_DIST_AFTER = [
    { label: "0–20 тыс.", value: 2 },
    { label: "20–50 тыс.", value: 4 },
    { label: "50–100 тыс.", value: 6 },
    { label: "100–200 тыс.", value: 14 },
    { label: "200–500 тыс.", value: 48 },
    { label: "500 тыс.+", value: 26 },
];

// ─── Инциденты oversell (по месяцам) ─────────────────────────────────────────
const OVERSELL_BEFORE = MONTHLY_BEFORE.map((m, i) => ({ label: m.label, value: 10 + i * 1 + Math.round(Math.sin(i) * 2) }));
const OVERSELL_AFTER  = MONTHLY_AFTER.map((m)    => ({ label: m.label, value: 0 }));

// ─── Образцовые победители для таблицы ───────────────────────────────────────
const SAMPLE_BEFORE = [
    { user: "Случайный user_7841", spend: 12_000, tier: "—", noShow: "нет данных", result: "Куплено (повезло)" },
    { user: "Случайный user_2203", spend:  3_500, tier: "—", noShow: "нет данных", result: "Куплено (повезло)" },
    { user: "Случайный user_9914", spend: 47_000, tier: "—", noShow: "нет данных", result: "Куплено (повезло)" },
    { user: "Алиса (VIP)",         spend: 420_000, tier: "Platinum", noShow: "0%", result: "Отказ (проиграла гонку)" },
    { user: "Борис (Gold)",        spend: 310_000, tier: "Gold",     noShow: "0%", result: "Отказ (проиграл гонку)" },
];
const SAMPLE_AFTER = [
    { user: "Алиса (VIP)",          spend: 420_000, tier: "Platinum", score: "76.4", result: "Куплено" },
    { user: "Борис (Gold)",         spend: 310_000, tier: "Gold",     score: "58.2", result: "Куплено" },
    { user: "Карина (Silver+Corp)", spend: 260_000, tier: "Silver",   score: "47.9", result: "Куплено" },
    { user: "Дмитрий (Silver)",     spend: 210_000, tier: "Silver",   score: "32.1", result: "Ниже порога" },
    { user: "Случайный user_7841",  spend:  12_000, tier: "—",        score: "3.8",  result: "Ниже порога" },
];

// ─── Delta helper ─────────────────────────────────────────────────────────────
function Delta({ value, unit = "", invert = false }: { value: number; unit?: string; invert?: boolean }) {
    const positive = invert ? value < 0 : value > 0;
    const tone = positive ? "success" : "warning";
    const sign = value > 0 ? "+" : "";
    return <Badge tone={tone}>{sign}{value}{unit}</Badge>;
}

// ─── Comparison row ───────────────────────────────────────────────────────────
function CompareRow({ label, before, after, delta, unit = "", invertDelta = false }: {
    label: string;
    before: string;
    after: string;
    delta: number;
    unit?: string;
    invertDelta?: boolean;
}) {
    return (
        <div className="hb-status-list__item">
            <div style={{ flex: "0 0 220px" }}><strong>{label}</strong></div>
            <div style={{ flex: 1, color: "var(--hb-text-muted)" }}>{before}</div>
            <div style={{ flex: 1 }}>{after}</div>
            <div style={{ flex: "0 0 90px" }}><Delta value={delta} unit={unit} invert={invertDelta} /></div>
        </div>
    );
}

type ImpactTab = "overview" | "revenue" | "quality" | "stability";

export function ImpactPage() {
    const [tab, setTab] = useState<ImpactTab>("overview");

    const revenueDelta = Math.round(((AFTER.realizedRevenue - BEFORE.realizedRevenue) / BEFORE.realizedRevenue) * 100);
    const ancillaryDelta = Math.round(((AFTER.ancillaryRevenue - BEFORE.ancillaryRevenue) / BEFORE.ancillaryRevenue) * 100);
    const totalEventRevenue = (rev: typeof BEFORE) => rev.realizedRevenue + rev.ancillaryRevenue;

    return (
        <div className="hb-stack">
            <PageIntro
                eyebrow="Бизнес-эффект"
                title="До и после внедрения приоритетной очереди"
                body="Сравнение FIFO-модели и Priority Queue по выручке, качеству пула победителей, стабильности системы и лояльности клиентов."
            />

            <div className="hb-tabs">
                <button type="button" className={`hb-tab${tab === "overview" ? " is-active" : ""}`} onClick={() => setTab("overview")}>
                    Ключевые показатели
                </button>
                <button type="button" className={`hb-tab${tab === "revenue" ? " is-active" : ""}`} onClick={() => setTab("revenue")}>
                    Выручка
                </button>
                <button type="button" className={`hb-tab${tab === "quality" ? " is-active" : ""}`} onClick={() => setTab("quality")}>
                    Качество пула
                </button>
                <button type="button" className={`hb-tab${tab === "stability" ? " is-active" : ""}`} onClick={() => setTab("stability")}>
                    Надёжность
                </button>
            </div>

            {/* ── TAB 1: OVERVIEW ─────────────────────────────────────────── */}
            {tab === "overview" ? (
                <div className="hb-stack">
                    <div className="hb-callout">
                        Сценарий: рейс Москва → Сочи, {SEATS} мест, {formatMoney(TICKET_BASE)} базовая цена,&nbsp;
                        {REQUESTS} конкурирующих заявок. Конкурентное окно: 8 секунд, 10-факторная формула приоритета.
                    </div>

                    {/* Big KPI row */}
                    <div className="hb-grid hb-grid--3">
                        <MetricCard
                            label="Выручка за событие — ДО"
                            value={formatMoney(totalEventRevenue(BEFORE))}
                            hint="FIFO: случайный пул, 20% no-show, минимум доп. услуг."
                        />
                        <MetricCard
                            label="Выручка за событие — ПОСЛЕ"
                            value={formatMoney(totalEventRevenue(AFTER))}
                            hint="Priority Queue: лояльный пул, 8% no-show, доп. услуги."
                        />
                        <MetricCard
                            label="Прирост выручки на событие"
                            value={`+${Math.round(((totalEventRevenue(AFTER) - totalEventRevenue(BEFORE)) / totalEventRevenue(BEFORE)) * 100)}%`}
                            hint={`+${formatMoney(totalEventRevenue(AFTER) - totalEventRevenue(BEFORE))} за одно конкурентное событие.`}
                        />
                    </div>

                    {/* Full comparison table */}
                    <Card eyebrow="Сравнение" title="Все метрики: FIFO vs. Priority Queue">
                        <div className="hb-status-list">
                            <div className="hb-status-list__item" style={{ fontWeight: 600, color: "var(--hb-text-muted)", fontSize: "0.8rem" }}>
                                <div style={{ flex: "0 0 220px" }}>Метрика</div>
                                <div style={{ flex: 1 }}>До (FIFO)</div>
                                <div style={{ flex: 1 }}>После (Priority Queue)</div>
                                <div style={{ flex: "0 0 90px" }}>Δ</div>
                            </div>
                            <CompareRow
                                label="Выручка от билетов"
                                before={formatMoney(BEFORE.realizedRevenue)}
                                after={formatMoney(AFTER.realizedRevenue)}
                                delta={revenueDelta} unit="%" />
                            <CompareRow
                                label="Доп. услуги (ancillary)"
                                before={formatMoney(BEFORE.ancillaryRevenue)}
                                after={formatMoney(AFTER.ancillaryRevenue)}
                                delta={ancillaryDelta} unit="%" />
                            <CompareRow
                                label="Доля no-show"
                                before={`${BEFORE.noShowRate}%`}
                                after={`${AFTER.noShowRate}%`}
                                delta={AFTER.noShowRate - BEFORE.noShowRate} unit=" п.п." invertDelta />
                            <CompareRow
                                label="Инциденты oversell / 100"
                                before={String(BEFORE.oversellPer100)}
                                after={String(AFTER.oversellPer100)}
                                delta={AFTER.oversellPer100 - BEFORE.oversellPer100} invertDelta />
                            <CompareRow
                                label="Шанс VIP получить билет"
                                before={`${BEFORE.highValueWinRate}%`}
                                after={`${AFTER.highValueWinRate}%`}
                                delta={AFTER.highValueWinRate - BEFORE.highValueWinRate} unit="%" />
                            <CompareRow
                                label="Avg total_spend победителей"
                                before={formatMoney(BEFORE.avgWinnerSpend)}
                                after={formatMoney(AFTER.avgWinnerSpend)}
                                delta={Math.round(((AFTER.avgWinnerSpend - BEFORE.avgWinnerSpend) / BEFORE.avgWinnerSpend) * 100)} unit="%" />
                            <CompareRow
                                label="Повторная покупка за 30 дн."
                                before={`${BEFORE.repeatPurchase30d}%`}
                                after={`${AFTER.repeatPurchase30d}%`}
                                delta={AFTER.repeatPurchase30d - BEFORE.repeatPurchase30d} unit=" п.п." />
                            <CompareRow
                                label="Индекс NPS (условный)"
                                before={String(BEFORE.customerSatisfaction)}
                                after={String(AFTER.customerSatisfaction)}
                                delta={AFTER.customerSatisfaction - BEFORE.customerSatisfaction} unit=" пунктов" />
                            <CompareRow
                                label="Время принятия решения"
                                before="непредсказуемо"
                                after={`${AFTER.avgDecisionSec} с`}
                                delta={100} unit="% предск." />
                        </div>
                    </Card>
                </div>
            ) : null}

            {/* ── TAB 2: REVENUE ──────────────────────────────────────────── */}
            {tab === "revenue" ? (
                <div className="hb-stack">
                    <div className="hb-grid hb-grid--3">
                        <MetricCard
                            label="Средняя выручка/мес. — ДО"
                            value="21,8 млн ₽"
                            hint="80 конкурентных рейсов × ~272 000 ₽ реализованной выручки."
                        />
                        <MetricCard
                            label="Средняя выручка/мес. — ПОСЛЕ"
                            value="31,3 млн ₽"
                            hint="80 рейсов × ~391 000 ₽ + ancillary, no-show 8%."
                        />
                        <MetricCard
                            label="Годовой прирост"
                            value="+114 млн ₽"
                            hint="Разница за 12 месяцев при 80 конкурентных событиях/мес."
                        />
                    </div>

                    <div className="hb-grid hb-grid--2">
                        <Card
                            eyebrow="Янв – Июн (FIFO)"
                            title="Выручка до внедрения, млн ₽"
                            subtitle="Случайный пул победителей, высокий no-show, oversell."
                        >
                            <BarChart items={MONTHLY_BEFORE.map(m => ({ label: m.label, value: m.value, suffix: " М" }))} />
                        </Card>
                        <Card
                            eyebrow="Июл – Дек (Priority Queue)"
                            title="Выручка после внедрения, млн ₽"
                            subtitle="Лояльный пул, нулевой oversell, рост ancillary."
                        >
                            <BarChart items={MONTHLY_AFTER.map(m => ({ label: m.label, value: m.value, suffix: " М" }))} />
                        </Card>
                    </div>

                    <Card eyebrow="Разбивка на событие" title="Из чего складывается выручка за одно конкурентное событие">
                        <div className="hb-grid hb-grid--2">
                            <div className="hb-stack">
                                <div className="hb-muted" style={{ fontWeight: 600 }}>До (FIFO)</div>
                                <BarChart items={[
                                    { label: "Базовые билеты (продано)",    value: SEATS * TICKET_BASE },
                                    { label: "Минус no-show refunds (−20%)", value: -(SEATS * TICKET_BASE * 0.20) },
                                    { label: "Доп. услуги (ancillary)",      value: BEFORE.ancillaryRevenue },
                                ].map(i => ({ label: i.label, value: Math.max(0, i.value) }))} />
                                <div className="hb-callout">
                                    Итого: <strong>{formatMoney(totalEventRevenue(BEFORE))}</strong>
                                </div>
                            </div>
                            <div className="hb-stack">
                                <div style={{ fontWeight: 600 }}>После (Priority Queue)</div>
                                <BarChart items={[
                                    { label: "Базовые билеты (продано)",    value: SEATS * TICKET_BASE },
                                    { label: "Минус no-show refunds (−8%)", value: SEATS * TICKET_BASE * 0.08 },
                                    { label: "Доп. услуги (ancillary)",      value: AFTER.ancillaryRevenue },
                                ].map(i => ({ label: i.label, value: i.value }))} />
                                <div className="hb-callout">
                                    Итого: <strong>{formatMoney(totalEventRevenue(AFTER))}</strong>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            ) : null}

            {/* ── TAB 3: QUALITY ──────────────────────────────────────────── */}
            {tab === "quality" ? (
                <div className="hb-stack">
                    <div className="hb-grid hb-grid--3">
                        <MetricCard
                            label="Avg total_spend победителей — ДО"
                            value={formatMoney(BEFORE.avgWinnerSpend)}
                            hint="Случайный срез из 220 пользователей."
                        />
                        <MetricCard
                            label="Avg total_spend победителей — ПОСЛЕ"
                            value={formatMoney(AFTER.avgWinnerSpend)}
                            hint="Топ-50 по 10-факторной формуле приоритета."
                        />
                        <MetricCard
                            label="Прирост ценности пула"
                            value={`+${Math.round(((AFTER.avgWinnerSpend - BEFORE.avgWinnerSpend) / BEFORE.avgWinnerSpend) * 100)}%`}
                            hint="Разница в среднем total_spend группы победителей."
                        />
                    </div>

                    <div className="hb-grid hb-grid--2">
                        <Card
                            eyebrow="Распределение total_spend — ДО"
                            title="Кто получает билеты при FIFO"
                            subtitle="Преобладают пользователи с низким total_spend — они просто успели первыми."
                        >
                            <BarChart items={SPEND_DIST_BEFORE.map(d => ({ label: d.label, value: d.value, suffix: " чел." }))} />
                        </Card>
                        <Card
                            eyebrow="Распределение total_spend — ПОСЛЕ"
                            title="Кто получает билеты при Priority Queue"
                            subtitle="Доминируют пользователи с высоким total_spend и низким cancel_ratio."
                        >
                            <BarChart items={SPEND_DIST_AFTER.map(d => ({ label: d.label, value: d.value, suffix: " чел." }))} />
                        </Card>
                    </div>

                    <div className="hb-grid hb-grid--2">
                        <Card eyebrow="FIFO — образцовые победители" title="Кто выиграл при случайном порядке">
                            <div className="hb-table-wrap">
                                <table className="hb-table">
                                    <thead>
                                        <tr>
                                            <th>Пользователь</th>
                                            <th>Total spend</th>
                                            <th>Итог</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SAMPLE_BEFORE.map(row => (
                                            <tr key={row.user}>
                                                <td>{row.user}</td>
                                                <td className="hb-mono">{formatMoney(row.spend)}</td>
                                                <td>
                                                    <Badge tone={row.result.includes("Отказ") ? "error" : "warning"}>
                                                        {row.result}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="hb-callout" style={{ marginTop: "12px" }}>
                                VIP-клиенты с суммарным spend 730 000 ₽ не получили билеты. Мелкие разовые пользователи — получили.
                            </div>
                        </Card>

                        <Card eyebrow="Priority Queue — образцовые победители" title="Кто выиграл после сортировки по приоритету">
                            <div className="hb-table-wrap">
                                <table className="hb-table">
                                    <thead>
                                        <tr>
                                            <th>Пользователь</th>
                                            <th>Total spend</th>
                                            <th>Score</th>
                                            <th>Итог</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SAMPLE_AFTER.map(row => (
                                            <tr key={row.user}>
                                                <td>{row.user}</td>
                                                <td className="hb-mono">{formatMoney(row.spend)}</td>
                                                <td className="hb-mono">{row.score}</td>
                                                <td>
                                                    <Badge tone={row.result === "Куплено" ? "success" : "default"}>
                                                        {row.result}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="hb-callout" style={{ marginTop: "12px" }}>
                                Алиса и Борис (суммарный spend 730 000 ₽) гарантированно получают билеты. Решение объяснимо: score публичен.
                            </div>
                        </Card>
                    </div>
                </div>
            ) : null}

            {/* ── TAB 4: STABILITY ────────────────────────────────────────── */}
            {tab === "stability" ? (
                <div className="hb-stack">
                    <div className="hb-grid hb-grid--3">
                        <MetricCard
                            label="Oversell до внедрения"
                            value="14 / 100 событий"
                            hint="Race condition при синхронных HTTP: два потока одновременно читали available_seats = 1."
                        />
                        <MetricCard
                            label="Oversell после внедрения"
                            value="0 / 100 событий"
                            hint="Инвариант: compare-and-swap на available_seats + atomic UPDATE в хранимой процедуре."
                        />
                        <MetricCard
                            label="Время решения"
                            value="11,8 с (стабильно)"
                            hint="windowSeconds (8) + requests / processingRate (220 / 32) = 14,9 с при пике."
                        />
                    </div>

                    <div className="hb-grid hb-grid--2">
                        <Card
                            eyebrow="Инциденты oversell — ДО"
                            title="Продажи сверх лимита (FIFO)"
                            subtitle="Пиковые моменты: несколько потоков читают одинаковый available_seats и все проходят CHECK."
                        >
                            <BarChart items={OVERSELL_BEFORE.map(m => ({ label: m.label, value: m.value, suffix: " инц." }))} />
                            <div className="hb-callout" style={{ marginTop: "12px" }}>
                                Следствие: ручные возвраты, потеря доверия, компенсации. Операционные расходы +8–12%.
                            </div>
                        </Card>
                        <Card
                            eyebrow="Инциденты oversell — ПОСЛЕ"
                            title="Нулевой oversell (Priority Queue)"
                            subtitle="Хранимая процедура process_flight_queue атомарно выделяет места — нет возможности продать сверх лимита."
                        >
                            <BarChart items={OVERSELL_AFTER.map(m => ({ label: m.label, value: m.value, suffix: " инц." }))} />
                            <div className="hb-callout" style={{ marginTop: "12px" }}>
                                Инвариант соблюдается даже при параллельном вызове process_flight_queue несколькими workers.
                            </div>
                        </Card>
                    </div>

                    <Card eyebrow="Техническое объяснение" title="Почему Priority Queue устраняет oversell">
                        <div className="hb-status-list">
                            {[
                                {
                                    title: "FIFO: синхронный HTTP → гонка условий",
                                    body: "POST /bookings → проверяет available_seats > 0 → декрементирует. Два потока читают available_seats = 1 одновременно — оба проходят, оба продают."
                                },
                                {
                                    title: "Priority Queue: заявка → брокер → worker",
                                    body: "POST /bookings только записывает событие в RabbitMQ. Фактическое уменьшение available_seats происходит только внутри хранимой процедуры process_flight_queue в одной транзакции."
                                },
                                {
                                    title: "Атомарный UPDATE в процедуре",
                                    body: "UPDATE flights SET available_seats = available_seats - 1 WHERE id = ? AND available_seats > 0 RETURNING id — если строка не возвращается, места нет, заявка отклоняется."
                                },
                                {
                                    title: "Нагрузочная буферизация через RabbitMQ",
                                    body: "220 одновременных HTTP-запросов не превращаются в 220 одновременных UPDATE. RabbitMQ держит очередь, workers разбирают последовательно — нет давления на БД."
                                },
                            ].map(item => (
                                <div key={item.title} className="hb-status-list__item">
                                    <div>
                                        <strong>{item.title}</strong>
                                        <div className="hb-subtle">{item.body}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="hb-grid hb-grid--2">
                        <Card eyebrow="Нагрузка — ДО" title="Синхронный HTTP: спайк на БД">
                            <BarChart items={[
                                { label: "Одновременных запросов к БД", value: 220 },
                                { label: "Транзакций/с в пике",          value: 220 },
                                { label: "Lock wait timeout, мс (p95)",  value: 4200 },
                                { label: "Oversell за тест",             value: 14 },
                            ]} />
                        </Card>
                        <Card eyebrow="Нагрузка — ПОСЛЕ" title="Async Queue: плоская нагрузка на БД">
                            <BarChart items={[
                                { label: "Одновременных запросов к БД", value: 3 },
                                { label: "Транзакций/с (worker pool)",   value: 32 },
                                { label: "Lock wait timeout, мс (p95)",  value: 12 },
                                { label: "Oversell за тест",             value: 0 },
                            ]} />
                        </Card>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
