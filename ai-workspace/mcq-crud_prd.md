Date created: September 1, 2026
Date last modified: September 1, 2026

# Multiple Choice Question (MCQ) CRUD — Technical PRD

## Overview/Problem

Quiz Maker authenticated users can sign in and reach a protected Dashboard, but they cannot yet create, manage, preview, or practice multiple choice questions. Without MCQ CRUD, the application has no question content layer to build future quiz assembly, assignment, or reporting features on top of.

Authenticated quiz authors need a dedicated workflow to define a question, configure answer choices (with one correct answer), review their work via preview, and maintain their question library over time. This capability expands the Dashboard area from a placeholder into the first real quiz-domain feature while reusing the authentication, D1 persistence, service-layer, and TDD conventions established in Sprint 0.

---



## Hypothesis

We believe that delivering a complete MCQ create-read-update-delete experience—with ownership enforcement, preview, and attempt recording—will let authenticated users build and validate question content in Quiz Maker and establish the domain patterns (service layer, API routes, migrations, tests) required for all future quiz features.

---



## Scope



### In Scope

- **MCQ listing page** at `/dashboard/mcqs` (protected route under the authenticated Dashboard layout)
  - shadcn/ui **Table** showing MCQ name, question/description, created date, and Actions column
  - **Create Multiple Choice Question** button navigating to the create page
  - Empty state when the user has no MCQs
- **Create/edit page** at `/dashboard/mcqs/new` (create) and `/dashboard/mcqs/[id]/edit` (edit)
  - Form fields: MCQ name, question/description, answer choices (2 default, up to 6)
  - Each choice has text and a correct-answer indicator (radio); exactly one must be correct
  - **Save** and **Cancel** actions
- **Actions menu** (three vertical dots / kebab) per table row with **Edit**, **Preview**, and **Delete**
- **Preview flow** via shadcn/ui **Dialog**: display question and choices without revealing the correct answer until the user submits a selection; show whether the answer was correct or incorrect after submission
- **Delete flow** via shadcn/ui **Dialog** confirmation before permanent deletion
- **Database schema**: three related D1 tables — `mcqs`, `mcq_choices`, `mcq_attempts`
- **Service layer** in `src/lib/mcq/` for database operations and business logic
- **API routes** in `src/app/api/mcqs/` for CRUD, preview data, and attempt recording
- **Authorization**: only the MCQ owner (`created_by_user_id`) may list (their own), read, update, or delete an MCQ; all MCQ routes require a valid authenticated session
- **Attempt recording**: when a user submits an answer during preview, persist a row in `mcq_attempts`
- **Validation** on client and server (Zod schemas, centralized message constants)
- **TDD**: tests written before implementation for each phase; phase exit requires all phase tests GREEN
- **Phased implementation** with explicit stop-and-approval between phases (see Implementation Phases)



### Out of Scope

- Full quiz assembly (grouping multiple MCQs into a quiz)
- Quiz publishing, sharing links, or public/unauthenticated access to MCQs
- Quiz attempts spanning multiple questions or scoring aggregates
- Import/export of MCQs (CSV, JSON bulk upload)
- Rich text or media in questions (images, LaTeX, code blocks)
- Question categories, tags, or full-text search
- Role-based access (admin, teacher, student); all authenticated users are equal owners of their own MCQs
- Editing or deleting another user's MCQs
- Attempt analytics dashboards or leaderboards
- AI-generated questions
- Server Actions for MCQ mutations (this feature uses **API route handlers** per architectural decision below)



### Cut

- **Soft delete / archive** — Adds state complexity without user request; hard delete with confirmation dialog is sufficient for v1.
- **Draft vs. published status** — All saved MCQs are immediately usable for preview; publishing workflow deferred to future quiz sprint.
- **Reorder choices via drag-and-drop** — Position is set by form order (array index); drag-and-drop is UX polish deferred.
- **Inline create/edit on the list page** — Dedicated create/edit routes keep forms manageable and match the requested UX.
- **Viewing other users' MCQs** — No shared library; each user sees only MCQs they created.

---



## User Flow



### MCQ List (Authenticated User)

1. User navigates to `/dashboard/mcqs` (or follows a link from Dashboard).
2. System validates session; unauthenticated users redirect to Sign In.
3. System loads MCQs where `created_by_user_id` matches the current user, ordered by `created_at` descending.
4. User sees a table with name, question, created date, and Actions menu per row.
5. User clicks **Create Multiple Choice Question** → navigates to `/dashboard/mcqs/new`.



### Create MCQ

1. User completes name, question, and at least two choices (two shown by default).
2. User marks exactly one choice as correct.
3. User may add choices up to six total or remove choices down to two minimum.
4. User clicks **Save**.
5. Client and server validate input.
6. On success, MCQ and choices persist; user redirects to `/dashboard/mcqs` (optionally with success feedback).
7. User clicks **Cancel** → returns to `/dashboard/mcqs` without saving.



### Edit MCQ

1. User opens Actions → **Edit** on a row (or navigates directly to `/dashboard/mcqs/[id]/edit`).
2. System loads MCQ and choices; returns 404 if not found or not owned by user.
3. Form pre-fills existing values.
4. User modifies fields and clicks **Save** or **Cancel** (same behavior as create).



### Preview MCQ

1. User opens Actions → **Preview** on a row.
2. Dialog opens showing MCQ name, question, and choices (no correct-answer indicator).
3. User selects one choice and clicks **Submit** (or equivalent).
4. System records an attempt in `mcq_attempts` and returns whether the answer was correct.
5. Dialog displays feedback (correct / incorrect); user closes dialog to return to the list.



### Delete MCQ

1. User opens Actions → **Delete**.
2. Confirmation dialog warns that deletion is permanent.
3. User confirms → system deletes MCQ (cascades to choices and attempts).
4. Table refreshes without the deleted row.



### Unauthenticated / Unauthorized Access

1. Unauthenticated request to MCQ pages or API → redirect (pages) or 401 (API).
2. Authenticated user requests another user's MCQ by ID → 404 (do not reveal existence via 403).

---



## User Stories

- As an authenticated user, I want to see a table of my multiple choice questions so that I can manage my question library.
- As an authenticated user, I want to create a new MCQ with a name, question, and answer choices so that I can build quiz content.
- As an authenticated user, I want at least two and at most six answer choices so that questions stay focused but flexible.
- As an authenticated user, I want to designate exactly one correct answer so that scoring and preview work reliably.
- As an authenticated user, I want to edit an existing MCQ so that I can fix mistakes or improve wording.
- As an authenticated user, I want to preview an MCQ and try answering it so that I can validate the question before using it in a future quiz.
- As an authenticated user, I want my preview attempts recorded so that attempt history exists for future analytics.
- As an authenticated user, I want to delete an MCQ I no longer need so that my library stays current.
- As an authenticated user, I want clear validation errors when my MCQ input is invalid so that I can correct it before saving.
- As an unauthenticated user, I must not access MCQ pages or APIs so that content remains private to signed-in users.

---



## Technical Requirements



### Architecture Alignment

This feature follows patterns established in Sprint 0 authentication (`QUIZ_MAKER_TECHNICAL_PRD.md` and implemented code):


