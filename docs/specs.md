Software Requirements Specification for LaneFly.

---

# Software Requirements Specification (SRS): LaneFly

## 1. Executive Summary

**LaneFly** is a modern, high-performance web application designed as a fully-featured Kanban board and task management tool (a Trello clone). The primary design philosophy centers around a **"Thick Client, Fortified Server"** architecture. While maximum computational and state-management workloads (like UI rendering and drag-and-drop physics) are offloaded to the client side to ensure a highly responsive experience, the backend acts as an absolute fortress of validation, security, and real-time state broadcasting.

Key differentiators include highly fluid Drag-and-Drop (DnD) animations that work seamlessly with virtualized lists, an elegant and mobile-responsive user interface, robust offline-capable data synchronization utilizing dedicated mutation queues and CRDTs, real-time multi-user collaboration, and strict adherence to enterprise-grade security and concurrency standards. LaneFly guarantees users never lose data, face uncertainty regarding their save state, or fall victim to storage exhaustion or stateful authorization leaks.

## 2. Technology Stack & Architecture

### 2.1 Core Technologies

- **Build Tool:** Vite
- **Framework:** React (Functional Components, Hooks)
- **Language:** TypeScript (Strict mode)
- **Real-Time Engine:** WebSockets (e.g., Socket.io) or Server-Sent Events (SSE) / Supabase Realtime to push live mutations to all connected clients.
- **The TanStack Suite:**
- **TanStack Query (React Query):** For managing asynchronous state, caching, background synchronization, and optimistic UI updates. It will implement **Cursor-Based Pagination** or Infinite Scrolling to fetch data in chunks rather than overwhelming the server's memory and network bandwidth.
- **TanStack Router:** For modern, type-safe routing.
- **TanStack Virtual:** _Mandatory for MVP._ Used for virtualizing large lists to prevent browser lag when columns contain hundreds of DOM nodes.

- **Drag and Drop:** `dnd-kit` or `@hello-pangea/dnd` for smooth, customizable physics.
- **Text Sanitization:** `DOMPurify` (Client-side) and robust server-side sanitization libraries to treat all incoming text as fundamentally untrusted.

### 2.2 Architectural Paradigm & State Strategy

- **Local-First / Optimistic UI:** Every user action instantly updates the local client state. Background sync requests push changes to the server asynchronously.
- **Dual Offline Strategy:** We will strictly separate discrete actions from collaborative editing to prevent conflicts:

1. **Offline Mutation Queue:** Used strictly for discrete board actions (e.g., `MOVE_CARD`, `UPDATE_TITLE`, `DELETE_COLUMN`). If a user loses connection, this queue records actions and replays them in exact chronological order upon reconnection.
2. **CRDTs (Conflict-free Replicated Data Types):** Powered by WebRTC/WebSockets (e.g., Yjs), used exclusively for the rich-text editor state. This merges mathematical state vectors for collaborative editing, bypassing the inefficiencies of replaying keystrokes via a standard mutation queue.

- **Fortified Backend:** A server/BaaS (e.g., Supabase or Node.js/Express with PostgreSQL) that does not trust the client. Every API call undergoes strict Role-Based Access Control (RBAC) re-validation.
- **State Indicators:** A global sync state manager provides visual feedback (e.g., "Saving...", "All changes saved") within the card editor to prevent premature navigation before attachments or texts are persisted.

---

## 3. Feature Specifications

### 3.1 Authentication & User Management

- **Registration/Login:** Modern, passwordless "Magic Link" via email.
- **Magic Link Constraints:** Links will be strictly single-use with a short Time-To-Live (TTL) of 15 minutes. To prevent email-scanner bots from consuming tokens, users opening the link on a new device will be prompted to explicitly click a confirmation button.
- **OAuth Fallbacks:** To mitigate email delivery lag (via providers like SendGrid/SES) and prevent users from spamming the endpoint, robust OAuth fallbacks (e.g., "Continue with Google" and "Continue with GitHub") will be integrated.
- **Spam Prevention:** Protected by strict rate-limiting and invisible CAPTCHAs.

- **Usernames & Immutable IDs:** Users define a globally unique `@username`. However, internal logs and mentions will strictly tie to immutable User IDs. If an account is deleted and a username is reclaimed, historical activity logs will correctly point to the original, distinct user profile.
- **Dashboard:** A landing page displaying all accessible boards, categorized by "Own Boards", "Shared Boards", and "Favorited Boards".

