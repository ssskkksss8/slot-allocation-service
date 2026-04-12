from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


DATA_FILE = "historical_clients.csv"
OUTPUT_WITH_PRIORITY = "historical_clients_with_priority_negative_behavior.csv"
OUTPUT_COEFFICIENTS_JSON = "priority_coefficients_negative_behavior.json"
OUTPUT_STAGE1_CSV = "stage1_criteria_coefficients_negative_behavior.csv"
OUTPUT_STAGE2_CSV = "stage2_group_coefficients_negative_behavior.csv"
OUTPUT_FINAL_FORMULA_CSV = "final_priority_formula_negative_behavior_0_100.csv"

RANDOM_STATE = 42
TEST_SIZE = 0.2
RIDGE_ALPHA_STAGE1 = 1.0
RIDGE_ALPHA_STAGE2 = 1.0


@dataclass
class Stage1Coefficient:
    group_name: str
    feature_name: str
    raw_coefficient: float
    abs_coefficient: float
    signed_weight_in_group: float
    signed_weight_in_group_0_100: float
    global_weight_0_100: float


@dataclass
class Stage2GroupCoefficient:
    group_name: str
    group_coefficient: float
    abs_group_coefficient: float
    normalized_group_weight: float
    normalized_group_weight_0_100: float


@dataclass
class FinalPriorityCoefficient:
    group_name: str
    feature_name: str
    raw_coefficient: float
    group_weight_0_100: float
    signed_weight_in_group_0_100: float
    final_weight_0_100: float


def load_data(path: str | Path) -> pd.DataFrame:
    df = pd.read_csv(path)

    required_columns = {
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
    }

    missing = required_columns - set(df.columns)
    if missing:
        raise ValueError(f"В файле отсутствуют обязательные столбцы: {sorted(missing)}")

    return df


def map_booking_class(value: str) -> int:
    mapping = {
        "ECONOMY": 1,
        "PREMIUM_ECONOMY": 2,
        "BUSINESS": 3,
        "FIRST": 4,
    }
    return mapping.get(str(value).strip().upper(), 1)


def map_corporate_flag(value: str) -> int:
    return 1 if str(value).strip().upper() == "YES" else 0


def recompute_target_with_stronger_behavior_penalty(df: pd.DataFrame) -> pd.Series:
    purchase_frequency = df["purchase_frequency_180d"].astype(float)
    avg_order = df["average_order_value"].astype(float)
    anc_count = df["ancillary_services_avg_count"].astype(float)
    cancel_ratio = df["cancel_ratio"].astype(float)
    no_show_ratio = df["no_show_ratio"].astype(float)
    loyalty_status = df["loyalty_status_score"].astype(float)
    bonus_balance = df["bonus_balance"].astype(float)
    group_size = df["group_size"].astype(int)
    booking_class = df["booking_class"].astype(str)
    corporate = df["corporate_contract_flag"].map(map_corporate_flag).astype(float)
    days_since_last_purchase = df["days_since_last_purchase"].astype(float)

    ticket_revenue = purchase_frequency * avg_order
    ancillary_revenue = purchase_frequency * anc_count * 1800.0

    class_multiplier = booking_class.map(
        {
            "ECONOMY": 1.00,
            "PREMIUM_ECONOMY": 1.18,
            "BUSINESS": 1.38,
            "FIRST": 1.62,
        }
    ).fillna(1.00)

    gross_revenue = (ticket_revenue + ancillary_revenue) * class_multiplier

    corporate_bonus = np.where(corporate == 1, 9000.0, 0.0)

    loyalty_bonus = loyalty_status * 3500.0 + np.log1p(bonus_balance) * 900.0

    cancel_loss = gross_revenue * cancel_ratio * 0.95

    no_show_loss = gross_revenue * no_show_ratio * 1.65

    cancel_behavior_penalty = cancel_ratio * 35000.0
    no_show_behavior_penalty = no_show_ratio * 85000.0

    high_no_show_penalty = np.where(no_show_ratio > 0.18, 22000.0, 0.0)

    recency_penalty = np.maximum(0.0, (days_since_last_purchase - 45.0) * 180.0)

    channel_cost = gross_revenue * np.where(corporate == 1, 0.07, 0.08)

    group_effect = np.select(
        [
            group_size == 1,
            group_size == 2,
            group_size == 3,
            group_size == 4,
            group_size >= 5,
        ],
        [
            0.0,
            2800.0,
            2200.0,
            800.0,
            -1800.0,
        ],
        default=0.0,
    )

    interaction = np.zeros(len(df), dtype=float)

    interaction += np.where(
        (corporate == 1) & (booking_class.isin(["BUSINESS", "FIRST"])),
        3500.0,
        0.0,
    )

    interaction += np.where((cancel_ratio > 0.45) & (avg_order > 22000), -14000.0, 0.0)
    interaction += np.where((purchase_frequency > 4.0) & (cancel_ratio < 0.15), 4500.0, 0.0)

    interaction += np.where(no_show_ratio > 0.20, -25000.0, 0.0)

    noise = np.random.default_rng(RANDOM_STATE).normal(0.0, 4500.0, len(df))

    margin_value = (
        gross_revenue
        + corporate_bonus
        + loyalty_bonus
        + group_effect
        + interaction
        - cancel_loss
        - no_show_loss
        - cancel_behavior_penalty
        - no_show_behavior_penalty
        - high_no_show_penalty
        - channel_cost
        - recency_penalty
        + noise
    )

    return pd.Series(np.maximum(0.0, margin_value).round(2), index=df.index)


