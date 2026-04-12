-- ============================================================
-- Seed: тестовые данные для демонстрации Priority Booking
-- Требует: pgcrypto extension (для хэширования паролей)
-- Пароль всех тестовых пользователей: Test1234
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Очистка (безопасна при повторном запуске)
TRUNCATE audit_logs, notifications, tickets, transactions,
         booking_requests, flights, airports, cities,
         user_roles, users RESTART IDENTITY CASCADE;

-- ============================================================
-- ГОРОДА И АЭРОПОРТЫ
-- ============================================================
INSERT INTO cities (name, country, timezone) VALUES
    ('Москва',          'Россия', 'Europe/Moscow'),
    ('Санкт-Петербург', 'Россия', 'Europe/Moscow'),
    ('Сочи',            'Россия', 'Europe/Moscow'),
    ('Казань',          'Россия', 'Europe/Moscow'),
    ('Новосибирск',     'Россия', 'Asia/Novosibirsk'),
    ('Екатеринбург',    'Россия', 'Asia/Yekaterinburg');

INSERT INTO airports (city_id, name) VALUES
    (1, 'Шереметьево'),
    (2, 'Пулково'),
    (3, 'Сочи (Адлер)'),
    (4, 'Казань'),
    (5, 'Толмачёво'),
    (6, 'Кольцово');

-- ============================================================
-- РЕЙСЫ (10 штук с разными датами, ценами и остатками мест)
-- ============================================================
INSERT INTO flights (origin_airport_id, destination_airport_id,
                     departure_time, arrival_time,
                     price, total_seats, available_seats, status)
VALUES
-- Москва → Сочи (горячий рейс, мало мест)
(1, 3, NOW() + INTERVAL '2 days',  NOW() + INTERVAL '2 days 2 hours 30 minutes',  8500.00,  50, 6,  'SCHEDULED'),
-- Москва → Сочи (второй рейс, мест больше)
(1, 3, NOW() + INTERVAL '3 days',  NOW() + INTERVAL '3 days 2 hours 30 minutes',  7200.00,  80, 42, 'SCHEDULED'),
-- Москва → Петербург
(1, 2, NOW() + INTERVAL '1 day',   NOW() + INTERVAL '1 day 1 hour 20 minutes',    4500.00, 120, 55, 'SCHEDULED'),
-- Петербург → Москва
(2, 1, NOW() + INTERVAL '4 days',  NOW() + INTERVAL '4 days 1 hour 20 minutes',   4800.00, 120, 70, 'SCHEDULED'),
-- Москва → Казань
(1, 4, NOW() + INTERVAL '1 day',   NOW() + INTERVAL '1 day 1 hour 10 minutes',    3900.00, 100, 48, 'SCHEDULED'),
-- Москва → Новосибирск (дальний, дорогой)
(1, 5, NOW() + INTERVAL '5 days',  NOW() + INTERVAL '5 days 4 hours',            18000.00,  90, 30, 'SCHEDULED'),
-- Москва → Екатеринбург
(1, 6, NOW() + INTERVAL '2 days',  NOW() + INTERVAL '2 days 2 hours',            11000.00,  80, 20, 'SCHEDULED'),
-- Екатеринбург → Москва
(6, 1, NOW() + INTERVAL '6 days',  NOW() + INTERVAL '6 days 2 hours',            10500.00,  80, 60, 'SCHEDULED'),
-- Петербург → Сочи
(2, 3, NOW() + INTERVAL '3 days',  NOW() + INTERVAL '3 days 2 hours 45 minutes',  9800.00,  60, 15, 'SCHEDULED'),
-- Казань → Сочи
(4, 3, NOW() + INTERVAL '7 days',  NOW() + INTERVAL '7 days 2 hours',             7600.00,  70, 50, 'SCHEDULED');

-- ============================================================
-- ПОЛЬЗОВАТЕЛИ (пароль: Test1234)
-- ============================================================
INSERT INTO users (email, password_hash, first_name, last_name,
                   loyalty_tier, has_corporate_contract, no_show_count, ancillary_spend)
