import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from typing import Tuple

class LeakageGuardScaler:
    """
    StandardScaler wrapper that enforces train-only fitting to prevent data leakage.
    """
    def __init__(self):
        self.scaler = StandardScaler()
        self.is_fitted = False

    def fit_transform_train(self, X_train: pd.DataFrame) -> Tuple[np.ndarray, StandardScaler]:
        """Fits scaler strictly on X_train and transforms X_train."""
        X_train_scaled = self.scaler.fit_transform(X_train)
        self.is_fitted = True
        return X_train_scaled, self.scaler

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        """Transforms validation or test features using pre-fitted scaler."""
        if not self.is_fitted:
            raise RuntimeError("Scaler must be fitted on X_train before transforming test/val sets!")
        return self.scaler.transform(X)
