import os
import time
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from ml.data_loader import (
    load_dataset,
    temporal_split,
    stratified_random_split,
    get_leakage_audit_summary
)
from ml.feature_engineering import engineer_features, PRODUCTION_FEATURES
from ml.preprocessing import LeakageGuardScaler
from ml.train_models import get_experiment_models
from ml.evaluate_models import evaluate_model_performance, get_pr_curve_data, get_roc_curve_data
from ml.threshold_optimizer import optimize_threshold

def setup_experiment_directories(base_dir: str = "."):
    """Ensures experiment output directories exist."""
    dirs = [
        os.path.join(base_dir, "experiments", "results"),
        os.path.join(base_dir, "experiments", "models"),
        os.path.join(base_dir, "experiments", "plots")
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    return dirs

def run_all_experiments(
    data_path: str = "data/paysim.csv",
    sample_ratio: float = None,
    base_dir: str = "."
):
    """
    Master runner executing the 9-experiment ML matrix and generating plots and results.
    """
    print("=" * 80, flush=True)
    print("STARTING PHASE 1: ML EXPERIMENTATION & VALIDATION PIPELINE", flush=True)
    print("=" * 80, flush=True)

    res_dir, mod_dir, plot_dir = setup_experiment_directories(base_dir)

    # 1. Load Dataset
    full_df = load_dataset(data_path=data_path, sample_ratio=sample_ratio)

    # 2. Compare Data Splitting Strategies
    print("\n" + "-"*50, flush=True)
    print("STEP 1: Splitting Strategy Analysis (Temporal vs Stratified)", flush=True)
    print("-" * 50, flush=True)
    temp_train_df, temp_val_df, temp_test_df = temporal_split(full_df)
    strat_train_df, strat_val_df, strat_test_df = stratified_random_split(full_df)

    # Feature engineering for Time-Aware Temporal split
    X_train_df, y_train = engineer_features(temp_train_df)
    X_val_df, y_val = engineer_features(temp_val_df)
    X_test_df, y_test = engineer_features(temp_test_df)

    print(f"\nEngineered Features (Exact 10 Production Schema):")
    for i, col in enumerate(PRODUCTION_FEATURES, 1):
        print(f"  {i:2d}. {col}")

    # Scaler pipeline
    scaler_guard = LeakageGuardScaler()
    X_train_scaled, fitted_scaler = scaler_guard.fit_transform_train(X_train_df)
    X_val_scaled = scaler_guard.transform(X_val_df)
    X_test_scaled = scaler_guard.transform(X_test_df)

    # 3. Load 9 Experiment Models
    experiment_configs = get_experiment_models(y_train, random_state=42)

    results_list = []
    detailed_results = {}
    pr_curves = {}
    threshold_histories = {}
    best_model_name = None
    best_test_f1 = -1.0

    print("\n" + "-"*50, flush=True)
    print("STEP 2: Executing 9-Experiment Matrix (Time-Aware Temporal Split)", flush=True)
    print("-" * 50, flush=True)

    for exp_id, config in experiment_configs.items():
        name = config["name"]
        alg = config["algorithm"]
        tech = config["technique"]
        model = config["model"]
        requires_scaling = config["requires_scaling"]

        print(f"\n[Experiment {len(results_list)+1}/9] Training {name}...")

        # Select scaled or raw features
        X_tr = X_train_scaled if requires_scaling else X_train_df.values
        X_va = X_val_scaled if requires_scaling else X_val_df.values
        X_te = X_test_scaled if requires_scaling else X_test_df.values

        t0 = time.time()
        model.fit(X_tr, y_train.values)
        fit_time = round(time.time() - t0, 3)

        # Get probabilities
        if hasattr(model, "predict_proba"):
            val_probs = model.predict_proba(X_va)[:, 1]
            test_probs = model.predict_proba(X_te)[:, 1]
        else:
            val_probs = model.decision_function(X_va)
            test_probs = model.decision_function(X_te)

        # Optimize threshold on Validation set ONLY
        thresh_opt = optimize_threshold(y_val.values, val_probs, target_metric="f1")
        opt_thresh = thresh_opt["best_threshold"]

        # Evaluate test set at default (0.50), opt_thresh, and prod (0.90)
        metrics_default = evaluate_model_performance(y_test.values, test_probs, threshold=0.50)
        metrics_opt = evaluate_model_performance(y_test.values, test_probs, threshold=opt_thresh)
        metrics_prod090 = evaluate_model_performance(y_test.values, test_probs, threshold=0.90)

        p_curve, r_curve, _ = get_pr_curve_data(y_test.values, test_probs)
        pr_curves[exp_id] = {"precision": p_curve, "recall": r_curve, "name": name}
        threshold_histories[exp_id] = thresh_opt["history"]

        row = {
            "Experiment_ID": exp_id,
            "Name": name,
            "Algorithm": alg,
            "Technique": tech,
            "Fit_Time_Sec": fit_time,
            "Val_Best_Threshold": opt_thresh,
            "Val_Max_F1": round(thresh_opt["best_f1_score"], 4),
            "Test_Precision_Default": round(metrics_default["precision"], 4),
            "Test_Recall_Default": round(metrics_default["recall"], 4),
            "Test_F1_Default": round(metrics_default["f1_score"], 4),
            "Test_Precision_OptThresh": round(metrics_opt["precision"], 4),
            "Test_Recall_OptThresh": round(metrics_opt["recall"], 4),
            "Test_F1_OptThresh": round(metrics_opt["f1_score"], 4),
            "Test_Precision_Prod090": round(metrics_prod090["precision"], 4),
            "Test_Recall_Prod090": round(metrics_prod090["recall"], 4),
            "Test_F1_Prod090": round(metrics_prod090["f1_score"], 4),
            "Test_AUPRC": round(metrics_opt["auprc"], 4),
            "Test_ROC_AUC": round(metrics_opt["roc_auc"], 4)
        }
        results_list.append(row)

        detailed_results[exp_id] = {
            "config": {"name": name, "algorithm": alg, "technique": tech, "requires_scaling": requires_scaling},
            "fit_time_seconds": fit_time,
            "validation_threshold_optimization": thresh_opt,
            "test_eval_default_0_50": metrics_default,
            "test_eval_opt_threshold": metrics_opt,
            "test_eval_prod_0_90": metrics_prod090
        }

        if metrics_opt["f1_score"] > best_test_f1:
            best_test_f1 = metrics_opt["f1_score"]
            best_model_name = exp_id

        print(f"  Fit Time: {fit_time}s | Val Best Thresh: {opt_thresh:.2f} (F1: {thresh_opt['best_f1_score']:.4f})", flush=True)
        print(f"  Test Metrics @ OptThresh ({opt_thresh:.2f}): Precision: {metrics_opt['precision']:.4f}, Recall: {metrics_opt['recall']:.4f}, F1: {metrics_opt['f1_score']:.4f}, AUPRC: {metrics_opt['auprc']:.4f}", flush=True)

    results_df = pd.DataFrame(results_list)
    results_csv_path = os.path.join(res_dir, "results.csv")
    results_df.to_csv(results_csv_path, index=False)
    print(f"\nSaved results summary to {results_csv_path}")

    # 4. Save Detailed JSON & Metadata
    metadata = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_dataset_rows": len(full_df),
        "temporal_split_sizes": {
            "train": len(X_train_df),
            "val": len(X_val_df),
            "test": len(X_test_df)
        },
        "features": PRODUCTION_FEATURES,
        "leakage_audit": get_leakage_audit_summary(),
        "best_model_by_f1": best_model_name
    }

    results_json_path = os.path.join(res_dir, "results.json")
    with open(results_json_path, "w") as f:
        json.dump(detailed_results, f, indent=2)

    metadata_path = os.path.join(res_dir, "experiment_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    # 5. Generate Experimental Plots
    print("\n" + "-"*50)
    print("STEP 3: Generating Publication-Quality Evaluation Plots")
    print("-" * 50)
    generate_plots(pr_curves, threshold_histories, results_df, detailed_results, best_model_name, experiment_configs, X_train_df, y_train, plot_dir)

    print("\n" + "=" * 80)
    print(f"PHASE 1 COMPLETE. Best Model: {best_model_name} (Test F1: {best_test_f1:.4f})")
    print("=" * 80)
    return results_df, detailed_results, metadata

def generate_plots(pr_curves, threshold_histories, results_df, detailed_results, best_exp_id, experiment_configs, X_train_df, y_train, plot_dir):
    plt.style.use("seaborn-v0_8-darkgrid" if "seaborn-v0_8-darkgrid" in plt.style.available else "default")

    # Plot 1: Precision-Recall Curves Comparison
    plt.figure(figsize=(10, 7))
    for exp_id, p_data in pr_curves.items():
        plt.plot(p_data["recall"], p_data["precision"], label=f"{p_data['name']} (AUPRC: {detailed_results[exp_id]['test_eval_opt_threshold']['auprc']:.3f})")
    plt.xlabel("Recall", fontsize=12)
    plt.ylabel("Precision", fontsize=12)
    plt.title("Precision-Recall Curves Comparison (Test Set)", fontsize=14, fontweight="bold")
    plt.legend(bbox_to_anchor=(1.05, 1), loc="upper left", fontsize=10)
    plt.tight_layout()
    plt.savefig(os.path.join(plot_dir, "pr_curves_comparison.png"), dpi=300)
    plt.close()
    print("  Created: pr_curves_comparison.png")

    # Plot 2: Threshold Optimization for Best Model
    best_history = threshold_histories[best_exp_id]
    th_vals = [h["threshold"] for h in best_history]
    prec_vals = [h["precision"] for h in best_history]
    rec_vals = [h["recall"] for h in best_history]
    f1_vals = [h["f1_score"] for h in best_history]
    opt_th = detailed_results[best_exp_id]["validation_threshold_optimization"]["best_threshold"]

    plt.figure(figsize=(10, 6))
    plt.plot(th_vals, prec_vals, label="Precision", color="#1f77b4", linewidth=2)
    plt.plot(th_vals, rec_vals, label="Recall", color="#ff7f0e", linewidth=2)
    plt.plot(th_vals, f1_vals, label="F1-Score", color="#2ca02c", linewidth=2.5)
    plt.axvline(x=opt_th, color="#d62728", linestyle="--", label=f"Optimal Val Threshold ({opt_th:.2f})")
    plt.axvline(x=0.90, color="#9467bd", linestyle=":", label="Production Threshold (0.90)")
    plt.xlabel("Decision Threshold", fontsize=12)
    plt.ylabel("Score", fontsize=12)
    plt.title(f"Threshold Optimization Curve ({detailed_results[best_exp_id]['config']['name']})", fontsize=14, fontweight="bold")
    plt.legend(fontsize=10)
    plt.tight_layout()
    plt.savefig(os.path.join(plot_dir, "threshold_optimization.png"), dpi=300)
    plt.close()
    print("  Created: threshold_optimization.png")

    # Plot 3: Model Performance Comparison Bar Chart
    plt.figure(figsize=(12, 6))
    x_labels = results_df["Name"].values
    f1_scores = results_df["Test_F1_OptThresh"].values
    auprc_scores = results_df["Test_AUPRC"].values

    x = np.arange(len(x_labels))
    width = 0.35

    plt.bar(x - width/2, f1_scores, width, label="Test F1-Score (@ Opt Thresh)", color="#2b5c8f")
    plt.bar(x + width/2, auprc_scores, width, label="Test AUPRC", color="#d95f02")
    plt.xlabel("Model Configuration", fontsize=12)
    plt.ylabel("Score", fontsize=12)
    plt.title("Model Comparison: Test F1-Score vs AUPRC", fontsize=14, fontweight="bold")
    plt.xticks(x, x_labels, rotation=45, ha="right", fontsize=9)
    plt.legend(fontsize=10)
    plt.tight_layout()
    plt.savefig(os.path.join(plot_dir, "model_performance_comparison.png"), dpi=300)
    plt.close()
    print("  Created: model_performance_comparison.png")

    # Plot 4: Top Model Confusion Matrix (at Opt Thresh & Prod 0.90)
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    cm_opt = detailed_results[best_exp_id]["test_eval_opt_threshold"]["confusion_matrix"]
    cm_opt_arr = np.array([[cm_opt["tn"], cm_opt["fp"]], [cm_opt["fn"], cm_opt["tp"]]])

    cm_p90 = detailed_results[best_exp_id]["test_eval_prod_0_90"]["confusion_matrix"]
    cm_p90_arr = np.array([[cm_p90["tn"], cm_p90["fp"]], [cm_p90["fn"], cm_p90["tp"]]])

    sns.heatmap(cm_opt_arr, annot=True, fmt="d", cmap="Blues", ax=axes[0], cbar=False)
    axes[0].set_title(f"Optimal Threshold ({opt_th:.2f})\nPrecision: {detailed_results[best_exp_id]['test_eval_opt_threshold']['precision']:.3f}, Recall: {detailed_results[best_exp_id]['test_eval_opt_threshold']['recall']:.3f}")
    axes[0].set_xlabel("Predicted")
    axes[0].set_ylabel("Actual")

    sns.heatmap(cm_p90_arr, annot=True, fmt="d", cmap="Greens", ax=axes[1], cbar=False)
    axes[1].set_title(f"Production Threshold (0.90)\nPrecision: {detailed_results[best_exp_id]['test_eval_prod_0_90']['precision']:.3f}, Recall: {detailed_results[best_exp_id]['test_eval_prod_0_90']['recall']:.3f}")
    axes[1].set_xlabel("Predicted")
    axes[1].set_ylabel("Actual")

    plt.suptitle(f"Confusion Matrix Comparison on Test Set ({detailed_results[best_exp_id]['config']['name']})", fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(os.path.join(plot_dir, "confusion_matrices.png"), dpi=300)
    plt.close()
    print("  Created: confusion_matrices.png")

if __name__ == "__main__":
    run_all_experiments()