| Concern       | Auth (Sprint 0)                                                      | MCQ (this feature)                                        |
| ------------- | -------------------------------------------------------------------- | --------------------------------------------------------- |
| Persistence   | Cloudflare D1 via `getDb()` in `src/lib/db.ts`                       | Same                                                      |
| ID generation | `crypto.randomUUID()` TEXT primary keys                              | Same                                                      |
| Timestamps    | `TEXT NOT NULL DEFAULT (datetime('now'))`                            | Same; MCQs also have `updated_at`                         |
| Session       | `getCurrentSession()` / `requireAuth()` in `src/lib/auth/session.ts` | Reuse for page and API guards                             |
| Validation    | Zod schemas + centralized messages                                   | Same pattern in `src/lib/mcq/`                            |
| Data access   | Repository-style modules (`users.ts`, `sessions.ts`)                 | Service modules under `src/lib/mcq/`                      |
| Mutations     | Server Actions (`"use server"`)                                      | **API route handlers** (`src/app/api/mcqs/`) per this PRD |
| Protected UI  | `dashboard/layout.tsx` calls `requireAuthOrExpired()`                | MCQ pages live under `/dashboard/mcqs/*`                  |
| Tests         | Vitest; mock D1 via `src/lib/auth/test/mock-d1.ts`                   | Extend mock D1 for MCQ SQL                                |
| SQL           | Numbered placeholders (`?1`, `?2`); `all()` not `first()`            | Same                                                      |


**Why API routes for MCQ:** The product requires explicit HTTP endpoints for CRUD, preview, and attempts—used by client components (table actions, preview dialog, form fetch/submit). Route handlers provide a clear boundary for JSON request/response contracts and are independently testable. Authentication still uses the existing HttpOnly session cookie; route handlers call `getCurrentSession()` and reject unauthenticated requests with `401`.

### Database Schema

Migration file (to be created in Phase 2): `migrations/0002_create_mcq_tables.sql`

```sql
-- MCQs: top-level question entity owned by a user
CREATE TABLE mcqs (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  question TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_mcqs_created_by_user_id ON mcqs (created_by_user_id);
CREATE INDEX idx_mcqs_created_at ON mcqs (created_at);

-- MCQ choices: ordered answer options for an MCQ
CREATE TABLE mcq_choices (
  id TEXT PRIMARY KEY NOT NULL,
  mcq_id TEXT NOT NULL,
  choice_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mcq_id) REFERENCES mcqs (id) ON DELETE CASCADE,
  UNIQUE (mcq_id, position)
);

CREATE INDEX idx_mcq_choices_mcq_id ON mcq_choices (mcq_id);

-- MCQ attempts: records a user's answer during preview (or future quiz attempt)
CREATE TABLE mcq_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  mcq_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  selected_choice_id TEXT NOT NULL,
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mcq_id) REFERENCES mcqs (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (selected_choice_id) REFERENCES mcq_choices (id) ON DELETE RESTRICT
);

CREATE INDEX idx_mcq_attempts_mcq_id ON mcq_attempts (mcq_id);
CREATE INDEX idx_mcq_attempts_user_id ON mcq_attempts (user_id);
CREATE INDEX idx_mcq_attempts_mcq_user ON mcq_attempts (mcq_id, user_id);
```



#### Schema Notes


| Topic           | Decision                                                                                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary keys    | `TEXT` UUIDs via `crypto.randomUUID()` at insert time (matches `users`, `sessions`)                                                                                                             |
| `is_correct`    | SQLite `INTEGER` 0/1 CHECK constraint (boolean semantics)                                                                                                                                       |
| `position`      | 1-based integer; unique per MCQ; determines display order                                                                                                                                       |
| Ownership       | `mcqs.created_by_user_id` → `users.id`                                                                                                                                                          |
| User deletion   | `ON DELETE CASCADE` removes user's MCQs, choices, and attempts                                                                                                                                  |
| MCQ deletion    | `ON DELETE CASCADE` removes choices and attempts                                                                                                                                                |
| Choice deletion | `mcq_attempts.selected_choice_id` uses `ON DELETE RESTRICT` so attempts are never orphaned; updates replace choices in a transaction rather than deleting individual choices that have attempts |
| `updated_at`    | Set explicitly in service layer on UPDATE (SQLite has no auto-update trigger in v1)                                                                                                             |




#### Business Rules Enforced in Service Layer (not all in SQL)

- Minimum **2** choices, maximum **6** choices per MCQ
- Exactly **1** choice must have `is_correct = 1`
- Positions must be contiguous starting at 1 (e.g., 1..N with no gaps)
- MCQ name and question must be non-empty after trim
- Each choice text must be non-empty after trim



### Domain Types (TypeScript)

Defined in `src/lib/mcq/types.ts`:

```typescript
export type Mcq = {
  id: string;
  name: string;
  question: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type McqChoice = {
  id: string;
  mcqId: string;
  choiceText: string;
  isCorrect: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type McqWithChoices = Mcq & { choices: McqChoice[] };

export type McqListItem = Mcq & {
  choiceCount: number;
};

export type McqAttempt = {
  id: string;
  mcqId: string;
  userId: string;
  selectedChoiceId: string;
  isCorrect: boolean;
  createdAt: string;
};

export type CreateMcqInput = {
  name: string;
  question: string;
  choices: { choiceText: string; isCorrect: boolean }[];
};

export type UpdateMcqInput = CreateMcqInput;

export type RecordAttemptInput = {
  selectedChoiceId: string;
};
```



### Field Validation Rules

Constants (e.g., in `src/lib/mcq/config.ts`):


| Constant                     | Value |
| ---------------------------- | ----- |
| `MCQ_NAME_MAX_LENGTH`        | 200   |
| `MCQ_QUESTION_MAX_LENGTH`    | 2000  |
| `MCQ_CHOICE_TEXT_MAX_LENGTH` | 500   |
| `MCQ_MIN_CHOICES`            | 2     |
| `MCQ_MAX_CHOICES`            | 6     |



| Field                 | Rules                                       |
| --------------------- | ------------------------------------------- |
| Name                  | Required; trim; 1–200 characters            |
| Question              | Required; trim; 1–2000 characters           |
| Choices array         | Length 2–6                                  |
| Choice text           | Required per choice; trim; 1–500 characters |
| Correct answer        | Exactly one choice with `isCorrect: true`   |
| Duplicate choice text | Allowed (no uniqueness constraint)          |




### Error Messages

Centralized in `src/lib/mcq/messages.ts` (wording may be tone-adjusted; meaning must be preserved):


| Condition                | Message                                                |
| ------------------------ | ------------------------------------------------------ |
| Name empty               | "MCQ name is required."                                |
| Name too long            | "MCQ name must be 200 characters or fewer."            |
| Question empty           | "Question is required."                                |
| Question too long        | "Question must be 2000 characters or fewer."           |
| Too few choices          | "At least 2 answer choices are required."              |
| Too many choices         | "A maximum of 6 answer choices is allowed."            |
| Choice text empty        | "Answer choice text is required."                      |
| Choice text too long     | "Answer choice must be 500 characters or fewer."       |
| No correct answer        | "Exactly one answer choice must be marked as correct." |
| Multiple correct answers | "Exactly one answer choice must be marked as correct." |
| MCQ not found            | "Multiple choice question not found."                  |
| Unauthorized / not owner | Same as not found for user-facing responses (404)      |
| Unauthenticated          | "Please sign in to continue." (pages) / 401 JSON (API) |
| Invalid selected choice  | "Selected answer is not valid for this question."      |
| Unexpected failure       | "Something went wrong. Please try again later."        |




