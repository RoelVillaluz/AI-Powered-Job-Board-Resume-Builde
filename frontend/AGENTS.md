# AGENTS.md — Frontend Service

## Stack

React (JSX/TSX), React Query (TanStack Query), Zustand for state, Socket.IO client for real-time, Vite, Axios for HTTP.

## Entry Points

**`src/main.jsx`** — Vite entry: imports styles, creates `QueryClient` (retry: 1, refetchOnWindowFocus: false), renders `<QueryClientProvider><App /></QueryClientProvider>` with React Query DevTools.

**`src/App.jsx`** — Root component: `BrowserRouter` → `SideNavbar` → `SocketProvider` → `Routes`. On mount, calls `authStore.restoreSession()`. `AppRoutes` conditionally renders Dashboard (onboarded) / GetStartedForm (not onboarded) / LandingPage (not logged in).

## Directory Layout

```
src/
├── App.jsx                 Root component + routing
├── main.jsx                Vite entry, QueryClient setup
├── config/api.js           BASE_API_URL from VITE_API_BASE_URL
├── stores/                 Zustand stores (4)
├── contexts/               React Context providers (8+)
├── services/               Axios mutation functions (for non-Query flows)
├── hooks/                  Custom hooks organized by domain
├── pages/                  Route-level page components (12)
├── components/             Reusable UI (Layout, SideNavbar, ErrorBoundary, FormComponents/, Chat/, Dashboard/, etc.)
├── reducers/               useReducer-based state (chat resources)
├── utils/                  Pure utility functions
└── styles/                 CSS files (imported globally)

frontend/
├── api/                    React Query fetch functions (queryFn targets)
└── constants/              Shared constants
```

## Zustand Stores

All use `devtools()` middleware with named labels. `authStore` and `draftStore` additionally use `persist()` for localStorage.

| Store | File | Purpose |
|---|---|---|
| `authStore` | `src/stores/authStore.js` | User, token, isAuthenticated, login/logout/restoreSession. Persisted (token + user only). Cross-store logout cascades to resume + draft stores. |
| `jobStore` | `src/stores/jobStore.js` | selectedJobId, activeFilters, sortBy. Not persisted. |
| `resumeStore` | `src/stores/resumeStore.js` | currentResume reference. Not persisted. |
| `draftStore` | `src/stores/draftStore.tsx` | Generic multi-step form draft persistence (form-agnostic). Persisted under `'form-drafts'` key. |

Cross-store communication: `authStore.logout()` calls `resumeStore.getState().clearCurrentResume()` and `draftStore.getState().clearAllDrafts()`.

## React Query Conventions

- **Stale time:** 5 minutes (`1000 * 60 * 5`) everywhere (one exception: `useResumeJobMatchQuery` uses 10 min)
- **Enabled guards:** Every query uses `enabled: !!param` or `enabled: !!id && !!token`
- **Infinite queries:** `useJobPostings` uses `useInfiniteQuery` with cursor-based pagination
- **Retry:** Default 1 (global), overridden per query: `retry: 3` for data fetches, `retry: false` for fire-and-forget generation, conditional retry on 404
- **Query keys:** Array-based: `['jobPostings', filters, sortBy]`, `['resume', resumeId]`
- **Side effects:** `useEffect` syncs query results into Zustand stores (replacing deprecated `onSuccess`)
- **Optimistic mutations:** `onMutate` saves previous → updates store, `onError` rolls back, `onSuccess` invalidates queries
- **Socket + Query integration:** `setQueryData()` on `matching:complete` events eliminates polling
- **Naming:** `use` + domain + `Query`/`Queries`/`Mutation` (e.g., `useJobPostings`, `useResumeScoreQuery`)

## Two-Layer API Architecture

- **`frontend/api/`** — Fetch functions used as React Query `queryFn` targets. Import `BASE_API_URL`, use raw `axios`, return `data.data`.
- **`frontend/src/services/`** — Functions used as mutation `mutationFn` targets or non-Query flows. Same pattern (raw `axios`), but some take `baseUrl` as parameter.

No centralized Axios instance. No request/response interceptors. Auth headers passed inline per request: `{ headers: { Authorization: 'Bearer ${token}' } }`.

## Socket.IO Setup

**`src/contexts/SocketContext.tsx`** — `SocketProvider` wraps `socket.io-client` connection to `http://localhost:5000`. Connects when `user._id` available, disconnects on logout. Maintains `onlineUsers: Set<string>` via `user-online`/`user-offline` events.

Events handled: `new-message`, `update-message`, `delete-message`, `pin-message`, `messages-seen`, `matching:complete`, `matching:error`, `matchInsight:complete`.

**Two `useSocket` hooks:** one in `SocketContext.tsx` (typed, TS), one in `hooks/useSocket.js` (plain JS). Same context, different import paths.

## Component Conventions

- Every page sets `document.title` in `useEffect` on mount
- `<Layout>` wraps page content: `<div className="content">{children}</div>`
- Error boundaries used selectively around feature sections, not page-level
- Feature-based folder structure: `Chat/`, `Dashboard/`, `JobDetailComponents/`, `JobListComponents/`

## Multi-Step Form Pattern

Used by `CreateJobForm`, `GetStartedForm`, `EditJobDetailPage`:
1. Page creates state via custom hooks (`useCreateJobFormData`, `useStepNavigation`)
2. State passed to typed Context providers (`JobFormProvider`, `StepProvider`)
3. Steps rendered dynamically: `const StepComponent = currentStep.component`
4. Draft persistence via `useDraftPersistence` hook → Zustand `draftStore`

## Chat Architecture

Deeply nested context composition:
```
SocketProvider (app-wide) > ChatProvider (page-level) > MessageOperationsContext.Provider
```
`useMessageOperations` orchestrates: `useMessageGrouping` + `useConversationUpdates` + `useMessageHandlers` + `useMessageSocket`. Heavy use of `useCallback`/`useMemo` to prevent re-renders.

## Mixed JS/TS

Mid-migration. Newer files (forms, mutations, types) are `.ts`/`.tsx`. Older files (stores, pages, chat components) remain `.js`/`.jsx`. New code should be TypeScript.

## Key Files

| Concern | Path |
|---|---|
| Entry point | `src/main.jsx` |
| Root component / routing | `src/App.jsx` |
| API base URL | `src/config/api.js` |
| Auth store | `src/stores/authStore.js` |
| Job store | `src/stores/jobStore.js` |
| Resume store | `src/stores/resumeStore.js` |
| Draft store | `src/stores/draftStore.tsx` |
| Socket.IO context | `src/contexts/SocketContext.tsx` |
| React Query config | `src/main.jsx` (lines 27-34) |
| Job API fetches | `frontend/api/jobApis.js` |
| Resume API fetches | `frontend/api/resumeApis.js` |
| Job query hooks | `src/hooks/jobs/useJobQueries.js` |
| Resume query hooks | `src/hooks/resumes/useResumeQueries.js` |
| Resume mutations | `src/hooks/resumes/useResumeMutations.ts` |
| Message orchestrator | `src/hooks/chats/messages/useMessageOperations.js` |
| Draft persistence | `src/hooks/useDraftPersistence.ts` |
| Error boundary | `src/components/ErrorBoundary.jsx` |
