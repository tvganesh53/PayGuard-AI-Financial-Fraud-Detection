import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.metrics import precision_score, recall_score, f1_score

def optimize_threshold(
    y_val: np.ndarray,
    y_val_prob: np.ndarray,
    target_metric: str = "f1"
) -> Dict[str, Any]:
    """
    Sweeps thresholds from 0.01 to 0.99 on Validation set to find optimal threshold for target metric (F1).
    Returns threshold curve history, best threshold, best metrics, and comparison with 0.90 production threshold.
    """
    thresholds = np.linspace(0.01, 0.99, 99)
    history = []

    best_threshold = 0.50
    best_score = -1.0
    best_metrics = {}

    for t in thresholds:
        t_val = round(float(t), 2)
        y_pred = (y_val_prob >= t_val).astype(int)
        
        p = float(precision_score(y_val, y_pred, zero_division=0))
        r = float(recall_score(y_val, y_pred, zero_division=0))
        f1 = float(f1_score(y_val, y_pred, zero_division=0))

        item = {
            "threshold": t_val,
            "precision": p,
            "recall": r,
            "f1_score": f1
        }
        history.append(item)

        score = f1 if target_metric == "f1" else p
        if score > best_score:
            best_score = score
            best_threshold = t_val
            best_metrics = item

    # Compare with production 0.90 threshold
    prod_pred = (y_val_prob >= 0.90).astype(int)
    prod_p = float(precision_score(y_val, prod_pred, zero_division=0))
    prod_r = float(recall_score(y_val, prod_pred, zero_division=0))
    prod_f1 = float(f1_score(y_val, prod_pred, zero_division=0))

    return {
        "best_threshold": best_threshold,
        "best_f1_score": best_metrics.get("f1_score", 0.0),
        "best_precision": best_metrics.get("precision", 0.0),
        "best_recall": best_metrics.get("recall", 0.0),
        "production_threshold_0_90": {
            "threshold": 0.90,
            "precision": prod_p,
            "recall": prod_r,
            "f1_score": prod_f1
        },
        "history": history
    }
