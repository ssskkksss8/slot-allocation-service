import type { ReactNode } from "react";

type Props = {
    title?: string;
    eyebrow?: string;
    subtitle?: ReactNode;
    actions?: ReactNode;
    className?: string;
    children: ReactNode;
};

export function Card({ title, eyebrow, subtitle, actions, className, children }: Props) {
    return (
        <section className={["hb-card", className ?? ""].filter(Boolean).join(" ")}>
            {title || eyebrow || subtitle || actions ? (
                <header className="hb-card__header">
                    <div className="hb-card__heading">
                        {eyebrow ? <div className="hb-card__eyebrow">{eyebrow}</div> : null}
                        {title ? <h2 className="hb-card__title">{title}</h2> : null}
                        {subtitle ? <div className="hb-card__subtitle">{subtitle}</div> : null}
                    </div>
                    {actions ? <div>{actions}</div> : null}
                </header>
            ) : null}
            <div className="hb-card__body">{children}</div>
        </section>
    );
}
