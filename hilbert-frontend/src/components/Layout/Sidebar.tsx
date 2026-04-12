import { NavLink } from "react-router-dom";
import { authStore } from "../../store/authStore";
import { adminNavigation, userNavigation } from "../../lib/navigation";
import { Button } from "../ui/Button";
import { formatMoney } from "../../lib/format";

function NavigationItem(props: { to: string; label: string; meta: string; icon: string; collapsed: boolean }) {
    return (
        <NavLink to={props.to} end={props.to === "/app"} className={({ isActive }) => `hb-nav__item${isActive ? " is-active" : ""}`}>
            <span className="hb-nav__icon">{props.icon}</span>
            <span className="hb-nav__content">
                <span className="hb-nav__label">{props.label}</span>
                {!props.collapsed ? <span className="hb-nav__meta">{props.meta}</span> : null}
            </span>
        </NavLink>
    );
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
    const profile = authStore((s) => s.profile);
    const isAdmin = authStore((s) => s.isAdmin());

    return (
        <aside className="hb-sidebar" data-collapsed={collapsed}>
            <div className="hb-sidebar__inner">
                <div className="hb-sidebar__brand">
                    <div className="hb-inline hb-inline--between">
                        <div className="hb-brand-mark">
                            <div className="hb-brand-copy">
                                <div className="hb-brand-title">Priority Booking</div>
                                <div className="hb-brand-subtitle">Приоритетное распределение ограниченного ресурса</div>
                            </div>
                        </div>
                        <Button variant="secondary" size="small" onClick={onToggle} aria-label="Свернуть боковую панель">
                            {collapsed ? ">" : "<"}
                        </Button>
                    </div>
                </div>

                <nav className="hb-nav">
                    <div className="hb-nav__section">
                        <div className="hb-nav__section-label">Пользовательский режим</div>
                        {userNavigation.map((item) => (
                            <NavigationItem key={item.to} {...item} collapsed={collapsed} />
                        ))}
                    </div>

                    {isAdmin ? (
                        <div className="hb-nav__section">
                            <div className="hb-nav__section-label">Администрирование</div>
                            {adminNavigation.map((item) => (
                                <NavigationItem key={item.to} {...item} collapsed={collapsed} />
                            ))}
                        </div>
                    ) : null}
                </nav>

                <div className="hb-sidebar__spacer" />

                <div className="hb-sidebar__footnote">
                    {profile ? (
                        <>
                            <strong>{profile.email}</strong>
                            <br />
                            Баланс: {formatMoney(profile.balance)}
                            <br />
                            Total spend: {formatMoney(profile.totalSpend)}
                        </>
                    ) : (
                        <>После авторизации здесь появится краткая памятка по механике приоритета.</>
                    )}
                </div>
            </div>
        </aside>
    );
}
