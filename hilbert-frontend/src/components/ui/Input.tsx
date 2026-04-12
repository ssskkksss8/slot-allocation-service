import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    hint?: string;
};

export function Input({ label, hint, className, ...rest }: Props) {
    return (
        <label className={["hb-field", className ?? ""].filter(Boolean).join(" ")}>
            {label ? <span className="hb-field__label">{label}</span> : null}
            <input className="hb-field__control" {...rest} />
            {hint ? <span className="hb-field__hint">{hint}</span> : null}
        </label>
    );
}
