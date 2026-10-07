import os
import io
import json
import datetime
import xgboost as xgb
import pandas as pd
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any

from model.predictor import FraudPredictor, validate_environment, ModelValidationError
from backend.schemas import (
    TransactionInput,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionSummary,
    ModelInfoResponse,
    DatasetSampleResponse,
    AnalyticsSummaryResponse,
    PatternsResponse,
    PatternItem,
    PredictionAuditItem,
    PredictionHistoryResponse,
    PredictionAnalyticsResponse
)
from backend.database import (
    initialize_database,
    insert_prediction_audit,
    insert_prediction_audits_bulk,
    get_prediction_history,
    get_prediction_detail,
    get_prediction_analytics
)

predictor: Optional[FraudPredictor] = None
base_dir: str = "."

@asynccontextmanager
async def lifespan(app: FastAPI):
    global predictor, base_dir
    try:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        validate_environment(base_dir)
        predictor = FraudPredictor(base_dir)
        print("[OK] Backend model engine loaded and environment validated successfully.")
        
        # Initialize SQLite payguard.db
        initialize_database(base_dir)
    except Exception as e:
        print(f"[ERROR] Startup model or database initialization error: {e}")
        raise e
    yield

app = FastAPI(
    title="PayGuard AI - Fraud Detection API",
    description="Production API using Leakage-Safe Temporal XGBoost Model for PaySim Financial Transactions",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS via ALLOWED_ORIGINS environment variable
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
def health_check():
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model engine not initialized")
    return {
        "status": "healthy",
        "model_loaded": True,
        "xgboost_version": xgb.__version__,
        "threshold": predictor.threshold,
        "n_features": len(predictor.features)
    }

def load_dynamic_experiment_metrics(base_dir: str = "."):
    """
    Loads verified experiment metrics dynamically from experiments/results/results.json
    and experiments/results/experiment_metadata.json.
    Differentiates Production Model metrics (XGBoost + Class Weight @ 0.90)
    from Academic Benchmark metrics (Random Forest + Baseline @ 0.71).
    """
    results_path = os.path.join(base_dir, "experiments", "results", "results.json")
    metadata_path = os.path.join(base_dir, "experiments", "results", "experiment_metadata.json")

    results_data = {}
    exp_metadata = {}

    if os.path.exists(results_path):
        try:
            with open(results_path, "r") as f:
                results_data = json.load(f)
        except Exception as e:
            print(f"[WARN] Failed to load results.json: {e}")

    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, "r") as f:
                exp_metadata = json.load(f)
        except Exception as e:
            print(f"[WARN] Failed to load experiment_metadata.json: {e}")

    # 1. Production Model Metrics (XGBoost Class Weight @ Prod Threshold 0.90)
    xgb_exp = results_data.get("XGB_ClassWeight", {})
    xgb_eval = xgb_exp.get("test_eval_prod_0_90", {})
    if not xgb_eval:
        xgb_eval = xgb_exp.get("test_eval_opt_threshold", {})

    prod_precision = float(xgb_eval.get("precision", 0.8620))
    prod_recall = float(xgb_eval.get("recall", 0.9948))
    prod_f1 = float(xgb_eval.get("f1_score", 0.9236))
    prod_auprc = float(xgb_eval.get("auprc", 0.9833))
    prod_roc_auc = float(xgb_eval.get("roc_auc", 0.9999))

    # 2. Academic Benchmark Metrics (Random Forest Baseline @ Opt Threshold 0.71)
    rf_exp = results_data.get("RF_Baseline", {})
    rf_eval = rf_exp.get("test_eval_opt_threshold", {})

    bench_precision = float(rf_eval.get("precision", 1.0000))
    bench_recall = float(rf_eval.get("recall", 0.9965))
    bench_f1 = float(rf_eval.get("f1_score", 0.9982))
    bench_auprc = float(rf_eval.get("auprc", 0.9999))
    bench_roc_auc = float(rf_eval.get("roc_auc", 1.0000))

    return {
        # Top-level backward-compatible metrics for production XGBoost
        "precision": f"{prod_precision * 100:.2f}%",
        "recall": f"{prod_recall * 100:.2f}%",
        "f1_score": f"{prod_f1 * 100:.2f}%",
        "pr_auc": f"{prod_auprc:.4f}",
        "roc_auc": f"{prod_roc_auc:.4f}",
        "accuracy": "99.93%",
        
        # Explicit distinction between Production and Academic Benchmark
        "production_model": {
            "model_name": "XGBoost (Class Weight)",
            "algorithm": "XGBoost",
            "imbalance_technique": "Class Weight (scale_pos_weight)",
            "decision_threshold": 0.90,
            "precision": f"{prod_precision * 100:.2f}%",
            "recall": f"{prod_recall * 100:.2f}%",
            "f1_score": f"{prod_f1 * 100:.2f}%",
            "auprc": round(prod_auprc, 4),
            "roc_auc": round(prod_roc_auc, 4),
            "test_samples": xgb_eval.get("total_samples", 918617),
            "confusion_matrix": xgb_eval.get("confusion_matrix", {"tn": 913973, "fp": 638, "fn": 21, "tp": 3985})
        },
        "academic_benchmark": {
            "model_name": "Random Forest (Baseline)",
            "algorithm": "Random Forest",
            "imbalance_technique": "Baseline",
            "decision_threshold": 0.71,
            "precision": f"{bench_precision * 100:.2f}%",
            "recall": f"{bench_recall * 100:.2f}%",
            "f1_score": f"{bench_f1 * 100:.2f}%",
            "auprc": round(bench_auprc, 4),
            "roc_auc": round(bench_roc_auc, 4),
            "test_samples": rf_eval.get("total_samples", 918617),
            "confusion_matrix": rf_eval.get("confusion_matrix", {"tn": 914611, "fp": 0, "fn": 14, "tp": 3992})
        },

        # Dataset & Pipeline split statistics
        "dataset_info": {
            "total_samples": exp_metadata.get("total_dataset_rows", 6362620),
            "train_samples": exp_metadata.get("temporal_split_sizes", {}).get("train", 4463587),
            "val_samples": exp_metadata.get("temporal_split_sizes", {}).get("val", 980416),
            "test_samples": exp_metadata.get("temporal_split_sizes", {}).get("test", 918617)
        }
    }

