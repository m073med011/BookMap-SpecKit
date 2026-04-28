# Feature Specification: Authentication, Authorization, Roles, and Profiles

**Feature Branch**: `002-auth-roles-profiles`  
**Created**: 2026-04-23  
**Status**: Draft  
**Input**: User description: "Build the complete identity and access layer for all platform actors — including credentials auth, Google OAuth, email OTP verification, password reset, role-aware route protection, profile management, avatar upload, staff invitation, and superadmin bootstrapping."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New User Registration (Priority: P1)

A visitor arrives at the marketplace and wants to create an account to browse, purchase books, and follow libraries. They choose to register using either their email and password or their Google account. After registration, they verify their email address and are directed to complete their profile.

**Why this priority**: Registration is the gateway to all platform functionality. Without it, no other user-facing feature works.

**Independent Test**: Can be fully tested by registering a new user with email/password, verifying the email, and confirming the user can access their profile. Delivers the ability for new users to join the platform.

**Acceptance Scenarios**:

1. **Given** a visitor on the registration page, **When** they submit a valid email and password, **Then** an account is created and a verification email is sent
2. **Given** a visitor on the registration page, **When** they choose to sign up with Google, **Then** an account is created using their Google identity and email is automatically verified
3. **Given** a user who registered with email/password, **When** they enter the correct OTP or click the verification link, **Then** their email is marked as verified and they can access the platform
4. **Given** a visitor attempting to register with an email already in use, **Then** they are informed the email is taken and offered sign-in options

---

### User Story 2 - User Sign-In and Session Management (Priority: P1)

A registered user returns to the platform and signs in using their chosen method — email/password or Google OAuth. Upon successful authentication, they are redirected to the appropriate area based on their role (regular user to storefront, staff to library dashboard, admin/superadmin to admin dashboard).

**Why this priority**: Sign-in is required for any authenticated interaction and determines the user's navigation path.

**Independent Test**: Can be fully tested by signing in with valid credentials and verifying role-based redirection works correctly for each user type.

**Acceptance Scenarios**:

1. **Given** a registered user with email/password, **When** they enter correct credentials, **Then** they are signed in and redirected based on their role
2. **Given** a registered user with Google, **When** they complete the Google sign-in flow, **Then** they are signed in and redirected based on their role
3. **Given** a user entering incorrect credentials, **When** they submit the sign-in form, **Then** they see a generic error message that does not reveal whether the email exists
4. **Given** a user with an unverified email, **When** they attempt to sign in, **Then** they are prompted to verify their email before proceeding
5. **Given** a suspended user, **When** they attempt to sign in, **Then** they are informed their account is suspended and cannot access the platform

---

### User Story 3 - Password Reset for Credentials Users (Priority: P2)

A user who registered with email/password has forgotten their password and needs to reset it. They request a password reset, receive a reset link via email, and set a new password. Users who signed up exclusively via Google do not see password reset options.

**Why this priority**: Password reset is a critical self-service recovery mechanism that prevents support burden and account lockout.

**Independent Test**: Can be fully tested by requesting a password reset for a credentials account, following the reset link, setting a new password, and signing in with the new credentials.

**Acceptance Scenarios**:

1. **Given** a credentials-based user on the forgot password page, **When** they enter their registered email, **Then** a password reset link is sent to that email
2. **Given** a user with a valid reset link, **When** they submit a new password meeting strength requirements, **Then** their password is updated and they can sign in with it
3. **Given** a user who registered only via Google, **When** they visit the forgot password page, **Then** the password reset option is not available and they are guided to use Google sign-in
4. **Given** an expired or already-used reset link, **When** a user tries to use it, **Then** they are informed the link is no longer valid and prompted to request a new one

---

### User Story 4 - Profile Management and Avatar Upload (Priority: P2)

An authenticated user wants to personalize their profile by updating their display name, bio, preferred language, and uploading a profile picture. The profile information is visible to other users and library staff when relevant (e.g., in chat, reviews).

**Why this priority**: Profiles create user identity within the platform, enabling personalized interactions and building community trust.

**Independent Test**: Can be fully tested by navigating to profile settings, updating fields, uploading an avatar, and verifying the changes persist and display correctly.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the profile settings page, **When** they update their display name and save, **Then** the new name persists and appears wherever their profile is shown
2. **Given** an authenticated user, **When** they upload a valid image file as their avatar, **Then** the image is stored securely and displayed as their profile picture
3. **Given** a user uploading an oversized or invalid file type, **When** they attempt the upload, **Then** they receive a clear error explaining the file requirements
4. **Given** a user updating their preferred language, **When** they save the preference, **Then** the platform interface switches to the selected language

---

### User Story 5 - Role-Based Access Control (Priority: P1)

