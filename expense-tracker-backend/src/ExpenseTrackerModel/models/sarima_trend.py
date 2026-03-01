import warnings
import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX
from pmdarima import auto_arima

warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)


class MonthlySARIMATrendRegressor:
    """
    SARIMA model with automatic parameter selection via auto_arima.
    Designed for monthly data with yearly seasonality (m=12).
    """

    def __init__(self, seasonal_period=12, max_pdq=3, max_PDQ=2, stepwise=True):
        self.seasonal_period = seasonal_period
        self.max_pdq = max_pdq
        self.max_PDQ = max_PDQ
        self.stepwise = stepwise

        self.model = None
        self.fitted_model = None
        self.is_fitted = False
        self.best_order = None
        self.best_seasonal_order = None

    def fit(self, values):
        if len(values) < self.seasonal_period:
            self.is_fitted = False
            return self

        y = pd.Series(values, dtype=float)
        # Use a dummy start date; relative trends matter more than absolute dates
        y.index = pd.period_range(start="2020-01", periods=len(y), freq="M")

        # Check if we have enough data for seasonality
        # We need at least 2 full cycles (24 months) to reliably estimate seasonality
        # PLUS: auto_arima seasonal differencing often fails if data length is exactly 2*m or slightly more
        # due to differencing eating up samples. Safe margin is 2*m + 1 or higher.
        if len(values) <= 2 * self.seasonal_period:
            use_seasonal = False
            current_m = 1
        else:
            use_seasonal = True
            current_m = self.seasonal_period

        try:
            auto_model = auto_arima(
                y,
                seasonal=use_seasonal,
                m=current_m,
                max_p=self.max_pdq,
                max_d=self.max_pdq,
                max_q=self.max_pdq,
                max_P=self.max_PDQ,
                max_D=self.max_PDQ,
                max_Q=self.max_PDQ,
                stepwise=self.stepwise,
                suppress_warnings=True,
                error_action="ignore",
            )

            self.best_order = auto_model.order
            self.best_seasonal_order = auto_model.seasonal_order

            self.model = SARIMAX(
                y,
                order=self.best_order,
                seasonal_order=self.best_seasonal_order,
                enforce_stationarity=False,
                enforce_invertibility=False,
            )

            self.fitted_model = self.model.fit(disp=0)
            self.is_fitted = True

        except Exception as e:
            print(f"SARIMA auto-fit failed: {e}")
            self.is_fitted = False

        return self

    def predict_next(self):
        if not self.is_fitted or self.fitted_model is None:
            raise RuntimeError("No valid fitted SARIMA model")
        fc = self.fitted_model.get_forecast(steps=1)
        return float(fc.predicted_mean.iloc[0])

    def get_params(self):
        if not self.is_fitted or self.best_order is None:
            return {"note": "SARIMA not fitted"}
        return {
            "order": self.best_order,
            "seasonal_order": self.best_seasonal_order,
            "aic": (
                float(self.fitted_model.aic) if self.fitted_model is not None else None
            ),
        }
