# PayGuard AI — Financial Fraud Detection Using Machine Learning

An AI-powered financial fraud detection system that analyzes transactions, estimates fraud probability, explains model predictions, and maintains an audit history through an interactive dashboard.

## Overview

Financial fraud detection is challenging because fraudulent transactions represent only a small proportion of all financial transactions. Traditional rule-based systems can struggle to identify complex patterns while balancing fraud detection and false alarms.

**PayGuard AI** uses Machine Learning to identify potentially fraudulent transactions. It combines an XGBoost classification model, SHAP-based explainability, a FastAPI backend, a SQLite audit database, and a React dashboard to provide an end-to-end fraud detection workflow.

## Key Features

- **Machine Learning fraud detection:** Predicts the likelihood of a transaction being fraudulent.
- **XGBoost production model:** Uses XGBoost with class weighting to address class imbalance.
- **Configurable decision threshold:** Uses a production threshold of `0.90`.
- **Explainable AI:** Uses native XGBoost prediction contributions to help explain model predictions.
- **Interactive transaction scanner:** Submit transaction details and view prediction results.
- **Batch prediction:** Supports batch transaction analysis and CSV-based prediction through the API.
- **Prediction history:** Stores prediction audit records in SQLite.
- **Risk categorization:** Displays risk levels to help users prioritize suspicious transactions.
- **Model evaluation:** Presents model comparison and evaluation metrics.
- **Dashboard and reports:** Provides an interface for reviewing predictions, explanations, analytics, and reports.

## Technology Stack

| Component | Technology |
|---|---|
| Programming language | Python |
| Machine Learning | XGBoost, Scikit-learn |
| Model Explainability | Native XGBoost SHAP contributions |
| Backend API | FastAPI |
| Database | SQLite |
| Frontend | React |
| Frontend tooling | Vite |
| Charts and visualizations | Recharts |
| Data processing | Pandas, NumPy |
| Model serialization | Pickle |

## Machine Learning Approach

### Models evaluated

The experimentation phase evaluated three algorithms:

1. **Logistic Regression** — Provides a simple baseline for comparison.
2. **Random Forest** — Captures nonlinear patterns and interactions between transaction features.
3. **XGBoost** — Uses gradient-boosted decision trees to learn complex patterns in structured transaction data.

The experiments also compared baseline training, class weighting, and SMOTE-based approaches.

### Selected production model

**XGBoost with Class Weight** was selected as the production model.

Class weighting gives greater importance to the minority fraud class during training. This is important because fraud transactions are much less common than legitimate transactions.

The model produces a fraud probability. The application compares this probability against the configured threshold to determine the prediction.

- Production model: XGBoost with Class Weight
- Decision threshold: `0.90`
- Explainability: Native XGBoost prediction contributions

### Production model evaluation

The following metrics were recorded for the production model:

| Metric | Result |
|---|---:|
| Precision | 86.20% |
| Recall | 99.48% |
| F1-score | 92.36% |
| Area Under the Precision-Recall Curve (AUPRC) | 0.9833 |
| ROC-AUC | 0.9999 |

These results are from the project's evaluation workflow. Performance on new or real-world transactions may differ.

## Dataset

The project uses the **PaySim synthetic mobile money transaction dataset**.

The dataset used during experimentation contains approximately:

- 6.36 million transactions
- 8,213 fraudulent transactions
- Approximately 0.129% fraudulent transactions

The project uses a temporal data split to evaluate the model on later transactions:

| Dataset | Step range |
|---|---|
| Training | `step <= 323` |
| Validation | `324–378` |
| Testing | `step > 378` |

Temporal evaluation helps assess performance on transactions occurring later than those used for training.

**Dataset note:** The original dataset is not included in this repository. Obtain it from an authorized source and place it at `data/paysim.csv` before running any workflows that require the original dataset. The pre-trained model may be used without rerunning the training process if its required artifacts and dependencies are available.

## System Architecture

```text
                 User
                  |
                  v
          React + Vite Frontend
                  |
                  v
            FastAPI Backend
                  |
          +-------+--------+
          |                |
          v                v
    Feature Processing   SQLite Audit DB
          |
          v
    Trained XGBoost Model
          |
          v
    Fraud Probability
          |
          v
    Threshold Comparison
          |
          v
    Fraud / Legitimate
          |
          v
    SHAP Explanation
          |
          v
    Prediction Response
          |
          v
      React Dashboard
```

## Project Structure

```text
Fraud_Project/
├── backend/
│   ├── main.py
│   ├── database.py
│   └── schemas.py
├── data/
│   └── paysim.csv                 # Obtain separately
├── experiments/
│   └── results/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── model/
│   ├── fraud_xgb_model.pkl
│   ├── threshold.json
│   └── metadata.json
├── scratch/
├── .gitignore
├── payguard.db                    # Created locally; not committed
└── README.md
```

