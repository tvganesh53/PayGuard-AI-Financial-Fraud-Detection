import pandas as pd
import numpy as np
from typing import Tuple, List

PRODUCTION_FEATURES = [
    "step",
    "amount",
    "oldbalanceOrg",
    "oldbalanceDest",
    "amount_to_oldbalance_ratio",
    "amount_to_dest_balance_ratio",
    "type_CASH_OUT",
    "type_DEBIT",
    "type_PAYMENT",
    "type_TRANSFER"
]

def engineer_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Reproduces the exact production 10-feature engineering schema:
    1. Computes amount_to_oldbalance_ratio (amount / oldbalanceOrg if > 0 else 0.0)
    2. Computes amount_to_dest_balance_ratio (amount / oldbalanceDest if > 0 else 0.0)
    3. One-hot encodes 'type' into type_CASH_OUT, type_DEBIT, type_PAYMENT, type_TRANSFER
    4. Enforces exclusion of post-transaction/identifier leakages: newbalanceOrig, newbalanceDest, isFlaggedFraud, nameOrig, nameDest.
    Returns:
        X: DataFrame containing the 10 production features
        y: Series containing target label 'isFraud'
    """
    df_engineered = df.copy()

    # Exact leakage-safe ratios matching production predictor.py
    df_engineered["amount_to_oldbalance_ratio"] = np.where(
        df_engineered["oldbalanceOrg"] > 0,
        df_engineered["amount"] / df_engineered["oldbalanceOrg"],
        0.0
    )
    
    df_engineered["amount_to_dest_balance_ratio"] = np.where(
        df_engineered["oldbalanceDest"] > 0,
        df_engineered["amount"] / df_engineered["oldbalanceDest"],
        0.0
    )

    # One-hot encode type
    type_dummies = pd.get_dummies(df_engineered["type"], prefix="type", dtype=float)
    
    # Ensure all required type dummy columns exist
    expected_type_cols = ["type_CASH_OUT", "type_DEBIT", "type_PAYMENT", "type_TRANSFER"]
    for col in expected_type_cols:
        if col not in type_dummies.columns:
            type_dummies[col] = 0.0

    # Combine dummy columns
    df_engineered = pd.concat([df_engineered, type_dummies[expected_type_cols]], axis=1)

    # Extract target if present
    if "isFraud" in df_engineered.columns:
        y = df_engineered["isFraud"].astype(int)
    else:
        y = None

    # Filter to exact production feature schema
    X = df_engineered[PRODUCTION_FEATURES].astype(float)

    return X, y
