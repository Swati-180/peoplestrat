import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Employee APIs ─────────────────────────────
export const fetchEmployees = (params) => api.get("/employees", { params });
export const fetchEmployeeStats = () => api.get("/employees/stats");
export const fetchEmployeeById = (id) => api.get(`/employees/${id}`);

// ─── Upload APIs ───────────────────────────────
export const fetchUploads = () => api.get("/uploads");
export const uploadEmployeeData = (formData) => api.post("/uploads/employee", formData);

// ─── Analysis APIs ─────────────────────────────
export const runAnalysis = (params) => api.post("/analysis/run", null, { params });
export const fetchAnalysisResults = (params) => api.get("/analysis/results", { params });
export const fetchAnalysisSummary = () => api.get("/analysis/summary");
export const fetchEmployeeAnalysis = (id) => api.get(`/analysis/employee/${id}`);
export const chatWithAI = (message, mode) => api.post("/analysis/chat", { message, mode });

// ─── Optimization APIs ─────────────────────────
export const fetchOptimizationRecommendations = () => api.get("/optimization/recommendations");

// ─── Auth APIs ─────────────────────────────────
export const loginUser = (credentials) => api.post("/auth/login", credentials);
export const registerUser = (data) => api.post("/auth/register", data);
export const fetchCurrentUser = () => api.get("/auth/me");

// ─── Analytics APIs ────────────────────────────
export const fetchWorkforceSummary = () => api.get("/analytics/workforce-summary");
export const fetchSkillGaps = () => api.get("/analytics/skill-gaps");
