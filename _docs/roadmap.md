# Project Roadmap: Health Tracker PWA to Native App

This document outlines the development roadmap to build the Health Tracker application, starting from a Progressive Web App (PWA) with a local-first architecture and evolving into a native mobile application using Capacitor.

## Engineering Principles

**Solo Developer Focus:** This roadmap is optimized for a single developer, prioritizing:
- **Simplicity over complexity** - Avoid over-engineering
- **Reactive state management** - Use `useLiveQuery` to eliminate manual state synchronization
- **Clean architecture** - Separate data layer from UI components
- **Security by design** - Implement proper API security from the start
- **Privacy preservation** - Maintain the ephemeral processing model throughout

---

### Phase 1: Foundational PWA - The Local-First Core

**Goal:** Create a fully functional, offline-capable PWA with a robust, private, on-device database. This phase delivers the core MVP.

-   [ ] **Task 1: Migrate to IndexedDB (`indexeddb-migration`)**
    -   **Action:** Replace `localStorage` with `IndexedDB` for data storage.
    -   **Technology:** Implement `Dexie.js` with `dexie-react-hooks` for reactive state management.
    -   **Dependencies:** Install `dexie`, `dexie-react-hooks`, and `zod` for data validation.
    -   **Outcome:** A robust, scalable, and high-performance local database with automatic UI updates.

-   [ ] **Task 2: Refactor Data Logic (`refactor-page-tsx`)**
    -   **Action:** Create `lib/db.ts` with centralized database operations and refactor `app/page.tsx` to use the new data layer.
    -   **Implementation:** 
        - Create centralized database functions (`addMeal`, `getSymptoms`, etc.)
        - Implement `useLiveQuery` hooks for reactive data binding
        - Create custom hooks for common operations (`useTodaysMeals`, `useSymptomTrends`)
        - Refactor components to use the data layer instead of direct database calls
    -   **Outcome:** Clean separation of concerns with reactive state management and no "God component" anti-pattern.

-   [ ] **Task 3: Implement Export/Import (`data-export-import`)**
    -   **Action:** Build a feature to allow users to export their data to a JSON file and import it back.
    -   **Outcome:** Users can back up, restore, and migrate their data, ensuring data ownership.

-   [ ] **Task 4: Wire Up UI Components (`wire-up-ui`)**
    -   **Action:** Connect all existing forms, dialogs, and visualizations to the new data layer.
    -   **Outcome:** The UI is fully interactive and reflects the state of the local database.

-   [ ] **Task 5: Finalize PWA Functionality (`finalize-pwa`)**
    -   **Action:** Ensure the service worker (`sw.js`) correctly caches all necessary assets for a seamless offline experience.
    -   **Outcome:** The application is installable and works reliably without an internet connection.

---

### Phase 2: AI Integration & Intelligence

**Goal:** Implement the privacy-preserving AI analysis flow to bring "smart" features online.

-   [ ] **Task 6: Create AI API Route (`create-api-route`)**
    -   **Action:** Create a Next.js API route (e.g., `/api/analyze`) that acts as a secure, ephemeral processor.
    -   **Security Implementation:**
        - Store AI API keys as server-side environment variables only
        - Implement rate limiting using `@upstash/ratelimit` or similar
        - Add Zod schema validation for AI responses
        - Implement proper error handling for malformed AI responses
    -   **Outcome:** A secure, serverless endpoint ready to receive image data for analysis with proper safeguards.

-   [ ] **Task 7: Integrate Camera with API (`integrate-camera`)**
    -   **Action:** Connect the `camera-capture.tsx` component to the new API route, sending image data on capture.
    -   **Outcome:** Photos taken in the app are sent for AI processing.

-   [ ] **Task 8: Handle AI Analysis in UI (`update-ui-for-ai`)**
    -   **Action:** Implement UI states to handle "Analyzing..." placeholders and display the structured data returned by the AI.
    -   **Outcome:** A seamless user experience from capture to categorized data entry.

-   [ ] **Task 9: Build Insights Page (`build-insights-page`)**
    -   **Action:** Create the "Insights & Analytics" page that performs all calculations and visualizations on the client-side using data from IndexedDB.
    -   **Outcome:** Users can see trends and correlations in their health data without it ever leaving their device.

---

### Phase 3: Native Integration with Capacitor

**Goal:** Package the PWA as a native app for iOS and Android to expand its reach and capabilities.

-   [ ] **Task 10: Integrate Capacitor (`integrate-capacitor`)**
    -   **Action:** Add Capacitor to the Next.js project.
    -   **Important Note:** Capacitor packages the PWA as a static web app. The native app will make network requests to the deployed Vercel API endpoints (e.g., `https://your-app.vercel.app/api/analyze`) for AI functionality.
    -   **Implementation:**
        - Configure Next.js for static export (`next build && next export`)
        - Install and configure Capacitor
        - Update API calls to use absolute URLs in production
    -   **Outcome:** The project is configured to build native app packages with proper client-server separation.

-   [ ] **Task 11: Configure Native Projects (`configure-native-projects`)**
    -   **Action:** Set up the iOS (Xcode) and Android (Android Studio) projects, including icons, splash screens, and permissions.
    -   **Outcome:** Native project shells are ready for compilation.

-   [ ] **Task 12: Build and Test on Devices (`test-native`)**
    -   **Action:** Compile the app and test it thoroughly on iOS and Android emulators and physical devices.
    -   **Outcome:** A stable, distributable native application.

---

### Phase 4: Advanced Features & Ecosystem

**Goal:** Implement "Tier 3" features that require careful privacy considerations, such as optional cloud sync.

-   [ ] **Task 13: Implement E2EE Sync (`e2ee-sync`)**
    -   **Action:** As an opt-in feature, build an end-to-end encrypted synchronization system.
    -   **Technology:** Use a service like Supabase to store encrypted data blobs that the server cannot read.
    -   **Outcome:** Users can securely sync their data across multiple devices while maintaining privacy.

-   [ ] **Task 14: Implement Secure Sharing (`secure-sharing`)**
    -   **Action:** Create a feature allowing users to securely share a snapshot of their data with a healthcare provider.
    -   **Outcome:** Users can grant temporary, controlled access to their health information.
