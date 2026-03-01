import numpy as np
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    mean_absolute_percentage_error,
)
from models.linear_trend import MonthlyTrendRegressor
from models.sarima_trend import MonthlySARIMATrendRegressor


def evaluate_linear_trend(values: np.ndarray) -> dict | None:
    """
    Evaluate linear regression model using rolling one-step-ahead forecast.

    Returns None if insufficient data.
    """
    if len(values) < 4:
        return None

    preds, actuals = [], []

    for i in range(3, len(values)):
        train = values[:i]
        try:
            model = MonthlyTrendRegressor().fit(train)
            pred = model.predict_next()
        except Exception:
            pred = np.mean(train) if len(train) > 0 else 0.0

        preds.append(pred)
        actuals.append(values[i])

    if not preds:
        return None

    actuals_arr = np.array(actuals)
    preds_arr = np.array(preds)

    return {
        "model": "Linear Regression",
        "mae": round(mean_absolute_error(actuals_arr, preds_arr), 2),
        "rmse": round(np.sqrt(mean_squared_error(actuals_arr, preds_arr)), 2),
        "r2": round(r2_score(actuals_arr, preds_arr), 3),
        "n_test": len(preds),
    }


def evaluate_sarima(values: np.ndarray, seasonal_period: int = 12) -> dict | None:
    """
    Evaluate SARIMA model using rolling one-step-ahead forecast.
    Falls back to recent mean when model fitting fails.

    Returns None if insufficient data.
    """
    if len(values) < seasonal_period + 4:
        return None

    preds, actuals = [], []
    y = np.asarray(values, dtype=float)

    start_idx = max(seasonal_period, 12)

    for i in range(start_idx, len(y)):
        train = y[:i]
        try:
            model = MonthlySARIMATrendRegressor(
                seasonal_period=seasonal_period, max_pdq=3, max_PDQ=2, stepwise=True
            ).fit(train)

            if model.is_fitted:
                pred = model.predict_next()
            else:
                pred = np.mean(train[-6:]) if len(train) >= 6 else np.mean(train)

        except Exception:
            pred = np.mean(train[-6:]) if len(train) >= 6 else np.mean(train)

        preds.append(pred)
        actuals.append(y[i])

    if not preds:
        return None

    actuals_arr = np.array(actuals)
    preds_arr = np.array(preds)

    return {
        "model": "SARIMA",
        "mae": round(mean_absolute_error(actuals_arr, preds_arr), 2),
        "rmse": round(np.sqrt(mean_squared_error(actuals_arr, preds_arr)), 2),
        "r2": round(r2_score(actuals_arr, preds_arr), 3),
        "n_test": len(preds),
    }


def evaluate_naive_mean(values: np.ndarray, window: int = 6) -> dict | None:
    """
    Evaluate naive recent-mean forecast (strong baseline for irregular series).
    Uses last 'window' months for prediction.
    """
    if len(values) < window + 3:
        return None

    preds, actuals = [], []

    for i in range(window, len(values)):
        train = values[:i]
        pred = np.mean(train[-window:]) if len(train) >= window else np.mean(train)
        preds.append(pred)
        actuals.append(values[i])

    if not preds:
        return None

    actuals_arr = np.array(actuals)
    preds_arr = np.array(preds)

    return {
        "model": "Naive Mean",
        "mae": round(mean_absolute_error(actuals_arr, preds_arr), 2),
        "rmse": round(np.sqrt(mean_squared_error(actuals_arr, preds_arr)), 2),
        "r2": round(r2_score(actuals_arr, preds_arr), 3),
        "n_test": len(preds),
    }


def evaluate_model(
    values: np.ndarray,
    model_type: str = "linear",
    min_train_months: int = 12,
    min_test_points: int = 6,
) -> dict | None:
    """
    Generic rolling one-step-ahead evaluation for different model types.

    Supported model_type values:
        'linear'   → Linear trend
        'sarima'   → Seasonal ARIMA
        'mean'     → Naive recent mean baseline

    Returns None if not enough data for meaningful evaluation.
    """
    if len(values) < min_train_months + min_test_points:
        return None

    preds, actuals = [], []
    start_idx = min_train_months

    for i in range(start_idx, len(values)):
        train = values[:i]

        try:
            if model_type == "linear":
                model = MonthlyTrendRegressor().fit(train)
                pred = model.predict_next()

            elif model_type == "sarima":
                model = MonthlySARIMATrendRegressor(
                    seasonal_period=12,
                    max_pdq=2,  # conservative for stability
                    max_PDQ=1,
                    stepwise=True,
                ).fit(train)
                pred = model.predict_next() if model.is_fitted else np.mean(train[-6:])

            elif model_type == "mean":
                pred = np.mean(train[-6:]) if len(train) >= 6 else np.mean(train)

            else:
                raise ValueError(f"Unsupported model_type: {model_type}")

        except Exception:
            # Safe fallback
            pred = np.mean(train[-6:]) if len(train) >= 6 else np.mean(train)

        preds.append(pred)
        actuals.append(values[i])

    if len(preds) < min_test_points:
        return None

    actuals_arr = np.array(actuals)
    preds_arr = np.array(preds)

    # MAPE - only on positive actuals
    mask = actuals_arr > 0
    mape = (
        mean_absolute_percentage_error(actuals_arr[mask], preds_arr[mask]) * 100
        if np.any(mask)
        else np.nan
    )

    return {
        "model": model_type.capitalize(),
        "mae": round(mean_absolute_error(actuals_arr, preds_arr), 2),
        "rmse": round(np.sqrt(mean_squared_error(actuals_arr, preds_arr)), 2),
        "mape": round(mape, 1) if not np.isnan(mape) else np.nan,
        "r2": round(r2_score(actuals_arr, preds_arr), 3),
        "n_test": len(preds),
        "n_train_avg": round(
            np.mean([len(values[:j]) for j in range(start_idx, len(values))])
        ),
    }


# ──────────────────────────────────────────────────────────────
#          Convenience function to compare all models
# ──────────────────────────────────────────────────────────────


def compare_models(values: np.ndarray) -> dict:
    """
    Run evaluation for multiple models and return results in one dictionary.
    Useful for reporting/comparison tables.
    """
    results = {}

    for model_type in ["mean", "linear", "sarima"]:
        metrics = evaluate_model(
            values=values, model_type=model_type, min_train_months=12, min_test_points=6
        )
        if metrics:
            results[model_type] = metrics

    return results
