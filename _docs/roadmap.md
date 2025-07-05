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

### Phase 0: Development Environment Setup

**Goal:** Establish a complete, professional development environment with all necessary tools, dependencies, and configurations for efficient solo development.

- [x] **Task 0.1: Node.js & Package Manager Setup (`setup-node-env`)**
  - **Action:** Ensure Node.js 18+ is installed and configure package manager.
  - **Implementation:**
    - Verify Node.js version (18+ required for Next.js 15)
    - Install/configure pnpm (already in use based on `pnpm-lock.yaml`)
    - Set up `.nvmrc` for Node.js version consistency
  - **Outcome:** Consistent Node.js environment ready for development.

- [x] **Task 0.2: Install Core Dependencies (`install-dependencies`)**
  - **Action:** Install all foundational packages for the tech stack.
  - **Dependencies to Install:**
    - `dexie` and `dexie-react-hooks` for IndexedDB
    - `zod` for data validation
    - `@upstash/ratelimit` for API rate limiting
    - Development tools: `@types/node`, `eslint`, `prettier`
  - **Outcome:** All necessary packages installed and configured.

- [x] **Task 0.3: Development Tools Configuration (`configure-dev-tools`)**
  - **Action:** Set up code quality and development efficiency tools.
  - **Configuration:**
    - ESLint with Next.js and TypeScript rules
    - Prettier for consistent code formatting
    - VS Code settings and recommended extensions
    - Git hooks for pre-commit linting (optional)
  - **Outcome:** Professional development environment with code quality enforcement.

- [x] **Task 0.4: Environment Variables & Security (`setup-env-vars`)**
  - **Action:** Configure environment variable management for development and production.
  - **Implementation:**
    - Create `.env.local` template with required variables
    - Set up `.env.example` for documentation
    - Configure Vercel environment variables (when ready)
    - Document security best practices
  - **Outcome:** Secure environment variable management system.

- [x] **Task 0.5: Development Scripts & Workflow (`setup-dev-scripts`)**
  - **Action:** Create helpful development scripts and document the development workflow.
  - **Scripts to Add:**
    - `dev:clean` - Clean build artifacts and reinstall dependencies
    - `build:check` - Build and type-check without deployment
    - `db:reset` - Clear IndexedDB for testing (development utility)
    - `test:pwa` - Test PWA functionality locally
  - **Outcome:** Streamlined development workflow with helpful utilities.

- [x] **Task 0.6: Verify Current Implementation (`audit-existing-code`)**
  - **Action:** Review and test existing components to ensure they work with the new environment.
  - **Verification:**
    - Test all existing UI components render correctly
    - Verify camera capture functionality works
    - Check PWA manifest and service worker
    - Ensure TypeScript compilation is clean
  - **Outcome:** Existing codebase is verified and ready for Phase 1 development.

---

### Phase 1: Foundational PWA - The Local-First Core

**Goal:** Create a fully functional, offline-capable PWA with a robust, private, on-device database. This phase delivers the core MVP.

- [ ] **Task 1: Migrate to IndexedDB (`indexeddb-migration`)**
  - **Action:** Replace `localStorage` with `IndexedDB` for data storage.
  - **Technology:** Implement `Dexie.js` with `dexie-react-hooks` for reactive state management.
  - **Dependencies:** Install `dexie`, `dexie-react-hooks`, and `zod` for data validation.
  - **Outcome:** A robust, scalable, and high-performance local database with automatic UI updates.

- [ ] **Task 2: Refactor Data Logic (`refactor-page-tsx`)**
  - **Action:** Create `lib/db.ts` with centralized database operations and refactor `app/page.tsx` to use the new data layer.
  - **Implementation:**
    - Create centralized database functions (`addMeal`, `getSymptoms`, etc.)
    - Implement `useLiveQuery` hooks for reactive data binding
    - Create custom hooks for common operations (`useTodaysMeals`, `useSymptomTrends`)
    - Refactor components to use the data layer instead of direct database calls
  - **Outcome:** Clean separation of concerns with reactive state management and no "God component" anti-pattern.

- [ ] **Task 3: Implement Export/Import (`data-export-import`)**
  - **Action:** Build a feature to allow users to export their data to a JSON file and import it back.
  - **Outcome:** Users can back up, restore, and migrate their data, ensuring data ownership.

