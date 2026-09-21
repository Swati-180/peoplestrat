# Phase 4C - Frontend Organization Propagation Audit

## A. Organization Context Architecture
- **Source of truth**: The selected organization is managed in `OrganizationContext.jsx` via `activeOrganizationId` and propagated through React Context.
- **Persistence**: Saved in `localStorage` under the key `saved_org_id`.
- **Restoration**: On initialization (`loadOrganizations`), it fetches memberships, checks `saved_org_id` against valid memberships, and if valid, restores it. If invalid or not found, it defaults to the first available organization.
- **Clearing**: When the `user` object from `useAuth` becomes null (e.g., on logout), the context sets all organization states to null and clears the Axios interceptor ID.
- **Invalid/No Orgs**: If the user has no organizations, state remains null. If `saved_org_id` is invalid, it falls back to the first available membership.

## B. API / Header Propagation Audit
- **Propagation Mechanism**: `api.js` exposes a `setApiOrganizationId(id)` function that mutates a module-level variable `activeOrganizationId`.
- **Interceptor**: An Axios request interceptor reads this module-level variable and attaches `x-organization-id` to every request.
- **Bypasses**: A search for `fetch(` and `axios` usage across the frontend revealed that all standard API calls are correctly routed through the `api.js` Axios instance. No direct XMLHttpRequests or independent `fetch` calls bypassing the interceptor were found.
- **Race Conditions**: Because `setApiOrganizationId` is synchronous and updates a shared module variable, concurrent requests during an organization switch could potentially read the wrong ID if not strictly sequenced, though the UI is mostly single-threaded React.

## C. State / Context Audit
- **WorkforceContext**: Depends on `activeOrganizationId`. When the organization changes, `useEffect` triggers `fetchEmployees()`. However, it does *not* clear the `employees` array synchronously before fetching. This means the previous organization's employees remain in state and visible in the UI until the new API request resolves.
- **AIContext**: Retains `messages` and `chatHistory` indefinitely. It does not listen for `activeOrganizationId` changes. When a user switches organizations, their previous chat history (which may contain sensitive workforce data from Org A) remains visible and accessible in Org B.

## D. Organization Switching Flow
1. User selects a new org via `OrganizationSwitcher`.
2. `handleSetActiveOrganization` updates React state (`activeOrganizationId`) and localStorage.
3. `setApiOrganizationId` is called synchronously.
4. Dependent contexts (like `WorkforceContext`) re-run their `useEffect` hooks.
5. **Flaw**: Stale data is not explicitly cleared during the loading phase of the new data. Cached state (like AI messages) is never cleared.

## E. Feature / Page Audit
- **Admin/Manager Pages**: Most pages rely on `useWorkforceData`. They will temporarily show stale data during an organization switch.
- **AI Features**: `AiEmployeeAssistant` and the floating AI Chat rely on `AIContext`, which leaks chat history across organizations.
- **Routing**: `ManagerRoute` and `AdminRoute` correctly re-evaluate permissions based on `activeRole`, which updates synchronously with the organization switch.

## F. Direct API Bypasses
- **Findings**: None. All components appear to import and use the configured Axios instance from `api.js`.

## G. Routing / Auth Audit
- **Logout Flow**: The API interceptor handles 401s by clearing `token` and `user` from localStorage and redirecting to `/login`.
- **Data Leaks**: Because React state isn't fully destroyed on logout unless a hard reload occurs, some contexts (like `AIContext`) might theoretically retain state if they don't explicitly listen to `user` changes.

## H. Draft / Resumability Audit
- **Propagation**: Draft APIs (if called via `api.js`) will correctly receive the `x-organization-id` header.
- **Boundaries**: Since there is no explicit clearing of local draft state on organization switch, if a draft is held in local React state or localStorage without being keyed by `organizationId`, it could cross boundaries.

## I. Existing Test Coverage
- **Current Coverage**: No specific frontend tests for organization switching were identified in this audit.
- **Recommendations**:
  - Test: Org A → Org B switch (verify UI clears immediately).
  - Test: Ensure Axios interceptor always sends the correct header.
  - Test: Ensure `AIContext` is wiped on org switch.
  - Test: Concurrent API requests during an org switch.

## J. Findings

### P0 = Cross-Org Data Exposure
- **File**: `Frontend/src/contexts/AIContext.jsx`
- **Component**: `AIProvider`
- **Evidence**: `messages` and `chatHistory` state are never cleared on organization switch.
- **Risk**: High. Chat history containing Org A's sensitive data remains visible when switching to Org B.
- **Required Fix**: Add a `useEffect` that listens to `activeOrganizationId` and calls `clearChat()` when it changes.
- **Recommended Test**: Mock a chat in Org A, switch to Org B, assert chat history is empty.

### P1 = Incorrect Organization Propagation / Security Bypass
- None found directly in the Axios interceptor, but the global module variable approach is inherently risky if SSR or concurrent rendering were ever introduced.

### P2 = Stale / Wrong Organization State
- **File**: `Frontend/src/contexts/WorkforceContext.jsx`
- **Component**: `WorkforceProvider`
- **Evidence**: `fetchEmployees` does not clear `setEmployees(null)` before initiating the API call.
- **Risk**: Medium. Users see Org A's employees while Org B's are loading.
- **Required Fix**: Inside `fetchEmployees`, clear the employee array (`setEmployees([])` or `null`) immediately before the `api.get` call.
- **Recommended Test**: Assert that `employees` is empty/loading immediately after an org switch.

### P3 = Cleanup / Hardening
- **File**: `Frontend/src/contexts/OrganizationContext.jsx`
- **Component**: `OrganizationProvider`
- **Evidence**: When `user` is null (logged out), contexts should be fully reset.
- **Risk**: Low.
- **Required Fix**: Ensure all global state is wiped on logout.

## Conclusion

1. **What is already correct**: 
   - The centralized `api.js` interceptor pattern correctly enforces the header.
   - `OrganizationContext` properly manages the source of truth and localStorage persistence.
2. **What must be fixed**: 
   - `AIContext` leaking chat history across orgs (P0).
   - `WorkforceContext` showing stale data during load (P2).
3. **What can remain unchanged**: 
   - The core `api.js` interceptor mechanism.
   - The `OrganizationSwitcher` UI component.
4. **Proposed Phase 4C implementation plan**:
   - Step 1: Update `WorkforceContext` to clear state on org change.
   - Step 2: Update `AIContext` and any other data stores to explicitly wipe state on `activeOrganizationId` change.
   - Step 3: Implement frontend tests to verify state isolation on org switch.
5. **Whether Phase 4C is safe to implement**:
   - Yes, it is safe to proceed. The architecture is sound, and the required fixes are isolated state-clearing operations that will not destabilize the application.
