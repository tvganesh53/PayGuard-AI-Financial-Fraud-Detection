import os
import io
import json
from fastapi.testclient import TestClient

from backend.main import app

def run_backend_verification():
    print("=" * 80)
    print("STARTING PHASE 2A: BACKEND API & INTEGRATION VERIFICATION")
    print("=" * 80)

    with TestClient(app) as client:
        # 1. Test /api/health
        print("\n[1/6] Testing GET /api/health...")
        res_health = client.get("/api/health")
        assert res_health.status_code == 200, f"Health check failed: {res_health.text}"
        data_health = res_health.json()
        print(f"  Status: {data_health['status']} | Model Loaded: {data_health['model_loaded']} | Threshold: {data_health['threshold']} | Features: {data_health['n_features']}")
        assert data_health['threshold'] == 0.90, f"Expected threshold 0.90, got {data_health['threshold']}"
        assert data_health['n_features'] == 10, f"Expected 10 features, got {data_health['n_features']}"

        # 2. Test /api/model/info
        print("\n[2/6] Testing GET /api/model/info...")
        res_info = client.get("/api/model/info")
        assert res_info.status_code == 200, f"Model info failed: {res_info.text}"
        data_info = res_info.json()
        print(f"  Model Name: {data_info['model_name']}")
        print(f"  Model Type: {data_info['model_type']}")
        print(f"  Threshold : {data_info['threshold']}")
        
        metrics = data_info["evaluation_metrics"]
        print(f"\n  Top-level Metrics (Production Model):")
        print(f"    Precision: {metrics.get('precision')} | Recall: {metrics.get('recall')} | F1: {metrics.get('f1_score')} | AUPRC: {metrics.get('pr_auc')} | ROC-AUC: {metrics.get('roc_auc')}")
        
        prod_m = metrics.get("production_model", {})
        bench_m = metrics.get("academic_benchmark", {})

        print(f"\n  Production Model Specs ({prod_m.get('model_name')}):")
        print(f"    Threshold: {prod_m.get('decision_threshold')} | Precision: {prod_m.get('precision')} | Recall: {prod_m.get('recall')} | F1: {prod_m.get('f1_score')} | AUPRC: {prod_m.get('auprc')}")

        print(f"\n  Academic Benchmark Specs ({bench_m.get('model_name')}):")
        print(f"    Threshold: {bench_m.get('decision_threshold')} | Precision: {bench_m.get('precision')} | Recall: {bench_m.get('recall')} | F1: {bench_m.get('f1_score')} | AUPRC: {bench_m.get('auprc')}")

        assert prod_m.get('decision_threshold') == 0.90, "Production threshold must be 0.90!"
        assert bench_m.get('decision_threshold') == 0.71, "Academic benchmark threshold must be 0.71!"
        assert prod_m.get('precision') == "86.20%", f"Expected Production Precision 86.20%, got {prod_m.get('precision')}"
        assert bench_m.get('precision') == "100.00%", f"Expected Academic Benchmark Precision 100.00%, got {bench_m.get('precision')}"

        # 3. Test /api/predict (Legitimate & Fraudulent Transactions)
        print("\n[3/6] Testing POST /api/predict...")
        
        # Test 3a: Legitimate transaction
        legit_payload = {
            "step": 1,
            "type": "PAYMENT",
            "amount": 50.0,
            "nameOrig": "C12345678",
            "oldbalanceOrg": 500.0,
            "newbalanceOrig": 450.0,
            "nameDest": "M98765432",
            "oldbalanceDest": 0.0,
            "newbalanceDest": 0.0
        }
        res_legit = client.post("/api/predict", json=legit_payload)
        assert res_legit.status_code == 200, f"Legit prediction failed: {res_legit.text}"
        data_legit = res_legit.json()
        print(f"  [Legit Tx] Fraud: {data_legit['is_fraud']} | Prob: {data_legit['probability']:.6f} | Risk: {data_legit['risk_level']} | Thresh: {data_legit['threshold']}")
        assert 0.0 <= data_legit['probability'] <= 1.0, "Probability out of bounds!"
        assert not data_legit['is_fraud'], "Legitimate transaction falsely flagged!"
        assert data_legit['risk_level'] == "LOW", f"Expected LOW risk level, got {data_legit['risk_level']}"
        assert data_legit['shap_values'] is not None, "SHAP values missing!"

        # Test 3b: Real PaySim Fraudulent balance-drain transaction (Row #2 in data/paysim.csv)
        fraud_payload = {
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
        res_fraud = client.post("/api/predict", json=fraud_payload)
        assert res_fraud.status_code == 200, f"Fraud prediction failed: {res_fraud.text}"
        data_fraud = res_fraud.json()
        print(f"  [Fraud Tx] Fraud: {data_fraud['is_fraud']} | Prob: {data_fraud['probability']:.6f} | Risk: {data_fraud['risk_level']} | Thresh: {data_fraud['threshold']}")
        assert 0.0 <= data_fraud['probability'] <= 1.0, "Probability out of bounds!"
        assert data_fraud['is_fraud'], "Fraudulent balance-drain transaction missed!"
        assert data_fraud['probability'] >= 0.90, "Fraud probability below threshold!"
        assert data_fraud['risk_level'] == "CRITICAL", f"Expected CRITICAL risk level, got {data_fraud['risk_level']}"
        assert data_fraud['shap_values'] is not None, "SHAP values missing!"
        print(f"  SHAP feature contributions: {json.dumps(data_fraud['shap_values'], indent=2)}")

        # 4. Test /api/predict/batch
        print("\n[4/6] Testing POST /api/predict/batch...")
        batch_payload = {"transactions": [legit_payload, fraud_payload]}
        res_batch = client.post("/api/predict/batch", json=batch_payload)
        assert res_batch.status_code == 200, f"Batch prediction failed: {res_batch.text}"
        data_batch = res_batch.json()
        print(f"  Total: {data_batch['total_transactions']} | Fraud Detected: {data_batch['total_fraud_detected']} | Rate: {data_batch['fraud_rate_percentage']}%")
        print(f"  Risk Distribution: {data_batch['risk_distribution']}")
        assert data_batch['total_transactions'] == 2
        assert data_batch['total_fraud_detected'] == 1

        # 5. Test /api/predict/batch/csv
        print("\n[5/6] Testing POST /api/predict/batch/csv...")
        csv_content = "step,type,amount,nameOrig,oldbalanceOrg,newbalanceOrig,nameDest,oldbalanceDest,newbalanceDest\n"
        csv_content += "1,PAYMENT,100.0,C1,1000.0,900.0,M1,0.0,0.0\n"
        csv_content += "1,TRANSFER,181.0,C1305486145,181.0,0.0,C553264065,0.0,0.0\n"

        files = {"file": ("test_batch.csv", io.BytesIO(csv_content.encode('utf-8')), "text/csv")}
        res_csv = client.post("/api/predict/batch/csv", files=files)
        assert res_csv.status_code == 200, f"CSV batch prediction failed: {res_csv.text}"
        data_csv = res_csv.json()
        print(f"  Total CSV Rows: {data_csv['total_transactions']} | Fraud Detected: {data_csv['total_fraud_detected']}")
        assert data_csv['total_transactions'] == 2
        assert data_csv['total_fraud_detected'] == 1

        # 6. Test /api/dataset/sample
        print("\n[6/6] Testing GET /api/dataset/sample...")
        res_sample = client.get("/api/dataset/sample")
        assert res_sample.status_code == 200, f"Dataset sample failed: {res_sample.text}"
        data_sample = res_sample.json()
        print(f"  Sample count: {data_sample['sample_count']} | Columns: {len(data_sample['columns'])}")
        assert data_sample['sample_count'] <= 30, f"Expected <= 30 sample rows, got {data_sample['sample_count']}"

    print("\n" + "=" * 80)
    print("PHASE 2A VERIFICATION COMPLETE: ALL API ENDPOINTS PASSED WITH 100% SUCCESS")
    print("=" * 80)

if __name__ == "__main__":
    run_backend_verification()
