# CLAUDE.md — tekmar-interface

## Identity

You are building the **customer-facing frontend** for Tekmar, an AI-powered
infrastructure query and analysis engine for security and compliance teams.
This is an Angular application deployed on the public internet. It is the
only surface through which customer users interact with the product.

This application communicates **exclusively** with the Application API
(`tekmar-api`). It never communicates directly with the Pipeline Service,
MCP servers, the database, or any external system. This is Architectural
Invariant #8 — it is absolute and cannot be violated.

---

## Contract References

All interface specifications that govern this project live in the
infrastructure repository. Read these files before implementing any
feature — they are the authoritative source of truth for what to build.

| Contract | Path | What it defines for this project |
|----------|------|----------------------------------|
| Architecture Contract | `../tekmar-infrastructure/contracts/architecture.md` | System overview, tenancy model, user roles, component responsibilities, architectural invariants. Read sections 1–4 and 14 for foundational context. |
| Public API | `../tekmar-infrastructure/contracts/public-api.yaml` | **Primary contract.** Every HTTP endpoint, WebSocket message, request/response shape, authentication flow, error format, and pagination pattern. This is the complete definition of how this application communicates with the backend. |
| MCP Tool Interface | `../tekmar-infrastructure/contracts/mcp-tool-interface.yaml` | The `query_plan` schema (section 2) and `transparency_log` schema (section 4). This application renders both: the query plan during the approval step, and the transparency log in the query detail view. |
| Internal API | `../tekmar-infrastructure/contracts/internal-api.yaml` | The `result_data`, `result_table`, and `result_column` schemas. This application renders query results using these structures. Also defines the WebSocket event-to-stream mapping for understanding the real-time execution flow. |

When implementing a feature, always check the relevant contract first.
If the contract does not define something, ask — do not assume.

---

## Technology Stack

| Concern | Choice |
|---------|--------|
| Framework | Angular (latest stable) |
| Language | TypeScript (strict mode) |
| Styling | SCSS with component-scoped styles |
| State management | Angular signals and services. No external state library (NgRx, Akita) for the MVP. Services hold application state; components consume it via signals or observables. |
| HTTP | Angular HttpClient with interceptors for auth token injection and error handling |
| WebSocket | Native WebSocket API wrapped in an Angular service with reconnection logic |
| Routing | Angular Router with lazy-loaded feature modules |
| Forms | Angular Reactive Forms |
| Build | Angular CLI default build system |
| Testing | Jasmine + Karma for unit tests, no E2E framework in MVP |

---

## Authentication Architecture

This application implements the **silent refresh** pattern with in-memory
access tokens and HTTP-only cookie refresh tokens. This is defined in the
`common.authentication` section of `public-api.yaml`. The implementation
must follow these rules exactly:

**Access token** — stored in a JavaScript variable (an Angular service
property). NEVER stored in localStorage, sessionStorage, or cookies. When
the user refreshes the page or opens a new tab, the access token is lost.
The application recovers by performing a silent refresh on startup.

**Refresh token** — managed entirely by the browser as an HTTP-only cookie
named `tekmar_refresh_token`. This application never reads, writes, or
touches this cookie directly. The browser sends it automatically with
requests to `/api/v1/auth/*` endpoints. The Application API sets and
clears the cookie via `Set-Cookie` headers.

**Silent refresh flow** (runs on application startup):
1. The application initializes with no access token.
2. It calls `POST /api/v1/auth/refresh` (no request body needed; the
   browser sends the cookie automatically).
3. If the response contains an `access_token`, the application stores it
   in memory and proceeds to load the authenticated UI.
4. If the response is 401 (no cookie, expired, or revoked), the
   application redirects to the login page.

**Token injection** — an Angular HTTP interceptor attaches the in-memory
access token to every API request as `Authorization: Bearer <token>`,
except for requests to `/api/v1/auth/register`, `/api/v1/auth/login`,
`/api/v1/auth/refresh`, and `/api/v1/invitations/accept`.

