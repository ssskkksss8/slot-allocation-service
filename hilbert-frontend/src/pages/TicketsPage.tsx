import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/ui/Card";
import { ticketsApi } from "../api/tickets";
import { Badge } from "../components/ui/Badge";
import styles from "./TicketsPage.module.css";

export function TicketsPage() {
    const q = useQuery({ queryKey: ["tickets"], queryFn: ticketsApi.my });

    return (
        <div className={styles.page}>
            <Card title="Мои билеты">
                {q.isLoading ? <div>Загрузка…</div> : null}
                {!q.isLoading && (q.data?.length ?? 0) === 0 ? <div>Билетов нет.</div> : null}

                <div className={styles.list}>
                    {(q.data ?? []).map((t) => (
                        <div key={t.ticketId} className={styles.item}>
                            <div className={styles.top}>
                                <div className={styles.num}>{t.ticketNumber}</div>
                                <Badge>{t.isActive ? "ACTIVE" : "INACTIVE"}</Badge>
                            </div>
                            <div className={styles.row}>
                                <div>
                                    <strong>{t.originCity}</strong> — {t.originAirport}
                                </div>
                                <div>
                                    <strong>{t.destCity}</strong> — {t.destAirport}
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div>Вылет: <strong>{t.departureTime.replace("T", " ")}</strong></div>
                                <div>Прилёт: <strong>{t.arrivalTime.replace("T", " ")}</strong></div>
                            </div>
                            <div>Цена: <strong>{t.price}</strong></div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
