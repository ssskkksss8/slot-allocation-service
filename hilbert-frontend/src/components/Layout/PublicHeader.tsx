import { Link, NavLink } from "react-router-dom";
import { Button } from "../ui/Button";

const navItems = [
    { to: "/#product", label: "О продукте" },
    { to: "/#how-it-works", label: "Как это работает" },
    { to: "/architecture", label: "Архитектура" }
];

export function PublicHeader() {
    return (
        <header className="hb-public-header">
            <Link to="/" className="hb-brand-mark">
                <div className="hb-brand-copy">
                    <div className="hb-brand-title">Priority Booking</div>
                    <div className="hb-brand-subtitle">Система приоритетного распределения авиабилетов</div>
                </div>
            </Link>

            <nav className="hb-public-nav">
                {navItems.map((item) => (
                    <NavLink key={item.to} to={item.to}>
                        <Button variant="secondary" size="small">{item.label}</Button>
                    </NavLink>
                ))}
                <Link to="/auth">
                    <Button size="small">Вход и регистрация</Button>
                </Link>
            </nav>
        </header>
    );
}
