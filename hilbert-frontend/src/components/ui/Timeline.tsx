export function Timeline(props: { items: Array<{ title: string; meta: string }> }) {
    return (
        <div className="hb-timeline">
            {props.items.map((item) => (
                <div key={item.title} className="hb-timeline__item">
                    <div className="hb-timeline__dot" />
                    <div className="hb-timeline__content">
                        <div className="hb-timeline__title">{item.title}</div>
                        <div className="hb-timeline__meta">{item.meta}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
