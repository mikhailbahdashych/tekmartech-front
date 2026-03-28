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
| Architecture Contract | `../tekmartech-infrastructure/contracts/architecture.md` | System overview, tenancy model, user roles, component responsibilities, architectural invariants. Read sections 1–4 and 14 for foundational context. |
| Public API | `../tekmartech-infrastructure/contracts/public-api.yaml` | **Primary contract.** Every HTTP endpoint, WebSocket message, request/response shape, authentication flow, error format, and pagination pattern. This is the complete definition of how this application communicates with the backend. |
| MCP Tool Interface | `../tekmartech-infrastructure/contracts/mcp-tool-interface.yaml` | The `query_plan` schema (section 2) and `transparency_log` schema (section 4). This application renders both: the query plan during the approval step, and the transparency log in the query detail view. |
| Internal API | `../tekmartech-infrastructure/contracts/internal-api.yaml` | The `result_data`, `result_table`, and `result_column` schemas. This application renders query results using these structures. Also defines the WebSocket event-to-stream mapping for understanding the real-time execution flow. |

When implementing a feature, always check the relevant contract first.
If the contract does not define something, ask — do not assume.

---

## Technology Stack

| Concern | Choice |
|---------|--------|
| Framework | Angular (latest stable) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS for utility-based styling + SCSS for component-specific overrides |
| Component library | Angular Material (for form controls, tables, dialogs, snackbars, menus) |
| Icons | Lucide Angular (lucide-angular) |
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

**Ten event types** are defined (see `public-api.yaml` for full field
details):
- `query_interpreting` — query submitted, interpretation started
- `query_interpretation_text_delta` — a chunk of the AI's analysis text
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

**Phase 1 — Submission and Interpretation.** The user types a natural
language question into a text input and optionally selects which
integrations to query against. Submitting calls `POST /queries` which
returns immediately with the query in `interpreting` status. The
WebSocket delivers `query_interpreting` to confirm, and the UI
transitions to the interpretation view.

Then `query_interpretation_text_delta` events begin arriving rapidly.
Each carries a small chunk of text — the AI's analysis of the question,
its reasoning about which tools and integrations to use, and its
explanation of the approach it will take. The UI appends each delta to
a growing text display, creating the effect of watching the AI think
in real time, like a chat message being typed. This is a core part of
the product experience: the user sees the AI working, not a spinner.

When interpretation completes, `query_plan_ready` arrives with the
full plan. If interpretation fails, `query_interpretation_failed`
arrives with an error message, and the UI displays the error alongside
whatever interpretation text was already shown.

**Phase 2 — Plan Review.** When `query_plan_ready` arrives, the UI
transitions from the streaming interpretation text to the plan approval
view. The AI's interpretation text remains visible (scrolled up or
collapsed) so the user can reference the AI's reasoning. The plan
itself is displayed as an ordered list of steps, each showing the tool
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

## Design Direction

Tekmar is a professional B2B SaaS tool for security and compliance
teams. The visual language communicates trust, precision, and technical
competence. The design references Vanta and Datadog: clean, minimal,
data-focused, and free of decorative elements. Every pixel serves a
functional purpose. The interface should feel like a tool built by
engineers for engineers — dense with information, fast to scan, and
quiet when nothing needs attention.

### Design Principles

1. **Content first.** The UI exists to display data, not to look
   impressive. Reduce chrome (borders, shadows, gradients) to the
   minimum needed to establish visual hierarchy. When in doubt, remove.

2. **Progressive disclosure.** Show summary information by default;
   reveal detail on interaction. Query results show a summary table;
   the transparency log is one click deeper. Integration cards show
   status; credential details are behind an expand action.

3. **Status at a glance.** Every entity (query, integration, user,
   invitation) has a visible status indicator. The user should be able
   to scan a list and understand the state of everything without
   reading text.

4. **Quiet until relevant.** Success states are muted (subtle green
   check marks). Only errors and warnings demand visual attention
   (vivid color, icons). The default state of the interface is calm.

### Layout

Persistent sidebar navigation on the left, main content area on the
right. The sidebar is narrow (w-60, 240px) and dark.

