Date created: August 26, 2026
Date last modified: August 31, 2026

# Quiz Maker Technical PRD

## Project Overview

Quiz Maker is a web application that will eventually allow users to create quizzes, manage quizzes, attempt quizzes, and view quiz results. Before any quiz functionality can be built, users must be able to register, sign in, maintain an authenticated session, and access protected areas of the application securely.

Sprint 0 is strictly limited to designing the authentication module. No quiz-related features are in scope. This document defines the complete product and technical requirements for user authentication so that developers, QA, product stakeholders, and AI agents have a single source of truth before implementation begins.

---

## Business Goal

Establish a secure, reliable authentication foundation for Quiz Maker so that only registered and authenticated users can access protected application areas in future sprints. A well-defined authentication module reduces security risk, provides a consistent user experience across sign-up and sign-in flows, and enables all subsequent quiz features to be built on a trusted identity layer.

---

## Sprint Goal

Design and specify the complete authentication module for Quiz Maker Sprint 0, covering User Sign Up, User Sign In, Logout, User Session Management, Protected Routes, and the Basic Authentication Flow. This sprint produces requirements documentation only; implementation begins in a subsequent sprint.

**Sprint 0 deliverable:** This Technical PRD, approved and ready to guide development.

---

## Hypothesis

We believe that defining a complete, unambiguous authentication specification before development begins will enable consistent implementation across teams and AI agents, reduce rework from unclear requirements, and establish a secure identity foundation for all future Quiz Maker features.

---

## User Flow

### New User Registration and First Sign In

1. User navigates to the Sign Up page.
2. User completes Full Name, Email Address, Password, and Confirm Password fields.
3. User submits the registration form.
4. System validates all fields and creates the account if validation passes.
5. User is redirected to the Sign In page and shown a registration success message.
6. User enters Email and Password on the Sign In page.
7. User submits the sign-in form.
8. System validates credentials and establishes an authenticated session.
9. User is redirected to the Dashboard.

### Returning User Sign In

1. User navigates to the Sign In page.
2. User enters Email and Password.
3. User submits the sign-in form.
4. System validates credentials and establishes or restores an authenticated session.
5. User is redirected to the Dashboard.

### Authenticated User Session

1. Authenticated user navigates between protected pages (e.g., Dashboard).
2. Authentication state persists across page navigation and browser refresh.
3. User accesses protected content only while the session is valid.

### Logout

1. Authenticated user initiates Logout.
2. System clears or invalidates the active session.
3. User is redirected to the Sign In page.
4. User is shown a logout success message where applicable.
5. User cannot access protected routes without signing in again.

### Unauthenticated Access Attempt

1. Unauthenticated user attempts to access a protected route (e.g., Dashboard) directly via URL or navigation.
2. System detects the absence of a valid session.
3. User is redirected to the Sign In page with the message "Please sign in to continue."
4. Protected content is not displayed.

### Expired or Invalid Session

1. Authenticated user's session becomes invalid or expires.
2. User attempts to access a protected route or refreshes the page.
3. System detects the invalid session.
4. User is redirected to the Sign In page.
5. Protected content is not displayed.

---

## User Stories

### Sign Up

- As a new user, I want to register with my full name, email, and password so that I can create an account and access Quiz Maker.
- As a new user, I want clear validation feedback on the Sign Up form so that I can correct errors before submitting.
- As a new user, I want to be redirected to Sign In with a success message after registration so that I know my account was created.

### Sign In

- As a registered user, I want to sign in with my email and password so that I can access protected areas of the application.
- As a registered user, I want meaningful error messages when sign-in fails so that I understand what went wrong without exposing sensitive system details.
- As a registered user, I want to be redirected to the Dashboard after successful sign-in so that I can begin using the application.

### Logout

- As an authenticated user, I want to log out so that my session ends and others cannot access my account on a shared device.
- As an authenticated user, I want confirmation that I have logged out successfully so that I know my session has ended.

### Session Management

- As an authenticated user, I want my session to remain active as I navigate the application so that I do not have to sign in repeatedly.
- As an authenticated user, I want my session to persist across browser refresh so that I remain signed in during normal use.
- As a user whose session has expired, I want to be redirected to Sign In when I attempt to access protected content so that I can authenticate again.

### Protected Routes

- As an authenticated user, I want to access the Dashboard and other protected pages so that I can use application features intended for signed-in users.
- As an unauthenticated user, I want to be redirected to Sign In when I attempt to access protected pages so that unauthorized access is prevented.

---

## Scope

### In Scope

Sprint 0 requirements cover the following:

- User Sign Up with Full Name, Email Address, Password, and Confirm Password
- User Sign In with Email and Password
- Logout
- User Session Management (creation, persistence, invalidation, expiration handling)
- Protected Routes (access control for authenticated users only)
- Basic Authentication Flow (registration through sign-in, session establishment, protected access, logout)
- Sign Up and Sign In page UI requirements (functional and UX behavior only)
- Field validation rules, error messages, and success messages
- Navigation flow between Sign Up, Sign In, Dashboard, and protected routes
- Security requirements for authentication
- Non-functional requirements relevant to authentication
- Acceptance criteria for all authentication capabilities

### Out of Scope

The following are explicitly excluded from Sprint 0:

- Quiz creation, editing, or deletion
- Quiz management (listing, organizing, publishing quizzes)
- Quiz attempts, scoring, or results
- Reports, analytics, and leaderboards
- Question management (creation, editing, import, categories)
- Any non-authentication application functionality
- Password reset or forgot-password flows
- Email verification
- Remember-me / persistent login beyond standard session behavior
- Multi-factor authentication (MFA)
- Social login (Google, GitHub, etc.)
- Account management (profile editing, password change, account deletion)
- Session or device management (view active sessions, revoke devices)
- Role-based access control beyond authenticated vs. unauthenticated
- Admin or moderator authentication flows
- API specifications, database schema, or implementation code (this document defines requirements only)

### Cut

Items considered during planning but deliberately excluded from Sprint 0:

- **Email verification at registration** — Adds complexity and external email dependency; deferred to a future sprint to keep Sprint 0 focused on core sign-up/sign-in.
- **Password reset** — Important for production but not required for the initial authentication foundation; deferred.
- **Remember-me checkbox** — Standard session persistence covers normal use; extended persistence deferred.
- **Rich Dashboard content** — Dashboard exists only as a protected destination placeholder; quiz and analytics content deferred.

---

## Authentication Requirements

Authentication is the sole focus of Sprint 0. The system must support the following capabilities:

| Capability | Description |
|------------|-------------|
| User registration | Allow new users to create an account with validated credentials |
| User sign-in | Allow registered users to authenticate with email and password |
| Session establishment | Create an authenticated session upon successful sign-in |
| Session persistence | Maintain authentication state across navigation and browser refresh |
| Session termination | End the session on logout or when the session becomes invalid |
| Access control | Restrict protected routes to authenticated users only |
| Credential validation | Enforce field-level and form-level validation with clear feedback |
| Secure error handling | Display user-friendly errors without revealing sensitive information |

---

## Functional Requirements

### FR-1: User Sign Up

1. The system shall provide a Sign Up page accessible to unauthenticated users.
2. The Sign Up form shall include the following required fields: Full Name, Email Address, Password, Confirm Password.
3. The system shall validate all fields before account creation.
4. The system shall reject registration if the email address is already registered.
5. The system shall reject registration if any validation rule fails.
6. Upon successful registration, the system shall redirect the user to the Sign In page.
7. Upon successful registration, the system shall display a success message indicating the account was created.

### FR-2: User Sign In

1. The system shall provide a Sign In page accessible to unauthenticated users.
2. The Sign In form shall include the following required fields: Email Address, Password.
3. The system shall validate that both fields are provided before attempting authentication.
4. The system shall verify credentials against stored user records.
5. The system shall display a user-friendly error message when authentication fails.
6. Upon successful authentication, the system shall establish an authenticated session.
7. Upon successful authentication, the system shall redirect the user to the Dashboard.
8. The session shall remain active until the user logs out or the session becomes invalid.

### FR-3: Logout

1. The system shall provide a Logout action available to authenticated users.
2. Upon logout, the system shall clear or invalidate the active authentication session.
3. Upon logout, the system shall prevent further access to protected routes without re-authentication.
4. Upon logout, the system shall redirect the user to the Sign In page.
5. Upon logout, the system shall display an appropriate success message.

### FR-4: Session Management