**Token expiration handling** — the access token has a 15-minute lifetime.
The interceptor should detect 401 responses, attempt a single silent
refresh, and retry the original request. If the refresh also fails, the
application redirects to the login page.

---

## WebSocket Connection

This application maintains a persistent WebSocket connection to the
Application API for real-time query lifecycle updates. The protocol is
defined in the `websocket` section of `public-api.yaml`.

**Connection** — connect to `/api/v1/ws?token=<access_token>` where the
token is the current in-memory JWT access token.

**Authentication** — the WebSocket connection is authenticated during the
HTTP upgrade handshake via the token query parameter. If the token expires,
the Application API closes the connection. The application must detect
this, perform a silent refresh, and reconnect with the new token.

**Reconnection** — implement automatic reconnection with exponential
backoff (1s, 2s, 4s, 8s, max 30s). On reconnection, use a fresh access
token. Recover any missed events by calling `GET /queries/:id` for any
queries that were in an active state (interpreting, approved, executing).

**Message routing** — every incoming WebSocket message has an `event`
field (the message type) and a `query_id` field (which query it relates
to). The WebSocket service should dispatch messages to the correct
component or service based on `query_id`.

**Nine event types** are defined (see `public-api.yaml` for full field
details):
- `query_interpreting` — query submitted, interpretation started
- `query_plan_ready` — plan generated, ready for user approval
- `query_interpretation_failed` — interpretation failed
- `query_execution_started` — execution began after approval
- `query_step_started` — a tool invocation started
- `query_step_completed` — a tool invocation succeeded
- `query_step_failed` — a tool invocation failed
- `query_completed` — execution finished with results
- `query_failed` — execution failed entirely

---

## Application Structure

Organize the application as lazy-loaded feature modules with a core module
for singleton services and a shared module for reusable components.

```
src/
├── app/
│   ├── core/                        ← Singleton services, guards, interceptors
│   │   ├── services/
│   │   │   ├── auth.service.ts      ← Token management, login/register/refresh
│   │   │   ├── api.service.ts       ← Base HTTP client with error handling
│   │   │   ├── websocket.service.ts ← WebSocket connection + reconnection
│   │   │   └── current-user.service.ts ← Current user + organization state
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts  ← JWT injection + 401 refresh retry
│   │   ├── guards/
│   │   │   ├── auth.guard.ts        ← Redirect to login if not authenticated
│   │   │   └── admin.guard.ts       ← Redirect if user is not admin role
│   │   └── core.module.ts
│   │
│   ├── features/
│   │   ├── auth/                    ← Login, register, invitation acceptance
│   │   ├── queries/                 ← Query submission, approval, results, history
│   │   ├── integrations/            ← Integration list, connect, disconnect, test
│   │   ├── users/                   ← User list, invite, remove, role management
│   │   ├── settings/                ← Organization settings
│   │   └── activity-logs/           ← Activity log viewer (admin only)
│   │
│   ├── shared/                      ← Reusable components, pipes, directives
│   │   ├── components/
│   │   │   ├── data-table/          ← Generic table component for result rendering
│   │   │   ├── status-badge/        ← Status indicator (query status, health status)
│   │   │   ├── pagination/          ← Cursor-based pagination controls
│   │   │   └── error-display/       ← Standard error message display
│   │   ├── pipes/
│   │   │   ├── relative-time.pipe.ts
│   │   │   └── role-label.pipe.ts
│   │   └── shared.module.ts
│   │
│   ├── app-routing.module.ts
│   └── app.component.ts
│
├── environments/
│   ├── environment.ts               ← API base URL, WS URL
│   └── environment.prod.ts
│
├── styles/                          ← Global SCSS variables, mixins, reset
└── assets/
```

---

## Key Views and Their Data Sources

### Login / Register

**Endpoints:** `POST /auth/login`, `POST /auth/register`

Login accepts email and password, returns `access_token` in the response
body (store in memory) and sets the refresh cookie automatically.
Registration creates a new organization and its founding admin in one
step, returning the same token structure. After successful auth, redirect
to the queries view and establish the WebSocket connection.

