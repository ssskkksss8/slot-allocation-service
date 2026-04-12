export function MetricCard(props: { label: string; value: string; hint?: string }) {
    return (
        <article className="hb-metric-card">
            <div className="hb-metric-card__label">{props.label}</div>
            <div className="hb-metric-card__value">{props.value}</div>
            {props.hint ? <div className="hb-metric-card__hint">{props.hint}</div> : null}
        </article>
    );
}