VALUES
    ('admin@demo.ru',   crypt('Test1234', gen_salt('bf', 10)), 'Админ',     'Системный',  3, true,  0, 3000.00),
    ('alice@demo.ru',   crypt('Test1234', gen_salt('bf', 10)), 'Алиса',     'Иванова',    3, true,  0, 2500.00),
    ('bob@demo.ru',     crypt('Test1234', gen_salt('bf', 10)), 'Борис',     'Петров',     2, false, 0, 1200.00),
    ('carol@demo.ru',   crypt('Test1234', gen_salt('bf', 10)), 'Карина',    'Смирнова',   2, true,  0,  800.00),
    ('dave@demo.ru',    crypt('Test1234', gen_salt('bf', 10)), 'Дмитрий',   'Козлов',     1, false, 1,  400.00),
    ('eve@demo.ru',     crypt('Test1234', gen_salt('bf', 10)), 'Елена',     'Новикова',   1, false, 0,  300.00),
    ('frank@demo.ru',   crypt('Test1234', gen_salt('bf', 10)), 'Фёдор',     'Морозов',    0, false, 2,    0.00),
    ('grace@demo.ru',   crypt('Test1234', gen_salt('bf', 10)), 'Галина',    'Волкова',    0, false, 0,    0.00),
    ('henry@demo.ru',   crypt('Test1234', gen_salt('bf', 10)), 'Григорий',  'Лебедев',    0, false, 1,    0.00),
    ('irene@demo.ru',   crypt('Test1234', gen_salt('bf', 10)), 'Ирина',     'Соколова',   0, false, 0,    0.00);

-- Роли
INSERT INTO user_roles (user_id, role) VALUES (1, 'ADMIN'), (1, 'USER');
INSERT INTO user_roles (user_id, role)
SELECT id, 'USER' FROM users WHERE id > 1;

-- ============================================================
-- ТРАНЗАКЦИИ (пополнения + старые покупки для total_spend)
-- ============================================================
-- Депозиты — формируют текущий баланс для покупки
INSERT INTO transactions (user_id, amount, type) VALUES
    (1, 500000.00, 'DEPOSIT'),
    (2, 300000.00, 'DEPOSIT'),
    (3, 150000.00, 'DEPOSIT'),
    (4, 120000.00, 'DEPOSIT'),
    (5,  80000.00, 'DEPOSIT'),
    (6,  60000.00, 'DEPOSIT'),
    (7,  40000.00, 'DEPOSIT'),
    (8,  30000.00, 'DEPOSIT'),
    (9,  20000.00, 'DEPOSIT'),
    (10, 15000.00, 'DEPOSIT');

-- Старые покупки (формируют cached_total_spend и purchase_frequency_score)
-- Триггер trg_update_spend пересчитает cached_total_spend автоматически
INSERT INTO transactions (user_id, amount, type, created_at) VALUES
    (2, 18000.00, 'PURCHASE', NOW() - INTERVAL '30 days'),
    (2, 22000.00, 'PURCHASE', NOW() - INTERVAL '60 days'),
    (2, 15000.00, 'PURCHASE', NOW() - INTERVAL '90 days'),
    (2,  9000.00, 'PURCHASE', NOW() - INTERVAL '120 days'),
    (2, 11000.00, 'PURCHASE', NOW() - INTERVAL '150 days'),

    (3, 14000.00, 'PURCHASE', NOW() - INTERVAL '45 days'),
    (3, 18000.00, 'PURCHASE', NOW() - INTERVAL '80 days'),
    (3, 12000.00, 'PURCHASE', NOW() - INTERVAL '110 days'),

    (4, 10000.00, 'PURCHASE', NOW() - INTERVAL '20 days'),
    (4,  8500.00, 'PURCHASE', NOW() - INTERVAL '55 days'),

    (5,  7200.00, 'PURCHASE', NOW() - INTERVAL '40 days'),
    (5,  4500.00, 'PURCHASE', NOW() - INTERVAL '95 days'),

    (6,  4800.00, 'PURCHASE', NOW() - INTERVAL '60 days'),

    (1, 35000.00, 'PURCHASE', NOW() - INTERVAL '10 days'),
    (1, 28000.00, 'PURCHASE', NOW() - INTERVAL '25 days'),
    (1, 19000.00, 'PURCHASE', NOW() - INTERVAL '50 days');
