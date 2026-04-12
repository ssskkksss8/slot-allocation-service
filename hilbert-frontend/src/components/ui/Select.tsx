import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    hint?: string;
};

export function Select({ label, hint, className, children, ...rest }: Props) {
    return (
        <label className={["hb-field", className ?? ""].filter(Boolean).join(" ")}>
            {label ? <span className="hb-field__label">{label}</span> : null}
            <select className="hb-field__control" {...rest}>
                {children}
            </select>
            {hint ? <span className="hb-field__hint">{hint}</span> : null}
        </label>
    );
}
