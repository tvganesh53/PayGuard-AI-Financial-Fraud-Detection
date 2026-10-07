import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE

def calculate_scale_pos_weight(y_train: pd.Series) -> float:
    """Calculates scale_pos_weight = negative_samples / positive_samples."""
    neg = (y_train == 0).sum()
    pos = (y_train == 1).sum()
    return float(neg / max(pos, 1))

def get_experiment_models(y_train: pd.Series, random_state: int = 42) -> Dict[str, Dict[str, Any]]:
    """
    Returns a dictionary of all 9 model configurations across 3 algorithms and 3 imbalance handling strategies.
    
    Experiment Matrix:
    1. Logistic Regression - Baseline
    2. Logistic Regression - Class Weight
    3. Logistic Regression - SMOTE
    4. Random Forest - Baseline
    5. Random Forest - Class Weight
    6. Random Forest - SMOTE
    7. XGBoost - Baseline
    8. XGBoost - Class Weight (scale_pos_weight)
    9. XGBoost - SMOTE
    """
    spw = calculate_scale_pos_weight(y_train)

    experiments = {
        # 1. Logistic Regression
        "LR_Baseline": {
            "name": "Logistic Regression (Baseline)",
            "algorithm": "Logistic Regression",
            "technique": "Baseline",
            "model": LogisticRegression(max_iter=1000, random_state=random_state),
            "requires_scaling": True
        },
        "LR_ClassWeight": {
            "name": "Logistic Regression (Class Weight)",
            "algorithm": "Logistic Regression",
            "technique": "Class Weight",
            "model": LogisticRegression(class_weight="balanced", max_iter=1000, random_state=random_state),
            "requires_scaling": True
        },
        "LR_SMOTE": {
            "name": "Logistic Regression (SMOTE)",
            "algorithm": "Logistic Regression",
            "technique": "SMOTE",
            "model": ImbPipeline([
                ("smote", SMOTE(random_state=random_state, k_neighbors=5)),
                ("classifier", LogisticRegression(max_iter=1000, random_state=random_state))
            ]),
            "requires_scaling": True
        },

        # 2. Random Forest
        "RF_Baseline": {
            "name": "Random Forest (Baseline)",
            "algorithm": "Random Forest",
            "technique": "Baseline",
            "model": RandomForestClassifier(n_estimators=50, max_depth=12, max_samples=0.2, random_state=random_state, n_jobs=-1),
            "requires_scaling": False
        },
        "RF_ClassWeight": {
            "name": "Random Forest (Class Weight)",
            "algorithm": "Random Forest",
            "technique": "Class Weight",
            "model": RandomForestClassifier(n_estimators=50, max_depth=12, max_samples=0.2, class_weight="balanced_subsample", random_state=random_state, n_jobs=-1),
            "requires_scaling": False
        },
        "RF_SMOTE": {
            "name": "Random Forest (SMOTE)",
            "algorithm": "Random Forest",
            "technique": "SMOTE",
            "model": ImbPipeline([
                ("smote", SMOTE(random_state=random_state, k_neighbors=5)),
                ("classifier", RandomForestClassifier(n_estimators=50, max_depth=12, max_samples=0.2, random_state=random_state, n_jobs=-1))
            ]),
            "requires_scaling": False
        },

        # 3. XGBoost
        "XGB_Baseline": {
            "name": "XGBoost (Baseline)",
            "algorithm": "XGBoost",
            "technique": "Baseline",
            "model": XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=random_state, n_jobs=-1, eval_metric="logloss"),
            "requires_scaling": False
        },
        "XGB_ClassWeight": {
            "name": "XGBoost (Class Weight)",
            "algorithm": "XGBoost",
            "technique": "Class Weight",
            "model": XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, scale_pos_weight=spw, random_state=random_state, n_jobs=-1, eval_metric="logloss"),
            "requires_scaling": False
        },
        "XGB_SMOTE": {
            "name": "XGBoost (SMOTE)",
            "algorithm": "XGBoost",
            "technique": "SMOTE",
            "model": ImbPipeline([
                ("smote", SMOTE(random_state=random_state, k_neighbors=5)),
                ("classifier", XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=random_state, n_jobs=-1, eval_metric="logloss"))
            ]),
            "requires_scaling": False
        }
    }

    return experiments
