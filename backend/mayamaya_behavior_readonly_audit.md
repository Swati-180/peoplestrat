# MayaMaya & Behavior Assessment Read-Only Audit

## 1. Executive Summary
This audit traces the complete end-to-end flow of the Behavior Assessment, analyzing the integration with MayaMaya and its alignment with PeopleStrat's core data models and organization-isolation bounds. The UI is successfully ported to use the MayaMaya SDK, and the webhook correctly pipes results into the PeopleStrat Employee record. However, we identified a legacy controller endpoint that bypasses MayaMaya and a minor data-isolation gap in the webhook's pipeline execution.

---

## 2. End-to-End Flow Trace

1. **Employee Login:** The employee logs in, yielding a JWT.
2. **Start Assessment (UI):** The employee visits the Behavior Assessment page (`Frontend/src/pages/employee/BehaviorAssessment.jsx`). The UI relies exclusively on the MayaMaya SDK iframe (`/js/mayamaya-quiz.min.js`).
3. **Start Assessment (API):** The UI hits `POST /api/quiz/start-quiz`. The `quizController.js` uses `getAuthUserId(req)` to pull the user identity. It explicitly injects `req.organizationId` when calling `quizService.saveInitiated`, binding the quiz attempt to the active organization.
4. **MayaMaya SDK:** The iframe renders the assessment.
5. **Webhook:** Upon completion, MayaMaya triggers `POST /api/quiz/webhook`. The payload is verified via SDK HMAC (`mmQuizzes.results.completed`).
6. **QuizResult:** The webhook securely updates the `QuizResult` document using the verified `userId` and `webhookEventId` (for idempotency).
7. **Pipeline (Data Mapping):** `runPostQuizPipeline` is executed. It maps the MayaMaya 4 quadrants (`spirit`, `purpose`, `rewards`, `profession`) and dynamic skill scores into PeopleStrat's 5 fixed traits (communication, leadership, adaptability, resilience, teamwork). 
8. **Employee/Behavior Update:** The pipeline uses the `owner.email` and `quizResult.organizationId` to securely locate the `Employee` record. It creates a `BehavioralResult` and saves the 5 traits to the `Employee` model, auto-updating the `fitmentScore`.
9. **UI Feedback:** The frontend polls `GET /api/quiz/summary` and displays the completed status, 24-hour cooldown, and the granular skill/quadrant scores.

---

## 3. Findings & Risks

### A. Duplication and Conflict (The Legacy Local API)
**Finding:** The backend still exposes `POST /api/employee/assessments/behavior` in `backend/controllers/employeePortalController.js`.
**Risk:** This legacy endpoint expects a JSON array of `q1...q10` responses and manually computes the 5 traits using old logic. Although the frontend currently bypasses this endpoint in favor of the MayaMaya SDK, its continued existence violates the directive that MayaMaya should be the *canonical* behavioral source. It presents a potential backdoor for updating behavioral scores outside the MayaMaya pipeline.

### B. Organization Isolation Gap (BehavioralResult)
**Finding:** Inside `backend/controllers/quizController.js` (`runPostQuizPipeline`):
```javascript
await BehavioralResult.create({
  employeeId: emp._id,
  scores: finalScores,
  rawResponses,
});
```
**Risk:** This creation lacks the `organizationId` payload. While `employeeId` is strictly isolated, we recently enforced `organizationId` on the `BehavioralResult` schema in Phase 4B. Creating this record without `organizationId` will cause a Mongoose Validation Error, silently failing the pipeline and preventing the historic `BehavioralResult` record from saving.

---

## 4. Required Modifications

**To make MayaMaya the undisputed canonical source and ensure Phase 4B isolation holds:**

1. **`backend/controllers/employeePortalController.js` (and routes):**
   - **Action:** Delete the `submitBehaviorAssessment` function and remove its route binding. MayaMaya is now the only valid ingestion path for behavioral results.

2. **`backend/controllers/quizController.js` (`runPostQuizPipeline`):**
   - **Action:** Inject `organizationId` into the `BehavioralResult.create()` call.
   - **Fix:** `organizationId: quizResult.organizationId`

---

## 5. Proposed Implementation & Testing Plan

### Implementation Phase
1. **Remove Legacy Code:** Strip `submitBehaviorAssessment` from `employeePortalController.js` and `employeePortalRoutes.js`.
2. **Patch Webhook Pipeline:** Add `organizationId: quizResult.organizationId` to `BehavioralResult.create` in `quizController.js`.

### Testing Phase
1. **Integration Test:** Simulate a MayaMaya webhook payload targeting a valid user in Org A.
2. **Verify Schema Compliance:** Confirm that the `BehavioralResult` is successfully created with `organizationId` attached (preventing the Phase 4B validation crash).
3. **Verify API Sunset:** Confirm `POST /api/employee/assessments/behavior` returns a 404 Not Found.
4. **Regression:** Run the full backend test suite to ensure the removal of the legacy API doesn't break older test suites (any old tests targeting it should be deleted or migrated).

*Note: No code changes, migrations, or test modifications have been made during this read-only audit.*
