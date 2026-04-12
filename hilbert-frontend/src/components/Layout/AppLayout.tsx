import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="hb-shell hb-shell--app">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((current) => !current)} />
            <main className="hb-main">
                <Topbar collapsed={collapsed} onToggle={() => setCollapsed((current) => !current)} />
                <div className="hb-page-wrap">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