### API Endpoints

All endpoints require an authenticated session unless noted. Session is read from the HttpOnly cookie via `getCurrentSession()`. Responses are JSON. Use numbered validation consistent with Zod schema errors where applicable.

#### GET /api/mcqs

List MCQs owned by the current user.

**Response (200):**

```json
{
  "mcqs": [
    {
      "id": "uuid",
      "name": "Capital Cities",
      "question": "What is the capital of France?",
      "createdAt": "2026-09-01T10:00:00.000Z",
      "updatedAt": "2026-09-01T10:00:00.000Z",
      "choiceCount": 4
    }
  ]
}
```

**Errors:** `401` unauthenticated; `500` unexpected

---



#### POST /api/mcqs

Create a new MCQ with choices.

**Request body:**

```json
{
  "name": "Capital Cities",
  "question": "What is the capital of France?",
  "choices": [
    { "choiceText": "Paris", "isCorrect": true },
    { "choiceText": "London", "isCorrect": false }
  ]
}
```

**Response (201):**

```json
{
  "mcq": {
    "id": "uuid",
    "name": "Capital Cities",
    "question": "What is the capital of France?",
    "createdByUserId": "user-uuid",
    "createdAt": "...",
    "updatedAt": "...",
    "choices": [ /* McqChoice[] */ ]
  }
}
```

**Errors:** `400` validation; `401` unauthenticated; `500` unexpected

---



#### GET /api/mcqs/[id]

Get a single MCQ with choices. Owner only.

**Response (200):** `{ "mcq": McqWithChoices }`

**Errors:** `401`; `404` not found or not owner; `500`

---



#### PUT /api/mcqs/[id]

Update MCQ and replace all choices in a transaction. Owner only.

**Request body:** Same as POST.

**Response (200):** `{ "mcq": McqWithChoices }`

**Errors:** `400`; `401`; `404`; `500`

**Update strategy:** Within a D1 batch/transaction: update `mcqs` row and `updated_at`; delete existing choices only if no `ON DELETE RESTRICT` conflict (attempts reference old choice IDs—**implementation must insert new choices first or use a replace strategy that preserves attempt FK integrity**). Recommended approach for v1: delete attempts is NOT desired. **Replace strategy:** delete all choices for MCQ only when zero attempts exist; when attempts exist, update choice rows in place where possible and insert/delete to adjust count. Simpler v1 approach documented: **on update, delete all existing choices and re-insert** — requires `mcq_attempts.selected_choice_id` to either (a) use `ON DELETE SET NULL` with nullable column, or (b) block choice structure changes when attempts exist, or (c) cascade delete attempts on MCQ content change. **Decision (Q-M1):** On MCQ update, existing attempts are **preserved**; choice rows are **updated in place** by position where count matches, or full replace deletes attempts for that MCQ first (acceptable for preview-only attempts in v1). **Final decision:** On update, **delete all attempts for the MCQ** then replace choices (preview attempts are disposable). Document in service: `updateMcq` runs transaction: DELETE attempts for mcq_id → DELETE choices → INSERT new choices → UPDATE mcq.

---



#### DELETE /api/mcqs/[id]

Delete MCQ. Cascades to choices and attempts. Owner only.

**Response (200):** `{ "success": true }`

**Errors:** `401`; `404`; `500`

---



#### GET /api/mcqs/[id]/preview

Return preview-safe MCQ data (question + choices **without** `isCorrect`). Owner only.

**Response (200):**

```json
{
  "preview": {
    "id": "uuid",
    "name": "Capital Cities",
    "question": "What is the capital of France?",
    "choices": [
      { "id": "choice-uuid", "choiceText": "Paris", "position": 1 },
      { "id": "choice-uuid", "choiceText": "London", "position": 2 }
    ]
  }
}
```

**Errors:** `401`; `404`; `500`

---



#### POST /api/mcqs/[id]/attempts

Record a preview attempt. Caller must be authenticated; MCQ must exist and be owned by caller (same as preview—owner previews their own MCQ).

**Request body:**

```json
{
  "selectedChoiceId": "choice-uuid"
}
```

**Response (201):**

```json
{
  "attempt": {
    "id": "uuid",
    "mcqId": "uuid",
    "userId": "uuid",
    "selectedChoiceId": "choice-uuid",
    "isCorrect": true,
    "createdAt": "..."
  },
  "isCorrect": true
}
```

**Errors:** `400` invalid choice; `401`; `404`; `500`

### Service Layer

Modules under `src/lib/mcq/`:


| Module             | Responsibility                                                        |
| ------------------ | --------------------------------------------------------------------- |
| `types.ts`         | Domain types                                                          |
| `config.ts`        | Length limits, min/max choices                                        |
| `messages.ts`      | User-facing error strings                                             |
| `schemas/mcq.ts`   | Zod schemas for create/update/attempt payloads                        |
| `validation.ts`    | Shared validation helpers                                             |
| `mcqs.ts`          | CRUD queries, ownership checks, list by user                          |
| `choices.ts`       | Choice insert/replace helpers (used by mcqs service)                  |
| `attempts.ts`      | Record and list attempts                                              |
| `authorization.ts` | `assertMcqOwner(db, mcqId, userId)` → returns Mcq or throws/not found |
| `index.ts`         | Public exports                                                        |


**Key service functions:**

```typescript
// mcqs.ts
listMcqsByUser(db, userId): Promise<McqListItem[]>
getMcqById(db, mcqId, userId): Promise<McqWithChoices | null>  // null if not found or not owner
createMcq(db, userId, input): Promise<McqWithChoices>
updateMcq(db, mcqId, userId, input): Promise<McqWithChoices | null>
deleteMcq(db, mcqId, userId): Promise<boolean>
getMcqPreview(db, mcqId, userId): Promise<PreviewMcq | null>

// attempts.ts
recordAttempt(db, mcqId, userId, selectedChoiceId): Promise<{ attempt: McqAttempt; isCorrect: boolean } | null>
```

**Ownership pattern:** Every mutating and single-resource read operation filters by `created_by_user_id = ?` (or joins through `mcqs`). Return `null` / 404 for wrong owner—never 403 with "not your MCQ" to avoid leaking IDs.

### User Interface Requirements



#### shadcn/ui Components

**Already installed:** `button`, `card`, `dialog`, `field`, `input`, `label`, `table`, `badge`

**To add before UI phases (Phase 5):**

```bash
npx shadcn@latest add @shadcn/dropdown-menu
```

Optional if needed: `@shadcn/alert-dialog` (or use `dialog` for delete confirmation), `@shadcn/radio-group` for correct-answer selection on the form.

#### Dashboard Link (minor)

Update Dashboard placeholder or header nav to link to `/dashboard/mcqs` (implementation detail in Phase 5).

