export const landingMetrics = [
    { label: "Одновременные запросы", value: "500+", hint: "Конкурентные окна без oversell." },
    { label: "Активные пользователи", value: "600", hint: "Нагрузка распределяется через очередь." },
    { label: "Время ответа", value: "до 30 с", hint: "С учётом окна приёма и обработки." },
    { label: "Доступность", value: "99.5%", hint: "Сервис остаётся предсказуемым под пиками." }
];

export const heroSteps = [
    {
        title: "Заявка попадает в конкурентное окно",
        body: "Вместо мгновенной покупки система собирает одновременные запросы в короткий интервал и не продаёт билеты раньше времени."
    },
    {
        title: "Приоритет считается по total_spend",
        body: "Внутри окна заявки сортируются по накопленному total_spend. Это делает результат объяснимым и детерминированным."
    },
    {
        title: "Worker pool распределяет места",
        body: "RabbitMQ и фоновые workers последовательно разбирают очередь и выделяют только доступный объём мест."
    },
    {
        title: "Пользователь получает уведомление",
        body: "Система сообщает итог обработки: билеты куплены, заявка отклонена или рейс отменён с возвратом."
    }
];

export const architectureNodes = [
    {
        id: "client",
        tag: "Клиент",
        title: "React Frontend",
        text: "Точка входа для поиска рейсов, отправки заявок и просмотра аналитики.",
        events: ["Поиск рейса", "Отправка заявки", "Получение результата"],
        reads: ["Профиль пользователя", "Список уведомлений", "Симуляция"],
        role: "Объясняет пользователю, как работает конкурентная покупка."
    },
    {
        id: "api",
        tag: "API",
        title: "Backend API",
        text: "Принимает команды от клиента, проверяет доступ и инициирует отправку в очередь.",
        events: ["POST /bookings", "GET /flights", "GET /notifications"],
        reads: ["JWT", "Пользовательские роли", "Текущие остатки"],
        role: "Объединяет auth, поиск и покупку в единый поток."
    },
    {
        id: "auth",
        tag: "Доступ",
        title: "Auth Service",
        text: "Регистрирует пользователя, выдаёт токен и определяет роль пользователя в интерфейсе.",
        events: ["register", "login", "token validation"],
        reads: ["Пользователи", "Роли"],
        role: "Гарантирует, что пользователь и администратор видят разные режимы."
    },
    {
        id: "booking",
        tag: "Покупка",
        title: "Booking Service",
        text: "Принимает заявку, пишет событие в обменник и не продаёт билеты напрямую с веб-запроса.",
        events: ["booking requested", "booking queued"],
        reads: ["flightId", "userId"],
        role: "Отделяет пользовательский запрос от тяжёлой конкурентной обработки."
    },
    {
        id: "priority",
        tag: "Правила",
        title: "Priority Calculator",
        text: "Сравнивает пользователей по total_spend и формирует отсортированный срез для текущего окна.",
        events: ["window closed", "priority recalculated"],
        reads: ["cached total_spend", "порог доступных мест"],
        role: "Делает результат покупки объяснимым и повторяемым."
    },
    {
        id: "queue",
        tag: "Брокер",
        title: "RabbitMQ",
        text: "Буферизует всплески трафика и не даёт синхронному HTTP-пути превратиться в бутылочное горлышко.",
        events: ["booking event", "retry", "worker ack"],
        reads: ["routing key", "exchange", "consumer state"],
        role: "Стабилизирует поток конкурентных запросов."
    },
    {
        id: "workers",
        tag: "Исполнение",
        title: "Worker Pool",
        text: "Фоновые consumers и планировщики разбирают очередь по рейсам и вызывают обработку окна.",
        events: ["process flight queue", "allocate seats"],
        reads: ["pending requests", "flight queue"],
        role: "Выполняет фактическое распределение мест."
    },
    {
        id: "redis",
        tag: "Кэш",
        title: "Redis",
        text: "Рекомендуемая точка для live-метрик, временных окон и realtime-симуляции.",
        events: ["queue depth", "window state"],
        reads: ["горячие счётчики"],
        role: "Поддерживает быстрые live-визуализации без давления на основную БД."
    },
    {
        id: "db",
        tag: "Хранилище",
        title: "PostgreSQL",
        text: "Источник истины для рейсов, заявок, билетов, уведомлений и пользовательского total_spend.",
        events: ["booking persisted", "ticket issued", "refund recorded"],
        reads: ["flights", "tickets", "notifications"],
        role: "Гарантирует консистентность продажи и отсутствие oversell."
    },
    {
        id: "notify",
        tag: "Коммуникации",
        title: "Notification Service",
        text: "Собирает результат обработки и доставляет понятный статус в центр уведомлений пользователя.",
        events: ["ticket purchased", "request rejected", "flight cancelled"],
        reads: ["booking status", "ticket state"],
        role: "Закрывает цикл покупки прозрачным объяснением результата."
    }
];

