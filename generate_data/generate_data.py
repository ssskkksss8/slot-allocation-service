from __future__ import annotations

import csv
import math
import random
from typing import Any

random.seed(42)

OUTPUT_FILE = "historical_clients.csv"
ROWS_COUNT = 5000

FIELDNAMES = [
    "client_profile",
    "loyalty_status_score",
    "bonus_balance",
    "purchase_frequency_180d",
    "cancel_ratio",
    "no_show_ratio",
    "average_order_value",
    "ancillary_services_avg_count",
    "group_size",
    "booking_class",
    "corporate_contract_flag",
    "days_since_last_purchase",
    "margin_value_180d",
]


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def weighted_choice(items: list[Any], weights: list[float]) -> Any:
    return random.choices(items, weights=weights, k=1)[0]


def round2(x: float) -> float:
    return round(x, 2)


def round3(x: float) -> float:
    return round(x, 3)


def gen_profile() -> str:
    """
    Профили клиентов и их доли в общей клиентской базе.
    """
    profiles = [
        "corporate_stable",
        "premium_loyal",
        "frequent_economy",
        "high_value_unstable",
        "new_high_check",
        "mass_tourist_group",
        "inactive_loyal",
        "problematic_client",
    ]
    weights = [0.16, 0.14, 0.20, 0.09, 0.08, 0.15, 0.08, 0.10]
    return weighted_choice(profiles, weights)


def apply_noise(features: dict[str, Any]) -> dict[str, Any]:
    """
    Добавляет шум и редкие нетипичные отклонения,
    чтобы данные не были полностью детерминированными.
    """
    average_order_value = float(features["average_order_value"])
    cancel_ratio = float(features["cancel_ratio"])
    no_show_ratio = float(features["no_show_ratio"])
    purchase_frequency_180d = float(features["purchase_frequency_180d"])
    ancillary_services_avg_count = float(features["ancillary_services_avg_count"])
    days_since_last_purchase = int(features["days_since_last_purchase"])

    # Лёгкий шум
    if random.random() < 0.06:
        average_order_value = clamp(
            average_order_value + random.uniform(-3500, 3500),
            2500,
            70000,
        )

    if random.random() < 0.06:
        cancel_ratio = clamp(
            cancel_ratio + random.uniform(-0.08, 0.08),
            0.0,
            0.85,
        )

    if random.random() < 0.05:
        no_show_ratio = clamp(
            no_show_ratio + random.uniform(-0.05, 0.05),
            0.0,
            0.45,
        )

    if random.random() < 0.05:
        purchase_frequency_180d = clamp(
            purchase_frequency_180d + random.uniform(-0.9, 0.9),
            0.0,
            9.5,
        )

    if random.random() < 0.05:
        ancillary_services_avg_count = clamp(
            ancillary_services_avg_count + random.uniform(-0.5, 0.5),
            0.0,
            5.5,
        )

    if random.random() < 0.04:
        days_since_last_purchase = int(
            clamp(days_since_last_purchase + random.randint(-20, 20), 1, 365)
        )

    # Редкие выбросы
    if random.random() < 0.015:
        average_order_value = clamp(average_order_value * random.uniform(1.2, 1.8), 2500, 70000)

    if random.random() < 0.012:
        cancel_ratio = clamp(cancel_ratio + random.uniform(0.10, 0.22), 0.0, 0.85)

    if random.random() < 0.010:
        no_show_ratio = clamp(no_show_ratio + random.uniform(0.07, 0.18), 0.0, 0.45)

    features["average_order_value"] = round2(average_order_value)
    features["cancel_ratio"] = round3(cancel_ratio)
    features["no_show_ratio"] = round3(no_show_ratio)
    features["purchase_frequency_180d"] = round2(purchase_frequency_180d)
    features["ancillary_services_avg_count"] = round2(ancillary_services_avg_count)
    features["days_since_last_purchase"] = int(days_since_last_purchase)

    return features