#### MCQ List Page (`/dashboard/mcqs`)

**Access:** Authenticated only (inherits `dashboard/layout.tsx` guard).

**Layout:**

- Page title: "Multiple Choice Questions"
- Primary button: **Create Multiple Choice Question** → `/dashboard/mcqs/new`
- **Table** columns:

  | Column   | Content                                                                |
  | -------- | ---------------------------------------------------------------------- |
  | Name     | `mcq.name`                                                             |
  | Question | `mcq.question` truncated (~80 chars) with full text in `title` tooltip |
  | Created  | Formatted `createdAt` (locale-appropriate date/time)                   |
  | Actions  | Kebab **Dropdown Menu** (MoreVertical icon)                            |


**Actions menu items:**

- **Edit** → `/dashboard/mcqs/[id]/edit`
- **Preview** → opens Preview Dialog (client component)
- **Delete** → opens Delete Confirmation Dialog

**Empty state:** Message such as "You have no multiple choice questions yet." with create button.

**Loading / error:** Show appropriate feedback if API fetch fails.

#### Create Page (`/dashboard/mcqs/new`)

**Access:** Authenticated only.

**Form fields:**


| Field          | Control                                                          | Notes                                                                |
| -------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| Name           | `Input`                                                          | Required                                                             |
| Question       | `Input` or textarea (`Input` multiline if no textarea component) | Required                                                             |
| Choices        | Dynamic list                                                     | 2 rows initially; Add Choice (disabled at 6); Remove (disabled at 2) |
| Correct answer | Radio per row                                                    | Exactly one selected                                                 |


**Actions:**

- **Save** — POST `/api/mcqs`; on success redirect to list
- **Cancel** — Link/button to `/dashboard/mcqs` without save

**Validation:** Inline/server errors via `FieldError`.

#### Edit Page (`/dashboard/mcqs/[id]/edit`)

Same as create, pre-filled from GET `/api/mcqs/[id]`. **Save** uses PUT. 404 page if not found.

#### Preview Dialog (client component)

- Triggered from list Actions → Preview
- Fetches GET `/api/mcqs/[id]/preview`
- Shows name, question, radio choices
- **Submit Answer** → POST `/api/mcqs/[id]/attempts`
- Shows success/failure message ("Correct!" / "Incorrect.")
- **Close** dismisses dialog



#### Delete Confirmation Dialog

- Message: "Delete this multiple choice question? This action cannot be undone."
- **Cancel** / **Delete** (destructive button)
- Delete calls DELETE `/api/mcqs/[id]`; refresh list on success



### Authorization Requirements


| Resource                                   | Rule                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------- |
| All MCQ pages                              | Require valid session (`requireAuthOrExpired` via dashboard layout)  |
| All MCQ API routes                         | Require `getCurrentSession().authenticated`; else `401`              |
| List                                       | Return only MCQs where `created_by_user_id = session.userId`         |
| Read / update / delete / preview / attempt | MCQ must exist AND `created_by_user_id = session.userId`; else `404` |
| Cross-user ID guessing                     | Never return 403 "forbidden"; use 404                                |




### Deletion and Cascade Behavior


| Action               | Effect                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------- |
| Delete MCQ           | Removes `mcqs` row; CASCADE deletes all `mcq_choices` and `mcq_attempts` for that MCQ  |
| Delete user (future) | CASCADE deletes user's MCQs, choices, and attempts                                     |
| Update MCQ choices   | Deletes existing attempts for that MCQ, then replaces choices (see PUT decision above) |


---



## TDD Test Strategy

Development follows **Test-Driven Development** identical to Sprint 0:

```
RED → GREEN → REFACTOR → repeat
```

- Write tests **before** implementation for each phase.
- Phase exit requires **all** phase test cases **GREEN**.
- Run `npm test` before marking a phase complete.
- Also run `npm run lint` and `npm run build` at phase 9.



### Test Types


| Type        | Scope                                          | Location                        |
| ----------- | ---------------------------------------------- | ------------------------------- |
| Unit        | Zod validation, helpers, authorization logic   | `src/lib/mcq/*.test.ts`         |
| Integration | Service + mock D1                              | `src/lib/mcq/*.test.ts`         |
| API / Route | Route handlers with mocked session and service | `src/app/api/mcqs/**/*.test.ts` |
| Component   | Client MCQ components                          | `src/components/mcq/*.test.tsx` |
| Flow        | Multi-step journeys                            | `src/lib/mcq/phase*.test.ts`    |




### Mock D1 Extension

Extend `src/lib/auth/test/mock-d1.ts` (or add `src/lib/mcq/test/mock-d1-mcq.ts`) to support MCQ-related SQL statements used by the service layer.

### Test Case ID Convention

`TC-M{phase}-{seq}` — e.g., `TC-M3-01` for Phase 3 (service), test 1.

---



## Implementation Phases

**Status markers:** COMPLETED · IN PROGRESS · PLANNED

**Phase execution protocol (mandatory):** After completing each phase, the implementer must **stop**, provide a concise summary (what was completed, what was tested, issues/decisions needing attention), and **wait for explicit user approval** before starting the next phase. Do not proceed automatically.

---



### Phase 1: Requirements, Architecture, and Database Design — COMPLETED

**Objective:** Finalize and approve this PRD as the single source of truth; confirm architectural decisions and database design before any migration or code.

**Dependencies:** Sprint 0 authentication complete (session, D1, dashboard layout).

**Scope:**

- This document reviewed and approved
- Open questions resolved (see Open Questions section)
- No application code changes in this phase

**Technical tasks:**

1. Review PRD against `QUIZ_MAKER_TECHNICAL_PRD.md` for consistency
2. Confirm API-route vs Server Action decision for MCQ mutations
3. Confirm ownership, cascade, and update/attempt preservation rules
4. Confirm route structure and UI component list
5. Stakeholder approval of phased plan

**Tests to write first:** None (documentation phase).

**Deliverables:**

- Approved `ai-workspace/mcq-crud_prd.md`

**Acceptance criteria:**

- [ ] PRD covers all In Scope items
- [ ] Database schema includes all three tables with FKs, indexes, and constraints
- [ ] API contracts defined for all endpoints
- [ ] UI routes and components specified
- [ ] TDD test plan defined for Phases 2–9
- [ ] Phase stop-and-approval protocol documented

**Exit criteria:** User explicitly approves PRD and authorizes Phase 2.

---



### Phase 2: Database Migrations and Models — COMPLETED

**Objective:** Add D1 migration for MCQ tables; define TypeScript domain types and schema constants.

**Dependencies:** Phase 1 approved.

**Technical tasks:**

1. **Write failing tests (RED)** TC-M2-01 through TC-M2-06
2. Create `migrations/0002_create_mcq_tables.sql` per schema above
3. Apply migration locally: `npm run db:migrate:local` (do **not** apply remote unless user requests)
4. Create `src/lib/mcq/types.ts`, `config.ts`, `messages.ts`
5. Extend mock D1 to support new tables for tests
6. Implement until TC-M2-01–TC-M2-06 are **GREEN**

**Tests to write first (RED):**