### Invitation Acceptance

**Endpoint:** `POST /invitations/accept`

A standalone page reached via invitation link. The URL contains the
invitation token as a query parameter. The page presents a form for
the invited user to set their password and display name. On success,
tokens are issued and the user is redirected to the queries view.

### Query Submission and Lifecycle

This is the core experience of the product. It has four phases, each
driven by WebSocket events.

**Phase 1 — Submission.** The user types a natural language question
into a text input and optionally selects which integrations to query
against. Submitting calls `POST /queries` which returns immediately
with the query in `interpreting` status. The UI transitions to a
waiting state. The WebSocket delivers `query_interpreting` to confirm.

**Phase 2 — Plan Review.** When `query_plan_ready` arrives via
WebSocket, the UI displays the generated plan for the user to review.
The plan contains an ordered list of steps, each showing the tool
display name, the integration it will query, a description of what
the step will do, and the estimated number of tool calls. The user
can approve (`POST /queries/:id/approve`) or reject
(`POST /queries/:id/reject`).

**Phase 3 — Live Execution.** After approval, the WebSocket delivers
real-time execution events. The UI shows a live execution log that
updates as events arrive:
- `query_execution_started` — show the log container with total step count
- `query_step_started` — add a new log entry showing the tool name,
  integration name, and step description, with a loading indicator
- `query_step_completed` — update the entry with duration, record count,
  and a success indicator
- `query_step_failed` — update the entry with duration and error message,
  with a failure indicator

This is the experience that makes the product feel alive. The user
watches each tool invocation happen in real time, like watching a
build pipeline run. Implementation quality matters here.

**Phase 4 — Results.** When `query_completed` arrives, the UI
transitions to the results view. The summary is displayed immediately
from the WebSocket message. The full results are fetched via
`GET /queries/:id`, which returns the `query_detail_response`
containing `result_data` (structured tables), the `transparency_log`,
and the `query_plan`. Render result tables using the `result_data`
schema: each table has a title, column definitions (with keys, labels,
and data types for formatting), and row data. Provide a download
button that calls `GET /queries/:id/export/csv`.

If the query fails (`query_failed` or `query_interpretation_failed`),
display the error message clearly with context about what went wrong.

### Query History

**Endpoint:** `GET /queries` (paginated list)

A list view showing all queries for the organization, ordered by
submission time (most recent first). Each entry shows the query text
(truncated), status badge, result summary (if completed), who submitted
it, and when. Clicking an entry navigates to the full query detail view
via `GET /queries/:id`. Supports filtering by status and by user.

### Integration Management (Admin Only)

**Endpoints:** `GET /integrations`, `POST /integrations`,
`DELETE /integrations/:id`, `POST /integrations/:id/test`

A list of connected integrations showing type, display name, status,
health check status, and who connected it. Admins can connect new
integrations (a form that collects credentials based on integration
type), disconnect existing ones (with confirmation), and test
connection health. Credential fields vary by type:
- **AWS:** Access Key ID, Secret Access Key, Region
- **Google Workspace:** Service Account JSON, Delegated Email (optional)
- **GitHub:** Personal Access Token, Organization name

Credential values are sent to the API during connection but are
**never displayed back** — the API does not return them. The UI should
make this clear (for example, showing masked placeholder text for
connected integrations rather than empty credential fields).

### User Management (Admin Only)

**Endpoints:** `GET /users`, `POST /users/invite`, `GET /invitations`,
`POST /invitations/:id/revoke`, `DELETE /users/:id`,
`PATCH /users/:id/role`

A list of users in the organization with their role, status, and last
login. Admins can invite new users (email + role), revoke pending
invitations, remove users (with confirmation and guard against removing
self or last admin), and change user roles (with guard against demoting
last admin). Error messages from the API for these guard conditions
should be displayed clearly.

### Organization Settings (Admin Only)

**Endpoint:** `GET /organization`, `PATCH /organization`

