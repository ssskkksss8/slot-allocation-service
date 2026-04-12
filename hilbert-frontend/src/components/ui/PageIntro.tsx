import type { ReactNode } from "react";

export function PageIntro(props: { eyebrow: string; title: string; body: ReactNode }) {
    return (
        <div className="hb-page-intro">
            <div className="hb-page-intro__eyebrow">{props.eyebrow}</div>
            <h1 className="hb-page-intro__title">{props.title}</h1>
            <div className="hb-page-intro__body">{props.body}</div>
        </div>
    );
}
