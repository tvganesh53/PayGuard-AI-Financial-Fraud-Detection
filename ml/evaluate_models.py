import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    average_precision_score,
    roc_auc_score,
    confusion_matrix,
    precision_recall_curve,
    roc_curve
)

def evaluate_model_performance(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    threshold: float = 0.5
) -> Dict[str, Any]:
    """
    Computes comprehensive evaluation metrics given ground truth labels, predicted probabilities, and a threshold.
    """
    y_pred = (y_prob >= threshold).astype(int)

    precision = float(precision_score(y_true, y_pred, zero_division=0))
    recall = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    auprc = float(average_precision_score(y_true, y_prob))
    
    try:
        roc_auc = float(roc_auc_score(y_true, y_prob))
    except ValueError:
        roc_auc = 0.5

    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()

    return {
        "threshold": float(threshold),
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "auprc": auprc,
        "roc_auc": roc_auc,
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp)
        },
        "total_samples": int(len(y_true)),
        "actual_frauds": int(np.sum(y_true)),
        "predicted_frauds": int(np.sum(y_pred))
    }

def get_pr_curve_data(y_true: np.ndarray, y_prob: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Returns precision, recall, thresholds arrays for plotting PR curves."""
    precision, recall, thresholds = precision_recall_curve(y_true, y_prob)
    return precision, recall, thresholds

def get_roc_curve_data(y_true: np.ndarray, y_prob: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Returns fpr, tpr, thresholds arrays for plotting ROC curves."""
    fpr, tpr, thresholds = roc_curve(y_true, y_prob)
    return fpr, tpr, thresholds
