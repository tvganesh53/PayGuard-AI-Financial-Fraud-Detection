from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class TransactionInput(BaseModel):
    step: int = Field(default=1, description="Time step in hours (1-744)", ge=1)
    type: str = Field(default="TRANSFER", description="Transaction category: TRANSFER, CASH_OUT, PAYMENT, DEBIT, CASH_IN")
    amount: float = Field(default=1000.0, description="Transaction amount in currency units", ge=0.0)
    nameOrig: Optional[str] = Field(default="C123456789", description="Origin account ID")
    oldbalanceOrg: float = Field(default=1000.0, description="Initial balance of origin account", ge=0.0)
    newbalanceOrig: Optional[float] = Field(default=0.0, description="New balance of origin account", ge=0.0)
    nameDest: Optional[str] = Field(default="M987654321", description="Destination account ID")
    oldbalanceDest: float = Field(default=0.0, description="Initial balance of destination account", ge=0.0)
    newbalanceDest: Optional[float] = Field(default=0.0, description="New balance of destination account", ge=0.0)

class PredictionResponse(BaseModel):
    prediction_id: str
    timestamp: str
    is_fraud: bool
    probability: float
    threshold: float = 0.90
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    risk_signals: List[str]
    features_used: Dict[str, Any]
    shap_values: Optional[Dict[str, float]] = None
    shap_base_value: Optional[float] = None

class BatchItemPrediction(BaseModel):
    row_index: int
    prediction_id: str
    step: int
    type: str
    amount: float
    is_fraud: bool
    probability: float
    risk_level: str

class BatchPredictionRequest(BaseModel):
    transactions: List[TransactionInput]

class BatchPredictionSummary(BaseModel):
    total_transactions: int
    total_fraud_detected: int
    fraud_rate_percentage: float
    risk_distribution: Dict[str, int]
    predictions: List[BatchItemPrediction]

class ModelInfoResponse(BaseModel):
    model_name: str
    model_type: str
    n_features: int
    features: List[str]
    threshold: float
    xgboost_version: str
    evaluation_metrics: Dict[str, Any]
    global_feature_importances: Optional[Dict[str, float]] = None

class DatasetSampleResponse(BaseModel):
    sample_count: int
    columns: List[str]
    data: List[Dict[str, Any]]

class AnalyticsSummaryResponse(BaseModel):
    total_samples_analyzed: int
    fraud_count: int
    genuine_count: int
    fraud_rate_percentage: float
    avg_fraud_amount: float
    max_fraud_amount: float
    avg_genuine_amount: float
    fraud_by_type: Dict[str, int]
    total_by_type: Dict[str, int]
    amount_distribution: Dict[str, Any]
    step_trend: List[Dict[str, Any]]

class PatternItem(BaseModel):
    pattern_name: str
    description: str
    transaction_count: int
    fraud_count: int
    fraud_rate_percentage: float
    avg_amount: float
    risk_level: str

class PatternsResponse(BaseModel):
    patterns: List[PatternItem]

class PredictionAuditItem(BaseModel):
    id: int
    prediction_id: str
    timestamp: str
    amount: float
    transaction_type: str
    fraud_probability: float
    is_fraud: bool
    threshold: float
    risk_level: str
    model_name: str
    model_version: str
    risk_signals: List[str]
    shap_values: Optional[Dict[str, float]] = None
    created_at: str

class PredictionHistoryResponse(BaseModel):
    items: List[PredictionAuditItem]
    total: int
    limit: int
    offset: int

class PredictionAnalyticsResponse(BaseModel):
    total_predictions: int
    fraud_detected: int
    legitimate_detected: int
    fraud_rate: float
    average_fraud_probability: float
    risk_distribution: Dict[str, int]