View and edit organization name. The subscription tier is displayed
but not editable in the MVP (no billing management yet).

### Activity Logs (Admin Only)

**Endpoint:** `GET /activity-logs`

A chronological list of platform activity: who did what, when, from
where. Each entry shows the user, the action type (formatted as a
human-readable sentence, not a raw enum value), the target entity
(linked if applicable), metadata details, IP address, and timestamp.
Filterable by action type and by user.

---

## Role-Based UI Behavior

The current user's role is available from the JWT access token payload
(decoded on the client side) and from the user object returned by the
auth endpoints.

**Admin** sees: all views listed above, including integration management,
user management, organization settings, and activity logs. Navigation
should show these sections.

**Member** sees: query submission, query history, and their own account
information. Navigation should hide integration management, user
management, organization settings, and activity logs. If a member
navigates to an admin-only route directly (via URL), the admin guard
redirects them to the queries view.

---

## Error Handling

All API errors conform to the standard error response format defined in
`public-api.yaml` under `common.error_response`. Every error has a
`code` (machine-readable) and a `message` (human-readable, safe to
display).

The HTTP interceptor should catch errors globally and:
- For 401 with `auth.token_expired`: attempt silent refresh and retry
- For 401 with `auth.token_invalid` or `auth.not_authenticated`:
  redirect to login
- For 403 with `auth.insufficient_role`: show an access denied message
- For 422 with `validation.invalid_field`: display the field-level error
  near the relevant form control
- For 429 with `rate_limit.exceeded`: show a retry-later message
- For 500 with `system.internal_error`: show a generic error message
- For all other errors: display the `message` field from the error response

Never display raw error codes, HTTP status codes, or stack traces to
the user. Always display the `message` field from the API error response.

---

## API Communication Patterns

**Base URL** — all API calls go to `/api/v1/*`. In development, this is
proxied to the Application API's local address. In production, this is
the same origin (the frontend is served from the same domain as the API,
or a reverse proxy routes `/api/v1/*` to the API).

**Pagination** — list endpoints use cursor-based pagination. The response
includes a `pagination` object with `next_cursor`, `has_more`, and
`total_count`. To fetch the next page, include `?cursor=<next_cursor>`.
The `limit` parameter defaults to 20 and can be set between 1 and 100.

**Timestamps** — all timestamps from the API are ISO 8601 UTC strings.
Display them in the user's local timezone using Angular's DatePipe or
a relative time pipe (for example, "3 minutes ago").

**UUIDs** — all IDs are UUID v4 strings. Route parameters use the UUID
directly (for example, `/queries/550e8400-e29b-41d4-a716-446655440000`).

---

## Coding Conventions

**File naming** — follow Angular CLI conventions: `feature-name.component.ts`,
`feature-name.service.ts`, `feature-name.module.ts`, `feature-name.guard.ts`.

**Component design** — prefer small, focused components. Smart components
(pages) handle data fetching and state; dumb components (shared) receive
data via inputs and emit events via outputs.

**TypeScript interfaces** — define interfaces for every API response
schema and every WebSocket event type. These interfaces should match
the schemas defined in the contracts exactly. Place them in a `models/`
directory at the feature or core level.

**Observables vs Signals** — use Angular signals for synchronous state
(current user, current organization, auth status). Use observables for
asynchronous streams (WebSocket events, HTTP responses). Do not mix
patterns unnecessarily.

**Error handling** — never swallow errors silently. Every HTTP call
should handle the error case. Use the global interceptor for common
patterns and component-level error handling for context-specific messages.

**No hardcoded strings** — API paths, WebSocket event names, query status
values, role names, and integration types should be defined as constants
or enums, not as string literals scattered across components. When the
contract defines allowed values, mirror them in a TypeScript enum or
const object.

**No direct DOM manipulation** — use Angular's template binding, renderer,
or ViewChild. Never use `document.querySelector` or similar.

**Comments** — comment the why, not the what. Do not add comments that
restate what the code does. Do add comments that explain non-obvious
decisions or contract references.
