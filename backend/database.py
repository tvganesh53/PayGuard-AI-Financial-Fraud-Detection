import os
import json
import sqlite3
import datetime
from typing import List, Dict, Any, Optional

DB_FILE_NAME = "payguard.db"

def get_db_path(base_dir: str = ".") -> str:
    return os.path.abspath(os.path.join(base_dir, DB_FILE_NAME))

def get_connection(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

def initialize_database(base_dir: str = "."):
    """
    Automatically creates payguard.db and prediction_audits table on startup if missing.
    Preserves existing records and database structure.
    """
    db_path = get_db_path(base_dir)
    print(f"[DB] Initializing SQLite audit database at {db_path}...")
    
    conn = get_connection(db_path)
    try:
        with conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS prediction_audits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prediction_id TEXT UNIQUE NOT NULL,
                timestamp TEXT NOT NULL,
                amount REAL NOT NULL,
                transaction_type TEXT NOT NULL,
                fraud_probability REAL NOT NULL,
                is_fraud INTEGER NOT NULL,
                threshold REAL NOT NULL,
                risk_level TEXT NOT NULL,
                model_name TEXT NOT NULL,
                model_version TEXT NOT NULL,
                risk_signals TEXT,
                shap_values TEXT,
                created_at TEXT NOT NULL
            );
            """)
            
            # Useful performance indexes (SQLite auto-indexes UNIQUE prediction_id)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_is_fraud ON prediction_audits(is_fraud);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_risk_level ON prediction_audits(risk_level);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_tx_type ON prediction_audits(transaction_type);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON prediction_audits(created_at);")
            
        print("[DB] SQLite prediction_audits table and indexes initialized successfully.")
    except Exception as e:
        print(f"[ERROR] Database initialization failed: {e}")
        raise e
    finally:
        conn.close()

def insert_prediction_audit(base_dir: str, audit_data: dict) -> bool:
    """
    Inserts a single prediction record safely into payguard.db.
    Uses INSERT OR IGNORE to prevent duplicate insertion error.
    """
    db_path = get_db_path(base_dir)
    try:
        conn = get_connection(db_path)
        with conn:
            risk_signals_json = json.dumps(audit_data.get("risk_signals", [])) if isinstance(audit_data.get("risk_signals"), list) else audit_data.get("risk_signals", "[]")
            shap_values_json = json.dumps(audit_data.get("shap_values", {})) if isinstance(audit_data.get("shap_values"), dict) else audit_data.get("shap_values", "{}")
            created_at = audit_data.get("created_at") or datetime.datetime.now(datetime.timezone.utc).isoformat()

            conn.execute("""
            INSERT OR IGNORE INTO prediction_audits (
                prediction_id, timestamp, amount, transaction_type,
                fraud_probability, is_fraud, threshold, risk_level,
                model_name, model_version, risk_signals, shap_values, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                str(audit_data.get("prediction_id")),
                str(audit_data.get("timestamp", created_at)),
                float(audit_data.get("amount", 0.0)),
                str(audit_data.get("transaction_type", "PAYMENT")).upper(),
                float(audit_data.get("probability", 0.0)),
                1 if audit_data.get("is_fraud") else 0,
                float(audit_data.get("threshold", 0.90)),
                str(audit_data.get("risk_level", "LOW")),
                str(audit_data.get("model", "XGBoost (Class Weight)")),
                str(audit_data.get("model_version", "2.0.0")),
                risk_signals_json,
                shap_values_json,
                created_at
            ))
        conn.close()
        return True
    except Exception as e:
        print(f"[WARN] Failed to insert prediction audit record {audit_data.get('prediction_id')}: {e}")
        return False