- [ ] **Task 4: Wire Up UI Components (`wire-up-ui`)**
  - **Action:** Connect all existing forms, dialogs, and visualizations to the new data layer.
  - **Outcome:** The UI is fully interactive and reflects the state of the local database.

- [ ] **Task 5: Finalize PWA Functionality (`finalize-pwa`)**
  - **Action:** Ensure the service worker (`sw.js`) correctly caches all necessary assets for a seamless offline experience.
  - **Outcome:** The application is installable and works reliably without an internet connection.

- [ ] **Task 6: Build Landing Page & Authentication (`build-landing-auth`)**
  - **Action:** Create the public-facing landing page and authentication system.
  - **Landing Page (`/`):**
    - Desktop: Comprehensive overview with app screenshots, QR code for mobile access
    - Mobile: Streamlined introduction with quick signup/login
    - Clear "better on mobile" messaging for desktop users
    - Feature highlights optimized for each device type
  - **Authentication Pages (`/login`, `/signup`):**
    - Local account creation and management using IndexedDB
    - Secure password hashing and session management
    - Responsive forms optimized for both mobile and desktop
    - Password reset and account recovery options
  - **Outcome:** Complete public-facing experience with device-appropriate authentication.

- [ ] **Task 7: Implement Route Protection (`implement-route-protection`)**
  - **Action:** Set up authentication-based route protection and user session management.
  - **Implementation:**
    - Create authentication context and hooks
    - Implement route guards for protected pages
    - Add session timeout and auto-logout functionality
    - Create user profile and settings management
  - **Outcome:** Secure application structure with proper access control.

- [ ] **Task 8: Optimize Desktop Experience (`optimize-desktop-experience`)**
  - **Action:** Enhance the desktop experience while maintaining mobile-first design.
  - **Desktop Enhancements:**
    - Responsive layout with sidebar navigation
    - Keyboard shortcuts for power users
    - Drag-and-drop file uploads for image capture
    - Enhanced data visualization with hover details
    - Multi-window support for data analysis
  - **Mobile Optimizations:**
    - Touch-friendly interface with appropriate target sizes
    - Swipe gestures for navigation
    - Pull-to-refresh functionality
    - Optimized viewport and PWA behavior
  - **Outcome:** Cohesive cross-device experience that works well on both mobile and desktop.

- [ ] **Task 9: Restructure App Navigation (`restructure-app-navigation`)**
  - **Action:** Refactor the main application structure to work with the new authentication flow.
  - **Implementation:**
    - Move current `app/page.tsx` to `app/app/page.tsx` (protected route)
    - Create new public home page at `app/page.tsx`
    - Implement responsive navigation (bottom tabs on mobile, sidebar on desktop)
    - Add proper page transitions and loading states
  - **Outcome:** Clean separation between public and protected areas with intuitive navigation.

---

### Phase 2: AI Integration & Intelligence

**Goal:** Implement the privacy-preserving AI analysis flow to bring "smart" features online.

- [ ] **Task 10: Setup AI Workflow Infrastructure (`setup-ai-infrastructure`)**
  - **Action:** Implement the hybrid workflow approach using n8n + OpenRouter for maximum iteration speed.
  - **Implementation Steps:**
    - Deploy n8n (start with cloud version for simplicity)
    - Set up OpenRouter account and configure API access
    - Create authentication tokens for webhook security
    - Test basic webhook connectivity
  - **Outcome:** Visual workflow platform ready for AI logic development.

- [ ] **Task 11: Build AI Analysis Workflow (`build-ai-workflow`)**
  - **Action:** Create the visual workflow in n8n that handles image analysis and JSON formatting.
  - **Workflow Components:**
    - Webhook trigger node for receiving image data
    - OpenRouter HTTP request node for AI model calls
    - Data transformation nodes for JSON formatting
    - Error handling and validation nodes
    - Response formatting for client consumption
  - **Outcome:** Complete AI analysis workflow that can be visually modified and tested.

- [ ] **Task 12: Create Simple API Route (`create-api-route`)**
  - **Action:** Build a lightweight Next.js API route that forwards requests to the n8n workflow.
  - **Security Implementation:**
    - Implement rate limiting using `@upstash/ratelimit`
    - Add input validation and sanitization
    - Secure webhook authentication with tokens
    - Implement proper error handling and timeouts
  - **Outcome:** Secure API endpoint that acts as a bridge between client and AI workflow.