| ID       | Type        | Test case                                          | Expected result                                         |
| -------- | ----------- | -------------------------------------------------- | ------------------------------------------------------- |
| TC-M2-01 | Integration | Migration SQL file exists and creates three tables | Expected tables and indexes present in migration source |
| TC-M2-02 | Integration | Mock D1 can insert and retrieve an MCQ row         | MCQ fields round-trip correctly                         |
| TC-M2-03 | Integration | Mock D1 enforces FK from mcq_choices to mcqs       | Invalid mcq_id rejected or insert fails                 |
| TC-M2-04 | Integration | Mock D1 CASCADE deletes choices when MCQ deleted   | Choices removed after MCQ delete                        |
| TC-M2-05 | Integration | Mock D1 stores attempt with is_correct flag        | Attempt row retrievable                                 |
| TC-M2-06 | Unit        | Domain config constants match PRD limits           | MIN/MAX choices and max lengths correct                 |


**Deliverables:**

- `migrations/0002_create_mcq_tables.sql`
- `src/lib/mcq/types.ts`, `config.ts`, `messages.ts`
- Extended mock D1 for MCQ tables
- Phase 2 tests GREEN

**Acceptance criteria:**

- [x] Migration matches PRD schema exactly
- [x] Local migration applies without error
- [x] TypeScript types align with schema columns
- [x] TC-M2-01–TC-M2-06 GREEN

**Exit criteria:** All Phase 2 tests GREEN; user approves Phase 3.

---



### Phase 3: MCQ Service Layer — COMPLETED

**Objective:** Implement business logic and D1 operations for MCQs, choices, and attempts.

**Dependencies:** Phase 2 complete.

**Technical tasks:**

1. **Write failing tests (RED)** TC-M3-01 through TC-M3-18
2. Create Zod schemas in `src/lib/mcq/schemas/mcq.ts`
3. Implement `validation.ts`, `authorization.ts`
4. Implement `mcqs.ts`, `choices.ts`, `attempts.ts`
5. Implement create, read, update, delete, list, preview, recordAttempt
6. Enforce choice count, single correct answer, ownership, trim/max length
7. Implement update transaction (delete attempts → replace choices)
8. Implement until TC-M3-01–TC-M3-18 are **GREEN**

**Tests to write first (RED):**


| ID       | Type        | Test case                                             | Expected result                                        |
| -------- | ----------- | ----------------------------------------------------- | ------------------------------------------------------ |
| TC-M3-01 | Unit        | Valid create payload passes schema                    | No validation error                                    |
| TC-M3-02 | Unit        | Name empty fails validation                           | "MCQ name is required."                                |
| TC-M3-03 | Unit        | Question empty fails validation                       | "Question is required."                                |
| TC-M3-04 | Unit        | One choice fails min count                            | "At least 2 answer choices are required."              |
| TC-M3-05 | Unit        | Seven choices fail max count                          | "A maximum of 6 answer choices is allowed."            |
| TC-M3-06 | Unit        | Zero correct answers fails                            | "Exactly one answer choice must be marked as correct." |
| TC-M3-07 | Unit        | Two correct answers fails                             | "Exactly one answer choice must be marked as correct." |
| TC-M3-08 | Unit        | Empty choice text fails                               | "Answer choice text is required."                      |
| TC-M3-09 | Integration | createMcq persists MCQ and choices                    | Returns McqWithChoices; 2+ choices stored              |
| TC-M3-10 | Integration | listMcqsByUser returns only owning user's MCQs        | Other user's MCQs excluded                             |
| TC-M3-11 | Integration | getMcqById returns null for wrong owner               | No data leak                                           |
| TC-M3-12 | Integration | updateMcq replaces choices                            | Updated fields persist; old choices removed            |
| TC-M3-13 | Integration | updateMcq clears prior attempts                       | Attempts deleted on update                             |
| TC-M3-14 | Integration | deleteMcq removes MCQ and cascaded rows               | MCQ, choices, attempts gone                            |
| TC-M3-15 | Integration | getMcqPreview omits isCorrect                         | Choices have no correct flag                           |
| TC-M3-16 | Integration | recordAttempt sets is_correct true for correct choice | isCorrect true in result                               |
| TC-M3-17 | Integration | recordAttempt sets is_correct false for wrong choice  | isCorrect false                                        |
| TC-M3-18 | Integration | recordAttempt rejects invalid choice ID               | Returns null or error                                  |


**Deliverables:**

- `src/lib/mcq/schemas/mcq.ts`, `validation.ts`, `authorization.ts`
- `src/lib/mcq/mcqs.ts`, `choices.ts`, `attempts.ts`, `index.ts`
- Phase 3 tests GREEN

**Acceptance criteria:**

- [x] All validation rules enforced in service layer
- [x] Ownership checks on all single-resource operations
- [x] TC-M3-01–TC-M3-18 GREEN

**Exit criteria:** All Phase 3 tests GREEN; user approves Phase 4.

---



### Phase 4: API Routes — COMPLETED

**Objective:** Expose MCQ operations via authenticated JSON API route handlers.

**Dependencies:** Phase 3 complete.

**Technical tasks:**

1. **Write failing tests (RED)** TC-M4-01 through TC-M4-14
2. Create route handlers under `src/app/api/mcqs/`
3. Wire session guard (401 if unauthenticated)
4. Map service results to HTTP status codes (404, 400, 201, 200)
5. Implement until TC-M4-01–TC-M4-14 are **GREEN**

**Route files:**

- `src/app/api/mcqs/route.ts` — GET list, POST create
- `src/app/api/mcqs/[id]/route.ts` — GET, PUT, DELETE
- `src/app/api/mcqs/[id]/preview/route.ts` — GET preview
- `src/app/api/mcqs/[id]/attempts/route.ts` — POST attempt

**Tests to write first (RED):**


| ID       | Type | Test case                                       | Expected result     |
| -------- | ---- | ----------------------------------------------- | ------------------- |
| TC-M4-01 | API  | GET /api/mcqs without session returns 401       | Unauthorized JSON   |
| TC-M4-02 | API  | GET /api/mcqs with session returns user's MCQs  | 200 array           |
| TC-M4-03 | API  | POST /api/mcqs creates MCQ                      | 201 with body       |
| TC-M4-04 | API  | POST /api/mcqs invalid body returns 400         | Validation error    |
| TC-M4-05 | API  | GET /api/mcqs/[id] returns MCQ for owner        | 200                 |
| TC-M4-06 | API  | GET /api/mcqs/[id] returns 404 for non-owner    | 404                 |
| TC-M4-07 | API  | PUT /api/mcqs/[id] updates for owner            | 200                 |
| TC-M4-08 | API  | DELETE /api/mcqs/[id] deletes for owner         | 200 success         |
| TC-M4-09 | API  | DELETE /api/mcqs/[id] 404 for non-owner         | 404                 |
| TC-M4-10 | API  | GET preview omits correct flags                 | 200; no isCorrect   |
| TC-M4-11 | API  | POST attempt returns isCorrect                  | 201                 |
| TC-M4-12 | API  | POST attempt invalid choice 400                 | 400                 |
| TC-M4-13 | API  | All routes return JSON errors, not stack traces | No internal details |
| TC-M4-14 | API  | Wrong HTTP method returns 405 where applicable  | 405                 |


