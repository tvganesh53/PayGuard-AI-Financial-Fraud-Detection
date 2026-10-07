import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from typing import Tuple, Dict, Any

def load_dataset(data_path: str = "data/paysim.csv", sample_ratio: float = None, random_state: int = 42) -> pd.DataFrame:
    """
    Loads PaySim dataset and validates schema.
    If sample_ratio is provided (e.g. 0.2), performs stratified sampling while preserving fraud ratio.
    """
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    required_cols = ["step", "type", "amount", "nameOrig", "oldbalanceOrg", "newbalanceOrig", "nameDest", "oldbalanceDest", "newbalanceDest", "isFraud", "isFlaggedFraud"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    if sample_ratio and 0.0 < sample_ratio < 1.0:
        print(f"Sampling {sample_ratio*100:.1f}% of dataset using stratified sampling...")
        _, df = train_test_split(
            df,
            test_size=sample_ratio,
            stratify=df["isFraud"],
            random_state=random_state
        )
        df = df.reset_index(drop=True)

    print(f"Loaded dataset: {df.shape[0]:,} rows, {df.shape[1]} columns. Fraud instances: {df['isFraud'].sum():,} ({df['isFraud'].mean()*100:.4f}%)")
    return df

def temporal_split(
    df: pd.DataFrame,
    train_quantile: float = 0.70,
    val_quantile: float = 0.85
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Time-Aware (Temporal) Split based on transaction 'step'.
    Prevents temporal data leakage by simulating production deployment on future time steps.
    """
    steps = df["step"].sort_values()
    train_cutoff = float(steps.quantile(train_quantile))
    val_cutoff = float(steps.quantile(val_quantile))

    train_df = df[df["step"] <= train_cutoff].copy()
    val_df = df[(df["step"] > train_cutoff) & (df["step"] <= val_cutoff)].copy()
    test_df = df[df["step"] > val_cutoff].copy()

    print(f"\n[Time-Aware Temporal Split]")
    print(f"  Train: steps <= {train_cutoff:.0f} | Rows: {len(train_df):,} | Frauds: {train_df['isFraud'].sum():,} ({train_df['isFraud'].mean()*100:.4f}%)")
    print(f"  Val  : steps {train_cutoff:.0f} to {val_cutoff:.0f} | Rows: {len(val_df):,} | Frauds: {val_df['isFraud'].sum():,} ({val_df['isFraud'].mean()*100:.4f}%)")
    print(f"  Test : steps > {val_cutoff:.0f} | Rows: {len(test_df):,} | Frauds: {test_df['isFraud'].sum():,} ({test_df['isFraud'].mean()*100:.4f}%)")

    return train_df, val_df, test_df

def stratified_random_split(
    df: pd.DataFrame,
    val_size: float = 0.15,
    test_size: float = 0.15,
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Standard Stratified Random Split for comparative benchmarking against temporal split.
    """
    total_val_test = val_size + test_size
    train_df, temp_df = train_test_split(
        df,
        test_size=total_val_test,
        stratify=df["isFraud"],
        random_state=random_state
    )
    
    val_prop = val_size / total_val_test
    val_df, test_df = train_test_split(
        temp_df,
        test_size=(1.0 - val_prop),
        stratify=temp_df["isFraud"],
        random_state=random_state
    )

    print(f"\n[Stratified Random Split]")
    print(f"  Train: Rows: {len(train_df):,} | Frauds: {train_df['isFraud'].sum():,} ({train_df['isFraud'].mean()*100:.4f}%)")
    print(f"  Val  : Rows: {len(val_df):,} | Frauds: {val_df['isFraud'].sum():,} ({val_df['isFraud'].mean()*100:.4f}%)")
    print(f"  Test : Rows: {len(test_df):,} | Frauds: {test_df['isFraud'].sum():,} ({test_df['isFraud'].mean()*100:.4f}%)")

    return train_df, val_df, test_df

def get_leakage_audit_summary() -> Dict[str, Any]:
    """
    Returns the formal data leakage audit documentation for report generation.
    """
    return {
        "newbalanceOrig": {
            "status": "EXCLUDED",
            "type": "Post-Transaction Leakage",
            "reason": "Balance of sender immediately after transaction reveals deducted amount before validation."
        },
        "newbalanceDest": {
            "status": "EXCLUDED",
            "type": "Post-Transaction Leakage",
            "reason": "Balance of recipient immediately after transaction."
        },
        "isFlaggedFraud": {
            "status": "EXCLUDED",
            "type": "Heuristic Rule Leakage",
            "reason": "System rule (amount > 200,000); creates target feedback loop and misses non-flagged fraud."
        },
        "nameOrig": {
            "status": "EXCLUDED",
            "type": "Identifier Leakage",
            "reason": "High-cardinality account ID string causes overfitting and fails to generalize."
        },
        "nameDest": {
            "status": "EXCLUDED",
            "type": "Identifier Leakage",
            "reason": "High-cardinality recipient account ID string."
        },
        "Preprocessing": {
            "status": "TRAIN-ONLY FITTING",
            "type": "Scaler Leakage Guard",
            "reason": "Scalers and encoders are fitted strictly on X_train. X_val and X_test are transformed without fitting."
        },
        "SMOTE": {
            "status": "TRAIN-ONLY RESAMPLING",
            "type": "Synthetic Data Leakage Guard",
            "reason": "SMOTE synthetic oversampling is applied ONLY within X_train via imblearn Pipeline. Zero synthetic samples in Val/Test."
        }
    }
