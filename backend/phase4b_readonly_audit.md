# Phase 4B Read-Only Audit & Implementation Plan

## 1. Executive Summary
The PeopleStrat backend has successfully enforced organization isolation across the majority of its core controllers (`analyticsController`, `optimizationController`, `successionController`, `peerFeedbackController`, `employeePortalController`, and the recently fixed `assessment/pipeline/quiz` controllers). 

However, Phase 4B must address critical leakage in the **Uploads/Ingestion** module and structurally missing `organizationId` fields in several Mongoose schemas. If left unpatched, cross-organizational data bleed will occur during file uploads and metric calculations.

---

## 2. Organization-Isolation Audit Findings

### 2.1 uploadController.js
**Endpoints:** `uploadJD`, `uploadCV`, `uploadActivity`
- **Current Behavior:** Parses uploaded files and creates `JobDescription`, `cvUploads`, and `ActivityUpload` documents using only the user ID.
- **Organization-Isolation Status:** **FAILED (Global Bleed)**
- **Risk Level:** **CRITICAL (P0)**
- **Exact Problematic Access Path:**
  - `const jd = new JobDescription({ ... })` (missing `organizationId: req.organizationId`)
  - `const cv = new cvUploads({ ... })` (missing `organizationId`)
  - `ActivityUpload.insertMany(...)` (missing `organizationId` mapping)
- **Recommended Fix:** Inject `organizationId: req.organizationId` into the payload before saving to the database.
- **Required for Phase 4B:** Yes.
- **Dependencies:** Model updates (see below).

**Endpoint:** `getUploadStats`
- **Current Behavior:** Calculates global counts for dashboard telemetry.
- **Organization-Isolation Status:** **FAILED (Global Bleed)**
- **Risk Level:** **HIGH (P1)**
- **Exact Problematic Access Path:**
  - `JobDescription.countDocuments()` (no filter object)
  - `cvUploads.countDocuments()`
  - `ActivityUpload.countDocuments()`
- **Recommended Fix:** Pass `{ organizationId: req.organizationId }` into all `countDocuments()` calls.
- **Required for Phase 4B:** Yes.

### 2.2 Mongoose Schema Definitions (Models)
**Models:** `WellbeingCheckin.js`, `activityUploads.js`, `cvUploads.js`, `fitmentMatches.js`, `analytics.js`
- **Current Behavior:** Schemas omit the `organizationId` field.
- **Organization-Isolation Status:** **FAILED**
- **Risk Level:** **HIGH (P1)**
- **Exact Problematic Access Path:** `organizationId` is missing from the Mongoose schemas. Even if a controller attempts to query by `organizationId` (e.g., in `analysisController.js`'s flight risk calculation: `WellbeingCheckin.find({ organizationId: req.organizationId })`), it will either be stripped by Mongoose strict mode or fail to match documents.
- **Recommended Fix:** Add `organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }` to these schemas and update indexes.
- **Required for Phase 4B:** Yes.

### 2.3 analysisController.js & aiController.js
- **Current Behavior:** Extracts workforce metrics, fits talent matrices, and interfaces with the Groq LLM API.
- **Organization-Isolation Status:** **PASSED**
- **Risk Level:** **LOW**
- **Exact Problematic Access Path:** None found. The AI fallback mechanisms explicitly feed LLM context using data fetched via `Employee.findOne({ ..., organizationId: req.organizationId })` and `AnalysisResult.find({ organizationId: req.organizationId })`.
- **Recommended Fix:** No changes needed. Preserve existing behavior.

---

## 3. Proposed Phase 4B Implementation Plan

### Step 1: Schema Updates
Modify the following backend models to explicitly include the `organizationId` field and enforce organization-based indexing:
- `backend/models/WellbeingCheckin.js`
- `backend/models/activityUploads.js`
- `backend/models/cvUploads.js`
- `backend/models/fitmentMatches.js`

### Step 2: Upload Controller Isolation
Update `backend/controllers/uploadController.js`:
- Inject `req.organizationId` into `new JobDescription()`, `new cvUploads()`, and `ActivityUpload.insertMany()`.
- Scope `getUploadStats()` queries: `JobDescription.countDocuments({ organizationId: req.organizationId })`.

### Step 3: Phase 4B Data Migration
Create `backend/migrations/phase4b_data_migration.js` to backfill `organizationId` for any dangling records in `cvUploads`, `activityUploads`, `fitmentMatches`, and `WellbeingCheckin`. Similar to Phase 4A, unmappable orphaned records should be purged or quarantined without defaulting to a fallback organization.

### Step 4: Regression Testing
Ensure Phase 4B fixes do not break:
- MayaMaya integrations
- Workflow resumability (`draftController.js` is already scoped correctly)
- The Phase 4A fixes (Assessments, Quizzes, Pipelines)

**Note:** No code modifications, migrations, or deployments have been executed during this audit.