**Deliverables:**

- API route handlers for all endpoints
- Phase 4 tests GREEN

**Acceptance criteria:**

- [x] All endpoints match PRD contracts
- [x] Authentication enforced on every route
- [x] TC-M4-01–TC-M4-14 GREEN

**Exit criteria:** All Phase 4 tests GREEN; user approves Phase 5.

---



### Phase 5: Frontend — MCQ List Page — PLANNED

**Objective:** Build the protected MCQ listing page with table, actions menu, and create navigation.

**Dependencies:** Phase 4 complete; add `@shadcn/dropdown-menu`.

**Technical tasks:**

1. **Write failing tests (RED)** TC-M5-01 through TC-M5-08
2. Create `src/app/dashboard/mcqs/page.tsx` (server component fetches list or delegates to client fetch)
3. Create client components: `mcq-list-table.tsx`, `mcq-actions-menu.tsx`
4. Add Dashboard link to MCQs
5. Implement empty state and loading/error UI
6. Implement until TC-M5-01–TC-M5-08 are **GREEN**

**Tests to write first (RED):**


| ID       | Type      | Test case                                            | Expected result                          |
| -------- | --------- | ---------------------------------------------------- | ---------------------------------------- |
| TC-M5-01 | Component | List page renders table headers                      | Name, Question, Created, Actions visible |
| TC-M5-02 | Component | Create button navigates to /dashboard/mcqs/new       | Link href correct                        |
| TC-M5-03 | Component | Empty state shown when no MCQs                       | Empty message displayed                  |
| TC-M5-04 | Component | MCQ rows render name, question, created date         | Row cells populated                      |
| TC-M5-05 | Component | Actions menu has Edit, Preview, Delete               | Three menu items                         |
| TC-M5-06 | Flow      | Unauthenticated user redirected from /dashboard/mcqs | Redirect to sign-in                      |
| TC-M5-07 | Component | Question text truncated in table                     | Long text truncated                      |
| TC-M5-08 | Component | Edit action links to correct edit URL                | href includes mcq id                     |


**Deliverables:**

- `/dashboard/mcqs` list page and components
- `dropdown-menu` shadcn component installed
- Phase 5 tests GREEN

**Acceptance criteria:**

- [ ] Table matches PRD columns
- [ ] Create button works
- [ ] Actions menu renders three items
- [ ] TC-M5-01–TC-M5-08 GREEN

**Exit criteria:** All Phase 5 tests GREEN; user approves Phase 6.

---



### Phase 6: Frontend — Create/Edit Page — PLANNED

**Objective:** Build the MCQ form for create and edit with dynamic choices and validation.

**Dependencies:** Phase 5 complete.

**Technical tasks:**

1. **Write failing tests (RED)** TC-M6-01 through TC-M6-12
2. Create `src/app/dashboard/mcqs/new/page.tsx`
3. Create `src/app/dashboard/mcqs/[id]/edit/page.tsx`
4. Create `mcq-form.tsx` client component (shared create/edit)
5. Wire POST/PUT to API; handle validation errors
6. Default 2 choices; add/remove between 2–6
7. Implement until TC-M6-01–TC-M6-12 are **GREEN**

**Tests to write first (RED):**


| ID       | Type        | Test case                                  | Expected result               |
| -------- | ----------- | ------------------------------------------ | ----------------------------- |
| TC-M6-01 | Component   | Form renders name, question, choice fields | All fields visible            |
| TC-M6-02 | Component   | Default two choice rows on create          | Exactly 2 choice inputs       |
| TC-M6-03 | Component   | Add choice increases count up to 6         | Sixth add disabled            |
| TC-M6-04 | Component   | Remove choice decreases count down to 2    | Remove disabled at 2          |
| TC-M6-05 | Component   | Submit empty form shows validation errors  | Error messages displayed      |
| TC-M6-06 | Component   | No correct answer selected shows error     | Correct-answer error shown    |
| TC-M6-07 | Integration | Successful create redirects to list        | Navigation to /dashboard/mcqs |
| TC-M6-08 | Integration | Cancel returns to list without save        | No API POST                   |
| TC-M6-09 | Component   | Edit form pre-fills existing data          | Fields match fixture          |
| TC-M6-10 | Integration | Successful update redirects to list        | PUT called; redirect          |
| TC-M6-11 | Flow        | Edit page 404 for non-owned MCQ            | Not found UI                  |
| TC-M6-12 | Component   | Save shows loading state during submit     | Button disabled/loading       |


**Deliverables:**

- Create and edit pages with shared form component
- Phase 6 tests GREEN

**Acceptance criteria:**

- [ ] Create and edit flows work end-to-end against API
- [ ] Validation matches PRD messages
- [ ] TC-M6-01–TC-M6-12 GREEN

**Exit criteria:** All Phase 6 tests GREEN; user approves Phase 7.

---



### Phase 7: Frontend — Preview and Delete Flows — PLANNED

**Objective:** Implement preview dialog with answer submission and delete confirmation dialog.

**Dependencies:** Phase 6 complete.

**Technical tasks:**

1. **Write failing tests (RED)** TC-M7-01 through TC-M7-08
2. Create `mcq-preview-dialog.tsx`
3. Create `mcq-delete-dialog.tsx`
4. Wire Preview and Delete from actions menu
5. Preview fetches preview API; submit calls attempts API
6. Delete calls DELETE API; refresh list on success
7. Implement until TC-M7-01–TC-M7-08 are **GREEN**

**Tests to write first (RED):**


| ID       | Type        | Test case                                    | Expected result            |
| -------- | ----------- | -------------------------------------------- | -------------------------- |
| TC-M7-01 | Component   | Preview dialog shows question and choices    | No correct answer revealed |
| TC-M7-02 | Component   | Submit without selection shows error         | Validation message         |
| TC-M7-03 | Integration | Correct attempt shows success feedback       | "Correct" or equivalent    |
| TC-M7-04 | Integration | Incorrect attempt shows failure feedback     | "Incorrect" or equivalent  |
| TC-M7-05 | Component   | Delete dialog requires confirmation          | Confirm/Cancel buttons     |
| TC-M7-06 | Integration | Confirmed delete removes row from list       | MCQ no longer in table     |
| TC-M7-07 | Component   | Cancel delete closes dialog without API call | No DELETE                  |
| TC-M7-08 | Component   | Preview dialog closes on Close button        | Dialog dismissed           |


**Deliverables:**

- Preview and delete dialog components
- Integrated actions from list page
- Phase 7 tests GREEN

**Acceptance criteria:**

- [ ] Preview does not leak correct answer before submit
- [ ] Delete requires confirmation
- [ ] TC-M7-01–TC-M7-08 GREEN

**Exit criteria:** All Phase 7 tests GREEN; user approves Phase 8.

---



### Phase 8: Attempts Functionality — PLANNED

**Objective:** Complete attempt recording integration; verify persistence and service/API edge cases.

**Dependencies:** Phase 7 complete (basic attempt POST exists); this phase hardens attempts end-to-end.

**Technical tasks:**