**Sidebar structure (top to bottom):**
- Brand mark: the word "Tekmar" in Montserrat SemiBold, white, text-lg.
  No logo icon in the MVP — the wordmark is sufficient.
- Spacing (mt-8).
- Navigation section — primary:
  - "New Query" button: full-width, indigo-500 background, white text,
    rounded-lg, font-medium. This is the most prominent interactive
    element in the sidebar. It stands apart from the navigation links.
  - Spacing (mt-6).
- Navigation section — links (each is a row with an icon and label):
  - Queries (icon: command-line or terminal icon) — `/queries`
  - Integrations (icon: plug or link icon) — `/integrations` (admin)
  - Team (icon: users icon) — `/users` (admin)
  - Activity Log (icon: list/clock icon) — `/activity-logs` (admin)
  - Settings (icon: cog/gear icon) — `/settings` (admin)
- Links use: text-sm, text-slate-400 default, text-white on hover,
  bg-slate-700/50 on hover, bg-slate-700 + text-white for active route.
  Icons are 18px, same color as text.
- Spacer (flex-1, pushes user info to bottom).
- User section at bottom: small avatar circle (initials-based, bg-indigo-500),
  display name (text-sm, text-white), role badge (tiny text-xs pill:
  "Admin" in indigo-400/20 bg with indigo-300 text, "Member" in
  slate-600 bg with slate-300 text). Logout as a small icon button
  (door/arrow icon, text-slate-500, hover text-white).

**Main content area:**
- Background: bg-slate-50.
- Inner padding: px-8 py-6.
- Maximum content width: max-w-6xl (1152px) for content-heavy pages
  (tables, forms). The query experience page uses full width.
