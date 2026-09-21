# Employee Open/Close (Activate/Terminate) Workflow Read-Only Audit

## Current Implementation Status
**Completely Missing & Dangerously Broken.**

There is no "Employee Open/Close", "Activate/Deactivate", or "Terminated" workflow anywhere in the PeopleStrat implementation. The `Employee` model lacks any status field, and the frontend contains no UI to toggle an employee's employment state gracefully.

Instead, the only available action is a hard delete via the `DELETE /api/employees/:id` endpoint (`Employee.findOneAndDelete`), which physically drops the record from the database. 

## Flow Breakdown & Critical Failures

### 1. Data Integrity Collapse (Historical Data Loss)
When an employee is "closed" by deleting their record, all historical analytics are instantly broken. 
- **Workforce KPIs & Dashboards:** The `PulseCheck`, `QuizResult`/`BehavioralResult`, `PerformanceRecord`, and `FTEWorkload` models rely on the `employeeId` reference. If the `Employee` document is physically deleted, these related records become orphaned.
- **Analytics:** The dashboard charts and workforce intelligence signals lose context for past months/quarters, warping the organization's historical metrics.

### 2. Massive Security & Access Control Flaw
- **Disjointed Models:** The `Employee` model represents the HR record, while the `User` model represents login credentials. 
- **The Bug:** Hard-deleting an `Employee` does **not** delete, deactivate, or lock the corresponding `User` account. A terminated employee retains full login access to the system. 

### 3. Missing Frontend/Backend Workflows
- **Frontend:** There is no UI to mark an employee as terminated. There are no confirmation modals for termination, and no historical view for terminated employees.
- **Backend:** Missing `status` field on `Employee`. Missing endpoints to `terminate` and `reactivate` an employee. 
- **Queries:** All existing controllers (`workforceController`, `employeeController`, `analysisController`, `successionController`) assume all employees in the database are currently active.

## Files Involved
1. **Models:**
   - `backend/models/Employee.js` (Missing `status` field)
   - `backend/models/User.js` (Missing link or locked state)
2. **Controllers:**
   - `backend/controllers/employeeController.js` (Performs hard deletes, fetches without status filtering)
   - `backend/controllers/workforceController.js` (Queries all employees)
   - `backend/controllers/analysisController.js` (Queries all employees)
   - `backend/controllers/successionController.js` (Queries all employees)
   - `backend/controllers/pipelineController.js` (Queries all employees)

## Proposed Implementation Plan

### 1. Schema Migration (Employee & User)
- Add `status: { type: String, enum: ['Active', 'Terminated'], default: 'Active' }` to the `Employee` model.
- Add `isActive: { type: Boolean, default: true }` or `status: { type: String, enum: ['active', 'inactive'], default: 'active' }` to the `User` model to strictly lock out terminated users.
- Create a migration script `backend/migrations/phase4d_employee_status.js` to set all existing employees to `Active`.

### 2. Backend Controller Updates
- **`employeeController.js`:**
  - Change `deleteEmployee` from a hard delete (`findOneAndDelete`) to a soft delete/termination (`findOneAndUpdate({ status: 'Terminated' })`).
  - Upon termination, locate the corresponding `User` via email and lock their account (`isActive: false`).
  - Add a `reactivateEmployee` endpoint.
  - Update `getEmployees` and `getEmployeeStats` to explicitly query `{ status: 'Active' }` so terminated employees do not clutter active HR dashboards.
- **Other Controllers (`analysisController`, `workforceController`, etc.):**
  - Update all baseline queries fetching populations of employees to filter by `{ status: 'Active' }`.

### 3. Login/Auth Updates
- **`authController.js`:**
  - Update `login` to reject logins if the `User` is not active (`if (!user.isActive) return res.status(403).json(...)`).

### 4. Regression Tests
- **Employee Termination Test:** Verify that terminating an employee updates their status to `Terminated` instead of physically dropping the row.
- **Security Check:** Verify that terminating an employee locks the associated user account and rejects subsequent login attempts.
- **Analytics Check:** Verify that terminated employees are correctly excluded from active workforce aggregate stats, but that their orphaned historical `PulseCheck` data is safely ignored or handled without crashing.

**This is a Read-Only Audit. No code has been modified.**