def insert_prediction_audits_bulk(base_dir: str, audit_list: List[dict]) -> int:
    """
    Bulk inserts a list of prediction audit records into payguard.db.
    Uses INSERT OR IGNORE for duplicate protection.
    """
    if not audit_list:
        return 0

    db_path = get_db_path(base_dir)
    inserted_count = 0
    try:
        conn = get_connection(db_path)
        rows_to_insert = []
        for audit in audit_list:
            risk_signals_json = json.dumps(audit.get("risk_signals", [])) if isinstance(audit.get("risk_signals"), list) else audit.get("risk_signals", "[]")
            shap_values_json = json.dumps(audit.get("shap_values", {})) if isinstance(audit.get("shap_values"), dict) else audit.get("shap_values", "{}")
            created_at = audit.get("created_at") or datetime.datetime.now(datetime.timezone.utc).isoformat()

            rows_to_insert.append((
                str(audit.get("prediction_id")),
                str(audit.get("timestamp", created_at)),
                float(audit.get("amount", 0.0)),
                str(audit.get("transaction_type", "PAYMENT")).upper(),
                float(audit.get("probability", 0.0)),
                1 if audit.get("is_fraud") else 0,
                float(audit.get("threshold", 0.90)),
                str(audit.get("risk_level", "LOW")),
                str(audit.get("model", "XGBoost (Class Weight)")),
                str(audit.get("model_version", "2.0.0")),
                risk_signals_json,
                shap_values_json,
                created_at
            ))

        with conn:
            cursor = conn.executemany("""
            INSERT OR IGNORE INTO prediction_audits (
                prediction_id, timestamp, amount, transaction_type,
                fraud_probability, is_fraud, threshold, risk_level,
                model_name, model_version, risk_signals, shap_values, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, rows_to_insert)
            inserted_count = cursor.rowcount

        conn.close()
        return inserted_count
    except Exception as e:
        print(f"[WARN] Bulk prediction audit insertion failed: {e}")
        return 0

def parse_audit_row(row: sqlite3.Row) -> dict:
    """Parses a database Row object into a clean Python dict."""
    d = dict(row)
    d["is_fraud"] = bool(d["is_fraud"])
    try:
        d["risk_signals"] = json.loads(d["risk_signals"]) if d["risk_signals"] else []
    except Exception:
        d["risk_signals"] = []

    try:
        d["shap_values"] = json.loads(d["shap_values"]) if d["shap_values"] else {}
    except Exception:
        d["shap_values"] = {}

    return d

def get_prediction_history(
    base_dir: str,
    limit: int = 20,
    offset: int = 0,
    is_fraud: Optional[bool] = None,
    risk_level: Optional[str] = None,
    transaction_type: Optional[str] = None
) -> dict:
    """
    Queries prediction audit history with pagination and SQL filtering.
    """
    db_path = get_db_path(base_dir)
    conn = get_connection(db_path)
    
    where_clauses = []
    params = []

    if is_fraud is not None:
        where_clauses.append("is_fraud = ?")
        params.append(1 if is_fraud else 0)

    if risk_level is not None:
        where_clauses.append("risk_level = ?")
        params.append(risk_level.upper())

    if transaction_type is not None:
        where_clauses.append("transaction_type = ?")
        params.append(transaction_type.upper())

    where_str = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    # Count total matching
    count_sql = f"SELECT COUNT(*) as cnt FROM prediction_audits{where_str};"
    total_records = conn.execute(count_sql, params).fetchone()["cnt"]

    # Fetch paginated items
    limit = max(1, min(limit, 100))
    offset = max(0, offset)

    fetch_sql = f"""
    SELECT id, prediction_id, timestamp, amount, transaction_type,
           fraud_probability, is_fraud, threshold, risk_level,
           model_name, model_version, risk_signals, shap_values, created_at
    FROM prediction_audits{where_str}
    ORDER BY id DESC
    LIMIT ? OFFSET ?;
    """
    fetch_params = params + [limit, offset]
    rows = conn.execute(fetch_sql, fetch_params).fetchall()
    conn.close()

    items = [parse_audit_row(r) for r in rows]

    return {
        "items": items,
        "total": total_records,
        "limit": limit,
        "offset": offset
    }

def get_prediction_detail(base_dir: str, prediction_id: str) -> Optional[dict]:
    """
    Fetches the complete audit record for a specific prediction_id.
    """
    db_path = get_db_path(base_dir)
    conn = get_connection(db_path)
    sql = """
    SELECT id, prediction_id, timestamp, amount, transaction_type,
           fraud_probability, is_fraud, threshold, risk_level,
           model_name, model_version, risk_signals, shap_values, created_at
    FROM prediction_audits
    WHERE prediction_id = ?;
    """
    row = conn.execute(sql, (prediction_id,)).fetchone()
    conn.close()

    if not row:
        return None
    return parse_audit_row(row)

def get_prediction_analytics(base_dir: str) -> dict:
    """
    Calculates dynamic prediction audit analytics using SQL aggregates.
    """
    db_path = get_db_path(base_dir)
    conn = get_connection(db_path)

    summary_sql = """
    SELECT 
        COUNT(*) as total_predictions,
        SUM(CASE WHEN is_fraud = 1 THEN 1 ELSE 0 END) as fraud_detected,
        SUM(CASE WHEN is_fraud = 0 THEN 1 ELSE 0 END) as legitimate_detected,
        AVG(fraud_probability) as avg_prob
    FROM prediction_audits;
    """
    s_row = conn.execute(summary_sql).fetchone()
    total = s_row["total_predictions"] or 0
    fraud_cnt = s_row["fraud_detected"] or 0
    legit_cnt = s_row["legitimate_detected"] or 0
    avg_prob = float(s_row["avg_prob"]) if s_row["avg_prob"] is not None else 0.0
    fraud_rate = float(fraud_cnt / total) if total > 0 else 0.0

    risk_sql = """
    SELECT risk_level, COUNT(*) as cnt
    FROM prediction_audits
    GROUP BY risk_level;
    """
    risk_rows = conn.execute(risk_sql).fetchall()
    conn.close()

    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for r in risk_rows:
        lvl = str(r["risk_level"]).upper()
        risk_dist[lvl] = int(r["cnt"])

    return {
        "total_predictions": total,
        "fraud_detected": fraud_cnt,
        "legitimate_detected": legit_cnt,
        "fraud_rate": round(fraud_rate, 4),
        "average_fraud_probability": round(avg_prob, 6),
        "risk_distribution": risk_dist
    }
