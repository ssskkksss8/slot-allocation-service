import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    hint?: string;
};

export function Textarea({ label, hint, className, ...rest }: Props) {
    return (
        <label className={["hb-field", className ?? ""].filter(Boolean).join(" ")}>
            {label ? <span className="hb-field__label">{label}</span> : null}
            <textarea className="hb-field__control" {...rest} />
            {hint ? <span className="hb-field__hint">{hint}</span> : null}
        </label>
    );
}
