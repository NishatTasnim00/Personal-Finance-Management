from sklearn.linear_model import LinearRegression
import numpy as np


class MonthlyTrendRegressor:
    """
    Simple linear regression trend based on month index.
    Used as baseline or fallback model.
    """

    def __init__(self):
        self.model = LinearRegression()
        self.is_fitted = False

    def fit(self, values):
        """
        values: 1D array-like of monthly totals
        """
        if len(values) < 2:
            return self

        X = np.arange(len(values)).reshape(-1, 1)
        y = np.asarray(values, dtype=float)

        self.model.fit(X, y)
        self.is_fitted = True
        return self

    def predict_next(self):
        if not self.is_fitted:
            raise RuntimeError("Model not fitted")
        next_idx = np.array([[self.model.n_features_in_]])
        return float(self.model.predict(next_idx)[0])

    def get_params(self):
        if not self.is_fitted:
            return {"note": "Linear model not fitted"}
        return {
            "slope": float(self.model.coef_[0]),
            "intercept": float(self.model.intercept_),
        }