const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errorMsg = `API request failed (${response.status}: ${response.statusText})`;
      try {
        const errJson = await response.json();
        if (errJson.detail) {
          errorMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch (e) {
        // Fallback to text
        const text = await response.text();
        if (text) errorMsg = text;
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Unable to connect to PayGuard services. Please verify that the backend API server is running on http://127.0.0.1:8000.");
    }
    throw error;
  }
}

export async function getHealth() {
  return request("/api/health");
}

export async function getModelInfo() {
  return request("/api/model/info");
}

export async function getAnalytics() {
  return request("/api/predictions/analytics");
}

export async function getPredictionHistory(params = {}) {
  const query = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== "") {
      query.append(key, params[key]);
    }
  });

  const queryString = query.toString();
  const endpoint = queryString ? `/api/predictions/history?${queryString}` : "/api/predictions/history";
  return request(endpoint);
}

export async function getPrediction(predictionId) {
  return request(`/api/predictions/${encodeURIComponent(predictionId)}`);
}

export async function predictTransaction(data) {
  return request("/api/predict", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function predictBatch(data) {
  return request("/api/predict/batch", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function predictBatchCsv(file) {
  const formData = new FormData();
  formData.append("file", file);
  return request("/api/predict/batch/csv", {
    method: "POST",
    body: formData
  });
}

export async function getDatasetSample() {
  return request("/api/dataset/sample");
}

export async function getAnalyticsSummary() {
  return request("/api/analytics/summary");
}

export async function getPatterns() {
  return request("/api/patterns");
}