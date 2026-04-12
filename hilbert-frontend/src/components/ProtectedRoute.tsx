import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authStore } from "../store/authStore";

export function ProtectedRoute(props: { children: ReactNode }) {
    const token = authStore((s) => s.token);
    const profile = authStore((s) => s.profile);
    const loadProfile = authStore((s) => s.loadProfile);

    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!token) {
                setReady(true);
                return;
            }
            try {
                if (!profile) await loadProfile();
            } finally {
                if (!cancelled) setReady(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [token, profile, loadProfile]);

    if (!token) return <Navigate to="/auth" replace />;
    if (!ready) return null;

    return <>{props.children}</>;
}
