import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
    return (
        <div className="hb-page-wrap">
            <Card eyebrow="404" title="Страница не найдена" subtitle="Похоже, маршрут больше не существует или был заменён новым разделом.">
                <Link to="/">
                    <Button>Вернуться на главную</Button>
                </Link>
            </Card>
        </div>
    );
}