1. **Write failing tests (RED)** TC-M8-01 through TC-M8-06
2. Verify attempt rows persist in D1 after preview submit
3. Ensure attempt cannot reference choice from another MCQ
4. Ensure unauthenticated attempt POST returns 401
5. Document attempt lifecycle in Technical Implementation Details
6. Implement until TC-M8-01–TC-M8-06 are **GREEN**

**Tests to write first (RED):**


| ID       | Type        | Test case                                      | Expected result         |
| -------- | ----------- | ---------------------------------------------- | ----------------------- |
| TC-M8-01 | Integration | Attempt row created in DB on preview submit    | Row in mcq_attempts     |
| TC-M8-02 | Integration | is_correct computed correctly in DB            | Matches selected choice |
| TC-M8-03 | Integration | Multiple attempts allowed per user per MCQ     | Multiple rows inserted  |
| TC-M8-04 | API         | Attempt without auth returns 401               | Unauthorized            |
| TC-M8-05 | API         | Attempt with choice from wrong MCQ returns 400 | Invalid choice error    |
| TC-M8-06 | Integration | Attempts deleted when MCQ deleted              | CASCADE verified        |


**Deliverables:**

- Hardened attempt flow
- Phase 8 tests GREEN

**Acceptance criteria:**

- [ ] Attempts persist with correct `is_correct`
- [ ] Invalid attempt inputs rejected
- [ ] TC-M8-01–TC-M8-06 GREEN

**Exit criteria:** All Phase 8 tests GREEN; user approves Phase 9.

---



### Phase 9: Integration Testing and Final Validation — PLANNED

**Objective:** Verify the full MCQ module end-to-end; lint, build, and document completion.

**Dependencies:** Phases 1–8 complete.

**Technical tasks:**

1. **Write failing tests (RED)** TC-M9-01 through TC-M9-08
2. Full journey test: create → list → edit → preview (correct + incorrect) → delete
3. Cross-cutting: error messages match PRD; auth redirects; 404 for non-owner
4. Run `npm test`, `npm run lint`, `npm run build`
5. Verify with `npm run preview` for Workers runtime (recommended)
6. Update this PRD phase statuses and Current Status
7. Update `AGENTS.md` Project section when feature complete
8. Implement until TC-M9-01–TC-M9-08 are **GREEN**

**Tests to write first (RED):**


| ID       | Type        | Test case                                      | Expected result              |
| -------- | ----------- | ---------------------------------------------- | ---------------------------- |
| TC-M9-01 | Flow        | Full MCQ CRUD journey succeeds                 | All steps pass without error |
| TC-M9-02 | Flow        | User A cannot access User B's MCQ              | 404 on API and edit page     |
| TC-M9-03 | Unit        | All MCQ error messages match PRD               | Message constants verified   |
| TC-M9-04 | Component   | MCQ pages usable at 320px width                | Responsive layout holds      |
| TC-M9-05 | Component   | Keyboard navigation on form and dialogs        | Operable via keyboard        |
| TC-M9-06 | Integration | API errors do not expose internals             | No stack traces              |
| TC-M9-07 | Integration | Full Vitest suite passes                       | `npm test` zero failures     |
| TC-M9-08 | Manual      | Preview runtime smoke test (`npm run preview`) | List/create/preview work     |


**Deliverables:**

- Full test suite GREEN
- Lint and build pass
- Updated PRD and AGENTS.md

**Acceptance criteria:**

- [ ] All acceptance criteria in this PRD marked complete
- [ ] TC-M9-01–TC-M9-08 GREEN (TC-M9-08 manual/preview documented)
- [ ] `npm test`, `npm run lint`, `npm run build` succeed

**Exit criteria:** MCQ CRUD feature complete; user sign-off.

---



### Phase Summary


| Phase | Name                                        | Focus                                 |
| ----- | ------------------------------------------- | ------------------------------------- |
| 1     | Requirements, Architecture, Database Design | This PRD — approval gate              |
| 2     | Database Migrations and Models              | SQL migration, types, mock D1         |
| 3     | MCQ Service Layer                           | Business logic, validation, ownership |
| 4     | API Routes                                  | JSON HTTP endpoints                   |
| 5     | Frontend List Page                          | Table, actions menu, create button    |
| 6     | Create/Edit Page                            | Form, dynamic choices, save/cancel    |
| 7     | Preview and Delete                          | Dialogs and confirmations             |
| 8     | Attempts Functionality                      | Persistence and edge cases            |
| 9     | Integration and Validation                  | Full journey, lint, build, preview    |


---



## Technical Implementation Details



### Key Files (planned)


| Path                                        | Purpose                    |
| ------------------------------------------- | -------------------------- |
| `migrations/0002_create_mcq_tables.sql`     | D1 schema for MCQ domain   |
| `src/lib/mcq/types.ts`                      | Domain types               |
| `src/lib/mcq/config.ts`                     | Limits and constants       |
| `src/lib/mcq/messages.ts`                   | User-facing strings        |
| `src/lib/mcq/schemas/mcq.ts`                | Zod schemas                |
| `src/lib/mcq/mcqs.ts`                       | MCQ CRUD service           |
| `src/lib/mcq/choices.ts`                    | Choice persistence helpers |
| `src/lib/mcq/attempts.ts`                   | Attempt recording          |
| `src/lib/mcq/authorization.ts`              | Ownership checks           |
| `src/app/api/mcqs/route.ts`                 | List + create API          |
| `src/app/api/mcqs/[id]/route.ts`            | Read + update + delete API |
| `src/app/api/mcqs/[id]/preview/route.ts`    | Preview API                |
| `src/app/api/mcqs/[id]/attempts/route.ts`   | Attempt API                |
| `src/app/dashboard/mcqs/page.tsx`           | List page                  |
| `src/app/dashboard/mcqs/new/page.tsx`       | Create page                |
| `src/app/dashboard/mcqs/[id]/edit/page.tsx` | Edit page                  |
| `src/components/mcq/mcq-list-table.tsx`     | Table component            |
| `src/components/mcq/mcq-actions-menu.tsx`   | Dropdown actions           |
| `src/components/mcq/mcq-form.tsx`           | Create/edit form           |
| `src/components/mcq/mcq-preview-dialog.tsx` | Preview dialog             |
| `src/components/mcq/mcq-delete-dialog.tsx`  | Delete confirmation        |




### API Route Auth Pattern

```typescript
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { listMcqsByUser } from "@/lib/mcq/mcqs";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getCurrentSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const mcqs = await listMcqsByUser(db, session.userId);
  return NextResponse.json({ mcqs });
}
```



### Service Layer Pattern

Follow `src/lib/auth/users.ts`:

- Accept `db: D1Database` as first parameter
- Map snake_case rows to camelCase domain objects
- Return `{ ok: false, error }` or null for expected failures; throw only for unexpected DB errors
- Use numbered placeholders in all SQL



### Important Notes

- **Do not apply remote D1 migrations** unless the user explicitly requests (per `AGENTS.md`).
- `npm run dev` **uses remote D1** (`remote: true` in `wrangler.jsonc`); local-only testing uses `--local` migrations.
- **Server Components** for pages where possible; **client components** for table actions, dialogs, and form interactivity.
- **No** `react-hook-form` unless user approves (project convention).
- **Extend mock D1 incrementally** as new SQL statements are added; do not hit real D1 in unit tests.