- Page header pattern: page title (text-xl, font-semibold, text-slate-900)
  on the left, primary action button on the right (e.g., "Connect
  Integration", "Invite User"). Below the header, an optional
  description line (text-sm, text-slate-500). Divider line (border-b,
  border-slate-200) below.

### Color System

All colors use the Tailwind CSS palette. Define custom CSS variables
for semantic usage so colors are consistent and changeable in one place.

**Surface colors:**
- Sidebar background: `slate-900`
- Sidebar hover: `slate-800` or `slate-700/50`
- Sidebar active: `slate-700`
- Main background: `slate-50`
- Card background: `white`
- Card border: `slate-200`
- Card shadow: `shadow-sm` (Tailwind's smallest shadow)

**Text colors:**
- Primary text: `slate-900`
- Secondary text: `slate-500`
- Tertiary text / captions: `slate-400`
- Sidebar text: `slate-400` (default), `white` (active/hover)
- Link text: `indigo-600`

**Brand and accent:**
- Primary action (buttons, links, active indicators): `indigo-600`
  (hover: `indigo-700`, active: `indigo-800`)
- Primary action text: `white`
- Focus ring: `ring-2 ring-indigo-500 ring-offset-2`

**Semantic colors (used for status indicators, badges, alerts):**
- Success: `emerald-600` text on `emerald-50` background, `emerald-500`
  for icons and borders
- Warning: `amber-600` text on `amber-50` background, `amber-500` for
  icons and borders
- Error / destructive: `red-600` text on `red-50` background, `red-500`
  for icons and borders
- Info / neutral: `blue-600` text on `blue-50` background

**Query status colors (specific to the query lifecycle):**
- interpreting: `blue-500` (in progress)
- awaiting_approval: `amber-500` (needs attention)
- approved: `indigo-500` (acknowledged)
- executing: `blue-500` (in progress, same as interpreting)
- completed: `emerald-500` (success)
- failed: `red-500` (error)
- rejected: `slate-400` (dismissed)

**Integration status colors:**
- active: `emerald-500`
- inactive: `slate-400`
- error: `red-500`
- Health: healthy = `emerald-500`, unhealthy = `red-500`, unknown = `slate-400`

### Typography

**Font family:** Montserrat for headings and UI elements, loaded from
Google Fonts. System font stack (`-apple-system, BlinkMacSystemFont,
"Segoe UI", Roboto, sans-serif`) as fallback and for body text / data
display. Monospace: `"JetBrains Mono", "Fira Code", ui-monospace,
monospace` for technical values (query IDs, tool names, JSON, code).

Configure in Tailwind:
```
fontFamily: {
  heading: ['Montserrat', 'sans-serif'],
  sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
  mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
}
```

**Type scale:**
- Page title: `font-heading text-xl font-semibold text-slate-900`
- Section header: `font-heading text-base font-semibold text-slate-800`
- Table column header: `text-xs font-medium text-slate-500 uppercase tracking-wider`
- Body text: `text-sm text-slate-700` (14px)
- Secondary text: `text-sm text-slate-500`
- Caption / label: `text-xs text-slate-500`
- Data in tables: `text-sm text-slate-900`
- Monospace values: `font-mono text-xs text-slate-600`
- Button text: `text-sm font-medium`

**Line height:** Use Tailwind defaults (leading-5 for text-sm,
leading-6 for text-base). Tables use tighter line height (leading-5).

### Components

**Buttons:**
- Primary: `bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-2 text-sm font-medium shadow-sm`
- Secondary: `bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium`
- Destructive: `bg-red-600 text-white hover:bg-red-700 rounded-lg px-4 py-2 text-sm font-medium`
- Ghost (for icon buttons in tables): `text-slate-400 hover:text-slate-600 p-1 rounded`
- Disabled state: `opacity-50 cursor-not-allowed`
- Loading state: replace text with a small spinner, maintain button width.

**Status badges:** Small inline pills used in tables and detail views.
Pattern: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium`
with color combinations from the semantic or status color sets. Example:
completed = `bg-emerald-50 text-emerald-700`, failed = `bg-red-50 text-red-700`,
awaiting_approval = `bg-amber-50 text-amber-700`.

**Cards:** Used for contained content blocks (query results, plan steps,
integration details). Pattern: `bg-white rounded-lg border border-slate-200
shadow-sm`. Inner padding: `p-5`. Cards do not use heavy shadows — the
border and minimal shadow are sufficient. Cards stack vertically with
`space-y-4` between them.

**Tables:** The primary data display pattern. Use Angular Material
mat-table for structure, styled with Tailwind:
- Table container: `bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden`
- Header row: `bg-slate-50 border-b border-slate-200`
- Header cells: `text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3`
- Body cells: `text-sm text-slate-900 px-4 py-3`
- Row dividers: `border-b border-slate-100`
- Row hover: `hover:bg-slate-50`
- Status column: use status badges (not colored text).
- Action column (last): icon buttons for edit, delete, test, etc.
- Pagination below the table: `mat-paginator` styled to match.

**Forms:** Use Angular Material form fields (mat-form-field) with the
`outline` appearance. Style to match the Tailwind aesthetic:
- Labels: `text-sm font-medium text-slate-700` above the field.
- Input text: `text-sm`
- Error messages: `text-xs text-red-600` below the field.
- Field spacing: `space-y-4` between form fields.

**Dialogs:** Angular Material mat-dialog for confirmations and inline
forms (invite user, connect integration). Max width 480px for simple
dialogs, 640px for complex forms. Title in font-heading font-semibold.
Actions row with cancel (secondary button) and confirm (primary or
destructive button).

**Snackbar / Toasts:** Angular Material mat-snackbar for transient
notifications. Success: green-tinted background. Error: red-tinted
background. Appear at the bottom-center of the viewport. Auto-dismiss
after 4 seconds (errors: 6 seconds).

**Empty states:** When a list view has no data, display a centered
container with: a subtle gray icon (48px), a heading (text-base
font-medium text-slate-700) explaining what would appear, a description
(text-sm text-slate-500) explaining how to populate it, and a primary
action button. Example: icon of a plug, "No integrations connected",
"Connect your infrastructure to start querying.", [Connect Integration]
button.

### Page-Specific Design

**Auth pages (login, register):** Full-page layout, no sidebar.
Background: `bg-slate-50` or a very subtle gradient (`from-slate-50
to-white`). Centered card: `max-w-md w-full bg-white rounded-xl
shadow-lg p-8`. "Tekmar" wordmark above the card in `font-heading
text-2xl font-bold text-slate-900`. Form inputs stacked vertically
with full-width submit button at the bottom. Link to the other auth
page below the card (e.g., "Don't have an account? Sign up" in
text-sm text-slate-500 with a text-indigo-600 link).

**Query page (the core product experience):** This page has a unique
layout distinct from management pages. At the top, a large query input
area styled like a conversational input — a tall textarea (min 3 rows)
in a card, with a prominent submit button. This is the hero interaction.
Below the input, the query lifecycle plays out in a vertical flow:
- Interpretation phase: a card showing the AI's analysis text streaming
  in real time. The text appears progressively with a subtle cursor or
  fade-in effect. Use a slightly off-white background (`bg-slate-50`)
  to distinguish AI-generated content from user content.
- Plan approval phase: the plan displayed as a vertical stepper or
  numbered list. Each step is a row showing: step number (circle with
  number), tool display name (font-medium), integration name (text-xs
  text-slate-500), and description. Approve and Reject buttons below.
- Execution phase: a live log that updates in real time. Each step
  shows: a status indicator (spinning for in-progress, green check for
  complete, red X for failed), the tool name, duration, and a brief
  summary. This should feel like watching a CI/CD pipeline log.
- Results phase: one or more data tables rendered with the standard
  table component. Above the tables: a summary card showing total
  records, execution time, and a "Download CSV" button.

**Query history page:** Standard table layout. Columns: query text
(truncated, clickable to detail), status badge, who submitted it,
when (relative time), result summary (if completed). Click a row to
navigate to the full query detail page.

**Integration management page:** A grid or list of connected
integrations, each as a card showing: integration type icon (or a
colored dot for the type), display name, status badge, last health
check time, and action buttons (test, disconnect). A prominent
"Connect Integration" button in the page header. The connect form is
a dialog with fields that change based on the selected integration
type (AWS shows access key fields, GitHub shows PAT field, Google
shows service account JSON upload).

**User management page:** Standard table. Columns: display name,
email, role badge, status, last login (relative time), actions
(change role, remove). "Invite User" button in the page header. The
invite form is a simple dialog: email + role select.

**Activity log page:** Standard table. Columns: timestamp, user (name
+ email), action (formatted as a human-readable sentence, e.g.,
"Connected integration 'Production AWS'"), and a metadata column for
additional context. Filters above the table: action type dropdown,
user dropdown.

### Responsive Behavior

The MVP targets desktop browsers at 1280px and wider. The sidebar is
always visible (no collapse toggle in MVP). On screens narrower than
1280px, the layout should not break — content scrolls horizontally
if needed. Do not invest in mobile-responsive design for the MVP.

### Animation and Transitions

Keep animations minimal and purposeful.
- Page transitions: none (instant route changes).
- Sidebar link hover/active: `transition-colors duration-150`.
- Button hover: `transition-colors duration-150`.
- Streaming text (interpretation): each text chunk appears immediately
  when received, no artificial typing delay. A blinking cursor at the
  end of the text indicates more content is coming.
- Execution log: step entries slide in from the left with a quick
  `transition-all duration-200` when added. Status changes (spinning
  to checkmark) are instant.
- Dialogs: Angular Material's default fade-in animation is sufficient.
- Snackbars: default slide-in from bottom.

### Iconography

Use Lucide icons (the open-source icon set, successor to Feather
icons). Install `lucide-angular` or use SVG icons directly. Consistent
size: 18px for navigation and inline icons, 20px for buttons,
48px for empty state illustrations. Consistent stroke width: 1.5px.
Color inherits from the parent text color.

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

**Test IDs** — every interactive or assertable element must have a
`data-testid` attribute following the naming convention in
`testid-manifest.json`. Use kebab-case with a page/feature prefix and
element-type suffix (e.g., `login-email-input`, `integration-card-{id}`).
When adding new components or modifying existing ones, update the
manifest. The manifest is the contract between the frontend and the
E2E test suite.