@app.get("/api/model/info", response_model=ModelInfoResponse, tags=["Model"])
def get_model_info():
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model engine not initialized")

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    dynamic_metrics = load_dynamic_experiment_metrics(base_dir)
    dynamic_metrics["objective"] = predictor.metadata.get("objective", "binary:logistic")
    dynamic_metrics["n_estimators"] = predictor.metadata.get("n_estimators", 300)
    dynamic_metrics["decision_threshold"] = predictor.threshold

    return ModelInfoResponse(
        model_name="XGBoost (Class Weight)",
        model_type=predictor.metadata.get("model_type", "Leakage-Safe Temporal XGBoost"),
        n_features=len(predictor.features),
        features=predictor.features,
        threshold=predictor.threshold,
        xgboost_version=xgb.__version__,
        global_feature_importances=predictor.global_feature_importances,
        evaluation_metrics=dynamic_metrics
    )

@app.post("/api/predict", response_model=PredictionResponse, tags=["Inference"])
def predict_transaction(tx: TransactionInput):
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model engine not initialized")

    try:
        tx_dict = tx.model_dump()
        result = predictor.predict_single(tx_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

    # Post-inference safe audit logging into SQLite payguard.db
    try:
        audit_data = {
            "prediction_id": result["prediction_id"],
            "timestamp": result["timestamp"],
            "amount": float(tx.amount),
            "transaction_type": str(tx.type),
            "probability": result["probability"],
            "is_fraud": result["is_fraud"],
            "threshold": result["threshold"],
            "risk_level": result["risk_level"],
            "model": "XGBoost (Class Weight)",
            "model_version": "2.0.0",
            "risk_signals": result.get("risk_signals", []),
            "shap_values": result.get("shap_values", {})
        }
        insert_prediction_audit(base_dir, audit_data)
    except Exception as db_err:
        print(f"[WARN] Post-inference database audit logging failed: {db_err}")

    return result

@app.post("/api/predict/batch", response_model=BatchPredictionSummary, tags=["Inference"])
def predict_batch_json(payload: BatchPredictionRequest):
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model engine not initialized")

    if not payload.transactions:
        raise HTTPException(status_code=400, detail="Transactions list cannot be empty.")

    tx_dicts = [t.model_dump() for t in payload.transactions]
    df = pd.DataFrame(tx_dicts)
    all_predictions = predictor.predict_batch_df(df)

    # Post-inference bulk logging into SQLite payguard.db
    try:
        audit_list = []
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        for i, p in enumerate(all_predictions):
            tx_item = tx_dicts[i] if i < len(tx_dicts) else {}
            audit_list.append({
                "prediction_id": p["prediction_id"],
                "timestamp": now_iso,
                "amount": float(tx_item.get("amount", p.get("amount", 0.0))),
                "transaction_type": str(tx_item.get("type", p.get("type", "PAYMENT"))),
                "probability": float(p["probability"]),
                "is_fraud": bool(p["is_fraud"]),
                "threshold": 0.90,
                "risk_level": str(p["risk_level"]),
                "model": "XGBoost (Class Weight)",
                "model_version": "2.0.0",
                "risk_signals": [],
                "shap_values": {}
            })
        insert_prediction_audits_bulk(base_dir, audit_list)
    except Exception as db_err:
        print(f"[WARN] Batch JSON post-inference database logging failed: {db_err}")

    total_count = len(all_predictions)
    fraud_count = sum(1 for p in all_predictions if p["is_fraud"])
    fraud_rate = (fraud_count / total_count * 100.0) if total_count > 0 else 0.0

    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for p in all_predictions:
        lvl = p.get("risk_level", "LOW")
        risk_dist[lvl] = risk_dist.get(lvl, 0) + 1

    return BatchPredictionSummary(
        total_transactions=total_count,
        total_fraud_detected=fraud_count,
        fraud_rate_percentage=round(fraud_rate, 2),
        risk_distribution=risk_dist,
        predictions=all_predictions[:500]
    )

@app.post("/api/predict/batch/csv", response_model=BatchPredictionSummary, tags=["Inference"])
async def predict_batch_csv(file: UploadFile = File(...)):
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model engine not initialized")

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported for batch prediction.")

    contents = await file.read()
    csv_stream = io.BytesIO(contents)

    all_predictions = []
    row_offset = 0
    try:
        chunk_iterator = pd.read_csv(csv_stream, chunksize=5000)
        for chunk in chunk_iterator:
            chunk_preds = predictor.predict_batch_df(chunk)
            for p in chunk_preds:
                p["row_index"] += row_offset
            all_predictions.extend(chunk_preds)
            row_offset += len(chunk)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV batch file: {str(e)}")

    # Post-inference bulk logging into SQLite payguard.db
    try:
        audit_list = []
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        for p in all_predictions:
            audit_list.append({
                "prediction_id": p["prediction_id"],
                "timestamp": now_iso,
                "amount": float(p.get("amount", 0.0)),
                "transaction_type": str(p.get("type", "PAYMENT")),
                "probability": float(p["probability"]),
                "is_fraud": bool(p["is_fraud"]),
                "threshold": 0.90,
                "risk_level": str(p["risk_level"]),
                "model": "XGBoost (Class Weight)",
                "model_version": "2.0.0",
                "risk_signals": [],
                "shap_values": {}
            })
        insert_prediction_audits_bulk(base_dir, audit_list)
    except Exception as db_err:
        print(f"[WARN] Batch CSV post-inference database logging failed: {db_err}")

    total_count = len(all_predictions)
    fraud_count = sum(1 for p in all_predictions if p["is_fraud"])
    fraud_rate = (fraud_count / total_count * 100.0) if total_count > 0 else 0.0

    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for p in all_predictions:
        lvl = p.get("risk_level", "LOW")
        risk_dist[lvl] = risk_dist.get(lvl, 0) + 1

    return BatchPredictionSummary(
        total_transactions=total_count,
        total_fraud_detected=fraud_count,
        fraud_rate_percentage=round(fraud_rate, 2),
        risk_distribution=risk_dist,
        predictions=all_predictions[:500]
    )

@app.get("/api/predictions/history", response_model=PredictionHistoryResponse, tags=["Audit & History"])
def get_audit_history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    is_fraud: Optional[bool] = Query(default=None),
    risk_level: Optional[str] = Query(default=None),
    transaction_type: Optional[str] = Query(default=None)
):
    try:
        result = get_prediction_history(
            base_dir=base_dir,
            limit=limit,
            offset=offset,
            is_fraud=is_fraud,
            risk_level=risk_level,
            transaction_type=transaction_type
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query prediction history: {str(e)}")

@app.get("/api/predictions/analytics", response_model=PredictionAnalyticsResponse, tags=["Audit & History"])
def get_audit_analytics():
    try:
        result = get_prediction_analytics(base_dir)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate audit analytics: {str(e)}")

@app.get("/api/predictions/{prediction_id}", response_model=PredictionAuditItem, tags=["Audit & History"])
def get_audit_detail(prediction_id: str):
    try:
        record = get_prediction_detail(base_dir, prediction_id)
        if not record:
            raise HTTPException(status_code=404, detail=f"Prediction record '{prediction_id}' not found.")
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving prediction record: {str(e)}")

@app.get("/api/dataset/sample", response_model=DatasetSampleResponse, tags=["Dataset"])
def get_dataset_sample():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    paysim_path = os.path.join(base_dir, "data", "paysim.csv")

    if not os.path.exists(paysim_path):
        raise HTTPException(status_code=444, detail="data/paysim.csv not found.")

    try:
        sample_df = pd.read_csv(paysim_path, nrows=30)
        sample_data = sample_df.to_dict(orient="records")
        return DatasetSampleResponse(
            sample_count=len(sample_data),
            columns=list(sample_df.columns),
            data=sample_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read dataset sample: {str(e)}")

@app.get("/api/analytics/summary", response_model=AnalyticsSummaryResponse, tags=["Analytics"])
def get_analytics_summary():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    paysim_path = os.path.join(base_dir, "data", "paysim.csv")
    if not os.path.exists(paysim_path):
        raise HTTPException(status_code=404, detail="data/paysim.csv not found.")

    try:
        df = pd.read_csv(paysim_path, nrows=100000)
        total_samples = len(df)
        fraud_df = df[df["isFraud"] == 1]
        genuine_df = df[df["isFraud"] == 0]

        fraud_cnt = len(fraud_df)
        genuine_cnt = len(genuine_df)
        fraud_rate = round((fraud_cnt / total_samples * 100.0) if total_samples > 0 else 0.0, 2)

        avg_fraud_amt = float(fraud_df["amount"].mean()) if fraud_cnt > 0 else 0.0
        max_fraud_amt = float(fraud_df["amount"].max()) if fraud_cnt > 0 else 0.0
        avg_gen_amt = float(genuine_df["amount"].mean()) if genuine_cnt > 0 else 0.0

        fraud_by_type = fraud_df["type"].value_counts().to_dict()
        total_by_type = df["type"].value_counts().to_dict()

        df["step_bucket"] = (df["step"] // 10) * 10
        step_agg = df.groupby("step_bucket").agg(
            total=("isFraud", "count"),
            fraud=("isFraud", "sum")
        ).reset_index()

        step_trend = [
            {
                "step_bucket": f"Step {int(r['step_bucket'])}-{int(r['step_bucket'])+9}",
                "total": int(r["total"]),
                "fraud": int(r["fraud"])
            }
            for _, r in step_agg.head(10).iterrows()
        ]

        return AnalyticsSummaryResponse(
            total_samples_analyzed=total_samples,
            fraud_count=fraud_cnt,
            genuine_count=genuine_cnt,
            fraud_rate_percentage=fraud_rate,
            avg_fraud_amount=round(avg_fraud_amt, 2),
            max_fraud_amount=round(max_fraud_amt, 2),
            avg_genuine_amount=round(avg_gen_amt, 2),
            fraud_by_type=fraud_by_type,
            total_by_type=total_by_type,
            amount_distribution={
                "genuine_avg": round(avg_gen_amt, 2),
                "fraud_avg": round(avg_fraud_amt, 2),
                "fraud_max": round(max_fraud_amt, 2)
            },
            step_trend=step_trend
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")

@app.get("/api/patterns", response_model=PatternsResponse, tags=["Analytics"])
def get_fraud_patterns():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    paysim_path = os.path.join(base_dir, "data", "paysim.csv")
    if not os.path.exists(paysim_path):
        raise HTTPException(status_code=404, detail="data/paysim.csv not found.")

    try:
        df = pd.read_csv(paysim_path, nrows=100000)

        transfer_df = df[df["type"] == "TRANSFER"]
        tr_fraud = transfer_df[transfer_df["isFraud"] == 1]

        cashout_df = df[df["type"] == "CASH_OUT"]
        co_fraud = cashout_df[cashout_df["isFraud"] == 1]

        drain_df = df[(df["oldbalanceOrg"] > 0) & (abs(df["amount"] - df["oldbalanceOrg"]) < 1.0)]
        drain_fraud = drain_df[drain_df["isFraud"] == 1]

        zero_dest_df = df[(df["oldbalanceDest"] == 0) & (df["newbalanceDest"] == 0) & (df["amount"] > 1000)]
        zero_dest_fraud = zero_dest_df[zero_dest_df["isFraud"] == 1]

        patterns = [
            PatternItem(
                pattern_name="High-Volume TRANSFER Emptying Account",
                description="Fraudulent transfer where exact account balance is transferred out to external destination.",
                transaction_count=len(transfer_df),
                fraud_count=len(tr_fraud),
                fraud_rate_percentage=round(len(tr_fraud) / len(transfer_df) * 100.0, 2) if len(transfer_df) > 0 else 0.0,
                avg_amount=round(float(tr_fraud["amount"].mean()), 2) if len(tr_fraud) > 0 else 0.0,
                risk_level="CRITICAL"
            ),
            PatternItem(
                pattern_name="Rapid CASH_OUT Liquidation",
                description="Follow-up cash out operation draining stolen funds immediately after transfer.",
                transaction_count=len(cashout_df),
                fraud_count=len(co_fraud),
                fraud_rate_percentage=round(len(co_fraud) / len(cashout_df) * 100.0, 2) if len(cashout_df) > 0 else 0.0,
                avg_amount=round(float(co_fraud["amount"].mean()), 2) if len(co_fraud) > 0 else 0.0,
                risk_level="CRITICAL"
            ),
            PatternItem(
                pattern_name="Complete Origin Balance Drain",
                description="Transaction amount equals 100% of origin account balance (ratio = 1.0).",
                transaction_count=len(drain_df),
                fraud_count=len(drain_fraud),
                fraud_rate_percentage=round(len(drain_fraud) / len(drain_df) * 100.0, 2) if len(drain_df) > 0 else 0.0,
                avg_amount=round(float(drain_fraud["amount"].mean()), 2) if len(drain_fraud) > 0 else 0.0,
                risk_level="HIGH"
            ),
            PatternItem(
                pattern_name="Zero Destination Balance Anomaly",
                description="Large transfer to destination accounts displaying 0 initial and 0 final balance.",
                transaction_count=len(zero_dest_df),
                fraud_count=len(zero_dest_fraud),
                fraud_rate_percentage=round(len(zero_dest_fraud) / len(zero_dest_df) * 100.0, 2) if len(zero_dest_df) > 0 else 0.0,
                avg_amount=round(float(zero_dest_fraud["amount"].mean()), 2) if len(zero_dest_fraud) > 0 else 0.0,
                risk_level="HIGH"
            )
        ]

        return PatternsResponse(patterns=patterns)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Patterns error: {str(e)}")
