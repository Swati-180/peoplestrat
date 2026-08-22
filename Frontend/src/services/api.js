import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

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

// ─── Succession Planning APIs ────────────────────
export const fetchCriticalRoles = () => api.get("/succession/roles");
export const fetchSuccessionPlan = (targetRoleId) => api.get(`/succession/plan/${targetRoleId}`);
export const predictSuccessors = (targetRoleId) => api.post(`/succession/plan/${targetRoleId}/predict`);
export const updateSuccessionCandidate = (targetRoleId, data) => api.put(`/succession/plan/${targetRoleId}/candidate`, data);

// ─── Leadership Pipeline APIs ────────────────────
export const fetchPipelineLeaders = () => api.get("/pipeline/leaders");
export const predictPipelineStage = (employeeId) => api.post(`/pipeline/${employeeId}/predict`);
export const updatePipelineStage = (employeeId, data) => api.put(`/pipeline/${employeeId}/stage`, data);

// ─── Flight Risk APIs (Analysis) ─────────────────
export const getFlightRisk = (employeeId) => api.get(`/analysis/flight-risk/${employeeId}`);
export const predictFlightRisk = (employeeId) => api.post(`/analysis/predict-flight-risk/${employeeId}`);

// ─── Peer Feedback APIs ──────────────────────────
export const submitPeerFeedback = (data) => api.post("/feedback/submit", data);
export const getAggregatedPeerFeedback = (employeeId) => api.get(`/feedback/target/${employeeId}`);
export const getPeerFeedbackColleagues = () => api.get('/feedback/colleagues');