The platform enforces access boundaries based on user roles. Regular users can only access their own data and public content. Library staff can only manage their assigned library. Admins have platform-wide operational controls. Superadmins have full governance. Unauthorized access attempts are blocked at every level.

**Why this priority**: Access control is a security foundation — every feature in the platform depends on it to prevent data leakage and unauthorized actions.

**Independent Test**: Can be fully tested by attempting to access restricted areas with each role type and verifying appropriate allow/deny behavior.

**Acceptance Scenarios**:

1. **Given** a regular user, **When** they attempt to access a library management area, **Then** they are denied access and redirected
2. **Given** a library staff member, **When** they attempt to manage a library they are not assigned to, **Then** they are denied access
3. **Given** a library staff member, **When** they access their assigned library's management area, **Then** they can view and manage library resources
4. **Given** an admin, **When** they access platform operational controls, **Then** they can perform administrative actions within their scope
5. **Given** a superadmin, **When** they access any area of the platform, **Then** they have full control over all entities and configurations including the ability to suspend and unsuspend user accounts
6. **Given** any unauthenticated visitor, **When** they attempt to access a protected route, **Then** they are redirected to the sign-in page

---

### User Story 6 - Staff Invitation to a Library (Priority: P3)

A library owner or admin invites a person to become staff for a specific library by sending an invitation to their email. If the invitee already has an account, the staff role is assigned upon acceptance. If they do not have an account, they register first and then the staff role is assigned.

**Why this priority**: Staff invitation enables the multi-vendor model by allowing libraries to onboard their team members, but it depends on registration and role systems being in place first.

**Independent Test**: Can be fully tested by sending a staff invitation, accepting it (with and without an existing account), and verifying the staff role is correctly assigned for the specific library.

**Acceptance Scenarios**:

1. **Given** an authorized user (library owner or admin), **When** they send a staff invitation to an email address, **Then** an invitation email is sent with a unique acceptance link
2. **Given** an invitee who already has an account, **When** they click the acceptance link, **Then** they are assigned the staff role for the specified library
3. **Given** an invitee without an account, **When** they click the acceptance link, **Then** they are guided to register first and then the staff role is assigned after registration
4. **Given** an invitation link that has expired, **When** the invitee clicks it, **Then** they are informed the invitation has expired and must request a new one
5. **Given** an invitation to an email already assigned as staff to that library, **When** the invitation is attempted, **Then** the system informs the sender that this person is already staff

---

### User Story 7 - Superadmin Bootstrap (Priority: P3)

When the platform is first deployed, a mechanism exists to designate the initial superadmin account. This bootstrapping process runs only once and cannot be repeated through normal platform usage.

**Why this priority**: Essential for platform setup but only runs once during initial deployment. Depends on the auth and role system being complete.

**Independent Test**: Can be fully tested by running the bootstrap process on a fresh platform, verifying the designated account has superadmin privileges, and confirming the process cannot be repeated.

**Acceptance Scenarios**:

1. **Given** a freshly deployed platform with no superadmin, **When** the bootstrap process is executed, **Then** the designated account is granted superadmin role
2. **Given** a platform where a superadmin already exists, **When** the bootstrap process is attempted again, **Then** it is rejected or has no effect

---

### Edge Cases

- What happens when a user tries to reset a password for a Google-only account? They are informed that password reset is not available and guided to use Google sign-in.
- What happens when someone registers with email/password using an email already linked to a Google account? The system automatically links both authentication methods to the same account. The user can then sign in with either method going forward.
- What happens when an invited staff email does not yet have an account? They are directed to register first, after which the pending invitation is automatically applied.
- What happens when a staff member is assigned to multiple libraries? Each library assignment is independent; they can switch between library contexts in their dashboard.
- What happens when a suspended user tries to access any protected area? They see a suspension notice and are signed out. They cannot perform any actions until the suspension is lifted.
- What happens when a password reset link is used after the user has already reset their password? The link is invalidated after first use and the user is prompted to request a new one if needed.
- What happens when a user's session expires while they are actively using the platform? They are prompted to re-authenticate without losing their current page context where possible.
- What happens when Google OAuth fails mid-flow (network error, Google outage, or user cancels consent)? The user is redirected to a dedicated error page that explains the issue and offers both a retry button and an email/password sign-in alternative.

## Clarifications

### Session 2026-04-23