1. The system shall create an authenticated session immediately after successful sign-in.
2. The system shall maintain authentication state as the user navigates between pages within the application.
3. The system shall maintain authentication state across browser refresh while the session is valid.
4. The system shall detect unauthenticated or invalid sessions when protected content is requested.
5. The system shall terminate the session when the user logs out.
6. The system shall treat expired or invalid sessions as unauthenticated and require re-sign-in.

### FR-5: Protected Routes

1. Only authenticated users with a valid session shall access protected routes.
2. Unauthenticated users attempting to access protected routes shall be redirected to the Sign In page.
3. Protected content shall not be rendered or accessible via direct URL navigation without a valid session.
4. The Dashboard shall be a protected route and serve as the default post-sign-in destination.

### FR-6: Navigation Between Authentication Pages

1. Unauthenticated users shall be able to navigate between Sign Up and Sign In pages.
2. Authenticated users attempting to access Sign Up or Sign In shall be redirected to the Dashboard (or another appropriate authenticated landing page).
3. Navigation links and redirects shall behave consistently for authenticated and unauthenticated users.

---

## Non-Functional Requirements

### Security

- Passwords shall never be stored or transmitted in plain text.
- Authentication errors shall not reveal whether an email exists in the system (use generic messaging for invalid credentials where appropriate).
- Sessions shall be protected against unauthorized access or tampering.
- Protected routes shall enforce authentication checks on every access attempt, not only on initial page load.
- Sensitive user data shall not be exposed in URLs, client-visible storage, or error messages.

### Performance

- Sign Up and Sign In form submission shall provide user feedback (loading state) within one interaction cycle.
- Authentication checks for protected routes shall not cause perceptible delay under normal load.
- Session validation shall complete quickly enough that navigation between protected pages feels seamless.

### Scalability

- Authentication requirements shall not assume a single-server deployment model; session and credential handling shall be compatible with horizontally scaled hosting.
- User registration and sign-in flows shall support growth in user volume without redesigning the authentication model.

### Accessibility

- Sign Up and Sign In forms shall be operable via keyboard navigation.
- All form fields shall have associated labels readable by assistive technologies.
- Validation errors shall be announced or associated with the relevant fields in a way assistive technologies can convey.
- Focus management shall follow logical order during form submission and error display.
- Color shall not be the sole indicator of error or success states.

### Responsive Design

- Sign Up and Sign In pages shall be usable on desktop, tablet, and mobile viewports.
- Form layouts shall adapt without loss of functionality or readability on smaller screens.
- Touch targets on mobile shall be adequately sized for interaction.

### Maintainability

- Authentication requirements shall be defined clearly enough that validation rules, messages, and flows can be implemented consistently.
- Error messages and validation rules shall be centralized in specification so they can be updated in one place during implementation.
- Authentication behavior shall be separable from future quiz functionality.

### Clean Architecture

- Authentication logic shall be isolated from presentation and from future quiz domain logic.
- Session management, credential validation, and route protection shall be defined as distinct concerns even if implemented in a single sprint.
- The authentication module shall be extensible for future enhancements (password reset, MFA) without rewriting core flows.

---

## UI Requirements

### Sign Up Page

**Purpose:** Allow new users to create an account.

**Access:** Available to unauthenticated users. Authenticated users shall be redirected away from this page.

**Layout and content:**

- Page title or heading indicating account creation (e.g., "Sign Up" or "Create Account").
- Registration form with labeled input fields.
- Primary submit action (e.g., "Sign Up" or "Create Account").
- Link to the Sign In page for users who already have an account.

**Form fields:**

| Field | Label (recommended) | Input type | Required |
|-------|---------------------|------------|----------|
| Full Name | Full Name | Text | Yes |
| Email Address | Email Address | Email | Yes |
| Password | Password | Password | Yes |
| Confirm Password | Confirm Password | Password | Yes |

**Password show/hide toggle (Q-3):** Both Password and Confirm Password fields shall include a show/hide toggle so users can verify what they typed.

**Validation behavior:**

- Required-field validation shall occur on submit at minimum; inline validation on blur or change is recommended but not mandatory unless specified during implementation.
- Invalid fields shall be visually indicated (e.g., error styling on the field or label).
- Field-level error messages shall appear near the relevant field.
- Form-level errors (e.g., duplicate email) shall appear in a prominent, readable location.
- Submit button shall be disabled or show a loading state while registration is in progress to prevent duplicate submissions.

**Error states:**

- Each field displays its specific validation error when invalid.
- Server-side or system errors (e.g., duplicate email, unexpected failure) display a clear message without technical jargon.

**Success state:**

- After successful registration, the user is redirected to Sign In; a success message is displayed on the Sign In page (see Success Messages).

**Navigation links:**

- Link to Sign In page (e.g., "Already have an account? Sign In").

**Accessibility:**

- All fields have visible labels; placeholders may supplement but not replace labels.
- Error messages are associated with fields for screen readers.
- Submit action is reachable and activatable via keyboard.

**Responsive behavior:**

- Form fields stack vertically on narrow viewports.
- Labels, inputs, and buttons remain readable and tappable on mobile devices.

---

### Sign In Page

**Purpose:** Allow registered users to authenticate.

**Access:** Available to unauthenticated users. Authenticated users shall be redirected to the Dashboard.

**Layout and content:**

- Page title or heading indicating sign-in (e.g., "Sign In").
- Authentication form with labeled input fields.
- Primary submit action (e.g., "Sign In").
- Link to the Sign Up page for users who need an account.
- Area for displaying success messages (e.g., post-registration) and error messages.

**Form fields:**

| Field | Label (recommended) | Input type | Required |
|-------|---------------------|------------|----------|
| Email Address | Email Address | Email | Yes |
| Password | Password | Password | Yes |

**Password show/hide toggle (Q-3):** The Password field shall include a show/hide toggle so users can verify what they typed.

**Validation behavior:**

- Required-field validation on submit at minimum.
- Invalid or empty fields shall show appropriate error messages.
- Submit button shall show a loading state while authentication is in progress.

**Error states:**

- Invalid credentials display a user-friendly error without specifying whether the email or password was wrong.
- Field validation errors display near the relevant field.
- Unexpected system errors display a generic, non-technical message.

**Success state:**

- Registration success message displayed when redirected from Sign Up.
- Logout success message displayed when redirected from Logout (see Success Messages).
- Successful sign-in redirects to Dashboard (no persistent on-page success message required unless desired during implementation).

**Navigation links:**

- Link to Sign Up page (e.g., "Don't have an account? Sign Up").

**Accessibility and responsive behavior:** Same expectations as Sign Up page.

---

### Dashboard (Protected Placeholder)

**Purpose:** Default landing page for authenticated users after sign-in. Serves as proof of protected-route access; no quiz functionality in Sprint 0.

**Access:** Authenticated users only.

**Minimum content:**

