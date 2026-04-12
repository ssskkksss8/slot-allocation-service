import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "default" | "small";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
};

export function Button({ children, className, variant = "primary", size = "default", ...rest }: Props) {
    const classes = [
        "hb-button",
        `hb-button--${variant}`,
        size === "small" ? "hb-button--small" : "",
        className ?? ""
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button className={classes} {...rest}>
            {children}
        </button>
    );
}
