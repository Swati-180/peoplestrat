# Phase 4C - Targeted Security Review

## A. AIContext — P0 DEEP AUDIT

### Root Cause
`AIContext` stores chat history in React state (`messages` and `chatHistory`) but completely ignores changes to the active organization. Because React context instances persist as long as the provider remains mounted, the chat state survives organization switches indefinitely.

### AI History Ownership Model
1. **Storage Location**: Chat history is stored exclusively in frontend React state within `AIContext.jsx`. 
2. **Keying**: The history is an unkeyed flat array (`[]`). It is not scoped by user, organization, or session ID.
3. **Backend Involvement**: The backend `chatAssistant` endpoint (`aiController.js`) is stateless. It only receives the current prompt (`message`) and does not receive or persist historical messages. Therefore, chat history is purely a frontend presentation feature.
4. **Ownership Model**: Based on the stateless backend design, chat history belongs exclusively to the **current active organization's local session**. It has no persistence beyond the page reload.

### Cross-Org Exposure Path
1. User interacts with AI in Org A.
2. `messages` and `chatHistory` state arrays populate with Org A context, which contains sensitive PII and scores (e.g., "Sarah Johnson has a 90% burnout risk").
3. User switches to Org B.
4. `activeOrganizationId` changes, but `AIContext` has no listener to clear its state.
5. User opens the AI chat in Org B. The AI chat UI maps over the existing `messages` array, displaying Org A's sensitive data while operating within Org B.

### Race Condition Analysis
- **Scenario**: User submits an AI prompt in Org A, then immediately switches to Org B before the backend responds.
- **Outcome**: The Axios interceptor correctly attaches Org A's header when the request fires. However, when the Promise resolves, the response containing Org A's analysis is blindly pushed into the `messages` array, which the user is now viewing in the context of Org B.

### Minimum Safe AI Fix
In `Frontend/src/contexts/AIContext.jsx`:
1. Import `useOrganization`.
2. Add a `useEffect` that listens to `activeOrganizationId`.
3. When `activeOrganizationId` changes, immediately call `clearChat()` (which sets `messages` to `[]` and should be updated to also set `chatHistory` to `[]`).

---

## B. WorkforceContext — P2 DEEP AUDIT

### Root Cause
When the organization changes, `WorkforceContext`'s `useEffect` triggers `fetchEmployees()`. While it correctly sets `setIsLoading(true)`, it fails to explicitly clear the existing `employees` array before initiating the async API request. 

### Stale State Behavior
1. **Retention**: The `employees` array retains Org A's data while waiting for Org B's API response.
2. **Visibility**: Any component rendering the workforce list or stats will continue to display Org A's data overlaid with a loading spinner (if the component implements one) or just stale data until the Promise resolves.
3. **Cascading Stale State**: Because `AIContext` derives its `workforceData` from `centralEmployees` (via `useMemo`), the AI engine's local data snapshot also remains stale. Analytics, departments, and performance stats derived from the workforce array in UI components will inherently remain stale.

### Race Condition Analysis
- **Scenario**: Rapidly switching Org A -> Org B -> Org C.
- **Outcome**: Three overlapping `fetchEmployees` promises are created. There is no request cancellation or version tracking. If Org B's API response is slower than Org C's, Org B's response will overwrite Org C's data upon resolution, leaving the user viewing Org B's employees while the header/context claims they are in Org C.

### Minimum Safe Workforce Fix
In `Frontend/src/contexts/WorkforceContext.jsx` inside `fetchEmployees`:
1. Clear the data synchronously *before* the API call: `setEmployees([])`.
2. Implement a standard React cleanup closure (`let isMounted = true`) inside the `useEffect` to ignore Promise resolutions from previous organization requests if a new request has already been dispatched.

---

## Required Tests (To be implemented later)

1. **AI Cross-Org Leak Test**:
   - Send an AI prompt while Org A is active.
   - Switch to Org B.
   - Assert that the AI chat history is empty.
2. **AI Race Condition Test**:
   - Mock a slow AI response for Org A.
   - Switch to Org B.
   - Resolve the slow response.
   - Assert that the slow response is discarded and not shown in Org B.
3. **Workforce Stale State Test**:
   - Mock a slow `/employees` response for Org B.
   - Switch from Org A to Org B.
   - Assert that `employees` state is empty (or null) immediately after the switch, before the Promise resolves.
4. **Workforce Race Condition Test**:
   - Trigger Org B switch, then immediately trigger Org C switch.
   - Resolve Org B's response *after* Org C's response.
   - Assert that the final state contains Org C's data.

---

## Files Requiring Modification

1. `Frontend/src/contexts/AIContext.jsx`
2. `Frontend/src/contexts/WorkforceContext.jsx`
