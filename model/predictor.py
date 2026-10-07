import os
import json
import uuid
import datetime
import joblib
import pandas as pd
import numpy as np
import xgboost as xgb

REQUIRED_XGBOOST_VERSION = "2.1.4"

class ModelValidationError(Exception):
    pass

def validate_environment(base_dir: str = "."):
    """
    Validates model files, feature count, threshold value, and XGBoost library version.
    Fails fast if any condition is not met.
    """
    model_path = os.path.join(base_dir, "model", "fraud_xgb_model.pkl")
    features_path = os.path.join(base_dir, "model", "features.json")
    threshold_path = os.path.join(base_dir, "model", "threshold.json")
    metadata_path = os.path.join(base_dir, "model", "metadata.json")

    # 1. File existence checks
    for p in [model_path, features_path, threshold_path, metadata_path]:
        if not os.path.exists(p):
            raise ModelValidationError(f"Required file missing: {p}")

    # 2. XGBoost version check
    if xgb.__version__ != REQUIRED_XGBOOST_VERSION:
        raise ModelValidationError(
            f"XGBoost version mismatch. Expected {REQUIRED_XGBOOST_VERSION}, got {xgb.__version__}"
        )

    # 3. Features check
    with open(features_path, "r") as f:
        features = json.load(f)
    if not isinstance(features, list) or len(features) != 10:
        raise ModelValidationError(
            f"Features schema invalid. Expected list of 10 features, got {len(features) if isinstance(features, list) else type(features)}"
        )

    # 4. Threshold check
    with open(threshold_path, "r") as f:
        threshold_data = json.load(f)
    threshold = float(threshold_data.get("threshold", 0.0))
    if round(threshold, 2) != 0.90:
        raise ModelValidationError(
            f"Threshold mismatch. Expected 0.90, got {threshold}"
        )

    return True