The exact files may vary as the project evolves. The SQLite database and original dataset are excluded from version control.

## Installation and Setup

### Prerequisites

Install the following:

- Python 3.10 or a compatible Python version supported by the project dependencies
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/tvganesh53/PayGuard-AI-Financial-Fraud-Detection.git
cd PayGuard-AI-Financial-Fraud-Detection
```

### 2. Set up the Python environment

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks environment activation, use the following command to run Python from the virtual environment directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Install the project's Python dependencies using the repository's `requirements.txt` file, if present:

```powershell
python -m pip install -r requirements.txt
```

If the repository does not contain `requirements.txt`, install the required dependencies according to the project's imports and compatible package versions before starting the backend.

### 3. Start the backend

From the repository root:

```powershell
python -m uvicorn backend.main:app --reload
```

The backend will normally be available at:

- API base URL: http://127.0.0.1:8000
- Interactive API documentation: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/api/health

Keep this terminal running.

### 4. Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally:

http://localhost:5173

Keep both the backend and frontend running while using the application.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend health |
| GET | `/api/model/info` | View model information and evaluation details |
| POST | `/api/predict` | Predict a single transaction |
| POST | `/api/predict/batch` | Predict multiple transactions |
| POST | `/api/predict/batch/csv` | Analyze transactions from a CSV upload |
| GET | `/api/dataset/sample` | Retrieve a sample of available dataset records |
| GET | `/api/predictions/history` | Retrieve prediction history |
| GET | `/api/predictions/{prediction_id}` | Retrieve a specific prediction |
| GET | `/api/predictions/analytics` | Retrieve prediction analytics |

Open `/docs` to inspect request schemas and try API endpoints interactively.

## How It Works

1. The user enters transaction information in the React dashboard.
2. The frontend sends the transaction to the FastAPI backend.
3. The backend validates the input and prepares model features.
4. The trained XGBoost model calculates the fraud probability.
5. The application applies the configured decision threshold of `0.90`.
6. Native XGBoost prediction contributions help explain the prediction.
7. Prediction details and explanation data are recorded in SQLite for auditing.
8. The result is returned to the dashboard for review.

## Example Transaction Scenarios

The following are illustrative testing scenarios, not guaranteed model outputs.

### Suspicious transaction

```text
Transaction type: TRANSFER
Amount: 181000
Sender old balance: 181000
Receiver old balance: 0
```

This represents a transfer equal to the sender's entire recorded starting balance. The model must determine whether the complete feature pattern is suspicious.

### Normal-looking transaction

```text
Transaction type: PAYMENT
Amount: 750
Sender old balance: 25000
Receiver old balance: 5000
```

This represents a relatively small payment compared with the sender's recorded starting balance. The model's actual prediction may vary.

## Explainability

PayGuard AI uses native XGBoost prediction contributions to help interpret individual predictions.

These contributions indicate how features influence the model's output. They can help an investigator understand which transaction characteristics contributed toward a higher or lower fraud score.

**Important:** A model prediction is a risk assessment, not proof that a transaction is fraudulent. Predictions and explanations should be reviewed in context.

## Security and Responsible Use

- Do not commit API keys, passwords, credentials, or private transaction records.
- Keep local datasets and generated database files out of version control.
- Use synthetic or appropriately anonymized data for demonstrations.
- Protect API endpoints before deploying the application publicly.
- Validate input data and restrict access to prediction history.
- Evaluate false positives and false negatives before using the model in a real financial workflow.
- Do not use model predictions as the sole basis for consequential financial decisions.

## Current Status

The project includes:

- Machine Learning experiments and model evaluation
- A trained XGBoost production model
- FastAPI prediction endpoints
- SQLite prediction audit storage
- A React dashboard with analysis and explainability features

**Cloud deployment is not yet documented as completed.** The application can be run locally using the instructions above.

## Future Enhancements

- Deploy the application to a secure cloud environment.
- Add authentication and role-based access control.
- Add real-time transaction stream processing.
- Improve monitoring for data drift and model performance.
- Add model retraining and version-management workflows.
- Evaluate the model on additional datasets and real-world scenarios.
- Improve audit reporting and investigation workflows.

## Author

**Project:** PayGuard AI — AI-Based Financial Fraud Detection Using Machine Learning

**GitHub:** https://github.com/tvganesh53/PayGuard-AI-Financial-Fraud-Detection

## License

No license has been specified yet. Unless a license is added to the repository, reuse and redistribution are subject to the applicable copyright rules.