export const queuePhases = [
    { name: "Заявка принята", current: 126, avgTime: "0.4 с", errorRate: "0.0%", processed: 1280 },
    { name: "В очереди", current: 81, avgTime: "5.8 с", errorRate: "0.3%", processed: 1210 },
    { name: "Приоритет рассчитан", current: 46, avgTime: "2.2 с", errorRate: "0.2%", processed: 1188 },
    { name: "Сортировка завершена", current: 25, avgTime: "1.2 с", errorRate: "0.0%", processed: 1188 },
    { name: "Места распределены", current: 14, avgTime: "0.9 с", errorRate: "0.0%", processed: 1174 },
    { name: "Уведомление отправлено", current: 8, avgTime: "0.7 с", errorRate: "0.1%", processed: 1166 }
];

export const queueLiveSeries = [
    { label: "12:00", requests: 40, latency: 12, success: 92 },
    { label: "12:05", requests: 68, latency: 18, success: 89 },
    { label: "12:10", requests: 108, latency: 26, success: 84 },
    { label: "12:15", requests: 132, latency: 30, success: 80 },
    { label: "12:20", requests: 96, latency: 21, success: 87 },
    { label: "12:25", requests: 58, latency: 14, success: 91 }
];

export const priorityExamples = [
    { user: "Алиса",    totalSpend: 420000, requestSize: 2, result: "Покупка одобрена", priorityScore: 76.4 },
    { user: "Борис",    totalSpend: 310000, requestSize: 1, result: "Покупка одобрена", priorityScore: 58.2 },
    { user: "Карина",   totalSpend: 260000, requestSize: 3, result: "Покупка одобрена", priorityScore: 47.9 },
    { user: "Дмитрий",  totalSpend: 210000, requestSize: 2, result: "Ниже порога",      priorityScore: 32.1 },
    { user: "Елена",    totalSpend: 190000, requestSize: 1, result: "Ниже порога",      priorityScore: 21.7 },
    { user: "Фёдор",    totalSpend:  80000, requestSize: 2, result: "Ниже порога",      priorityScore:  9.3 },
];

export const simulationDefaults = {
    users: 160,
    requests: 220,
    seats: 48,
    windowSeconds: 8,
    processingRate: 32,
    mode: "demo" as "demo" | "live"
};

export function buildSimulationSnapshot(params = simulationDefaults) {
    const winners = Math.min(params.requests, params.seats);
    const denied = Math.max(params.requests - params.seats, 0);
    const medianWinnerSpend = 214000 + params.seats * 320;
    const avgDecisionSeconds = Number((params.windowSeconds + params.requests / params.processingRate).toFixed(1));

    return {
        totalRequests: params.requests,
        winners,
        denied,
        medianWinnerSpend,
        avgDecisionSeconds,
        oversellIncidents: 0,
        topWinners: Array.from({ length: Math.min(6, winners) }, (_, index) => ({
            user: `Пользователь ${index + 1}`,
            totalSpend: 420000 - index * 27000,
            tickets: index < 2 ? 2 : 1
        })),
        queueDepth: [
            { label: "0 c", value: Math.round(params.requests * 0.1) },
            { label: "2 c", value: Math.round(params.requests * 0.42) },
            { label: "4 c", value: Math.round(params.requests * 0.8) },
            { label: "6 c", value: Math.round(params.requests * 0.54) },
            { label: "8 c", value: Math.round(params.requests * 0.22) }
        ]
    };
}

export const adminHealthCards = [
    { label: "Активные рейсы", value: "14", hint: "В продаже и в окне конкурентной покупки" },
    { label: "Заявки в очереди", value: "81", hint: "Сейчас ожидают сортировки и распределения" },
    { label: "Доля успеха", value: "84%", hint: "Без учёта отменённых рейсов" },
    { label: "Среднее время обработки", value: "11.8 с", hint: "С момента приёма до результата" },
    { label: "Инциденты oversell", value: "0", hint: "Инвариант системы сохраняется" },
    { label: "Глубина очереди", value: "3.4x", hint: "Кратность текущей нагрузки к базовой" }
];

export const demoRequestTimeline = [
    { title: "Заявка принята API", meta: "Запрос зарегистрирован и подтверждён пользователю" },
    { title: "Событие записано в брокер", meta: "RabbitMQ удерживает всплеск конкурентных покупок" },
    { title: "Окно приёма закрыто", meta: "Система зафиксировала набор конкурирующих заявок" },
    { title: "Приоритет рассчитан", meta: "Пользователь сравнен по total_spend с другими участниками окна" },
    { title: "Решение принято", meta: "Места распределены без oversell" },
    { title: "Результат отправлен", meta: "Пользователь получил билет или понятную причину отказа" }
];
