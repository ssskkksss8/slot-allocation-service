export function BarChart(props: { items: Array<{ label: string; value: number; suffix?: string }>; max?: number }) {
    const max = props.max ?? Math.max(...props.items.map((item) => item.value), 1);

    return (
        <div className="hb-chart-bars">
            {props.items.map((item) => (
                <div key={item.label} className="hb-chart-bars__item">
                    <div className="hb-chart-bars__meta">
                        <span>{item.label}</span>
                        <strong>{item.value}{item.suffix ?? ""}</strong>
                    </div>
                    <div className="hb-chart-bars__line">
                        <div className="hb-chart-bars__fill" style={{ width: `${(item.value / max) * 100}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