def prepare_criteria_features(df: pd.DataFrame) -> pd.DataFrame:
    prepared = pd.DataFrame(index=df.index)

    prepared["purchase_frequency_score"] = df["purchase_frequency_180d"].astype(float)
    prepared["average_order_value_score"] = df["average_order_value"].astype(float)
    prepared["ancillary_services_score"] = df["ancillary_services_avg_count"].astype(float)
    prepared["booking_class_score"] = df["booking_class"].map(map_booking_class).astype(float)
    prepared["corporate_contract_score"] = df["corporate_contract_flag"].map(map_corporate_flag).astype(float)

    prepared["cancel_ratio"] = df["cancel_ratio"].astype(float)
    prepared["no_show_ratio"] = df["no_show_ratio"].astype(float)

    prepared["loyalty_status_score"] = df["loyalty_status_score"].astype(float)
    prepared["bonus_balance_score"] = np.log1p(df["bonus_balance"].astype(float))
    prepared["days_since_last_purchase"] = df["days_since_last_purchase"].astype(float)

    return prepared


def get_feature_groups() -> Dict[str, List[str]]:
    return {
        "commercial_value": [
            "purchase_frequency_score",
            "average_order_value_score",
            "ancillary_services_score",
            "booking_class_score",
            "corporate_contract_score",
        ],
        "behavior_risk": [
            "cancel_ratio",
            "no_show_ratio",
        ],
        "engagement_level": [
            "loyalty_status_score",
            "bonus_balance_score",
            "days_since_last_purchase",
        ],
    }


def fit_stage1_model(x_train_scaled: pd.DataFrame, y_train: pd.Series) -> Ridge:
    model = Ridge(alpha=RIDGE_ALPHA_STAGE1)
    model.fit(x_train_scaled, y_train)
    return model


def extract_stage1_coefficients(
    model: Ridge,
    feature_names: List[str],
    feature_groups: Dict[str, List[str]],
) -> List[Stage1Coefficient]:
    coef_map = {feature: float(coef) for feature, coef in zip(feature_names, model.coef_)}

    global_abs_max = max(abs(v) for v in coef_map.values()) if coef_map else 1.0
    if global_abs_max == 0:
        global_abs_max = 1.0

    result: List[Stage1Coefficient] = []

    for group_name, features in feature_groups.items():
        abs_sum = sum(abs(coef_map[f]) for f in features)
        if abs_sum == 0:
            abs_sum = 1.0

        for feature in features:
            raw_coef = coef_map[feature]
            abs_coef = abs(raw_coef)
            signed_weight = raw_coef / abs_sum

            result.append(
                Stage1Coefficient(
                    group_name=group_name,
                    feature_name=feature,
                    raw_coefficient=raw_coef,
                    abs_coefficient=abs_coef,
                    signed_weight_in_group=signed_weight,
                    signed_weight_in_group_0_100=signed_weight * 100.0,
                    global_weight_0_100=(abs_coef / global_abs_max) * 100.0,
                )
            )

    return result


def build_group_scores(
    x_scaled: pd.DataFrame,
    stage1_coefficients: List[Stage1Coefficient],
) -> pd.DataFrame:
    group_scores = pd.DataFrame(index=x_scaled.index)

    grouped: Dict[str, List[Stage1Coefficient]] = {}
    for coef in stage1_coefficients:
        grouped.setdefault(coef.group_name, []).append(coef)

    for group_name, items in grouped.items():
        score = np.zeros(len(x_scaled), dtype=float)
        for item in items:
            score += x_scaled[item.feature_name].values * item.signed_weight_in_group
        group_scores[group_name] = score

    return group_scores


