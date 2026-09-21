# Fatigue & Wellbeing Read-Only Audit

## 1. Trace and Current Behavior

### Employee Submission Flow
1. **Frontend:** The employee accesses the Pulse Check page at `/employee/pulse-check` (`Frontend/src/pages/employee/PulseCheck.jsx`).
2. **Data Collection:** The UI collects responses on a 1-5 scale for:
   - Overall stress level
   - Workload manageability
   - Sleep quality
3. **API Submission:** The frontend sends a `POST` request to `/api/employee/pulse-check`.
4. **Backend Processing (`employeePortalController.js`):**
   - Resolves the current employee safely using JWT and `organizationId`.
   - **Calculates Subjective Score:** Converts the 1-5 inputs into a 0-100 penalty score.
   - **Calculates Objective Penalty:** Queries the last 30 `PerformanceRecord`s for the employee (scoped by `organizationId`) to sum `overtime_hours`, applying a penalty up to 100.
   - **Final Fatigue Score:** `(Subjective * 0.7) + (Objective * 0.3)`.
5. **Storage:** 
   - A `PulseCheck` document is created to log the historical submission.
   - The `Employee` record is updated directly with the new `fatigueScore`.
6. **Result Display:** The UI immediately shows the score, risk level, and an AI/rule-based recommendation.

### Manager View Flow
1. **Frontend:** The manager accesses `/fatigue` (`Frontend/src/pages/Fatigue.jsx`).
2. **Data Fetching:** The page utilizes `useWorkforceData()`, which pulls all employees for the organization securely.
3. **Calculation & Display:** The UI maps over `employees`, reads `emp.fatigueScore`, calculates aggregate KPIs (Critical, High, Healthy averages), and displays a risk matrix. Clicking a row opens `EmployeeDrawer.jsx` for details.

---

## 2. Completed vs Broken/Missing Functionality

### Completed
- **Pulse Check UI & API:** fully functional and stores real database data.
- **Fatigue Calculation:** Successfully merges subjective survey data with objective overtime data.
- **Manager Dashboard:** Aggregates real data effectively with proper KPI calculations.

### Broken/Missing (The Disconnect)
- **`WellbeingCheckin` is an Orphan Model:** The `backend/models/WellbeingCheckin.js` model exists but is **never populated or created** anywhere in the application logic. 
- **Broken Dependency in Flight Risk Engine:** The `backend/services/flightRiskEngine.js` queries `WellbeingCheckin.find()` to calculate 20% of an employee's flight risk score (expecting `engagementScore`, `moodScore`, `stressLevel`). Because this model is never written to, the flight risk calculation will *always* report missing data and drop 20% of its weighting.

---

## 3. Data Isolation and Access Control

- **Phase 4B Isolation:** The backend `submitPulseCheck` securely scopes the `PerformanceRecord` lookup using `organizationId: req.organizationId`. The resulting `PulseCheck` document is saved with `organizationId` securely attached.
- **Employee Isolation:** 
  - `employeePortalController.js` strictly limits updates to `findMyEmployee(req)`.
  - In `Fatigue.jsx`, client-side RBAC ensures employees can only view their own record (`displayEmployees` filters by `e._id === user.id`). Managers receive the full organization list securely provided by `WorkforceContext`.
- **Verdict:** Secure. No data bleed across organizations or peers.

---

## 4. Proposed Implementation Plan

To fix the broken dependency in the Flight Risk Engine and unify the wellbeing data models:

1. **Deprecate `WellbeingCheckin`:** 
   - Remove references to `WellbeingCheckin` in migration scripts and tests.
   - Delete `backend/models/WellbeingCheckin.js`.
2. **Update `flightRiskEngine.js` and `analysisController.js`:**
   - Swap the `WellbeingCheckin` query in `analysisController.js` to query `PulseCheck.find()`.
   - Update `calculateDeterministicFlightRisk` in `flightRiskEngine.js` to read from the `PulseCheck` schema (`stressLevel`, `workloadManageability`, `sleepQuality`) instead of the defunct `WellbeingCheckin` fields.
3. **Adjust Flight Risk Weights:** Ensure the 1-5 scales from `PulseCheck` map correctly to the 20% weighting in the flight risk calculation.

---

## 5. Proposed Tests

1. **Pulse Check Isolation Test:** Ensure `submitPulseCheck` correctly computes fatigue and saves `PulseCheck` with the active `organizationId`.
2. **Flight Risk Engine Integration Test:** Verify that `calculateDeterministicFlightRisk` successfully consumes a `PulseCheck` record and awards the 20% wellbeing weight without reporting missing inputs.
3. **Regression Testing:** Run the full suite to ensure the removal of `WellbeingCheckin` does not break any historic Phase 4B tests or migrations.