- Q: When a user who already signed up via Google later tries to register with email/password using the same email (or vice versa), what should happen? → A: Auto-link — automatically merge both auth methods into one account so the user can sign in with either method going forward.
- Q: Which roles should have the authority to suspend and unsuspend user accounts? → A: Only Superadmin can suspend and unsuspend user accounts.
- Q: When Google OAuth fails (network error, Google outage, or user cancels consent screen), what should the user experience? → A: Redirect to a dedicated error page explaining the issue with both a retry button and an email/password sign-in option.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to register with email and password
- **FR-002**: System MUST allow users to register and sign in using Google OAuth
- **FR-003**: System MUST verify user email addresses via OTP or email confirmation link
- **FR-004**: System MUST allow credentials-based users to reset their password via email
- **FR-005**: System MUST NOT show password reset options to users who registered exclusively via Google
- **FR-006**: System MUST assign one of the following roles to each user: Guest, Registered User, Library Staff, Admin, or Superadmin
- **FR-007**: System MUST enforce role-based access restrictions on all protected routes and actions, verified at the server level
- **FR-008**: System MUST redirect authenticated users to the appropriate dashboard or landing page based on their role after sign-in
- **FR-009**: System MUST allow users to view and edit their profile information (display name, bio, preferred language)
- **FR-010**: System MUST allow users to upload, replace, and remove a profile avatar image
- **FR-011**: System MUST restrict avatar uploads to common image formats (JPEG, PNG, WebP) with a maximum file size of 5 MB
- **FR-012**: System MUST support inviting a person to become library staff via email
- **FR-013**: System MUST handle staff invitations for both existing and new users gracefully, assigning the role upon acceptance or after registration
- **FR-014**: System MUST expire staff invitations after 7 days if not accepted
- **FR-015**: System MUST provide a one-time bootstrap mechanism to create the initial superadmin account
- **FR-016**: System MUST prevent suspended users from accessing any protected functionality
- **FR-017**: System MUST display user-friendly, localized error messages for all authentication failures without revealing whether an email exists in the system
- **FR-018**: System MUST enforce password strength requirements: minimum 8 characters, at least one uppercase letter, one lowercase letter, and one number
- **FR-019**: System MUST support both Arabic and English for all authentication and profile user interfaces
- **FR-020**: System MUST log all security-relevant events (sign-in attempts, password resets, role changes, invitation actions)
- **FR-021**: System MUST automatically link authentication methods when the same email is used across multiple providers (e.g., Google OAuth and email/password), maintaining a single account identity per email address
- **FR-022**: System MUST restrict account suspension and unsuspension actions exclusively to the Superadmin role
- **FR-023**: System MUST redirect users to a dedicated error page when Google OAuth fails (network error, provider outage, or user cancellation), offering both a retry option and an alternative email/password sign-in path

### Key Entities

- **Profile**: Represents a user's public and personal information — display name, bio, preferred language, avatar reference, account status (active, suspended)
- **Role**: Defines a user's access level — Guest, Registered User, Library Staff, Admin, Superadmin. A user may hold multiple roles (e.g., Registered User + Library Staff for a specific library)
- **User Role Assignment**: Links a user to one or more roles, optionally scoped to a specific library for staff roles
- **Auth Provider Metadata**: Tracks which authentication methods a user has linked (email/password, Google) to control available features like password reset
- **Staff Invitation**: A time-limited invitation record linking an email address to a library, with status tracking (pending, accepted, expired, revoked)
- **Profile Image**: Metadata for user avatar images including storage reference, upload timestamp, and file attributes

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of new users complete registration (from form submission to email verification) within 3 minutes
- **SC-002**: Users can sign in and reach their role-appropriate dashboard within 5 seconds of submitting credentials
- **SC-003**: 100% of unauthorized access attempts to protected areas are blocked and result in appropriate redirection
- **SC-004**: Password reset flow (from request to successful new password sign-in) completes in under 5 minutes for 90% of users
- **SC-005**: Profile updates (including avatar upload) save and display correctly within 3 seconds
- **SC-006**: Staff invitations are delivered and actionable within 2 minutes of being sent
- **SC-007**: The platform supports at least 500 concurrent authenticated sessions without degradation in authentication response
- **SC-008**: All authentication and profile interfaces are fully usable in both Arabic (RTL) and English (LTR)
- **SC-009**: 90% of first-time users complete onboarding (registration through profile setup) without requiring support assistance

## Assumptions

- Users have access to a valid email address for registration and verification
- Users have stable internet connectivity sufficient for standard web interactions
- Google OAuth is the only third-party provider needed for the initial release; additional providers (Apple, Facebook) may be added later
- Password strength policy (8+ characters, mixed case, at least one number) is sufficient for the platform's security needs
- Staff invitations expire after 7 days as a reasonable balance between security and convenience
- Avatar file size limit of 5 MB accommodates quality profile photos without excessive storage costs
- The superadmin bootstrap mechanism is an operational process run during deployment, not a user-facing feature
- Session duration follows standard web practices (persistent sessions with activity-based refresh)
- Rate limiting on authentication endpoints (sign-in, registration, password reset) follows industry-standard thresholds to prevent brute force attacks
- The existing project foundation (Phase 0) provides the shared UI components, layout system, localization framework, and theme support that this phase builds upon
