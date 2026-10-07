import os
import io
import json
import sqlite3
import datetime
from fastapi.testclient import TestClient

from backend.main import app
from backend.database import (
    initialize_database,
    insert_prediction_audit,
    insert_prediction_audits_bulk,
    get_prediction_history,
    get_prediction_detail,
    get_prediction_analytics,
    get_db_path
)

def run_phase2b_database_tests():
    print("=" * 80)
    print("STARTING PHASE 2B: SQLITE DATABASE & API TEST SUITE")
    print("=" * 80)

    base_dir = "."
    db_path = get_db_path(base_dir)

    # 1. Test Database Initialization & Table Creation
    print("\n[1/16] Testing Database Initialization & Table Creation...")
    initialize_database(base_dir)
    assert os.path.exists(db_path), f"Database file {db_path} not found!"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='prediction_audits';")
    tbl = cursor.fetchone()
    assert tbl is not None, "prediction_audits table missing!"
    print("  payguard.db and prediction_audits table initialized successfully.")

    # 2. Test Direct Single Prediction Insertion
    print("\n[2/16] Testing Single Prediction Insertion...")
    test_pred_id = f"test_pred_{datetime.datetime.now().timestamp()}"
    single_audit = {
        "prediction_id": test_pred_id,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "amount": 1500.0,
        "transaction_type": "TRANSFER",
        "probability": 0.95,
        "is_fraud": True,
        "threshold": 0.90,
        "risk_level": "CRITICAL",
        "model": "XGBoost (Class Weight)",
        "model_version": "2.0.0",
        "risk_signals": ["High-risk transaction category: TRANSFER", "Large transaction amount ($1,500.00)"],
        "shap_values": {"amount": 1.25, "oldbalanceOrg": 3.40}
    }
    inserted = insert_prediction_audit(base_dir, single_audit)
    assert inserted, "Failed to insert single prediction audit record!"
    print("  Single prediction record inserted successfully.")

    # 3. Test Direct Batch Insertion
    print("\n[3/16] Testing Batch Insertion...")
    batch_audits = []
    for i in range(5):
        batch_audits.append({
            "prediction_id": f"batch_pred_{i}_{datetime.datetime.now().timestamp()}",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "amount": 100.0 * (i + 1),
            "transaction_type": "PAYMENT" if i % 2 == 0 else "CASH_OUT",
            "probability": 0.10 * i,
            "is_fraud": i >= 4,
            "threshold": 0.90,
            "risk_level": "CRITICAL" if i >= 4 else "LOW",
            "model": "XGBoost (Class Weight)",
            "model_version": "2.0.0",
            "risk_signals": ["Normal transaction"],
            "shap_values": {"amount": 0.1 * i}
        })
    inserted_cnt = insert_prediction_audits_bulk(base_dir, batch_audits)
    assert inserted_cnt == 5, f"Expected 5 bulk inserted records, got {inserted_cnt}"
    print(f"  {inserted_cnt} batch records inserted successfully.")

    # 4. Test Duplicate Prediction Protection
    print("\n[4/16] Testing Duplicate Prediction Protection...")
    dup_inserted = insert_prediction_audit(base_dir, single_audit)
    print(f"  Duplicate insert result (INSERT OR IGNORE): {dup_inserted}")
    # Verify count for test_pred_id is still 1
    cursor.execute("SELECT COUNT(*) FROM prediction_audits WHERE prediction_id = ?;", (test_pred_id,))
    cnt = cursor.fetchone()[0]
    assert cnt == 1, f"Duplicate prediction_id inserted! Count: {cnt}"
    print("  Duplicate protection verified: prediction_id count remains 1.")

    conn.close()

    # FastAPI Client Tests
    with TestClient(app) as client:
        # 5. Test Existing Health Endpoint
        print("\n[5/16] Testing GET /api/health...")
        r_health = client.get("/api/health")
        assert r_health.status_code == 200
        assert r_health.json()["threshold"] == 0.90
        print("  /api/health verified OK.")

        # 6. Test Existing Model Info Endpoint
        print("\n[6/16] Testing GET /api/model/info...")
        r_info = client.get("/api/model/info")
        assert r_info.status_code == 200
        info_json = r_info.json()
        assert info_json["threshold"] == 0.90
        assert "production_model" in info_json["evaluation_metrics"]
        assert "academic_benchmark" in info_json["evaluation_metrics"]
        print("  /api/model/info verified OK.")

        # 7. Test Single Prediction Endpoint & Automatic Logging
        print("\n[7/16] Testing POST /api/predict & Auto-Logging...")
        fraud_tx = {
            "step": 1,
            "type": "TRANSFER",
            "amount": 181.0,
            "nameOrig": "C1305486145",
            "oldbalanceOrg": 181.0,
            "newbalanceOrig": 0.0,
            "nameDest": "C553264065",
            "oldbalanceDest": 0.0,
            "newbalanceDest": 0.0
        }
        r_pred = client.post("/api/predict", json=fraud_tx)
        assert r_pred.status_code == 200
        pred_data = r_pred.json()
        api_pred_id = pred_data["prediction_id"]
        assert pred_data["is_fraud"] is True
        assert pred_data["probability"] >= 0.90
        assert pred_data["threshold"] == 0.90
        assert pred_data["risk_level"] == "CRITICAL"
        assert pred_data["shap_values"] is not None
        print(f"  Prediction created: id={api_pred_id}, is_fraud={pred_data['is_fraud']}, prob={pred_data['probability']:.6f}")

        # 8. Test Prediction Detail Retrieval
        print(f"\n[8/16] Testing GET /api/predictions/{api_pred_id}...")
        r_detail = client.get(f"/api/predictions/{api_pred_id}")
        assert r_detail.status_code == 200, f"Detail retrieval failed: {r_detail.text}"
        detail_data = r_detail.json()
        assert detail_data["prediction_id"] == api_pred_id
        assert detail_data["is_fraud"] is True
        assert detail_data["threshold"] == 0.90
        assert detail_data["risk_level"] == "CRITICAL"
        assert detail_data["model_name"] == "XGBoost (Class Weight)"
        assert isinstance(detail_data["shap_values"], dict)
        print("  Prediction detail record retrieved and parsed successfully.")

        # 9. Test Missing Prediction Detail (404)
        print("\n[9/16] Testing GET /api/predictions/non_existent_id (404)...")
        r_404 = client.get("/api/predictions/non_existent_id_9999")
        assert r_404.status_code == 404, f"Expected 404, got {r_404.status_code}"
        print("  404 response verified OK.")

        # 10. Test Batch JSON Prediction & Auto-Logging
        print("\n[10/16] Testing POST /api/predict/batch & Auto-Logging...")
        legit_tx = {
            "step": 1,
            "type": "PAYMENT",
            "amount": 50.0,
            "nameOrig": "C123",
            "oldbalanceOrg": 500.0,
            "newbalanceOrig": 450.0,
            "nameDest": "M999",
            "oldbalanceDest": 0.0,
            "newbalanceDest": 0.0
        }
        r_batch = client.post("/api/predict/batch", json={"transactions": [legit_tx, fraud_tx]})
        assert r_batch.status_code == 200
        batch_res = r_batch.json()
        assert batch_res["total_transactions"] == 2
        print("  Batch JSON predictions executed and logged successfully.")

        # 11. Test Batch CSV Prediction & Auto-Logging
        print("\n[11/16] Testing POST /api/predict/batch/csv & Auto-Logging...")
        csv_content = "step,type,amount,nameOrig,oldbalanceOrg,newbalanceOrig,nameDest,oldbalanceDest,newbalanceDest\n"
        csv_content += "1,PAYMENT,100.0,C1,1000.0,900.0,M1,0.0,0.0\n"
        csv_content += "1,TRANSFER,181.0,C1305486145,181.0,0.0,C553264065,0.0,0.0\n"
        files = {"file": ("test_batch.csv", io.BytesIO(csv_content.encode('utf-8')), "text/csv")}
        r_csv = client.post("/api/predict/batch/csv", files=files)
        assert r_csv.status_code == 200
        print("  Batch CSV predictions executed and logged successfully.")

        # 12. Test History Retrieval (Pagination)
        print("\n[12/16] Testing GET /api/predictions/history (Pagination)...")
        r_hist = client.get("/api/predictions/history?limit=5&offset=0")
        assert r_hist.status_code == 200
        hist_data = r_hist.json()
        print(f"  Total records in DB: {hist_data['total']} | Returned items: {len(hist_data['items'])} | Limit: {hist_data['limit']} | Offset: {hist_data['offset']}")
        assert len(hist_data["items"]) <= 5
        assert hist_data["total"] >= 8

        # 13. Test Fraud Filtering
        print("\n[13/16] Testing GET /api/predictions/history?is_fraud=true...")
        r_fraud_filter = client.get("/api/predictions/history?is_fraud=true")
        assert r_fraud_filter.status_code == 200
        fraud_filter_data = r_fraud_filter.json()
        print(f"  Matching fraud records: {fraud_filter_data['total']}")
        for item in fraud_filter_data["items"]:
            assert item["is_fraud"] is True

        # 14. Test Risk Level Filtering
        print("\n[14/16] Testing GET /api/predictions/history?risk_level=CRITICAL...")
        r_risk_filter = client.get("/api/predictions/history?risk_level=CRITICAL")
        assert r_risk_filter.status_code == 200
        risk_filter_data = r_risk_filter.json()
        print(f"  Matching CRITICAL risk records: {risk_filter_data['total']}")
        for item in risk_filter_data["items"]:
            assert item["risk_level"] == "CRITICAL"

        # 15. Test Transaction Type Filtering
        print("\n[15/16] Testing GET /api/predictions/history?transaction_type=TRANSFER...")
        r_tx_filter = client.get("/api/predictions/history?transaction_type=TRANSFER")
        assert r_tx_filter.status_code == 200
        tx_filter_data = r_tx_filter.json()
        print(f"  Matching TRANSFER type records: {tx_filter_data['total']}")
        for item in tx_filter_data["items"]:
            assert item["transaction_type"] == "TRANSFER"

        # 16. Test Dynamic Analytics API
        print("\n[16/16] Testing GET /api/predictions/analytics...")
        r_analytics = client.get("/api/predictions/analytics")
        assert r_analytics.status_code == 200
        analytics_data = r_analytics.json()
        print(f"  Total Predictions: {analytics_data['total_predictions']}")
        print(f"  Fraud Detected   : {analytics_data['fraud_detected']}")
        print(f"  Legit Detected   : {analytics_data['legitimate_detected']}")
        print(f"  Fraud Rate       : {analytics_data['fraud_rate']}")
        print(f"  Avg Fraud Prob   : {analytics_data['average_fraud_probability']}")
        print(f"  Risk Distribution: {analytics_data['risk_distribution']}")
        assert analytics_data['total_predictions'] >= 8
        assert analytics_data['fraud_detected'] >= 3

    print("\n" + "=" * 80)
    print("PHASE 2B VERIFICATION COMPLETE: ALL 16 TEST CASES PASSED WITH 100% SUCCESS")
    print("=" * 80)

if __name__ == "__main__":
    run_phase2b_database_tests()
