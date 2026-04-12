import { Link } from "react-router-dom";
import { PublicHeader } from "../components/Layout/PublicHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { MetricCard } from "../components/ui/MetricCard";
import { BarChart } from "../components/ui/BarChart";
import { landingMetrics, heroSteps, architectureNodes, queueLiveSeries } from "../lib/demo";
import { authStore } from "../store/authStore";

export function LandingPage() {
    const token = authStore((s) => s.token);
    const primaryLink = token ? "/app/search" : "/auth";

    return (
        <>
            <PublicHeader />
            <main className="hb-public-main">
                <section className="hb-hero" id="product">
                    <div className="hb-hero__grid">
                        <div className="hb-hero__headline">
                            <div className="hb-kicker">Сервис конкурентной покупки билетов</div>
                            <h1 className="hb-display">
                                Покупка билетов без oversell, с очередью, приоритетом и объяснимым результатом.
                            </h1>
                            <p className="hb-lead">
                                Priority Booking показывает не только пользовательский сценарий покупки, но и инженерную механику
                                распределения ограниченного ресурса. Заявки собираются в конкурентное окно, сортируются по
                                total spend и проходят через очередь с предсказуемой обработкой.
                            </p>
                            <div className="hb-action-row">
                                <Link to={primaryLink}>
                                    <Button>Найти рейс</Button>
                                </Link>
                                <Link to="/architecture">
                                    <Button variant="secondary">Посмотреть архитектуру</Button>
                                </Link>
                                <Link to={token ? "/app/architecture" : "/architecture"}>
                                    <Button variant="ghost">Запустить симуляцию нагрузки</Button>
                                </Link>
                            </div>
                        </div>

                        <div className="hb-stack">
                            <Card
                                eyebrow="Ключевая механика"
                                title="Как работает приоритетная обработка"
                                subtitle="Пользователь видит не просто кнопку покупки, а прозрачный жизненный цикл заявки."
                            >
                                <div className="hb-pipeline">
                                    {heroSteps.slice(0, 4).map((step, index) => (
                                        <div key={step.title} className="hb-step">
                                            <div className="hb-step__index">{index + 1}</div>
                                            <div className="hb-step__title">{step.title}</div>
                                            <div className="hb-step__body">{step.body}</div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="hb-metric-grid">
                        {landingMetrics.map((metric) => (
                            <MetricCard key={metric.label} {...metric} />
                        ))}
                    </div>
                </section>

                <section className="hb-public-section" id="how-it-works">
                    <div className="hb-page-intro">
                        <div className="hb-page-intro__eyebrow">Инженерная идея проекта</div>
                        <h2 className="hb-page-intro__title">Новый интерфейс объясняет систему за 10-15 секунд</h2>
                        <div className="hb-page-intro__body">
                            Здесь пользователь быстро понимает, что перед ним не обычная витрина авиабилетов, а демонстрация
                            справедливого распределения мест в условиях конкурентной нагрузки.
                        </div>
                    </div>

                    <div className="hb-grid hb-grid--2">
                        <Card eyebrow="4 шага" title="Как проходит конкурентная покупка">
                            <div className="hb-pipeline">
                                {heroSteps.map((step, index) => (
                                    <div key={step.title} className="hb-step">
                                        <div className="hb-step__index">{index + 1}</div>
                                        <div className="hb-step__title">{step.title}</div>
                                        <div className="hb-step__body">{step.body}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card
                            eyebrow="Архитектура"
                            title="Мини-превью карты системы"
                            subtitle="Очередь, worker pool, база данных и уведомления показаны как единый поток обработки."
                            actions={
                                <Link to="/architecture">
                                    <Button variant="secondary" size="small">Полная карта</Button>
                                </Link>
                            }
                        >
                            <div className="hb-status-list">
                                {architectureNodes.slice(0, 5).map((node) => (
                                    <div key={node.id} className="hb-status-list__item">
                                        <div>
                                            <strong>{node.title}</strong>
                                            <div className="hb-subtle">{node.text}</div>
                                        </div>
                                        <span className="hb-pill">{node.tag}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </section>

                <section className="hb-public-section">
                    <div className="hb-grid hb-grid--2">
                        <Card
                            eyebrow="Предпросмотр нагрузки"
                            title="Нагрузка и задержка"
                            subtitle="Предпросмотр того, как система ведёт себя внутри конкурентного окна."
                        >
                            <BarChart
                                items={queueLiveSeries.map((item) => ({
                                    label: `${item.label} - запросы`,
                                    value: item.requests
                                }))}
                            />
                        </Card>

                        <Card
                            eyebrow="Почему это серьёзная инженерная работа"
                            title="Очередь, консистентность и наблюдаемость"
                            subtitle="Интерфейс подчёркивает те части системы, которые обычно скрыты от пользователя."
                        >
                            <div className="hb-status-list">
                                <div className="hb-status-list__item">
                                    <div>
                                        <strong>Очередь и брокер</strong>
                                        <div className="hb-subtle">Пики нагрузки сглаживаются через асинхронную обработку.</div>
                                    </div>
                                </div>
                                <div className="hb-status-list__item">
                                    <div>
                                        <strong>Строгая консистентность продажи</strong>
                                        <div className="hb-subtle">Распределение мест не допускает oversell даже при конкурентной покупке.</div>
                                    </div>
                                </div>
                                <div className="hb-status-list__item">
                                    <div>
                                        <strong>Наблюдаемость и объяснимость</strong>
                                        <div className="hb-subtle">Пользователь видит этапы обработки, а администратор - KPI и проблемные зоны.</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </section>
            </main>
        </>
    );
}
