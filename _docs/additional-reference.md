# Engineering Standards & Guidelines

This document serves as a supplementary reference for our engineering team, providing detailed guidelines on topics not fully elaborated in the main PRD. These standards are critical for maintaining code quality, consistency, and performance.

---

## 1. Error Handling & User Feedback Patterns

A predictable and clear feedback system is essential for a good user experience, especially in an offline-first application.

- **Error Messages:**
  - **Format:** Use concise, human-readable language. Avoid technical jargon.
  - **Display:** Use the `Sonner` (toast) component for non-blocking feedback (e.g., "Liquid entry saved"). Use inline alerts (`Alert` component with `variant="destructive"`) for form-specific errors.
- **Loading States:**
  - **Skeleton Screens:** Use for initial page or large component loads to mimic the final layout.
  - **Spinners/Loaders:** Use `lucide-react`'s `Loader2` icon within buttons or for small, localized actions where a skeleton screen is impractical.
- **Offline Indicators:**
  - Implement a global hook (`useOnlineStatus`) that provides the network state.
  - Display a subtle, non-blocking toast or a small indicator in the header when the application is offline.
  - Disable actions that require a network connection (e.g., AI analysis) and provide a tooltip explaining why.
- **Form Validation:**
  - **Real-time:** Provide instant feedback for simple constraints like character count or required fields as the user types.
  - **On-Submit:** Perform full Zod schema validation when the user submits a form to catch complex errors.

---

## 2. Data Validation & Security Patterns

Ensuring data integrity and security is paramount, even in a local-first architecture.

- **Input Sanitization:** While data is local, assume it could be exported or synced in the future. Sanitize all user-provided text inputs to prevent potential XSS if the data is ever rendered in a different context.
- **Zod Schema Patterns:**
  - All data structures in `lib/types.ts` must have a corresponding Zod schema in `lib/validations/`.
  - Use these schemas to validate data on creation, on import, and when receiving data from the AI analysis API.
- **Security Guidelines:**
  - **Session Management:** The `jose` library is used for creating secure, signed JWTs stored in both an httpOnly cookie (for middleware) and localStorage (for client-side access).
  - **Secret Management:** The `JWT_SECRET` is a static string in `lib/db.ts` which is acceptable _only_ because authentication is purely local and device-bound. If any server-side validation were to occur, this would need to be moved to a secure environment variable.
- **Rate Limiting:** Although the app is local-first, the AI analysis API (`/api/analyze`) must be protected. Implement IP-based rate limiting using `@upstash/ratelimit` on this endpoint to prevent abuse.

---

## 3. Performance & Optimization Guidelines

A fast, responsive application is key to user satisfaction and PWA success.

- **Performance Targets:**
  - **First Contentful Paint (FCP):** < 1.8 seconds.
  - **Largest Contentful Paint (LCP):** < 2.5 seconds.
  - **Interaction to Next Paint (INP):** < 200 milliseconds.
- **Image Optimization:**
  - All user-captured images should be converted to `WebP` format on the client before being stored in IndexedDB to reduce storage footprint.
  - Resize images to a maximum dimension (e.g., 1024x1024) before storage.
- **Bundle Size:**
  - Regularly analyze the bundle with `@next/bundle-analyzer`.
  - Keep the initial client-side bundle under 500KB. Use dynamic imports (`next/dynamic`) for heavy components or libraries not needed on initial load.
- **IndexedDB Queries:**
  - All frequently queried fields (e.g., `timestamp`, `type`) must be indexed in the `Dexie.js` schema in `lib/db.ts`.
  - Avoid fetching entire tables when a more specific query will suffice. Utilize compound indexes where necessary.

---

## 4. State Management Patterns

A clear state management strategy prevents bugs and simplifies development.

- **Data Fetching vs. UI State:**
  - **`useLiveQuery`:** Use for all data that should reactively update from the IndexedDB. This is the "server state" of our local-first app.
  - **`useState` / `useReducer`:** Use for transient UI state that does not need to be persisted (e.g., dialog visibility, form input values, toggles).
- **Form Management:** For complex forms, use `react-hook-form` combined with the `zodResolver` for seamless validation against our Zod schemas. This is not yet implemented but is the standard to follow.
- **Optimistic Updates:**
  - When adding a new entry, first add it to the Dexie database. `useLiveQuery` will automatically and instantly update the UI, providing an "optimistic" feel without manual state manipulation.
  - For updates or deletions, apply the change directly to the database and let `useLiveQuery` handle the UI refresh.

---

## 5. Accessibility (A11y) & Inclusive Design

Building an accessible app is a non-negotiable requirement.

- **Compliance Goal:** Strive for **WCAG 2.1 AA** compliance.
- **Screen Readers:**
  - Use semantic HTML5 elements (`<nav>`, `<main>`, `<button>`) correctly.
  - Provide `aria-label` attributes for all icon-only buttons.
  - Ensure all images have descriptive `alt` tags.
- **Keyboard Navigation:**
  - All interactive elements must be focusable and operable via the keyboard.
  - Logical focus order must be maintained.
  - Visible focus indicators are required (Tailwind's default `ring` utility is sufficient).
- **Color Contrast:** All text must have a contrast ratio of at least 4.5:1 against its background.

---

## 6. Development Workflow & Code Standards

- **Import Order:** Follow this convention to keep files clean:
  1.  React / Next.js imports
  2.  External library imports (e.g., `lucide-react`)
  3.  `@/lib/` imports
  4.  `@/features/` imports
  5.  `@/components/` imports
  6.  Relative imports (`../`)
- **Naming Conventions:**
  - **Components:** `PascalCase` (e.g., `AddFoodDialog.tsx`)
  - **Functions/Variables:** `camelCase` (e.g., `handleSaveEdit`)
  - **Types/Interfaces:** `PascalCase` (e.g., `Ingredient`)
- **File Organization:**
  - Each feature folder should contain its own `components`, `hooks`, `types`, etc.
  - Use `index.ts` barrel files to export the public API of a feature.

---

## 7. API Design Patterns (for AI Integration)

- **Request/Response:** All API endpoints should expect JSON and return JSON.
- **Error Handling:**
  - Return standard HTTP status codes (e.g., `400` for bad request, `429` for rate limit, `500` for server error).
  - The JSON response for an error should have a consistent shape: `{ "error": { "message": "Your error message here." } }`.
- **Client-Side API Logic:** Use a wrapper around `fetch` in `lib/api/client.ts` to handle standardized requests, response parsing, and error handling for all API interactions.