### 3.2 Boards & Global Features

- **Properties:** Unique Name, Background Image/Color.
- **Interactions:** Can be favorited (marked with a Star or Heart icon).
- **Search and Filtering:** A global board search bar to find cards by text. Dedicated filters to show cards by "Assigned to Me", "Due Date", or specific "Labels".
- **Notifications System:** A centralized notification center (bell icon) and optional email integration to alert users when they are @mentioned or explicitly assigned to a card.
- **Data Export (GDPR Compliance):** Essential for power users and enterprise adoption. A feature to export the entire board, including card metadata, to JSON or CSV formats.

### 3.3 Columns (Lists)

- **Properties:** Name, optional Background Image.
- **Layout Rules:** Columns take up maximum vertical viewport space. The internal column area utilizes **TanStack Virtual**.
- **Interactions:**
- **Add Card:** A footer at the bottom of the column with a `+ Add a card` button.
- **Delete & Restore:** Requires an explicit confirmation modal. Deleting a column recursively soft-deletes/archives all child cards. If an archived column is restored, **cascading un-delete logic** will automatically restore all the child cards that belonged to it at the time of deletion.
- **Sort:** Context menu to auto-sort cards.
- **Drag & Drop (Virtualization Resolution):** Entire columns can be dragged left/right. For card dragging within virtualized lists, a highly custom DnD implementation will auto-scroll the viewport and pre-render virtual nodes on the fly as the drag cursor approaches the edges, ensuring the drop target is always present in the DOM.

### 3.4 Cards

- **Default View (Board Level):** Highly compact, displaying the title, cover image, applied labels, and the avatar of the explicitly assigned user.
- **Quick Action (To-Do Toggle):** Hovering over a card reveals a fading, dotted circle outline. Clicking it toggles the card's state to "Done" (checkmarked) or "Undone" without opening details.
- **Card Editor (Detail View):** Clicking the card opens a modal/overlay.
- **Description Engine:** A rich-text editor allowing free text structuring, powered by CRDTs (Yjs) for seamless concurrent editing.
- **Checklists:** Addable/removable checklists with progress tracking.
- **Assignments & Mentions:** Users can explicitly assign a user as the card "Owner", and separately type `@` in text fields to mention users.
- **Activity/Audit Log:** A chronological history log tracking actions tied to immutable user IDs.
- **Attachments:** File uploads with strict validation and quota limits.
- **Labels:** Assign existing labels, create new ones, and pick custom colors via a Color Picker.

- **Drag & Drop:** Cards can be dragged within or across columns, utilizing spring physics for physical swapping animations.

### 3.5 Archive System

- **Archive View:** A dedicated view to see all archived (soft-deleted) cards and columns.
- **Retention Policy:** Archived items remain indefinitely or follow an auto-purge timeframe (e.g., 30 days).

---

## 4. UI/UX & Accessibility

- **Viewport Constraints (Desktop):** A Single Page Application (SPA) where the board height is `100vh`. The page body does not scroll vertically.
- **The Mobile Experience (<768px):** The UI will respond to mobile viewports by snapping to a single-column view that occupies the full screen width. Users will utilize horizontal swipe capabilities (like a carousel) to navigate between different columns, ensuring the core Kanban functionality remains highly accessible on touch devices.
- **Keyboard Accessibility:** Critical for power users and WCAG compliance. Full keyboard navigation support (e.g., arrow keys to move focus, pressing 'Space' while hovering to assign to self, pressing 'L' to open the label menu).

---

## 5. Security & Permissions (RBAC)

### 5.1 Roles

An owner can invite users via email and assign one of three strictly server-validated roles:

1. **Admin:** Full destructive rights. Can delete boards/columns, remove users, and change permissions.
2. **Editor:** Can create, edit, move, and archive cards/columns. Cannot perform hard deletes.
3. **Viewer:** Read-only access. Can open descriptions and view attachments, but cannot move, edit, or delete.

### 5.2 Vulnerability & Resource Mitigation

