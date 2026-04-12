import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/Layout/AppLayout";
import { LandingPage } from "./pages/LandingPage";
import { PublicArchitecturePage, ArchitecturePage } from "./pages/ArchitecturePage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SearchFlightsPage } from "./pages/SearchFlightsPage";
import { RequestsPage } from "./pages/RequestsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminLocationsPage } from "./pages/AdminLocationsPage";
import { AdminFlightsPage } from "./pages/AdminFlightsPage";
import { ImpactPage } from "./pages/ImpactPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/architecture" element={<PublicArchitecturePage />} />
            <Route path="/auth" element={<AuthPage />} />

            <Route
                path="/app"
                element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<DashboardPage />} />
                <Route path="search" element={<SearchFlightsPage />} />
                <Route path="requests" element={<RequestsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="architecture" element={<ArchitecturePage />} />
                <Route path="admin" element={<AdminDashboardPage />} />
                <Route path="admin/flights" element={<AdminFlightsPage />} />
                <Route path="admin/locations" element={<AdminLocationsPage />} />
                <Route path="impact" element={<ImpactPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