def fit_stage2_model(group_scores_train: pd.DataFrame, y_train: pd.Series) -> Ridge:
    model = Ridge(alpha=RIDGE_ALPHA_STAGE2)
    model.fit(group_scores_train, y_train)
    return model


def extract_stage2_coefficients(model: Ridge, group_names: List[str]) -> List[Stage2GroupCoefficient]:
    abs_sum = float(np.sum(np.abs(model.coef_)))
    if abs_sum == 0:
        abs_sum = 1.0

    result: List[Stage2GroupCoefficient] = []

    for name, coef in zip(group_names, model.coef_):
        coef = float(coef)
        abs_coef = abs(coef)
        normalized_weight = abs_coef / abs_sum
        result.append(
            Stage2GroupCoefficient(
                group_name=name,
                group_coefficient=coef,
                abs_group_coefficient=abs_coef,
                normalized_group_weight=normalized_weight,
                normalized_group_weight_0_100=normalized_weight * 100.0,
            )
        )

    return result


def build_final_priority_coefficients(
    stage1_coefficients: List[Stage1Coefficient],
    stage2_coefficients: List[Stage2GroupCoefficient],
) -> List[FinalPriorityCoefficient]:
    group_weight_map = {
        item.group_name: item.normalized_group_weight_0_100
        for item in stage2_coefficients
    }

    result: List[FinalPriorityCoefficient] = []

    for item in stage1_coefficients:
        group_weight = group_weight_map[item.group_name]
        final_weight = group_weight * item.signed_weight_in_group_0_100 / 100.0

        result.append(
            FinalPriorityCoefficient(
                group_name=item.group_name,
                feature_name=item.feature_name,
                raw_coefficient=item.raw_coefficient,
                group_weight_0_100=group_weight,
                signed_weight_in_group_0_100=item.signed_weight_in_group_0_100,
                final_weight_0_100=final_weight,
            )
        )

    result.sort(key=lambda x: abs(x.final_weight_0_100), reverse=True)
    return result


def evaluate_regression(y_true: pd.Series, y_pred: np.ndarray) -> dict:
    return {
        "r2": float(r2_score(y_true, y_pred)),
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
    }


def normalize_0_100(values: np.ndarray) -> np.ndarray:
    vmin = float(np.min(values))
    vmax = float(np.max(values))
    if np.isclose(vmin, vmax):
        return np.full_like(values, 50.0, dtype=float)
    return 100.0 * (values - vmin) / (vmax - vmin)


def print_stage1_coefficients(stage1_coefficients: List[Stage1Coefficient]) -> None:
    print("\nКоэффициенты критериев внутри групп")
    print("=" * 150)

    by_group: Dict[str, List[Stage1Coefficient]] = {}
    for item in stage1_coefficients:
        by_group.setdefault(item.group_name, []).append(item)

    for group_name, items in by_group.items():
        print(f"\nГруппа: {group_name}")
        items_sorted = sorted(items, key=lambda x: x.abs_coefficient, reverse=True)
        for item in items_sorted:
            sign = "+" if item.raw_coefficient >= 0 else ""
            print(
                f"  {item.feature_name:<32} "
                f"raw_coef={sign}{item.raw_coefficient:>12.4f}   "
                f"abs={item.abs_coefficient:>12.4f}   "
                f"signed_group_weight={item.signed_weight_in_group:>9.4f}   "
                f"signed_group_0_100={item.signed_weight_in_group_0_100:>8.2f}   "
                f"global_0_100={item.global_weight_0_100:>8.2f}"
            )


def print_stage2_coefficients(stage2_coefficients: List[Stage2GroupCoefficient]) -> None:
    print("\nКоэффициенты групп")
    print("=" * 150)

    sorted_items = sorted(stage2_coefficients, key=lambda x: x.abs_group_coefficient, reverse=True)
    for item in sorted_items:
        sign = "+" if item.group_coefficient >= 0 else ""
        print(
            f"{item.group_name:<24} "
            f"group_coef={sign}{item.group_coefficient:>12.4f}   "
            f"abs={item.abs_group_coefficient:>12.4f}   "
            f"group_weight={item.normalized_group_weight:>8.4f}   "
            f"group_0_100={item.normalized_group_weight_0_100:>8.2f}"
        )


