# 🛡️ AI Workforce Management & Role Fitment Platform

An enterprise-grade, full-stack AI platform designed to modernize organizational talent mapping. The system evaluates employee skills against automated Workforce Diagnostic Tests (WDT), extracting insights from parsed resumes, and dynamically computing Role Fitment algorithms. It also features a real-time AI Chat interface for HR teams to query institutional skill gaps via LLM intelligence.

This application is strictly built on a decoupled **Model-View-Controller (MVC) Architecture**.

---

## 🏗️ System Architecture

### Frontend (React + Vite)
- **Framework:** React 18, Vite, Tailwind CSS, shadcn/ui.
- **State Management:** Fully dynamic via global Context Providers (`WorkforceContext`, `AuthContext`, `AIContext`).
- **Visuals:** Advanced metric graphing leveraging Recharts (Pie, Bar, Radar).

### Backend (Node.js + Express)
- **Architecture:** API Route Layer -> Controller -> Service -> Mongoose ODM.
- **Security:** `helmet` header protections, `express-rate-limit` DDOS guards, and strict stateless `jsonwebtoken` (JWT)/bcrypt Role-Based Access Control (RBAC).
- **Database:** MongoDB Atlas (Profiles, Analytics Snapshots, Assessments, Security).
- **AI Core:** Groq Cloud SDK (Llama 3.1) integrated with dynamic Mongoose context fetching. PDF Parsing + NLP Regex engine.

---

## 🚀 Quick Start / Local Development

Ensure you have Node.js 18+ installed.

### 1. Backend Setup
Navigate to the backend and install all required structural and testing dependencies.
```bash
cd backend
npm install
```

Set up your local `.env` inside the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-workforce
JWT_SECRET=super_secret_jwt_key
GROQ_API_KEY=gsk_... (Required for live AI Chat)
FRONTEND_URL=http://localhost:3000
```

Seed the local MongoDB database with our 20+ Demo Employee network:
```bash
npm run seed
```

Start the Express API:
```bash
npm run dev
```

### 2. Frontend Setup
In a new terminal window, initialize the Vite engine.
```bash
cd Frontend
npm install
```

Set up your `.env` (Optional: Default binds to 5000):
```env
VITE_API_URL=http://localhost:5000/api
```

Boot the frontend:
```bash
npm run dev
```

---

## 🧪 Automated Testing

The backend architecture is rigidly enforced via a robust integration and regression suite (`jest` + `supertest`) tracking JSON envelopes, 400 parameter rejections, Auth barriers, and AI proxying. 

To run the full suite:
```bash
cd backend
npm run test
```

---

## 🌐 Production Deployment

The repository is pre-configured with zero-configuration deployment scripts tailored for Cloud orchestration.

### Vercel (Frontend)
The `/Frontend` folder contains `vercel.json` asserting strict Vite Single-Page Application (SPA) routing overrides.
- **Import:** Point your Vercel project to root folder `Frontend`.
- **Environment Variable:** Set `VITE_API_URL` equal to your live backend domain.

### Render / Railway (Backend)
The root incorporates a standardized `render.yaml` defining a node environment bound to `server.js`.
- **Import:** Point to the `backend/` directory.
- **Add DB:** Connect your `MONGO_URI` strictly to an IP-whitelisted M0 Sandbox Atlas cluster. Insert the matched production `JWT_SECRET`.

---

## 📖 API Documentation

The REST protocol enforces a standardized JSON wrapper for predictable frontend deserialization:
Success: `{ success: true, data: { ... } }`
Error: `{ success: false, error: "Reason" }`

**(All routes except `/auth/login` require `Bearer <Token>` Headers)**

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticates User, replies with signed JWT payload. |
| `POST` | `/api/auth/register` | Provisions User. Requires `department` and `role`. |
| `GET` | `/api/employees` | Fetches normalized workforce schemas for React Chart aggregations. |
| `POST` | `/api/employees/upload-resume` | `multipart/form-data`. Invokes native `pdf-parse` against Node Buffers. |
| `POST` | `/api/assessments` | Issues a standardized global Assessment exam schema. |
| `POST` | `/api/assessments/:id/submit` | Computes Logic/Technical arrays against a max scale threshold. |
| `POST` | `/api/analysis/chat` | Dispatches query to Groq Llama 3.1 OR invokes fallback if no key is present. |

---

## 🤖 Demo Mode Behavior

In order to guarantee unbroken presentation flows regardless of internet telemetry or strict API Quota thresholds, the `/api/ai/chat` endpoint is mapped to a secure fallback bypass. 

If `GROQ_API_KEY` is completely missing from `.env`, the endpoint manually indexes the Mongoose `employees` collection and dynamically answers questions regarding "skill gaps" and "data scientists" specifically to securely fuel UI component mounting.