| Threat / Risk                      | Mitigation Strategy                                                                                                                                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **XSS (Cross-Site Scripting)**     | The server will treat _all_ text as untrusted and sanitize it upon receipt. Client-side, `DOMPurify` will also be mandated before rendering any rich text, preventing payloads from executing on current or future client applications.                 |
| **IDOR (Direct Object Reference)** | Attachments for private boards are stored securely and served exclusively via securely signed, time-limited URLs.                                                                                                                                       |
| **Malicious File Uploads**         | Strict server-side validation of MIME types and file extensions.                                                                                                                                                                                        |
| **Storage Exhaustion (Zip Bombs)** | Implementation of strict **Account-Level Storage Quotas**. This prevents malicious actors from bankrupting the infrastructure by uploading thousands of valid, size-compliant files.                                                                    |
| **WebSocket Stale State**          | The server will actively manage sessions. If an Admin demotes a user to "Viewer", the server will immediately force-terminate that user's active WebSocket connection or push a state-patch, forcing a re-authentication of their session capabilities. |

---

## 6. Concurrency & Edge Cases

1. **The "Last Write Wins" Collision:** Handled entirely by separating the architecture into discrete mutation queues for board actions and CRDTs (Yjs) for rich-text descriptions, allowing true collaborative, collision-free editing.
2. **Drag & Drop Race Conditions:** If two users move the same card simultaneously, the server accepts the first timestamp. The WebSocket engine instantly pushes a state correction to the "loser's" client, snapping the card to the server-validated column to maintain strict synchronization.
3. **The "Orphaned Card" Race Condition:** If User A drags Card 1 to Column B, and User B simultaneously deletes Column B, the server will encounter a missing drop target. The fallback behavior will be to return the card to its original position (Column A) and issue a toast notification to User A: "Target column no longer exists."
4. **Unsaved Data on Unmount:** If a user attempts to close a browser window while an attachment is uploading or the offline queue is processing, the system intercepts via `beforeunload` events to warn the user of potential data loss.
5. **Data Fetching vs. DOM Limits:** To support the client-side TanStack Virtual implementation, TanStack Query will utilize Cursor-Based Pagination to fetch data in manageable chunks as the user scrolls, preserving server memory and bandwidth.

---

## 7. Milestones & Implementation Plan

- **Milestone 1: Project Setup, Security & Architecture Foundation**
- Initialize Vite, TypeScript, React, TanStack Query/Router.
- Set up strict linting, DOMPurify, and baseline server-side security configurations.
- Implement Auth with OAuth fallbacks, Magic Link constraints, Rate Limiting, and CAPTCHA.

- **Milestone 2: The Core Board Engine, Virtualization & Mobile**
- Implement static Columns and Cards using TanStack Virtual alongside custom auto-scrolling DnD logic.
- Build the responsive mobile viewport (horizontal swipe).
- Implement Cursor-Based API Pagination.

- **Milestone 3: Real-Time Engine, State Synchronization & CRDTs**
- Integrate WebSockets/Supabase Realtime with active session termination logic.
- Build the offline discrete mutation queue.
- Integrate Yjs/WebRTC for collaborative rich-text editing.
- Implement DnD race condition resolutions (Orphaned Cards, Timestamp conflicts).

- **Milestone 4: Card Details, Collaboration & Features**
- Build the Card Editor Modal.
- Implement explicit assignments, labels, and the Activity Log (tied to immutable IDs).
- Implement the Quick-Action To-Do toggle and Keyboard Accessibility shortcuts.

- **Milestone 5: Advanced Search, Notifications, Storage & Export**
- Implement secure file uploads with Account-Level Storage Quotas and signed URLs.
- Build the global Search and Filtering engine.
- Implement the Notification center.
- Build the Board Data Export (JSON/CSV) tool.
- Finalize cascading un-delete logic for the Archive system.

---

## 8. Initial Coding Approach: Directory Structure

```text
lanefly-client/
├── public/
├── src/
│   ├── app/
│   │   ├── router.tsx
│   │   ├── queryClient.ts
│   │   └── websocket.ts    # Connection manager with stale-state handling
│   ├── components/
│   ├── config/
│   ├── features/
│   │   ├── auth/           # Magic Link, OAuth, Token validation
│   │   ├── boards/         # Search, Filters, Export, Dashboard
│   │   ├── columns/        # Custom Virtualized DnD logic, Cascading logic
│   │   ├── cards/          # Card Editor, CRDT (Yjs) logic, Activity Log
│   │   ├── offline/        # Discrete Mutation Queue manager
│   │   ├── notifications/
│   │   └── permissions/    # Client-side RBAC UI hiding
│   ├── hooks/
│   ├── layouts/
│   ├── lib/
│   ├── routes/
│   ├── types/
│   └── utils/
├── package.json
└── vite.config.ts

```