def generate_features(profile: str) -> dict[str, Any]:
    """
    Генерация признаков с учетом профиля клиента.
    """

    if profile == "corporate_stable":
        loyalty_status_score = weighted_choice([1, 2, 3, 4], [0.08, 0.18, 0.42, 0.32])
        bonus_balance = int(random.lognormvariate(9.0, 0.45))
        purchase_frequency_180d = clamp(random.normalvariate(4.8, 1.2), 1.5, 8.5)
        cancel_ratio = clamp(random.betavariate(1.1, 15.0), 0.0, 0.18)
        no_show_ratio = clamp(random.betavariate(1.0, 20.0), 0.0, 0.08)
        average_order_value = clamp(random.normalvariate(21000, 5000), 9000, 42000)
        ancillary_services_avg_count = clamp(random.normalvariate(2.1, 0.7), 0.4, 4.5)
        group_size = weighted_choice([1, 2, 3, 4], [0.62, 0.20, 0.10, 0.08])
        booking_class = weighted_choice(
            ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"],
            [0.20, 0.15, 0.55, 0.10],
        )
        corporate_contract_flag = weighted_choice(["YES", "NO"], [0.88, 0.12])
        days_since_last_purchase = clamp(random.normalvariate(18, 14), 1, 90)

    elif profile == "premium_loyal":
        loyalty_status_score = weighted_choice([2, 3, 4], [0.10, 0.38, 0.52])
        bonus_balance = int(random.lognormvariate(9.4, 0.50))
        purchase_frequency_180d = clamp(random.normalvariate(3.2, 1.1), 0.8, 6.5)
        cancel_ratio = clamp(random.betavariate(1.2, 13.0), 0.0, 0.20)
        no_show_ratio = clamp(random.betavariate(1.0, 16.0), 0.0, 0.10)
        average_order_value = clamp(random.normalvariate(26000, 6000), 12000, 52000)
        ancillary_services_avg_count = clamp(random.normalvariate(2.7, 0.9), 0.6, 5.0)
        group_size = weighted_choice([1, 2, 3], [0.75, 0.18, 0.07])
        booking_class = weighted_choice(
            ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"],
            [0.10, 0.18, 0.47, 0.25],
        )
        corporate_contract_flag = weighted_choice(["YES", "NO"], [0.35, 0.65])
        days_since_last_purchase = clamp(random.normalvariate(25, 18), 1, 120)

    elif profile == "frequent_economy":
        loyalty_status_score = weighted_choice([0, 1, 2, 3], [0.10, 0.35, 0.35, 0.20])
        bonus_balance = int(random.lognormvariate(8.2, 0.60))
        purchase_frequency_180d = clamp(random.normalvariate(5.3, 1.3), 2.2, 9.0)
        cancel_ratio = clamp(random.betavariate(1.8, 9.0), 0.01, 0.35)
        no_show_ratio = clamp(random.betavariate(1.4, 12.0), 0.0, 0.15)
        average_order_value = clamp(random.normalvariate(9500, 1800), 4500, 17000)
        ancillary_services_avg_count = clamp(random.normalvariate(1.0, 0.45), 0.0, 2.8)
        group_size = weighted_choice([1, 2, 3, 4], [0.70, 0.18, 0.08, 0.04])
        booking_class = weighted_choice(
            ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"],
            [0.76, 0.18, 0.06, 0.00],
        )
        corporate_contract_flag = weighted_choice(["YES", "NO"], [0.20, 0.80])
        days_since_last_purchase = clamp(random.normalvariate(16, 12), 1, 75)

    elif profile == "high_value_unstable":
        loyalty_status_score = weighted_choice([0, 1, 2, 3], [0.22, 0.28, 0.30, 0.20])
        bonus_balance = int(random.lognormvariate(8.3, 0.75))
        purchase_frequency_180d = clamp(random.normalvariate(2.2, 1.0), 0.2, 5.5)
        cancel_ratio = clamp(random.betavariate(3.0, 5.0), 0.08, 0.65)
        no_show_ratio = clamp(random.betavariate(2.0, 7.0), 0.02, 0.30)
        average_order_value = clamp(random.normalvariate(28000, 8000), 10000, 65000)
        ancillary_services_avg_count = clamp(random.normalvariate(2.9, 1.0), 0.5, 5.0)
        group_size = weighted_choice([1, 2, 3, 4, 5], [0.55, 0.18, 0.12, 0.09, 0.06])
        booking_class = weighted_choice(
            ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"],
            [0.18, 0.18, 0.46, 0.18],
        )
        corporate_contract_flag = weighted_choice(["YES", "NO"], [0.22, 0.78])
        days_since_last_purchase = clamp(random.normalvariate(42, 28), 1, 180)

    elif profile == "new_high_check":
        loyalty_status_score = weighted_choice([0, 1], [0.75, 0.25])
        bonus_balance = int(random.lognormvariate(6.8, 0.90))
        purchase_frequency_180d = clamp(random.normalvariate(0.7, 0.5), 0.0, 2.2)
        cancel_ratio = clamp(random.betavariate(2.0, 8.0), 0.01, 0.28)
        no_show_ratio = clamp(random.betavariate(1.4, 10.0), 0.0, 0.14)
        average_order_value = clamp(random.normalvariate(23000, 7000), 9000, 50000)
        ancillary_services_avg_count = clamp(random.normalvariate(1.8, 0.9), 0.0, 4.2)
        group_size = weighted_choice([1, 2, 3], [0.72, 0.18, 0.10])
        booking_class = weighted_choice(
            ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"],
            [0.30, 0.18, 0.42, 0.10],
        )
        corporate_contract_flag = weighted_choice(["YES", "NO"], [0.10, 0.90])
        days_since_last_purchase = clamp(random.normalvariate(12, 15), 1, 120)

    elif profile == "mass_tourist_group":
        loyalty_status_score = weighted_choice([0, 1, 2], [0.48, 0.38, 0.14])
        bonus_balance = int(random.lognormvariate(7.0, 0.85))
        purchase_frequency_180d = clamp(random.normalvariate(1.4, 0.8), 0.0, 3.5)
        cancel_ratio = clamp(random.betavariate(2.1, 7.5), 0.02, 0.40)
        no_show_ratio = clamp(random.betavariate(1.6, 8.0), 0.0, 0.20)
        average_order_value = clamp(random.normalvariate(11000, 3000), 4500, 22000)
        ancillary_services_avg_count = clamp(random.normalvariate(0.9, 0.5), 0.0, 2.6)
        group_size = weighted_choice([2, 3, 4, 5, 6], [0.18, 0.22, 0.25, 0.22, 0.13])
        booking_class = weighted_choice(
            ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS"],
            [0.84, 0.13, 0.03],
        )
        corporate_contract_flag = weighted_choice(["YES", "NO"], [0.03, 0.97])
        days_since_last_purchase = clamp(random.normalvariate(55, 35), 1, 220)

    elif profile == "inactive_loyal":
        loyalty_status_score = weighted_choice([2, 3, 4], [0.25, 0.45, 0.30])
        bonus_balance = int(random.lognormvariate(9.1, 0.55))
        purchase_frequency_180d = clamp(random.normalvariate(0.9, 0.6), 0.0, 2.8)
        cancel_ratio = clamp(random.betavariate(1.5, 10.0), 0.0, 0.24)
        no_show_ratio = clamp(random.betavariate(1.2, 11.0), 0.0, 0.16)
        average_order_value = clamp(random.normalvariate(17000, 4500), 7000, 32000)
        ancillary_services_avg_count = clamp(random.normalvariate(1.7, 0.7), 0.0, 4.0)
        group_size = weighted_choice([1, 2, 3], [0.72, 0.20, 0.08])
        booking_class = weighted_choice(
            ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"],
            [0.28, 0.18, 0.44, 0.10],
        )
        corporate_contract_flag = weighted_choice(["YES", "NO"], [0.25, 0.75])
        days_since_last_purchase = clamp(random.normalvariate(125, 40), 30, 320)

    elif profile == "problematic_client":
        loyalty_status_score = weighted_choice([0, 1, 2], [0.50, 0.35, 0.15])
        bonus_balance = int(random.lognormvariate(7.3, 0.80))
        purchase_frequency_180d = clamp(random.normalvariate(1.6, 0.9), 0.0, 4.2)
        cancel_ratio = clamp(random.betavariate(4.2, 4.5), 0.15, 0.80)
        no_show_ratio = clamp(random.betavariate(3.0, 5.0), 0.05, 0.42)
        average_order_value = clamp(random.normalvariate(9000, 2600), 3500, 20000)
        ancillary_services_avg_count = clamp(random.normalvariate(0.7, 0.45), 0.0, 2.2)
        group_size = weighted_choice([1, 2, 3, 4], [0.70, 0.15, 0.10, 0.05])
        booking_class = weighted_choice(
            ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS"],
            [0.82, 0.13, 0.05],
        )
        corporate_contract_flag = weighted_choice(["YES", "NO"], [0.08, 0.92])
        days_since_last_purchase = clamp(random.normalvariate(70, 45), 1, 260)

    else:
        raise ValueError(f"Unknown profile: {profile}")

    features = {
        "client_profile": profile,
        "loyalty_status_score": int(loyalty_status_score),
        "bonus_balance": int(max(0, bonus_balance)),
        "purchase_frequency_180d": round2(purchase_frequency_180d),
        "cancel_ratio": round3(cancel_ratio),
        "no_show_ratio": round3(no_show_ratio),
        "average_order_value": round2(average_order_value),
        "ancillary_services_avg_count": round2(ancillary_services_avg_count),
        "group_size": int(group_size),
        "booking_class": booking_class,
        "corporate_contract_flag": corporate_contract_flag,
        "days_since_last_purchase": int(days_since_last_purchase),
    }

    return apply_noise(features)


def main() -> None:
    rows: list[dict[str, Any]] = []

    for _ in range(ROWS_COUNT):
        profile = gen_profile()
        features = generate_features(profile)
        features["margin_value_180d"] = compute_margin_value(features)
        rows.append(features)

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Файл '{OUTPUT_FILE}' создан.")
    print(f"Количество строк: {len(rows)}")


if __name__ == "__main__":
    main()