- [ ] **Task 13: Integrate Camera with Workflow (`integrate-camera`)**
  - **Action:** Connect the `camera-capture.tsx` component to the new API route, sending image data to the AI workflow.
  - **Implementation:**
    - Update camera component to call `/api/analyze` endpoint
    - Handle workflow response timing (may be slower than direct API calls)
    - Implement proper loading states and error handling
  - **Outcome:** Photos taken in the app are sent through the AI workflow for processing.

- [ ] **Task 14: Handle AI Analysis in UI (`update-ui-for-ai`)**
  - **Action:** Implement UI states to handle "Analyzing..." placeholders and display the structured data returned by the AI workflow.
  - **Implementation:**
    - Add loading states for workflow processing
    - Handle workflow timeouts and errors gracefully
    - Display structured data from workflow responses
    - Implement retry logic for failed analyses
  - **Outcome:** A seamless user experience from capture to categorized data entry with proper error handling.

- [ ] **Task 15: Build Insights Page (`build-insights-page`)**
  - **Action:** Create the "Insights & Analytics" page that performs all calculations and visualizations on the client-side using data from IndexedDB.
  - **Outcome:** Users can see trends and correlations in their health data without it ever leaving their device.

---

### Phase 3: Native Integration with Capacitor

**Goal:** Package the PWA as a native app for iOS and Android to expand its reach and capabilities.

- [ ] **Task 16: Integrate Capacitor (`integrate-capacitor`)**
  - **Action:** Add Capacitor to the Next.js project.
  - **Important Note:** Capacitor packages the PWA as a static web app. The native app will make network requests to the deployed Vercel API endpoints and n8n workflows for AI functionality.
  - **Implementation:**
    - Configure Next.js for static export (`next build && next export`)
    - Install and configure Capacitor
    - Update API calls to use absolute URLs in production
    - Ensure n8n webhook URLs are accessible from native apps
  - **Outcome:** The project is configured to build native app packages with proper client-server separation.

- [ ] **Task 17: Configure Native Projects (`configure-native-projects`)**
  - **Action:** Set up the iOS (Xcode) and Android (Android Studio) projects, including icons, splash screens, and permissions.
  - **Outcome:** Native project shells are ready for compilation.

- [ ] **Task 18: Build and Test on Devices (`test-native`)**
  - **Action:** Compile the app and test it thoroughly on iOS and Android emulators and physical devices.
  - **Outcome:** A stable, distributable native application.

---

### Phase 4: Advanced Features & Ecosystem

**Goal:** Implement "Tier 3" features that require careful privacy considerations, such as optional cloud sync.

- [ ] **Task 19: Implement E2EE Sync (`e2ee-sync`)**
  - **Action:** As an opt-in feature, build an end-to-end encrypted synchronization system.
  - **Technology:** Use a service like Supabase to store encrypted data blobs that the server cannot read.
  - **Outcome:** Users can securely sync their data across multiple devices while maintaining privacy.

- [ ] **Task 20: Implement Secure Sharing (`secure-sharing`)**
  - **Action:** Create a feature allowing users to securely share a snapshot of their data with a healthcare provider.
  - **Outcome:** Users can grant temporary, controlled access to their health information.

---

## AI Architecture Migration Path

As the application matures, there's an optional migration path for the AI architecture:

### **Phase 1: n8n + OpenRouter (Recommended Start)**

- **Benefits:** Maximum iteration speed, model flexibility, visual development
- **Trade-offs:** Additional service dependency, slightly higher latency
- **When to use:** During development and early user testing

### **Phase 2: Direct API Integration (Optional Optimization)**

- **Benefits:** Lower latency, fewer dependencies, potentially lower costs
- **Trade-offs:** Reduced iteration speed, more complex code changes
- **When to migrate:** When AI logic is proven and stable, performance becomes critical

### **Decision Criteria for Migration:**

- **Performance:** If workflow latency becomes unacceptable (>5-10 seconds)
- **Cost:** If n8n + OpenRouter costs exceed direct API costs significantly
- **Complexity:** If visual workflow becomes harder to manage than code
- **Scale:** If request volume requires more optimized architecture

**Important:** Only migrate when you have a clear performance or cost issue. The n8n approach provides significant development velocity advantages for solo developers.
