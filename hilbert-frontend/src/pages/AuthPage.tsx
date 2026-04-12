import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { authStore } from "../store/authStore";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { landingMetrics } from "../lib/demo";
import { MetricCard } from "../components/ui/MetricCard";

export function AuthPage() {
    const navigate = useNavigate();
    const setToken = authStore((s) => s.setToken);
    const loadProfile = authStore((s) => s.loadProfile);

    const [tab, setTab] = useState<"login" | "register">("login");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");


    const handleSubmit = async () => {
        setBusy(true);
        setError(null);
        try {
            const response =
                tab === "login"
                    ? await authApi.login({ email: loginEmail.trim(), password: loginPassword })
                    : await authApi.register({
                          email: registerEmail.trim(),
                          password: registerPassword,
                          firstName: firstName || undefined,
                          lastName: lastName || undefined
                      });

            setToken(response.token);
            await loadProfile();
            navigate("/app", { replace: true });
        } catch (submissionError: any) {
            setError(String(submissionError?.response?.data || submissionError?.message || "Не удалось выполнить вход."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="hb-auth">
            <section className="hb-auth__showcase">
                <div className="hb-stack">
                    <div className="hb-brand-mark">
                        <div className="hb-brand-copy">
                            <div className="hb-brand-title">Priority Booking</div>
                            <div className="hb-brand-subtitle">Технологическая демонстрация справедливого распределения билетов</div>
                        </div>
                    </div>

                    <div className="hb-kicker">Вход в систему</div>
                    <h1 className="hb-display">Priority Booking — конкурентная покупка билетов с приоритетной очередью.</h1>
                    <p className="hb-lead">
                        После входа доступны: поиск рейсов, отправка заявок, просмотр баланса, total spend и симулятор нагрузки.
                    </p>

                    <div className="hb-metric-grid">
                        {landingMetrics.map((metric) => (
                            <MetricCard key={metric.label} {...metric} />
                        ))}
                    </div>

                    <div className="hb-action-row">
                        <Link to="/">
                            <Button variant="secondary">На главную</Button>
                        </Link>
                        <Link to="/architecture">
                            <Button variant="ghost">Архитектура и симуляция</Button>
                        </Link>
                    </div>
                </div>
            </section>

            <aside className="hb-auth__panel">
                <Card
                    eyebrow="Доступ"
                    title={tab === "login" ? "Вход" : "Регистрация"}
                    subtitle="Один экран для входа в пользовательский или административный сценарий."
                >
                    <div className="hb-segmented">
                        <button type="button" className={tab === "login" ? "is-active" : ""} onClick={() => setTab("login")}>
                            Вход
                        </button>
                        <button type="button" className={tab === "register" ? "is-active" : ""} onClick={() => setTab("register")}>
                            Регистрация
                        </button>
                    </div>

                    <div className="hb-stack">
                        {tab === "login" ? (
                            <>
                                <Input label="Email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
                                <Input
                                    label="Пароль"
                                    type="password"
                                    value={loginPassword}
                                    onChange={(event) => setLoginPassword(event.target.value)}
                                />
                            </>
                        ) : (
                            <>
                                <Input label="Email" value={registerEmail} onChange={(event) => setRegisterEmail(event.target.value)} />
                                <Input
                                    label="Пароль"
                                    type="password"
                                    value={registerPassword}
                                    onChange={(event) => setRegisterPassword(event.target.value)}
                                    hint="Минимум 6 символов."
                                />
                                <div className="hb-grid hb-grid--2">
                                    <Input label="Имя" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
                                    <Input label="Фамилия" value={lastName} onChange={(event) => setLastName(event.target.value)} />
                                </div>
                            </>
                        )}

                        {error ? <div className="hb-callout">{error}</div> : null}

                        <Button onClick={handleSubmit} disabled={busy}>
                            {busy ? "Обрабатываем..." : tab === "login" ? "Войти" : "Создать аккаунт"}
                        </Button>
                    </div>
                </Card>
            </aside>
        </div>
    );
}
