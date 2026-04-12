import type { ReactNode } from "react";

type BadgeTone = "default" | "accent" | "success" | "warning" | "error" | "info";

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: BadgeTone }) {
    return <span className={["hb-badge", `hb-badge--${tone}`].join(" ")}>{children}</span>;
}