- Indication that the user is signed in (e.g., welcome message using the user's name or email).
- Placeholder content indicating future Quiz Maker features will appear here.

**Authenticated layout (Q-5):** Logout shall appear in a **global header** on all authenticated pages (not Dashboard-only). The header is shared across protected routes via the authenticated layout.

**Behavior:**

- Unauthenticated access redirects to Sign In.
- Logout initiates the logout flow defined in this PRD.

---

## Input Fields

| Field | Page | Required | Description |
|-------|------|----------|-------------|
| Full Name | Sign Up | Yes | User's display name; used for identification in the application |
| Email Address | Sign Up, Sign In | Yes | Unique identifier for authentication; must be a valid email format |
| Password | Sign Up, Sign In | Yes | Secret credential for authentication |
| Confirm Password | Sign Up | Yes | Re-entry of password to confirm accuracy |

---

## Field Validation Rules

### Full Name

| Rule | Requirement |
|------|-------------|
| Required | Must not be empty or whitespace-only |
| Minimum length | At least 1 non-whitespace character |
| Maximum length | **100 characters** maximum (`FULL_NAME_MAX_LENGTH`); enforced in validation |

### Email Address

| Rule | Requirement |
|------|-------------|
| Required | Must not be empty |
| Format | Must match a valid email format (contains local part, `@`, and domain) |
| Uniqueness | On Sign Up, must not match an existing registered email |
| Normalization | Trim whitespace and lowercase before storage and lookup; uniqueness comparison is case-insensitive |

### Password

| Rule | Requirement |
|------|-------------|
| Required | Must not be empty |
| Minimum length | At least 8 characters |
| Uppercase | At least one uppercase letter (A–Z) |
| Lowercase | At least one lowercase letter (a–z) |
| Number | At least one digit (0–9) |
| Special character | At least one special character (e.g., `!@#$%^&*()_+-=[]{}|;:'",.<>?/\`~) |

### Confirm Password

| Rule | Requirement |
|------|-------------|
| Required | Must not be empty |
| Match | Must exactly match the Password field value |

### Sign In — Email and Password

| Rule | Requirement |
|------|-------------|
| Required | Both fields must be provided |
| Email format | Email must match valid format before authentication is attempted |
| Credentials | Email and password combination must match a registered user |

---

## Error Messages

Error messages shall be concise, user-friendly, and actionable. The following messages shall be used (exact wording may be adjusted for tone consistency during implementation, but meaning must be preserved).

### Sign Up — Field Validation

| Condition | Error message |
|-----------|---------------|
| Full Name empty | "Full name is required." |
| Full Name exceeds 100 characters | "Full name must be 100 characters or fewer." |
| Email empty | "Email address is required." |
| Email invalid format | "Please enter a valid email address." |
| Email already registered | "An account with this email address already exists. Please sign in or use a different email." |
| Password empty | "Password is required." |
| Password too short | "Password must be at least 8 characters long." |
| Password missing uppercase | "Password must contain at least one uppercase letter." |
| Password missing lowercase | "Password must contain at least one lowercase letter." |
| Password missing number | "Password must contain at least one number." |
| Password missing special character | "Password must contain at least one special character." |
| Confirm Password empty | "Please confirm your password." |
| Confirm Password mismatch | "Passwords do not match." |
| Multiple field errors | Each invalid field shows its own message; form may also show "Please correct the errors below." |

### Sign Up — System Errors

| Condition | Error message |
|-----------|---------------|
| Unexpected registration failure | "Something went wrong. Please try again later." |

### Sign In — Field Validation

| Condition | Error message |
|-----------|---------------|
| Email empty | "Email address is required." |
| Email invalid format | "Please enter a valid email address." |
| Password empty | "Password is required." |

### Sign In — Authentication Errors

| Condition | Error message |
|-----------|---------------|
| Invalid credentials (wrong email and/or password) | "Invalid email or password. Please try again." |
| Unexpected sign-in failure | "Something went wrong. Please try again later." |

### Session and Protected Route Errors

| Condition | Behavior |
|-----------|----------|
| Unauthenticated access to protected route | Redirect to Sign In; display message: "Please sign in to continue." (Q-2) |
| Expired or invalid session | Redirect to Sign In; display message: "Your session has expired. Please sign in again." |

---

## Success Messages

| Event | Message | Display location |
|-------|---------|------------------|
| Successful registration | "Your account has been created successfully. Please sign in." | Sign In page (after redirect from Sign Up) |
| Successful logout | "You have been signed out successfully." | Sign In page (after redirect from Logout) |
| Successful sign-in | No persistent message required | User is redirected to Dashboard |

Success messages shall be visually distinct (e.g., success styling) and dismissible or transient if implementation supports it. They shall not block further interaction with the page.

---

## Navigation Flow

### Route Summary

| Route / Page | Authenticated access | Unauthenticated access |
|--------------|---------------------|------------------------|
| Sign Up | Redirect to Dashboard | Allowed |
| Sign In | Redirect to Dashboard | Allowed |
| Dashboard | Allowed | Redirect to Sign In |
| Other protected routes | Allowed | Redirect to Sign In |

### Navigation Paths

```
Sign Up ──(successful registration)──> Sign In ──(successful sign-in)──> Dashboard
   ^                                        |
   |                                        |
   └────────(link: "Sign In")───────────────┘
   └────────(link: "Sign Up")───────────────┘

Dashboard ──(logout)──> Sign In

Protected route (direct URL, no session) ──> Sign In

Sign In / Sign Up (direct URL, valid session) ──> Dashboard
```

### Expected Behavior

- **Unauthenticated user on Sign Up or Sign In:** May view and submit the respective form; may navigate between Sign Up and Sign In via links.
- **Unauthenticated user on protected route:** Immediately redirected to Sign In; protected content is not shown.
- **Authenticated user on Sign Up or Sign In:** Redirected to Dashboard without displaying the authentication form (unless implementation requires a brief redirect message).
- **Authenticated user on Dashboard or protected routes:** Full access while session is valid; Logout available.
- **Post-registration:** Always redirect to Sign In, never directly to Dashboard.
- **Post-sign-in:** Always redirect to Dashboard (unless a return URL pattern is introduced in a future sprint; not in Sprint 0 scope).

---

## Authentication Flow

The following describes the complete high-level authentication flow at the product requirements level.

### 1. Registration Flow

```
User opens Sign Up page
    → User enters Full Name, Email, Password, Confirm Password
    → User submits form
    → Client validates fields (required, format, password rules, match)
    → If client validation fails: display field errors, stop
    → System validates fields and checks email uniqueness
    → If server validation fails: display errors, stop
    → System creates user account with securely stored credentials
    → System redirects to Sign In with registration success message
```

### 2. Sign-In Flow

```
User opens Sign In page
    → User enters Email, Password
    → User submits form
    → Client validates required fields and email format
    → If client validation fails: display field errors, stop
    → System validates credentials
    → If credentials invalid: display authentication error, stop
    → System creates authenticated session
    → System redirects user to Dashboard
```

### 3. Session Lifecycle

```
Successful sign-in
    → Session created and associated with user
    → Session identifier stored securely (implementation-specific)
    → Session valid for authenticated requests and protected route access

During active session
    → Navigation between protected pages: session validated, access granted
    → Browser refresh: session validated, user remains authenticated

Session ends when
    → User logs out (explicit termination)
    → Session expires after 7-day absolute timeout from creation (implicit termination)
    → Session becomes invalid for any other reason (implicit termination)

After session ends
    → Protected routes redirect to Sign In
    → User must sign in again to access protected content
```

### 4. Logout Flow

```
Authenticated user initiates Logout
    → System invalidates or clears session
    → System redirects to Sign In
    → Sign In page displays logout success message
    → Subsequent protected route access requires new sign-in
```

### 5. Protected Route Access Flow

```
User requests protected route (e.g., Dashboard)
    → System checks for valid authenticated session
    → If valid: render protected content
    → If invalid or absent: redirect to Sign In, do not render protected content
```

---

## Session Management Requirements

### Session Creation

- An authenticated session shall be created immediately upon successful credential verification during sign-in.
- The session shall be bound to the authenticated user identity.
- Session creation shall occur only after successful sign-in, not after registration (user must sign in after sign-up).

### Session Expiration (Q-1)

- Sessions use a **7-day absolute timeout** from session creation.
- No separate idle timeout in Phase 1; activity does not extend the expiration window.
- Expired sessions are deleted on validation and treated as unauthenticated.

### Session Persistence

- The session shall persist across in-application navigation without requiring re-authentication.
- The session shall persist across browser refresh while the session remains valid (within the 7-day window).
- Session persistence shall not require the user to re-enter credentials on each page load.

### Session Validation

- Every request for protected content shall validate the session before granting access.
- Invalid, expired, or missing sessions shall be treated as unauthenticated.
- Session validation failure shall result in redirect to Sign In, not partial rendering of protected content.

### Session Termination

- Logout shall fully terminate the active session; the same session identifier shall not grant access after logout.
- After termination, the user is considered unauthenticated for all protected routes.

### Expired or Invalid Session Handling

- When a session expires or becomes invalid, the user shall be redirected to Sign In on the next protected route access or refresh.
- Unauthenticated redirect shall display "Please sign in to continue."; expired-session redirect shall display "Your session has expired. Please sign in again."
- No automatic re-authentication without user action (no silent credential refresh in Sprint 0).

---

## Protected Route Requirements

### Definition

A protected route is any application page or resource that requires a valid authenticated session. For Sprint 0, the Dashboard is the primary protected route; the protection model shall apply consistently to any route designated as protected.

### Access Rules

1. **Authenticated with valid session:** Access granted; page content rendered.
2. **Unauthenticated:** Access denied; redirect to Sign In; no protected content in response.
3. **Authenticated with invalid/expired session:** Treated as unauthenticated; redirect to Sign In.

### Direct URL Access

- Users shall not bypass authentication by entering a protected URL directly in the browser.
- Authentication checks shall apply regardless of how the user arrived at the protected route (link, bookmark, direct URL, browser back/forward).

### Content Protection

- Protected data and UI shall not be sent to or rendered for unauthenticated clients.
- A redirect to Sign In is the required behavior; display "Please sign in to continue." for unauthenticated access and "Your session has expired. Please sign in again." for expired sessions (Q-2).

### Post-Authentication Landing

- After successful sign-in, users shall land on the Dashboard by default.
- The Dashboard shall confirm authenticated access (e.g., welcome message, Logout control).

---

## Security Requirements

### Password Handling

- Passwords shall be hashed with **Web Crypto PBKDF2-SHA256** at **100,000 iterations** before storage in D1.
- Plain-text passwords shall never be stored, logged, or transmitted except over secure channels during sign-in/sign-up submission.
- Password fields shall use masked input (password type) in the UI, with show/hide toggles on Sign Up and Sign In forms (Q-3).

### Credential Protection

- Sign-in shall use secure transport (HTTPS in production).
- Invalid credential responses shall use generic messaging ("Invalid email or password") to avoid account enumeration.
- Duplicate email errors on Sign Up inherently reveal email existence; this is acceptable for registration but sign-in errors must remain generic.

### Session Security

- Session identifiers shall be generated with `crypto.randomUUID()`, stored server-side in D1, and bound to the client via an HttpOnly session cookie.
- Session identifiers shall be unpredictable and resistant to guessing.
- Sessions shall be invalidated on logout.
- Session data shall not expose passwords or other secrets.
- Session cookies shall use appropriate security attributes (HttpOnly, Secure in production, SameSite).

### Unauthorized Access Prevention

- Protected routes shall enforce authentication on every access.
- Client-side-only protection (e.g., hiding links without server-side checks) is insufficient; enforcement must occur where protected content is served.

### Safe Error Handling

- Error responses shall not include stack traces, database errors, or internal system details visible to users.
- Authentication failure messages shall not confirm which credential component failed.

### Sensitive Data Protection

- User passwords shall never appear in URLs, query parameters, or client-accessible logs.
- Full Name and email may appear in authenticated UI but shall not be exposed to unauthenticated users inappropriately.

### Session Invalidation on Logout

- Logout shall destroy or invalidate the server-side session record (or equivalent) so the session cannot be reused.
- Client-side session artifacts shall be cleared on logout.

---

## Acceptance Criteria

### Sign Up

- [x] Sign Up page is accessible to unauthenticated users at its designated route.
- [x] Form displays Full Name, Email Address, Password, and Confirm Password fields, all marked or treated as required.
- [x] Submitting an empty form shows required-field errors for all empty fields.
- [x] Invalid email format shows "Please enter a valid email address."
- [x] Password failing any complexity rule shows the corresponding specific error message.
- [x] Mismatched Confirm Password shows "Passwords do not match."
- [x] Registering with an email that already exists shows the duplicate email error message.
- [x] Successful registration redirects to Sign In and displays the registration success message.
- [x] Successfully registered user is not automatically signed in; they must sign in separately.

### Sign In

- [x] Sign In page is accessible to unauthenticated users at its designated route.
- [x] Form displays Email Address and Password fields, both required.
- [x] Submitting with empty fields shows appropriate required-field errors.
- [x] Invalid email format shows validation error before or during authentication attempt.
- [x] Wrong email or password shows "Invalid email or password. Please try again."
- [x] Successful sign-in establishes a session and redirects to Dashboard.
- [x] Sign In page displays registration success message when redirected after Sign Up.
- [x] Sign In page displays logout success message when redirected after Logout.

### Logout

- [x] Logout control is available to authenticated users on the Dashboard (or global authenticated layout).
- [x] Logout clears the session and redirects to Sign In.
- [x] After logout, accessing Dashboard redirects to Sign In.
- [x] Logout success message is displayed on Sign In page after logout.

### Session Management

- [x] After sign-in, navigating between protected pages does not require re-authentication.
- [x] After sign-in, refreshing the browser maintains authenticated state.
- [x] After logout, refreshing the browser does not restore authenticated state.
- [x] Expired or invalid session results in redirect to Sign In when accessing protected content.

### Protected Routes

- [x] Unauthenticated user accessing Dashboard is redirected to Sign In.
- [x] Unauthenticated user accessing Dashboard via direct URL does not see Dashboard content.
- [x] Authenticated user with valid session can access Dashboard.
- [x] Authenticated user accessing Sign Up or Sign In is redirected to Dashboard.

### Validation and Error Handling

- [x] All field validation rules documented in this PRD are enforced.
- [x] All error messages match the meanings defined in the Error Messages section.
- [x] System errors show generic user-friendly messages, not technical details.

### Success Handling

- [x] Registration success message appears on Sign In after Sign Up.
- [x] Logout success message appears on Sign In after Logout.

### Accessibility

- [x] All form fields have associated labels.
- [x] Forms are fully operable via keyboard.
- [x] Error messages are perceivable by assistive technologies (associated with fields or announced).

### Responsive Behavior

- [x] Sign Up and Sign In pages are usable on mobile, tablet, and desktop viewport widths.
- [x] Forms remain readable and submittable on a minimum mobile width (e.g., 320px).

---

## TDD Test Cases

Authentication features shall be developed using **Test-Driven Development (TDD)**. For each implementation phase, tests are written **before** the corresponding feature code. Tests must fail initially (**RED**), then pass after correct implementation (**GREEN**).

### TDD Workflow

```
1. RED    — Write a test that describes the required behavior. Run the suite; the test must fail.
2. GREEN  — Implement the minimum code needed to make the test pass. Run the suite; the test must pass.
3. REFACTOR — Clean up code while keeping all tests GREEN.
4. REPEAT — Continue for the next test case in the phase.
```

**Rules:**

- Do not implement feature code before its test exists and has been observed failing.
- A test that passes before implementation is written is invalid; revise it so it asserts real behavior.
- Each test case in this section maps to one or more Acceptance Criteria items.
- Tests must assert observable behavior (UI output, redirects, session state, error messages), not implementation internals.
- Cover failure paths (validation errors, invalid credentials, unauthorized access) as thoroughly as happy paths.
- Phase exit criteria require all test cases for that phase to be **GREEN**.

**Test types used in this PRD:**

| Type | Scope | Examples |
|------|-------|----------|
| Unit | Isolated functions (validation, password hashing, session helpers) | Email format validation, password complexity rules |
| Integration | Modules working together with mocked persistence | User registration with storage, credential verification |
| Component | Client UI rendered in test environment | Form fields, error messages, button states |
| Flow | Multi-step authentication journeys | Register → Sign In → Dashboard → Logout |

**Status legend:**

| Status | Meaning |
|--------|---------|
| RED | Test written; fails because feature is not implemented yet |
| GREEN | Test passes after feature is correctly implemented |

---

### Phase 1: Foundation and Infrastructure

| ID | Type | Test case | Expected result | TDD status |
|----|------|-----------|-----------------|------------|
| TC-1-01 | Unit | Valid email format is accepted | Validation returns no error for `user@example.com` | GREEN |
| TC-1-02 | Unit | Invalid email format is rejected | Validation returns error for malformed emails (e.g., `not-an-email`, `@missing.com`) | GREEN |
| TC-1-03 | Unit | Password missing uppercase is rejected | Validation returns "Password must contain at least one uppercase letter." | GREEN |
| TC-1-04 | Unit | Password missing lowercase is rejected | Validation returns "Password must contain at least one lowercase letter." | GREEN |
| TC-1-05 | Unit | Password missing number is rejected | Validation returns "Password must contain at least one number." | GREEN |
| TC-1-06 | Unit | Password missing special character is rejected | Validation returns "Password must contain at least one special character." | GREEN |
| TC-1-07 | Unit | Password shorter than 8 characters is rejected | Validation returns "Password must be at least 8 characters long." | GREEN |
| TC-1-08 | Unit | Valid password meeting all rules is accepted | Validation returns no error for `Secure1!pass` | GREEN |
| TC-1-09 | Unit | Confirm Password mismatch is rejected | Validation returns "Passwords do not match." when values differ | GREEN |
| TC-1-10 | Unit | Confirm Password match is accepted | Validation returns no error when Confirm Password equals Password | GREEN |
| TC-1-11 | Unit | Full Name empty or whitespace-only is rejected | Validation returns "Full name is required." | GREEN |
| TC-1-12 | Integration | User account is created with hashed password | Stored credential is not plain text; original password cannot be retrieved | GREEN |
| TC-1-13 | Integration | User can be retrieved by email | Lookup by registered email returns the user record | GREEN |
| TC-1-14 | Integration | Duplicate email registration is detectable | Second registration attempt with same email (case-insensitive) is rejected | GREEN |
| TC-1-15 | Integration | Session is created for a valid user | Session record exists and is associated with the user after creation | GREEN |
| TC-1-16 | Integration | Valid session is recognized as authenticated | Session validation returns authenticated state for active session | GREEN |
| TC-1-17 | Integration | Invalid or missing session is rejected | Session validation returns unauthenticated for unknown or expired session | GREEN |
| TC-1-18 | Integration | Session can be invalidated | After invalidation, session validation returns unauthenticated | GREEN |

**Phase 1 exit (tests):** TC-1-01 through TC-1-18 all GREEN.

---

### Phase 2: User Sign Up

| ID | Type | Test case | Expected result | TDD status |
|----|------|-----------|-----------------|------------|
| TC-2-01 | Component | Sign Up page renders required fields | Full Name, Email, Password, and Confirm Password fields are visible | GREEN |
| TC-2-02 | Component | Submitting empty Sign Up form shows required errors | All four required-field error messages are displayed | GREEN |
| TC-2-03 | Component | Invalid email on Sign Up shows format error | "Please enter a valid email address." is displayed | GREEN |
| TC-2-04 | Component | Weak password on Sign Up shows specific complexity error | Corresponding password rule error message is displayed | GREEN |
| TC-2-05 | Component | Mismatched Confirm Password shows error | "Passwords do not match." is displayed | GREEN |
| TC-2-06 | Integration | Duplicate email on Sign Up shows error | "An account with this email address already exists. Please sign in or use a different email." is displayed | GREEN |
| TC-2-07 | Integration | Valid Sign Up creates user account | User record exists in storage after successful submission | GREEN |
| TC-2-08 | Flow | Successful Sign Up redirects to Sign In | User lands on Sign In page after registration | GREEN |
| TC-2-09 | Component | Registration success message appears on Sign In | "Your account has been created successfully. Please sign in." is displayed | GREEN |
| TC-2-10 | Integration | User is not authenticated after Sign Up | No valid session exists; protected routes remain inaccessible | GREEN |
| TC-2-11 | Component | Sign Up shows loading state during submission | Submit control indicates in-progress state; duplicate submission is prevented | GREEN |

**Phase 2 exit (tests):** TC-2-01 through TC-2-11 all GREEN.

---

### Phase 3: User Sign In and Session Establishment

| ID | Type | Test case | Expected result | TDD status |
|----|------|-----------|-----------------|------------|
| TC-3-01 | Component | Sign In page renders required fields | Email and Password fields are visible | GREEN |
| TC-3-02 | Component | Submitting empty Sign In form shows required errors | "Email address is required." and "Password is required." are displayed | GREEN |
| TC-3-03 | Component | Invalid email format on Sign In shows error | "Please enter a valid email address." is displayed | GREEN |
| TC-3-04 | Integration | Wrong email or password shows generic error | "Invalid email or password. Please try again." is displayed; no indication of which field failed | GREEN |
| TC-3-05 | Integration | Valid credentials establish authenticated session | Session is created and associated with the user | GREEN |
| TC-3-06 | Flow | Successful Sign In redirects to Dashboard | User lands on Dashboard after authentication | GREEN |
| TC-3-07 | Flow | Authenticated user visiting Sign In is redirected to Dashboard | Sign In form is not shown to authenticated users | GREEN |
| TC-3-08 | Component | Registration success message visible on Sign In after redirect | Message from Sign Up redirect is displayed | GREEN |
| TC-3-09 | Component | Sign In shows loading state during submission | Submit control indicates in-progress state during authentication | GREEN |

**Phase 3 exit (tests):** TC-3-01 through TC-3-09 all GREEN.

---

### Phase 4: Session Management and Protected Routes

| ID | Type | Test case | Expected result | TDD status |
|----|------|-----------|-----------------|------------|
| TC-4-01 | Flow | Unauthenticated user accessing Dashboard is redirected to Sign In | User does not see Dashboard content; "Please sign in to continue." is displayed | GREEN |
| TC-4-02 | Flow | Unauthenticated direct URL to Dashboard does not render protected content | Response redirects to Sign In; no Dashboard data exposed | GREEN |
| TC-4-03 | Flow | Authenticated user with valid session can access Dashboard | Dashboard content is rendered | GREEN |
| TC-4-04 | Integration | Session persists across in-app navigation | User remains authenticated when moving between protected pages | GREEN |
| TC-4-05 | Integration | Session persists across browser refresh | User remains authenticated after page reload while session is valid | GREEN |
| TC-4-06 | Flow | Authenticated user visiting Sign Up is redirected to Dashboard | Sign Up form is not shown to authenticated users | GREEN |
| TC-4-07 | Integration | Expired or invalid session redirects to Sign In | Protected route access with bad session redirects; displays "Your session has expired. Please sign in again." | GREEN |
| TC-4-08 | Component | Dashboard shows authenticated placeholder content | Welcome indication and Logout control are visible to authenticated users | GREEN |

**Phase 4 exit (tests):** TC-4-01 through TC-4-08 all GREEN.

---

### Phase 5: Logout and Session Termination

| ID | Type | Test case | Expected result | TDD status |
|----|------|-----------|-----------------|------------|
| TC-5-01 | Integration | Logout invalidates the active session | Session validation returns unauthenticated after logout | GREEN |
| TC-5-02 | Flow | Logout redirects user to Sign In | User lands on Sign In page after logout | GREEN |
| TC-5-03 | Component | Logout success message appears on Sign In | "You have been signed out successfully." is displayed | GREEN |
| TC-5-04 | Flow | Dashboard is inaccessible immediately after logout | Access attempt redirects to Sign In | GREEN |
| TC-5-05 | Integration | Browser refresh after logout does not restore session | User remains unauthenticated after reload | GREEN |

**Phase 5 exit (tests):** TC-5-01 through TC-5-05 all GREEN.

---

### Phase 6: Quality Assurance and Cross-Cutting Tests

| ID | Type | Test case | Expected result | TDD status |
|----|------|-----------|-----------------|------------|
| TC-6-01 | Flow | Full authentication journey succeeds | Register → Sign In → Dashboard → Logout → blocked re-access completes without error | GREEN |
| TC-6-02 | Unit | All validation error messages match PRD definitions | Each error condition produces the exact message specified in Error Messages section | GREEN |
| TC-6-03 | Component | All form fields have associated labels | Every input has a readable label for assistive technologies | GREEN |
| TC-6-04 | Component | Forms are operable via keyboard | Tab order reaches all fields and submit; Enter submits form | GREEN |
| TC-6-05 | Component | Error messages are associated with fields | Invalid fields expose errors in a way assistive technologies can read | GREEN |
| TC-6-06 | Component | Sign Up and Sign In layouts are usable at 320px width | Fields and buttons remain visible and submittable at minimum mobile width | GREEN |
| TC-6-07 | Integration | System errors show generic user-friendly message | Unexpected failure displays "Something went wrong. Please try again later." | GREEN |
| TC-6-08 | Integration | Authentication errors do not expose internal details | No stack traces, database errors, or system messages in user-facing output | GREEN |

**Phase 6 exit (tests):** TC-6-01 through TC-6-08 all GREEN; full suite (`npm test`) passes.

---

### Phase 7: Cloudflare Deployment Verification

These cases verify the authentication module on the **deployed** Cloudflare Workers environment. They are validated manually (or with wrangler CLI) after `npm run deploy`; they are not part of the Vitest suite.

| ID | Type | Test case | Expected result | TDD status |
|----|------|-----------|-----------------|------------|
| TC-7-01 | Deployment | Remote D1 schema is applied | `npx wrangler d1 migrations list quizemaker-db --remote` reports no pending migrations; `users` and `sessions` tables exist in D1 Studio | GREEN |
| TC-7-02 | Deployment | Worker deploys successfully | `npm run deploy` completes without error; Worker URL is reachable over HTTPS | GREEN |
| TC-7-03 | Flow | Production Sign Up persists user to remote D1 | Register on deployed URL; new row appears in remote `users` table | GREEN |
| TC-7-04 | Flow | Production Sign In establishes session | Valid credentials redirect to Dashboard; session cookie is set | GREEN |
| TC-7-05 | Flow | Production protected routes enforce auth | Unauthenticated `/dashboard` redirects to Sign In | GREEN |
| TC-7-06 | Flow | Production Logout terminates session | Logout redirects to Sign In with success message; Dashboard is inaccessible afterward | GREEN |

**Phase 7 exit (tests):** TC-7-01 through TC-7-06 all GREEN; live auth flows verified on deployed Worker.

---

### TDD Test Case Summary

| Phase | Test IDs | Count | Required status at phase completion |
|-------|----------|-------|-------------------------------------|
| 1 | TC-1-01 – TC-1-18 | 18 | All GREEN |
| 2 | TC-2-01 – TC-2-11 | 11 | All GREEN |
| 3 | TC-3-01 – TC-3-09 | 9 | All GREEN |
| 4 | TC-4-01 – TC-4-08 | 8 | All GREEN |
| 5 | TC-5-01 – TC-5-05 | 5 | All GREEN |
| 6 | TC-6-01 – TC-6-08 | 8 | All GREEN |
| 7 | TC-7-01 – TC-7-06 | 6 | All GREEN (manual / live verification) |
| **Total** | **65 test cases** | **65** | **Vitest suite (59) GREEN + deployment checklist (6) GREEN before release** |

### Mapping: Test Cases to Acceptance Criteria

Each TDD test case verifies one or more Acceptance Criteria checkboxes. Developers and AI agents should mark the corresponding Acceptance Criteria item complete only when its related test case(s) are GREEN.

| Acceptance area | Related test IDs |
|-----------------|------------------|
| Sign Up | TC-1-01 – TC-1-11, TC-1-14, TC-2-01 – TC-2-11 |
| Sign In | TC-3-01 – TC-3-09 |
| Logout | TC-5-01 – TC-5-05 |
| Session Management | TC-1-15 – TC-1-18, TC-4-04 – TC-4-05, TC-4-07, TC-5-05 |
| Protected Routes | TC-4-01 – TC-4-03, TC-4-06 |
| Validation and Error Handling | TC-1-01 – TC-1-11, TC-6-02, TC-6-07 – TC-6-08 |
| Success Handling | TC-2-09, TC-3-08, TC-5-03 |
| Accessibility | TC-6-03 – TC-6-05 |
| Responsive Behavior | TC-6-06 |
| Cloudflare Deployment | TC-7-01 – TC-7-06 |

---

## Assumptions

| ID | Assumption | Confirmation needed? |
|----|------------|----------------------|
| A-1 | Users self-register; there is no admin-created account flow in Sprint 0. | No |
| A-2 | Email address is the unique username for authentication. | No |
| A-3 | One account per email address. | No |
| A-4 | Dashboard is a minimal protected placeholder with no quiz features. | No |
| A-5 | Session duration is a 7-day absolute timeout from creation; no idle timeout in Phase 1 (see Q-1). | No |
| A-6 | Production deployment will use HTTPS; local development may use HTTP. | No |
| A-7 | English-only UI for Sprint 0; internationalization deferred. | No |
| A-8 | No "remember me" extended session; standard session behavior only. | No |
| A-9 | Full Name is collected at registration for display purposes only; it is not used as a login identifier. | No |
| A-10 | Users who register but never verify email (no verification in Sprint 0) may sign in immediately after registration. | No |

---

## Future Enhancements

The following authentication-related capabilities may be considered in later sprints. They are **not** Sprint 0 requirements.

- Password reset / forgot password flow
- Email verification at registration
- Remember-me / extended session duration
- Multi-factor authentication (MFA)
- Social login (OAuth providers)
- Account management (edit profile, change password, delete account)
- Session and device management (view and revoke active sessions)
- Role-based access control (admin, teacher, student)
- Account lockout after repeated failed sign-in attempts
- CAPTCHA or bot protection on registration and sign-in

---

## Risks and Open Questions

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Session handling differs between Node dev server and Cloudflare Workers runtime | Auth works locally but fails in preview/production | Validate auth flows with `npm run preview` before considering auth complete |
| Inconsistent validation between client and server | Users see confusing or bypassable validation | Define all rules in this PRD; enforce on both client and server during implementation |
| Session storage choice affects scalability | Sessions break or don't sync across instances | Choose session storage compatible with Cloudflare Workers hosting model during implementation planning |

### Security Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Weak password storage | Credential breach | Require strong hashing; follow security requirements in this PRD |
| Session fixation or hijacking | Unauthorized account access | Use secure session identifiers and cookie attributes; invalidate on logout |
| Account enumeration via timing or error differences | Privacy and targeted attacks | Use generic sign-in error messages; consistent response timing where feasible |

### UX Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Requiring sign-in after sign-up adds friction | User confusion or abandonment | Clear success message on Sign In explaining next step |
| Password complexity rules frustrate users | Registration drop-off | Show password requirements before or during entry; specific error messages |
| Redirect loops between auth and protected pages | Broken navigation | Define redirect rules clearly (documented in Navigation Flow) |

### Product and Implementation Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep into quiz features | Sprint 0 delays | Strict adherence to Out of Scope section |
| Undefined session TTL | Inconsistent session behavior | Resolved in Phase 1 (Q-1: 7-day absolute timeout) |

### Open Questions (Resolved in Phase 1)

All open questions were resolved during Phase 1 (Foundation and Infrastructure).

| ID | Question | Decision |
|----|----------|----------|
| Q-1 | Session expiration duration (idle timeout, absolute timeout, or both)? | **7-day absolute timeout** from session creation. No separate idle timeout in Phase 1. Expired sessions are deleted on validation. |
| Q-2 | Redirect message for unauthenticated protected routes? | **Yes** — display "Please sign in to continue." when redirecting (implemented in Phase 4 UI). |
| Q-3 | Password show/hide toggle? | **Yes** — include on Sign Up and Sign In forms (implemented in Phases 2–3 UI). |
| Q-4 | Full Name maximum length? | **100 characters** — enforced in validation (`FULL_NAME_MAX_LENGTH`). |
| Q-5 | Logout control placement? | **Global header** on all authenticated pages (implemented in Phase 4–5 UI). |

### Phase 1 Infrastructure Choices

| Area | Choice |
|------|--------|
| User persistence | Cloudflare D1 (`users` table) |
| Session persistence | Cloudflare D1 (`sessions` table) |
| Password hashing | Web Crypto PBKDF2-SHA256 (100,000 iterations) |
| Email normalization | Trim and lowercase before storage and lookup |
| Session identifier | `crypto.randomUUID()` stored server-side; HttpOnly cookie binding on the client |

---

## Implementation Phases

Sprint 0 is documentation only. Phases 1–7 below guide the subsequent development sprint(s). Each phase builds on the previous one; do not skip ahead without completing prerequisites.

**Status markers:** COMPLETED · IN PROGRESS · PLANNED

### Implementation Conventions (Server Actions)

Next.js `"use server"` modules may export **async functions only**. Co-locate action state with types in separate files; keep the action module limited to the server function:

| Module | Exports |
|---|---|
| `src/lib/auth/actions/sign-up-state.ts` | `SignUpActionState`, `initialSignUpActionState` |
| `src/lib/auth/actions/sign-in-state.ts` | `SignInActionState`, `initialSignInActionState` |
| `src/lib/auth/actions/sign-up.ts` | `signUpAction` |
| `src/lib/auth/actions/sign-in.ts` | `signInAction` |
| `src/lib/auth/actions/logout.ts` | `logoutAction` |

Client forms import initial state from `*-state.ts` and the action from the `"use server"` file. Exporting objects (e.g. `initialSignUpActionState`) from a `"use server"` file causes a runtime error: *A "use server" file can only export async functions*.

### D1 Database (Local Development vs Cloudflare Dashboard)

User accounts and sessions are stored in the Cloudflare D1 database `quizemaker-db` (binding `DB`), accessed via `getDb()` in `src/lib/db.ts`.

| Environment | Where data is written | How to inspect |
|---|---|---|
| `npm run dev` (localhost) | **Remote** D1 on your Cloudflare account (`remote: true` in `wrangler.jsonc`) | Cloudflare dashboard → D1 → `quizemaker-db` → Studio |
| `npm run preview` / deployed Worker | Remote D1 on your Cloudflare account | Same Cloudflare dashboard |
| Local-only D1 (optional) | `.wrangler/state/` on your machine | `npx wrangler d1 execute quizemaker-db --local --command "SELECT * FROM users"` |

**Why this matters:** Without `remote: true`, `npm run dev` writes to a *local* D1 simulation. Sign-up can succeed in the browser while the Cloudflare dashboard `users` table stays empty — because the dashboard shows the remote database, not the local copy.

**Setup requirements:**
1. Apply migrations to remote D1 before first sign-up: `npx wrangler d1 migrations apply quizemaker-db --remote`
2. For local-only testing without touching remote data: remove `remote: true`, run `npm run db:migrate:local`, and inspect with `--local` wrangler commands
3. Restart `npm run dev` after changing D1 binding configuration

---

### Phase 0: Requirements — COMPLETED

**Objective:** Define complete authentication requirements for Quiz Maker.

**Tasks:**
1. Document authentication flows, validation, messages, and acceptance criteria
2. Review and approve this Technical PRD

**Deliverables:**
- Quiz Maker Technical PRD (this document)

**Exit criteria:**
- PRD reviewed and approved by stakeholders
- Open questions acknowledged with owners assigned

---

### Phase 1: Foundation and Infrastructure — COMPLETED

**Objective:** Resolve implementation decisions and establish the persistence and session layer that all authentication features depend on.

**Prerequisites:** Phase 0 complete

**Tasks:**
1. Resolve open questions Q-1 through Q-5 (session expiration, redirect messages, password toggle, Full Name max length, Logout placement)
2. Set up the automated test harness (see project testing skill)
3. **Write failing tests (RED)** for TC-1-01 through TC-1-18; confirm they fail before any implementation
4. Select and configure persistent storage for user accounts
5. Select and configure session storage compatible with Cloudflare Workers
6. Configure authentication secrets for local (`.dev.vars`) and production environments
7. Define shared validation rules and error/success message constants aligned with this PRD
8. Implement foundation code until TC-1-01 through TC-1-18 are **GREEN**
9. Establish project conventions for separating authentication logic from UI and future quiz domain logic

**Deliverables:**
- Documented decisions for all open questions (see **Open Questions** and **Phase 1 Infrastructure Choices**)
- Test harness configured with Phase 1 tests written
- Working user account persistence layer (D1 `quizemaker-db`, `users` table, remote binding for local dev)
- Working session creation and validation layer (D1 `sessions` table, 7-day absolute timeout, `crypto.randomUUID()` identifiers)
- Password hashing via Web Crypto PBKDF2-SHA256 (100,000 iterations)
- Email normalization (trim + lowercase) before storage and lookup
- Centralized validation rules and message constants (including `FULL_NAME_MAX_LENGTH = 100`)

**Exit criteria:**
- TC-1-01 through TC-1-18 all GREEN
- A test user record can be created and retrieved securely
- A session can be created, read, and invalidated programmatically
- Secrets are configured without committing values to the repository

---

### Phase 2: User Sign Up — COMPLETED

**Objective:** Allow new users to register with validated credentials and redirect them to Sign In with a success message.

**Prerequisites:** Phase 1 complete

**Tasks:**
1. **Write failing tests (RED)** for TC-2-01 through TC-2-11; confirm they fail before Sign Up implementation
2. Build the Sign Up page per UI Requirements (Full Name, Email, Password, Confirm Password)
3. Implement client-side validation for all Sign Up fields
4. Implement server-side validation mirroring Field Validation Rules
5. Enforce email uniqueness on registration
6. Securely store new user credentials (hashed password, never plain text)
7. Handle all Sign Up error messages defined in this PRD
8. Redirect to Sign In with registration success message on successful account creation
9. Ensure successfully registered users are not automatically signed in
10. Implement until TC-2-01 through TC-2-11 are **GREEN**

**Deliverables:**
- Phase 2 TDD tests written and passing
- Functional Sign Up page
- End-to-end registration flow

**Exit criteria:**
- TC-2-01 through TC-2-11 all GREEN
- All Sign Up acceptance criteria pass
- Invalid submissions show correct field-level and form-level errors
- Duplicate email registration is rejected with the defined error message
- Successful registration redirects to Sign In with the defined success message

---

### Phase 3: User Sign In and Session Establishment — COMPLETED

**Objective:** Allow registered users to authenticate and establish a persistent authenticated session.

**Prerequisites:** Phase 2 complete (at least one registered user available for testing)

**Tasks:**
1. **Write failing tests (RED)** for TC-3-01 through TC-3-09; confirm they fail before Sign In implementation
2. Build the Sign In page per UI Requirements (Email, Password)
3. Implement client-side validation for Sign In fields
4. Implement credential verification against stored user records
5. Create an authenticated session upon successful sign-in
6. Handle all Sign In error messages defined in this PRD (including generic invalid-credentials message)
7. Redirect authenticated users to the Dashboard on successful sign-in
8. Display registration and logout success messages on Sign In when redirected from those flows
9. Redirect already-authenticated users away from Sign In to the Dashboard
10. Implement until TC-3-01 through TC-3-09 are **GREEN**

**Deliverables:**
- Phase 3 TDD tests written and passing
- Functional Sign In page
- Working session establishment on successful authentication

**Exit criteria:**
- TC-3-01 through TC-3-09 all GREEN
- All Sign In acceptance criteria pass
- Valid credentials establish a session and redirect to Dashboard
- Invalid credentials show the defined error without revealing which field failed
- Sign In page displays success messages when arriving from Sign Up or Logout

---

### Phase 4: Session Management and Protected Routes — COMPLETED

**Objective:** Maintain authentication state across navigation and refresh, and restrict protected content to authenticated users only.

**Prerequisites:** Phase 3 complete

**Tasks:**
1. **Write failing tests (RED)** for TC-4-01 through TC-4-08; confirm they fail before protected-route implementation
2. Persist session across in-application page navigation
3. Persist session across browser refresh while the session remains valid
4. Detect invalid, expired, or missing sessions and treat as unauthenticated
5. Implement server-side protected route enforcement for the Dashboard and any authenticated-only routes
6. Redirect unauthenticated users to Sign In when accessing protected routes (direct URL, bookmark, or navigation)
7. Redirect authenticated users away from Sign Up and Sign In to the Dashboard
8. Build the Dashboard placeholder per UI Requirements (welcome message, Logout control, future-features placeholder)
9. Display "Please sign in to continue." on unauthenticated redirect and session-expired message on expired-session redirect (Q-2)
10. Implement until TC-4-01 through TC-4-08 are **GREEN**

**Deliverables:**
- Phase 4 TDD tests written and passing
- Session persistence across navigation and refresh
- Protected route access control
- Dashboard placeholder page

**Exit criteria:**
- TC-4-01 through TC-4-08 all GREEN
- All Session Management and Protected Routes acceptance criteria pass
- Unauthenticated direct URL access to Dashboard never renders protected content
- Authenticated users can navigate and refresh without re-authentication while session is valid
- Expired or invalid sessions redirect to Sign In

---

### Phase 5: Logout and Session Termination — COMPLETED

**Objective:** Allow authenticated users to end their session and confirm logout with appropriate feedback.

**Prerequisites:** Phase 4 complete

**Tasks:**
1. **Write failing tests (RED)** for TC-5-01 through TC-5-05; confirm they fail before Logout implementation
2. Add Logout control in global authenticated header (Q-5: all protected pages, not Dashboard-only)
3. Invalidate or clear the server-side session on logout
4. Clear client-side session artifacts on logout
5. Redirect to Sign In after logout
6. Display logout success message on Sign In page
7. Verify protected routes are inaccessible immediately after logout (including on refresh)
8. Implement until TC-5-01 through TC-5-05 are **GREEN**

**Deliverables:**
- Phase 5 TDD tests written and passing
- Functional Logout flow
- Session fully terminated on logout

**Exit criteria:**
- TC-5-01 through TC-5-05 all GREEN
- All Logout acceptance criteria pass
- After logout, Dashboard and other protected routes redirect to Sign In
- Logout success message appears on Sign In page

---

### Phase 6: Quality Assurance and Release Readiness — COMPLETED

**Objective:** Verify the complete authentication module against all acceptance criteria, non-functional requirements, and runtime environments before marking the feature complete.

**Prerequisites:** Phases 1–5 complete

**Tasks:**
1. **Write failing tests (RED)** for TC-6-01 through TC-6-08; confirm they fail where cross-cutting behavior is not yet complete
2. Run the full test suite; resolve any remaining RED tests
3. Run through the full Authentication Flow end-to-end (registration → sign-in → protected access → logout → re-access blocked)
4. Verify all error and success messages match the Error Messages and Success Messages sections
5. Verify accessibility and responsive test cases (TC-6-03 through TC-6-06) are GREEN
6. Verify authentication flows under the Cloudflare Workers runtime using `npm run preview` (not Node dev server alone)
7. Run `npm run lint`, `npm run build`, and `npm test`; resolve any failures
8. Mark all Acceptance Criteria checkboxes as complete only when related TDD tests are GREEN
9. Update AGENTS.md Project section to reflect implemented authentication
10. Update TDD status columns and Current Status in this PRD

**Deliverables:**
- All 59 TDD test cases GREEN
- Fully verified authentication module
- Completed acceptance criteria checklist
- Updated project documentation

**Exit criteria:**
- TC-6-01 through TC-6-08 all GREEN
- Full test suite (`npm test`) passes with zero failures
- 100% of Acceptance Criteria pass
- Lint and build succeed
- Preview runtime authentication verified
- No critical or high-severity authentication bugs open

---

### Phase 7: Cloudflare Deployment — COMPLETED

**Objective:** Deploy the authentication module to Cloudflare Workers with remote D1 persistence and verify all auth flows on the live environment.

**Prerequisites:** Phase 6 complete (59/59 Vitest tests GREEN, lint and build pass)

**Tasks:**
1. Authenticate Wrangler with the target Cloudflare account (`npx wrangler login`; verify with `npx wrangler whoami`)
2. Confirm D1 database `quizemaker-db` is bound as `DB` in `wrangler.jsonc` with `migrations_dir` pointing to `migrations/`
3. Register a `workers.dev` subdomain for the account if none exists (required for first deploy; via Cloudflare dashboard **Workers & Pages → Your subdomain** or Wrangler/API)
4. Apply auth migrations to **remote** D1: `npx wrangler d1 migrations apply quizemaker-db --remote`
5. Configure local development to use remote D1 when inspecting data in the Cloudflare dashboard: set `"remote": true` on the D1 binding in `wrangler.jsonc` (see **D1 Database** conventions above)
6. Run pre-deploy checks: `npm test`, `npm run lint`, `npm run build`
7. Deploy: `npm run deploy` (OpenNext build + Wrangler upload)
8. Verify deployment checklist TC-7-01 through TC-7-06 on the live Worker URL
9. Mark Phase 7 test cases GREEN in this PRD after live verification

**Deliverables:**
- Worker deployed to Cloudflare (`ai-sprints-quizemaker`)
- Remote D1 `quizemaker-db` with `users` and `sessions` tables
- Live URL: `https://ai-sprints-quizemaker.<workers-dev-subdomain>.workers.dev`
- Deployment verification checklist (TC-7-01 – TC-7-06) complete

**Exit criteria:**
- TC-7-01 through TC-7-06 all GREEN
- Remote migrations applied; no pending migrations
- Production Sign Up writes to remote `users` table (visible in D1 Studio)
- Production Sign In, Dashboard access, and Logout behave identically to local preview
- HTTPS enforced on deployed URL

**Deployment notes (recorded from Sprint 0):**

| Item | Value / command |
|------|-----------------|
| Deploy command | `npm run deploy` |
| D1 database | `quizemaker-db` (binding `DB`) |
| Remote migrations | `npx wrangler d1 migrations apply quizemaker-db --remote` |
| Pre-deploy verification | `npm test`, `npm run lint`, `npm run build` |
| Workers runtime preview (pre-deploy) | `npm run preview` |
| Local dev D1 | `"remote": true` in `wrangler.jsonc` so dashboard Studio matches dev writes |
| First-deploy blocker | Account must have a registered `workers.dev` subdomain |
| Windows caveat | OpenNext warns Windows may be less reliable than WSL for build/deploy |

**Do not deploy** unless explicitly requested (per `AGENTS.md`). Remote migration and deploy steps are user-initiated operations.

---

### Phase Summary

| Phase | Name | Focus |
|-------|------|-------|
| 0 | Requirements | PRD and specification |
| 1 | Foundation and Infrastructure | Storage, sessions, secrets, shared validation |
| 2 | User Sign Up | Registration form, validation, account creation |
| 3 | User Sign In and Session Establishment | Authentication, session creation, redirects |
| 4 | Session Management and Protected Routes | Persistence, access control, Dashboard |
| 5 | Logout and Session Termination | End session, redirect, success message |
| 6 | Quality Assurance and Release Readiness | Cross-cutting TDD tests, full suite verification, preview runtime |
| 7 | Cloudflare Deployment | Remote D1 migrations, Worker deploy, live auth verification |

---

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| TDD test pass rate | 100% (59/59 Vitest GREEN) before deploy | `npm test` full suite result |
| Deployment verification | 100% (6/6 TC-7 GREEN) before release | Live Worker + D1 Studio checklist |
| Registration completion rate | Baseline established post-launch | Successful registrations / Sign Up page visits |
| Sign-in success rate | > 95% for valid credentials | Successful sign-ins / sign-in attempts with valid accounts |
| Authentication-related support issues | Zero critical auth bugs in first release | Bug tracker / QA sign-off |
| Protected route enforcement | 100% of unauthorized access attempts redirected | QA test cases for direct URL access |
| Acceptance criteria pass rate | 100% before sprint close | Acceptance criteria checklist |

---

## Dependencies

### External Dependencies

- Hosting environment capable of secure HTTPS in production (Cloudflare Workers per project stack)
- No third-party authentication provider required for Sprint 0

### Internal Dependencies

- Persistent storage for user accounts: **Cloudflare D1** (`quizemaker-db`, binding `DB`, `users` table)
- Session storage: **Cloudflare D1** (`sessions` table) + HttpOnly session cookie bound to `crypto.randomUUID()` server-side identifier
- Password hashing: **Web Crypto PBKDF2-SHA256** (100,000 iterations)
- Email normalization: trim and lowercase before storage and lookup

### Environment Considerations

- Secure secret configuration for session signing or encryption (production secrets via hosting platform; local via `.dev.vars`)
- No AI or external API dependencies for authentication in Sprint 0

---

## Notes for AI Agents

When working with this PRD:

1. **Start with Project Overview, Business Goal, and Sprint Goal** to understand that Sprint 0 is authentication design only; quiz features are out of scope.
2. **Use Scope (In Scope / Out of Scope / Cut)** as hard boundaries. Do not implement quiz creation, management, attempts, scoring, or related features.
3. **Do not invent API endpoints, database schemas, or folder structures** from this document unless a later sprint explicitly authorizes implementation design.
4. **Follow Field Validation Rules and Error Messages** exactly; centralized message constants are recommended during implementation.
5. **Use TDD for every phase:** write tests from the TDD Test Cases section first (RED), implement until GREEN, then refactor. See `.cursor/skills/testing/SKILL.md` for Vitest setup and conventions.
6. **Enforce authentication on protected routes server-side**, not only via client navigation guards.
7. **Verify with `npm run preview`** for Workers-runtime behavior; `npm run dev` alone is insufficient for session-related features.
8. **Mark Acceptance Criteria complete only when related TDD tests are GREEN** — do not check boxes based on manual inspection alone.
9. **Open Questions Q-1 through Q-5 are resolved** — see **Open Questions (Resolved in Phase 1)** and **Phase 1 Infrastructure Choices**.
10. **Follow Implementation Phases in order** (1 → 7); each phase requires its test cases GREEN before proceeding.
11. **Update TDD status (RED → GREEN) and phase status markers** in this PRD as work progresses.
12. **Ask before adding dependencies** per project working agreements in `AGENTS.md`.
13. **Keep AGENTS.md Project section updated** when authentication or deployment status changes.
14. **Do not run `npm run deploy` or remote D1 migrations** unless the user explicitly requests deployment (per `AGENTS.md`).
15. **After deployment**, verify TC-7-01 through TC-7-06 manually on the live Worker URL and confirm remote D1 rows in Cloudflare D1 Studio.

---

## Current Status

**Last Updated:** August 31, 2026
**Current Phase:** Phase 7 — Cloudflare Deployment
**Status:** COMPLETED
**Live URL:** `https://ai-sprints-quizemaker.arunkumar-hg.workers.dev`
**Next Steps:** Authentication module deployed and verified. Begin quiz features in a future sprint per product roadmap.
