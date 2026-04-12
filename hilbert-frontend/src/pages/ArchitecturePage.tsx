import { useState } from "react";
import { PublicHeader } from "../components/Layout/PublicHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Badge } from "../components/ui/Badge";
import { MetricCard } from "../components/ui/MetricCard";
import { PageIntro } from "../components/ui/PageIntro";
import { BarChart } from "../components/ui/BarChart";
import { Timeline } from "../components/ui/Timeline";
import {
    architectureNodes,
    buildSimulationSnapshot,
    demoRequestTimeline,
    priorityExamples,
    queueLiveSeries,
    queuePhases,
    simulationDefaults
} from "../lib/demo";
import { formatMoney } from "../lib/format";

type ArchitectureTab = "architecture" | "queue" | "priority" | "simulation";

function ArchitectureExperience() {
    const [tab, setTab] = useState<ArchitectureTab>("architecture");
    const [selectedNodeId, setSelectedNodeId] = useState(architectureNodes[0].id);
    const [simulation, setSimulation] = useState(simulationDefaults);
    const [snapshot, setSnapshot] = useState(buildSimulationSnapshot(simulationDefaults));

    const selectedNode = architectureNodes.find((node) => node.id === selectedNodeId) ?? architectureNodes[0];
    const columns = [
        architectureNodes.slice(0, 2),
        architectureNodes.slice(2, 4),
        architectureNodes.slice(4, 6),
        architectureNodes.slice(6, 8),
        architectureNodes.slice(8)
    ];

    return (
        <div className="hb-stack">
            <div className="hb-tabs">
                <button type="button" className={`hb-tab${tab === "architecture" ? " is-active" : ""}`} onClick={() => setTab("architecture")}>
                    Архитектура системы
                </button>
                <button type="button" className={`hb-tab${tab === "queue" ? " is-active" : ""}`} onClick={() => setTab("queue")}>
                    Очередь и обработка
                </button>
                <button type="button" className={`hb-tab${tab === "priority" ? " is-active" : ""}`} onClick={() => setTab("priority")}>
                    Приоритеты пользователей
                </button>
                <button type="button" className={`hb-tab${tab === "simulation" ? " is-active" : ""}`} onClick={() => setTab("simulation")}>
                    Нагрузочный симулятор
                </button>
            </div>

            {tab === "architecture" ? (
                <div className="hb-grid hb-grid--2">
                    <Card
                        eyebrow="Интерактивная карта"
                        title="Архитектура системы"
                        subtitle="Узлы показывают роли сервисов, а справа раскрывается их ответственность в процессе покупки."
                    >
                        <div className="hb-architecture">
                            <div className="hb-architecture__scene">
                                {columns.map((column, index) => (
                                    <div key={index} className="hb-architecture__column">
                                        {column.map((node) => (
                                            <button
                                                key={node.id}
                                                type="button"
                                                className={`hb-node${selectedNodeId === node.id ? " is-active" : ""}`}
                                                onClick={() => setSelectedNodeId(node.id)}
                                            >
                                                <div className="hb-node__tag">{node.tag}</div>
                                                <div className="hb-node__title">{node.title}</div>
                                                <div className="hb-node__text">{node.text}</div>
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <div className="hb-callout">
                                Визуализация работает в demo-first режиме. Realtime-потоки подключаются через отдельные analytics endpoints и SSE.
                            </div>
                        </div>
                    </Card>

                    <div className="hb-stack">
                        <Card eyebrow="Выбранный узел" title={selectedNode.title} subtitle={selectedNode.role}>
                            <div className="hb-stack">
                                <div>
                                    <strong>Что делает сервис</strong>
                                    <div className="hb-muted">{selectedNode.text}</div>
                                </div>
                                <div>
                                    <strong>Какие события принимает</strong>
                                    <div className="hb-inline">
                                        {selectedNode.events.map((event) => (
                                            <Badge key={event} tone="accent">{event}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <strong>Что читает или пишет</strong>
                                    <div className="hb-inline">
                                        {selectedNode.reads.map((item) => (
                                            <Badge key={item} tone="info">{item}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card eyebrow="Жизненный цикл" title="Путь пользовательской заявки">
                            <Timeline items={demoRequestTimeline} />
                        </Card>
                    </div>
                </div>
            ) : null}

            {tab === "queue" ? (
                <div className="hb-stack">
                    <div className="hb-grid hb-grid--3">
                        <MetricCard label="Текущая длина очереди" value="81" hint="Запросы, ожидающие сортировки и распределения." />
                        <MetricCard label="Средняя задержка" value="11.8 с" hint="От приёма заявки до решения по окну." />
                        <MetricCard label="Доля отказов" value="16%" hint="Отказы возникают из-за порога доступных мест, а не из-за oversell." />
                    </div>

                    <div className="hb-grid hb-grid--2">
                        <Card eyebrow="Конвейер обработки" title="Фазы обработки заявки">
                            <div className="hb-status-list">
                                {queuePhases.map((phase) => (
                                    <div key={phase.name} className="hb-status-list__item">
                                        <div>
                                            <strong>{phase.name}</strong>
                                            <div className="hb-subtle">
                                                Сейчас: {phase.current} | Среднее время: {phase.avgTime} | Ошибки: {phase.errorRate}
                                            </div>
                                        </div>
                                        <span className="hb-pill">{phase.processed} обработано</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card eyebrow="Графики" title="Запросы в секунду, задержка и доля успеха">
                            <BarChart
                                items={queueLiveSeries.map((point) => ({
                                    label: point.label,
                                    value: point.requests
                                }))}
                            />
                            <div className="hb-divider" />
                            <BarChart
                                items={queueLiveSeries.map((point) => ({
                                    label: `${point.label} - задержка`,
                                    value: point.latency,
                                    suffix: " с"
                                }))}
                            />
                        </Card>
                    </div>
                </div>
            ) : null}

            {tab === "priority" ? (
                <div className="hb-grid hb-grid--2">
                    <Card
                        eyebrow="Формула приоритета"
                        title="10-факторная модель"
                        subtitle="Пользователи ранжируются по взвешенному баллу. Места выделяются сверху вниз до исчерпания."
                    >
                        <div className="hb-stack">
                            <div className="hb-callout hb-mono" style={{ fontSize: "0.78rem", lineHeight: 1.7 }}>
                                priority =<br />
                                &nbsp;&nbsp;+29.22 × purchase_frequency_score<br />
                                &nbsp;&nbsp;+14.15 × average_order_value_score<br />
                                &nbsp;&nbsp;+11.46 × booking_class_score<br />
                                &nbsp;&nbsp;+11.43 × corporate_contract_score<br />
                                &nbsp;&nbsp;+11.00 × loyalty_status_score<br />
                                &nbsp;&nbsp;−10.50 × cancel_ratio<br />
                                &nbsp;&nbsp; −5.53 × no_show_ratio<br />
                                &nbsp;&nbsp; −2.93 × days_since_last_purchase<br />
                                &nbsp;&nbsp; +2.03 × bonus_balance_score<br />
                                &nbsp;&nbsp; +1.76 × ancillary_services_score
                            </div>
                            <BarChart
                                items={priorityExamples.map((item) => ({
                                    label: item.user,
                                    value: item.priorityScore
                                }))}
                            />
                        </div>
                    </Card>

                    <Card
                        eyebrow="Наглядный пример"
                        title="Итоговая очередь после сортировки"
                        subtitle="Верхняя часть списка получает билеты, нижняя оказывается ниже порога отсечения."
                    >
                        <div className="hb-table-wrap">
                            <table className="hb-table">
                                <thead>
                                    <tr>
                                        <th>Пользователь</th>
                                        <th>Показатель total spend</th>
                                        <th>Запрос</th>
                                        <th>Итог</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {priorityExamples.map((item) => (
                                        <tr key={item.user}>
                                            <td>{item.user}</td>
                                            <td className="hb-mono">{formatMoney(item.totalSpend)}</td>
                                            <td>{item.requestSize} места</td>
                                            <td>
                                                <Badge tone={item.result === "Покупка одобрена" ? "success" : "warning"}>
                                                    {item.result}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            ) : null}

            {tab === "simulation" ? (
                <div className="hb-grid hb-grid--2">
                    <Card
                        eyebrow="Демо-режим"
                        title="Нагрузочный симулятор"
                        subtitle="Задайте параметры и нажмите «Запустить» — система покажет распределение мест, очередь и среднее время решения."
                    >
                        <div className="hb-grid hb-grid--2">
                            <Input
                                label="Число пользователей"
                                type="number"
                                value={simulation.users}
                                onChange={(event) => setSimulation((current) => ({ ...current, users: Number(event.target.value) }))}
                            />
                            <Input
                                label="Число заявок"
                                type="number"
                                value={simulation.requests}
                                onChange={(event) => setSimulation((current) => ({ ...current, requests: Number(event.target.value) }))}
                            />
                            <Input
                                label="Доступные билеты"
                                type="number"
                                value={simulation.seats}
                                onChange={(event) => setSimulation((current) => ({ ...current, seats: Number(event.target.value) }))}
                            />
                            <Input
                                label="Длина окна, сек"
                                type="number"
                                value={simulation.windowSeconds}
                                onChange={(event) => setSimulation((current) => ({ ...current, windowSeconds: Number(event.target.value) }))}
                            />
                            <Input
                                label="Скорость обработки"
                                type="number"
                                value={simulation.processingRate}
                                onChange={(event) => setSimulation((current) => ({ ...current, processingRate: Number(event.target.value) }))}
                            />
                            <Select
                                label="Режим"
                                value={simulation.mode}
                                onChange={(event) =>
                                    setSimulation((current) => ({ ...current, mode: event.target.value as "demo" | "live" }))
                                }
                            >
                                <option value="demo">Демо-режим</option>
                                <option value="live">Live-режим (подготовка UI)</option>
                            </Select>
                        </div>

                        <div className="hb-action-row">
                            <Button onClick={() => setSnapshot(buildSimulationSnapshot(simulation))}>Запустить симуляцию</Button>
                            <Badge tone={simulation.mode === "demo" ? "accent" : "warning"}>
                                {simulation.mode === "demo" ? "Предсказуемый демо-сценарий" : "UI готов к будущему live-endpoint"}
                            </Badge>
                        </div>
                    </Card>

                    <div className="hb-stack">
                        <Card eyebrow="Итог" title="Результат симуляции">
                            <div className="hb-grid hb-grid--3">
                                <MetricCard label="Всего заявок" value={String(snapshot.totalRequests)} />
                                <MetricCard label="Победили" value={String(snapshot.winners)} />
                                <MetricCard label="Отказы" value={String(snapshot.denied)} />
                                <MetricCard label="Медианный total spend" value={formatMoney(snapshot.medianWinnerSpend)} />
                                <MetricCard label="Среднее время решения" value={`${snapshot.avgDecisionSeconds} с`} />
                                <MetricCard label="Oversell" value={String(snapshot.oversellIncidents)} />
                            </div>
                        </Card>

                        <Card eyebrow="Глубина очереди" title="Рост и спад очереди">
                            <BarChart items={snapshot.queueDepth.map((item) => ({ label: item.label, value: item.value }))} />
                        </Card>

                        <Card eyebrow="Победители" title="Верхняя часть победителей">
                            <div className="hb-status-list">
                                {snapshot.topWinners.map((winner) => (
                                    <div key={winner.user} className="hb-status-list__item">
                                        <div>
                                            <strong>{winner.user}</strong>
                                            <div className="hb-subtle">
                                                {formatMoney(winner.totalSpend)} | {winner.tickets} билета
                                            </div>
                                        </div>
                                        <Badge tone="success">Выше порога</Badge>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export function ArchitecturePage() {
    return (
        <div className="hb-stack">
            <PageIntro
                eyebrow="Архитектура и симуляция"
                title="Инженерная карта системы"
                body="Очередь, конкурентное окно, приоритетная сортировка, нагрузочный симулятор."
            />
            <ArchitectureExperience />
        </div>
    );
}

export function PublicArchitecturePage() {
    return (
        <>
            <PublicHeader />
            <main className="hb-public-main">
                <PageIntro
                    eyebrow="Архитектура"
                    title="Интерактивная карта обработки конкурентной покупки"
                    body="Публичная версия страницы позволяет быстро показать проект на защите, собеседовании или в портфолио: как устроены сервисы, где появляется очередь и как принимается объяснимое решение по заявке."
                />
                <ArchitectureExperience />
            </main>
        </>
    );
}