---



## Acceptance Criteria



### List Page

- [ ] Authenticated user can open `/dashboard/mcqs` and see a table of their MCQs
- [ ] Table shows name, question (truncated), created date, and Actions column
- [ ] Empty state displays when user has no MCQs
- [ ] Create button navigates to `/dashboard/mcqs/new`
- [ ] Unauthenticated user is redirected to Sign In



### Create/Edit

- [ ] User can create an MCQ with name, question, and 2–6 choices
- [ ] Exactly one choice must be marked correct
- [ ] Validation errors match PRD messages
- [ ] Successful save redirects to list
- [ ] Cancel returns to list without saving
- [ ] User can edit an owned MCQ; non-owned returns 404



### Preview

- [ ] Preview opens from Actions menu
- [ ] Correct answer is not shown before submission
- [ ] Submitting an answer shows correct/incorrect feedback
- [ ] Attempt is persisted in `mcq_attempts`



### Delete

- [ ] Delete requires confirmation
- [ ] Confirmed delete removes MCQ and related choices and attempts
- [ ] List updates after delete



### API and Security

- [ ] All API routes require authentication
- [ ] Users can only access their own MCQs
- [ ] Cross-user access returns 404, not 403
- [ ] Error responses do not expose internal details



### Quality

- [ ] All phase TDD tests GREEN (`TC-M2-*` through `TC-M9-*`)
- [ ] `npm run lint` and `npm run build` pass
- [ ] Keyboard and mobile usability verified (TC-M9-04, TC-M9-05)

---



## Success Metrics


| Metric                | Target                                       | How Measured                 |
| --------------------- | -------------------------------------------- | ---------------------------- |
| TDD test pass rate    | 100% MCQ tests GREEN before feature sign-off | `npm test`                   |
| MCQ create completion | User can save valid MCQ in one flow          | TC-M6-07, TC-M9-01           |
| Ownership enforcement | 100% cross-user access blocked               | TC-M3-11, TC-M4-06, TC-M9-02 |
| Preview accuracy      | is_correct matches selected choice           | TC-M3-16, TC-M3-17, TC-M8-02 |
| Build stability       | lint + build pass                            | CI / local commands          |


---



## Dependencies



### External Dependencies

- Cloudflare D1 (`quizemaker-db`, binding `DB`) — existing
- No new npm dependencies required unless `radio-group` or `alert-dialog` is added via shadcn (still source-copied, not npm)



### Internal Dependencies

- Sprint 0 authentication: `getCurrentSession`, `requireAuth`, `requireAuthOrExpired`
- `getDb()` from `src/lib/db.ts`
- Dashboard layout and authenticated header
- Vitest test harness and mock D1 patterns
- shadcn/ui components (install `dropdown-menu` before Phase 5)



### Environment Considerations

- No new secrets or environment variables for MCQ v1
- Remote D1 migration apply is user-initiated only

---



## Risks and Mitigation



### Technical Risks

- **Risk:** API routes behave differently on Node dev vs Workers preview.
- **Mitigation:** Run `npm run preview` during Phase 9; session cookie patterns already validated in auth sprint.
- **Risk:** D1 batch transactions for updateMcq may have limitations.
- **Mitigation:** Use D1 batch API; test in integration tests; simplify to sequential prepared statements with clear rollback behavior if batch fails.
- **Risk:** Mock D1 drift from real D1 behavior.
- **Mitigation:** Keep mock SQL support aligned with service layer; optional preview manual test (TC-M9-08).



### User Experience Risks

- **Risk:** Truncated question text hides important context in the list.
- **Mitigation:** Tooltip with full question on hover/focus.
- **Risk:** Accidental delete.
- **Mitigation:** Confirmation dialog with destructive styling on confirm button.



### Security Risks

- **Risk:** MCQ ID enumeration by non-owners.
- **Mitigation:** Return 404 for both not-found and not-owner; enforce ownership in service layer, not only UI.

---



## Open Questions (Resolved for Phase 1)


| ID   | Question                                                  | Decision                                                                                            |
| ---- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Q-M1 | On MCQ update, what happens to existing preview attempts? | **Delete attempts** for that MCQ when choices are replaced (preview attempts are disposable in v1). |
| Q-M2 | API routes vs Server Actions?                             | **API routes** for MCQ CRUD, preview, and attempts (client components consume JSON).                |
| Q-M3 | Can users preview other users' MCQs?                      | **No** — preview is owner-only, same as edit/delete.                                                |
| Q-M4 | MCQ list route path?                                      | `/dashboard/mcqs` under authenticated dashboard layout.                                             |
| Q-M5 | Show `updated_at` in list table?                          | **No** — Created column only for v1; `updated_at` stored for future use.                            |


---



## Troubleshooting Guide

*(Add entries during implementation as issues are discovered and fixed.)*

### Migration apply fails locally

**Problem:** `npm run db:migrate:local` errors on FK to `users`.
**Cause:** Auth migration not applied locally first.
**Solution:** Apply `0001_create_auth_tables.sql` locally before `0002`.

### API returns 401 despite being signed in

**Problem:** Fetch from client does not send session cookie.
**Cause:** Missing `credentials: 'include'` on fetch calls.
**Solution:** Add credentials option to all MCQ API client fetches.

---



## Notes for AI Agents

When working with this PRD:

1. **Read Scope (In / Out / Cut)** before implementing; do not build quiz assembly, publishing, or shared libraries.
2. **Follow phases in order** (1 → 9); **stop after each phase** for user approval.
3. **Write tests first (RED)** per phase test tables; implement until GREEN.
4. **Use API routes** for MCQ mutations and reads consumed by client components; reuse auth session cookie.
5. **Centralize validation** in Zod schemas and `messages.ts`; mirror rules on client and server.
6. **Service layer** must not be bypassed from route handlers — no raw SQL in routes.
7. **Extend mock D1** for MCQ SQL; do not use real D1 in unit tests.
8. **Do not apply remote migrations or deploy** unless the user explicitly requests (per `AGENTS.md`).
9. **Mark acceptance criteria complete** only when related TDD tests are GREEN.
10. **Update phase status markers** and Current Status in this file as work progresses.
11. **Ask before adding npm dependencies** not listed in this PRD.
12. **Install shadcn components** via `npx shadcn@latest add @shadcn/<name>` before use.

---



## Current Status

**Last Updated:** September 2, 2026
**Current Phase:** Phase 4 — API Routes
**Status:** COMPLETED
**Next Steps:** Await user approval to begin Phase 5 (MCQ list page).

**Phase completion log:**


| Phase | Status    | Approved by user      |
| ----- | --------- | --------------------- |
| 1     | COMPLETED | Yes                   |
| 2     | COMPLETED | Yes                   |
| 3     | COMPLETED | Yes                   |
| 4     | COMPLETED | Yes (Phase 4 started) |
| 5     | PLANNED   | —                     |
| 4     | PLANNED | —                |
| 5     | PLANNED | —                |
| 6     | PLANNED | —                |
| 7     | PLANNED | —                |
| 8     | PLANNED | —                |
| 9     | PLANNED | —                |