class FraudPredictor:
    def __init__(self, base_dir: str = "."):
        self.base_dir = base_dir
        validate_environment(base_dir)

        self.model_path = os.path.join(base_dir, "model", "fraud_xgb_model.pkl")
        self.features_path = os.path.join(base_dir, "model", "features.json")
        self.threshold_path = os.path.join(base_dir, "model", "threshold.json")
        self.metadata_path = os.path.join(base_dir, "model", "metadata.json")

        self.model = joblib.load(self.model_path)
        with open(self.features_path, "r") as f:
            self.features = json.load(f)
        with open(self.threshold_path, "r") as f:
            self.threshold = float(json.load(f)["threshold"])
        with open(self.metadata_path, "r") as f:
            self.metadata = json.load(f)

        importances = getattr(self.model, "feature_importances_", None)
        if importances is not None:
            self.global_feature_importances = {
                feat: round(float(imp), 6)
                for feat, imp in zip(self.features, importances)
            }
        else:
            self.global_feature_importances = {}

    @staticmethod
    def compute_ratios(amount: float, oldbalance_org: float, oldbalance_dest: float):
        """
        Exact ratio engineering matching ML training:
        amount_to_oldbalance_ratio = amount / oldbalanceOrg if oldbalanceOrg > 0 else 0.0
        amount_to_dest_balance_ratio = amount / oldbalanceDest if oldbalanceDest > 0 else 0.0
        """
        ratio_org = float(amount / oldbalance_org) if oldbalance_org > 0 else 0.0
        ratio_dest = float(amount / oldbalance_dest) if oldbalance_dest > 0 else 0.0
        return ratio_org, ratio_dest

    @staticmethod
    def get_risk_level(prob: float) -> str:
        """
        Risk level ranges:
        - LOW: 0.0 <= prob < 0.30
        - MEDIUM: 0.30 <= prob < 0.70
        - HIGH: 0.70 <= prob < 0.90
        - CRITICAL: prob >= 0.90
        """
        if prob >= 0.90:
            return "CRITICAL"
        elif prob >= 0.70:
            return "HIGH"
        elif prob >= 0.30:
            return "MEDIUM"
        else:
            return "LOW"

    def generate_risk_signals(self, tx_type: str, amount: float, oldbalance_org: float, ratio_org: float, ratio_dest: float) -> list:
        """
        Generates descriptive risk signals for UI explanation.
        Does NOT modify or override the XGBoost prediction.
        """
        signals = []
        if tx_type in ["TRANSFER", "CASH_OUT"]:
            signals.append(f"High-risk transaction category: {tx_type}")
        if ratio_org >= 1.0 and oldbalance_org > 0:
            signals.append("Transaction exhausts entire sender balance")
        elif ratio_org > 0.8:
            signals.append("High withdrawal ratio relative to sender balance")
        if amount > 200000.0:
            signals.append(f"Large transaction amount (${amount:,.2f})")
        if not signals:
            signals.append("Normal transaction parameters")
        return signals

    def predict_single(self, tx: dict) -> dict:
        step = int(tx.get("step", 1))
        tx_type = str(tx.get("type", "PAYMENT")).upper()
        amount = float(tx.get("amount", 0.0))
        oldbalance_org = float(tx.get("oldbalanceOrg", 0.0))
        oldbalance_dest = float(tx.get("oldbalanceDest", 0.0))

        ratio_org, ratio_dest = self.compute_ratios(amount, oldbalance_org, oldbalance_dest)

        row = {
            "step": step,
            "amount": amount,
            "oldbalanceOrg": oldbalance_org,
            "oldbalanceDest": oldbalance_dest,
            "amount_to_oldbalance_ratio": ratio_org,
            "amount_to_dest_balance_ratio": ratio_dest,
            "type_CASH_OUT": 1 if tx_type == "CASH_OUT" else 0,
            "type_DEBIT": 1 if tx_type == "DEBIT" else 0,
            "type_PAYMENT": 1 if tx_type == "PAYMENT" else 0,
            "type_TRANSFER": 1 if tx_type == "TRANSFER" else 0,
        }

        df = pd.DataFrame([row])[self.features]
        prob = float(self.model.predict_proba(df)[:, 1][0])
        is_fraud = bool(prob >= self.threshold)
        risk_level = self.get_risk_level(prob)
        risk_signals = self.generate_risk_signals(tx_type, amount, oldbalance_org, ratio_org, ratio_dest)

        # Native XGBoost Tree SHAP contributions calculation
        dmat = xgb.DMatrix(df)
        contribs = self.model.get_booster().predict(dmat, pred_contribs=True)[0]
        shap_values = {feat: round(float(val), 6) for feat, val in zip(self.features, contribs[:-1])}
        base_value = round(float(contribs[-1]), 6)

        prediction_id = f"pred_{uuid.uuid4().hex[:12]}"
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

        return {
            "prediction_id": prediction_id,
            "timestamp": timestamp,
            "is_fraud": is_fraud,
            "probability": round(prob, 6),
            "threshold": self.threshold,
            "risk_level": risk_level,
            "risk_signals": risk_signals,
            "features_used": row,
            "shap_values": shap_values,
            "shap_base_value": base_value
        }

    def predict_batch_df(self, df: pd.DataFrame) -> list:
        """
        Vectorised feature engineering and batch prediction for a DataFrame chunk.
        """
        working_df = df.copy()

        # Handle required columns
        req_cols = ["step", "type", "amount", "oldbalanceOrg", "oldbalanceDest"]
        for col in req_cols:
            if col not in working_df.columns:
                working_df[col] = 0.0 if col != "type" else "PAYMENT"

        # Ensure correct types
        working_df["step"] = working_df["step"].astype(int)
        working_df["amount"] = working_df["amount"].astype(float)
        working_df["oldbalanceOrg"] = working_df["oldbalanceOrg"].astype(float)
        working_df["oldbalanceDest"] = working_df["oldbalanceDest"].astype(float)
        working_df["type"] = working_df["type"].astype(str).str.upper()

        # Vectorised ratio calculation
        working_df["amount_to_oldbalance_ratio"] = np.where(
            working_df["oldbalanceOrg"] > 0,
            working_df["amount"] / working_df["oldbalanceOrg"],
            0.0
        )
        working_df["amount_to_dest_balance_ratio"] = np.where(
            working_df["oldbalanceDest"] > 0,
            working_df["amount"] / working_df["oldbalanceDest"],
            0.0
        )

        # One-hot encoding
        working_df["type_CASH_OUT"] = (working_df["type"] == "CASH_OUT").astype(int)
        working_df["type_DEBIT"] = (working_df["type"] == "DEBIT").astype(int)
        working_df["type_PAYMENT"] = (working_df["type"] == "PAYMENT").astype(int)
        working_df["type_TRANSFER"] = (working_df["type"] == "TRANSFER").astype(int)

        feature_df = working_df[self.features]
        probs = self.model.predict_proba(feature_df)[:, 1]

        results = []
        for idx, prob in enumerate(probs):
            prob = float(prob)
            is_fraud = bool(prob >= self.threshold)
            risk_level = self.get_risk_level(prob)
            orig_row = working_df.iloc[idx].to_dict()
            results.append({
                "row_index": idx,
                "prediction_id": f"pred_{uuid.uuid4().hex[:12]}",
                "step": int(orig_row.get("step", 1)),
                "type": str(orig_row.get("type", "PAYMENT")),
                "amount": float(orig_row.get("amount", 0.0)),
                "is_fraud": is_fraud,
                "probability": round(prob, 6),
                "risk_level": risk_level
            })

        return results