def print_final_priority_formula_0_100(final_coefficients: List[FinalPriorityCoefficient]) -> None:
    print("\nИТОГОВАЯ ФОРМУЛА ПРИОРИТЕТА")
    print("=" * 150)
    print("Положительные коэффициенты повышают полезность клиента.")
    print("Отрицательные коэффициенты понижают полезность клиента.")
    print()

    print("priority_score =")
    for i, item in enumerate(final_coefficients):
        sign = "+" if item.final_weight_0_100 >= 0 else "-"
        prefix = "    " if i == 0 else "  "
        print(f"{prefix}{sign} {abs(item.final_weight_0_100):6.2f} * {item.feature_name}")

    print()
    print("Важно:")
    print("- cancel_ratio и no_show_ratio должны иметь отрицательный вклад;")
    print("- days_since_last_purchase тоже должен иметь отрицательный вклад;")
    print("- purchase_frequency_score и average_order_value_score должны оставаться положительными.")


def save_coefficients_json(
    stage1_coefficients: List[Stage1Coefficient],
    stage2_coefficients: List[Stage2GroupCoefficient],
    final_coefficients: List[FinalPriorityCoefficient],
    stage1_intercept: float,
    stage2_intercept: float,
    train_metrics_stage1: dict,
    test_metrics_stage1: dict,
    train_metrics_stage2: dict,
    test_metrics_stage2: dict,
    path: str | Path,
) -> None:
    payload = {
        "stage1_intercept": stage1_intercept,
        "stage2_intercept": stage2_intercept,
        "stage1_criteria_coefficients": [asdict(x) for x in stage1_coefficients],
        "stage2_group_coefficients": [asdict(x) for x in stage2_coefficients],
        "final_priority_coefficients": [asdict(x) for x in final_coefficients],
        "stage1_metrics_train": train_metrics_stage1,
        "stage1_metrics_test": test_metrics_stage1,
        "stage2_metrics_train": train_metrics_stage2,
        "stage2_metrics_test": test_metrics_stage2,
    }

    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def build_coefficients_tables(
    stage1_coefficients: List[Stage1Coefficient],
    stage2_coefficients: List[Stage2GroupCoefficient],
    final_coefficients: List[FinalPriorityCoefficient],
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    stage1_df = pd.DataFrame([asdict(x) for x in stage1_coefficients])
    stage2_df = pd.DataFrame([asdict(x) for x in stage2_coefficients])
    final_df = pd.DataFrame([asdict(x) for x in final_coefficients])

    stage1_df = stage1_df.sort_values(
        by=["group_name", "abs_coefficient"],
        ascending=[True, False],
    ).reset_index(drop=True)

    stage2_df = stage2_df.sort_values(
        by="abs_group_coefficient",
        ascending=False,
    ).reset_index(drop=True)

    final_df = final_df.sort_values(
        by="final_weight_0_100",
        ascending=True,
    ).reset_index(drop=True)

    return stage1_df, stage2_df, final_df


def main() -> None:
    df = load_data(DATA_FILE)

    y = recompute_target_with_stronger_behavior_penalty(df)

    criteria_df = prepare_criteria_features(df)
    feature_groups = get_feature_groups()

    x_train, x_test, y_train, y_test = train_test_split(
        criteria_df,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
    )

    scaler = StandardScaler()
    x_train_scaled_np = scaler.fit_transform(x_train)
    x_test_scaled_np = scaler.transform(x_test)
    x_all_scaled_np = scaler.transform(criteria_df)

    x_train_scaled = pd.DataFrame(x_train_scaled_np, columns=criteria_df.columns, index=x_train.index)
    x_test_scaled = pd.DataFrame(x_test_scaled_np, columns=criteria_df.columns, index=x_test.index)
    x_all_scaled = pd.DataFrame(x_all_scaled_np, columns=criteria_df.columns, index=criteria_df.index)

    stage1_model = fit_stage1_model(x_train_scaled, y_train)
    train_pred_stage1 = stage1_model.predict(x_train_scaled)
    test_pred_stage1 = stage1_model.predict(x_test_scaled)

    train_metrics_stage1 = evaluate_regression(y_train, train_pred_stage1)
    test_metrics_stage1 = evaluate_regression(y_test, test_pred_stage1)

    stage1_coefficients = extract_stage1_coefficients(
        model=stage1_model,
        feature_names=list(criteria_df.columns),
        feature_groups=feature_groups,
    )

    group_scores_train = build_group_scores(x_train_scaled, stage1_coefficients)
    group_scores_test = build_group_scores(x_test_scaled, stage1_coefficients)
    group_scores_all = build_group_scores(x_all_scaled, stage1_coefficients)

    stage2_model = fit_stage2_model(group_scores_train, y_train)
    train_pred_stage2 = stage2_model.predict(group_scores_train)
    test_pred_stage2 = stage2_model.predict(group_scores_test)

    train_metrics_stage2 = evaluate_regression(y_train, train_pred_stage2)
    test_metrics_stage2 = evaluate_regression(y_test, test_pred_stage2)

    stage2_coefficients = extract_stage2_coefficients(
        model=stage2_model,
        group_names=list(group_scores_train.columns),
    )

    final_priority_coefficients = build_final_priority_coefficients(
        stage1_coefficients=stage1_coefficients,
        stage2_coefficients=stage2_coefficients,
    )

    priority_raw = stage2_model.predict(group_scores_all)
    priority_score = normalize_0_100(priority_raw)

    result_df = df.copy()
    result_df["recomputed_margin_value_180d"] = y
    result_df["commercial_value_score"] = group_scores_all["commercial_value"]
    result_df["behavior_risk_score"] = group_scores_all["behavior_risk"]
    result_df["engagement_level_score"] = group_scores_all["engagement_level"]
    result_df["priority_raw"] = priority_raw
    result_df["priority_score_0_100"] = np.round(priority_score, 2)

    result_df = result_df.sort_values("priority_score_0_100", ascending=False)
    result_df.to_csv(OUTPUT_WITH_PRIORITY, index=False, encoding="utf-8")

    stage1_df, stage2_df, final_df = build_coefficients_tables(
        stage1_coefficients, stage2_coefficients, final_priority_coefficients
    )
    stage1_df.to_csv(OUTPUT_STAGE1_CSV, index=False, encoding="utf-8")
    stage2_df.to_csv(OUTPUT_STAGE2_CSV, index=False, encoding="utf-8")
    final_df.to_csv(OUTPUT_FINAL_FORMULA_CSV, index=False, encoding="utf-8")

    print("ЭТАП 1: модель по критериям")
    print("=" * 150)
    print(f"Train R2   : {train_metrics_stage1['r2']:.4f}")
    print(f"Test R2    : {test_metrics_stage1['r2']:.4f}")
    print(f"Train MAE  : {train_metrics_stage1['mae']:.2f}")
    print(f"Test MAE   : {test_metrics_stage1['mae']:.2f}")
    print(f"Train RMSE : {train_metrics_stage1['rmse']:.2f}")
    print(f"Test RMSE  : {test_metrics_stage1['rmse']:.2f}")
    print(f"Intercept  : {float(stage1_model.intercept_):.4f}")

    print_stage1_coefficients(stage1_coefficients)

    print("\nЭТАП 2: модель по группам")
    print("=" * 150)
    print(f"Train R2   : {train_metrics_stage2['r2']:.4f}")
    print(f"Test R2    : {test_metrics_stage2['r2']:.4f}")
    print(f"Train MAE  : {train_metrics_stage2['mae']:.2f}")
    print(f"Test MAE   : {test_metrics_stage2['mae']:.2f}")
    print(f"Train RMSE : {train_metrics_stage2['rmse']:.2f}")
    print(f"Test RMSE  : {test_metrics_stage2['rmse']:.2f}")
    print(f"Intercept  : {float(stage2_model.intercept_):.4f}")

    print_stage2_coefficients(stage2_coefficients)
    print_final_priority_formula_0_100(final_priority_coefficients)

    print("\nТоп-10 клиентов по приоритету")
    print("=" * 150)
    print(
        result_df[
            [
                "client_profile",
                "booking_class",
                "corporate_contract_flag",
                "recomputed_margin_value_180d",
                "commercial_value_score",
                "behavior_risk_score",
                "engagement_level_score",
                "priority_raw",
                "priority_score_0_100",
            ]
        ].head(10).to_string(index=False)
    )

    save_coefficients_json(
        stage1_coefficients=stage1_coefficients,
        stage2_coefficients=stage2_coefficients,
        final_coefficients=final_priority_coefficients,
        stage1_intercept=float(stage1_model.intercept_),
        stage2_intercept=float(stage2_model.intercept_),
        train_metrics_stage1=train_metrics_stage1,
        test_metrics_stage1=test_metrics_stage1,
        train_metrics_stage2=train_metrics_stage2,
        test_metrics_stage2=test_metrics_stage2,
        path=OUTPUT_COEFFICIENTS_JSON,
    )

    print("\nСохранены файлы:")
    print(f"- {OUTPUT_WITH_PRIORITY}")
    print(f"- {OUTPUT_STAGE1_CSV}")
    print(f"- {OUTPUT_STAGE2_CSV}")
    print(f"- {OUTPUT_FINAL_FORMULA_CSV}")
    print(f"- {OUTPUT_COEFFICIENTS_JSON}")


if __name__ == "__main__":
    main()