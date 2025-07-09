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
    - Implement data structures from PRD (unified `timestamp`).
    - Create centralized database functions (`addFood`, `getSymptoms`, etc.).
    - Implement `useLiveQuery` hooks for reactive data binding.
    - Create custom hooks for common operations (`useTodaysFoods`, `useSymptomTrends`).
    - Refactor components to use the data layer instead of direct database calls.
    - **Structural Alignments:**
      - The `features/foods/` folder is already correctly named. No change needed.
      - Restructure `lib/` folder: create `lib/db/`, `lib/validations/`, `lib/api/` subfolders
      - Move `lib/db.ts` → `lib/db/db.ts` and add `lib/db/migrations.ts`, `lib/db/seed.ts`
      - Create Zod validation schemas in `lib/validations/` for all data types
  - **Outcome:** Clean separation of concerns with reactive state management, proper folder structure, and no "God component" anti-pattern.

- [ ] **Task 3: Implement Export/Import (`data-export-import`)**
  - **Action:** Build the data export/import feature, positioning it as the primary user-managed backup system.
  - **Implementation:**
    - Allow users to export their complete IndexedDB data to a single JSON file.
    - Create a clear UI for importing a previously exported file.
    - Add user education within the UI explaining this is the ONLY way to back up data and migrate between devices.
  - **Outcome:** A robust backup system that empowers users with full data ownership, aligned with the PRD's local-first principles.

- [ ] **Task 4: Wire Up UI Components (`wire-up-ui`)**
  - **Action:** Connect all existing forms, dialogs, and visualizations to the new data layer.
  - **Implementation:**
    - Connect all forms and dialogs to centralized database functions
    - Wire up reactive data binding with useLiveQuery hooks
    - **Structural Alignments - Move Components to Feature Folders:**
      - `add-food-dialog.tsx` → `features/foods/components/`
      - `add-liquid-dialog.tsx` → `features/liquids/components/`
      - `add-stool-dialog.tsx` → `features/stools/components/`
      - `add-symptom-dialog.tsx` → `features/symptoms/components/`
      - `camera-capture.tsx` → `features/camera/components/`
      - `split-circular-progress.tsx` → `features/liquids/components/`
      - `food-category-progress.tsx` → `features/foods/components/`
      - `vertical-progress-bar.tsx` → `features/foods/components/`
      - `food-composition-bar.tsx` → `features/foods/components/`
      - `organic-composition-bar.tsx` → `features/foods/components/`
  - **Outcome:** The UI is fully interactive, reflects the state of the local database, and follows proper feature-based component organization.

- [ ] **Task 4.5: Implement Core Visualizations (`implement-visualizations`)**
  - **Action:** Build the key data visualization components defined in the PRD.
  - **Components to Build:**
    - `split-circular-progress.tsx` for the Liquids view.
    - `food-category-progress.tsx` for the Foods pie chart.
    - `vertical-progress-bar.tsx` for the daily organic "battery".
    - `food-composition-bar.tsx` for visualizing individual food entry health.
  - **Outcome:** The core, high-impact visualizations that form the heart of the user's "Body Compass" dashboard are implemented and ready for data binding.

- [ ] **Task 5: Finalize PWA Functionality (`finalize-pwa`)**
  - **Action:** Ensure the service worker (`sw.js`) correctly caches all necessary assets for a seamless offline experience.
  - **Outcome:** The application is installable and works reliably without an internet connection.

- [ ] **Task 5.5: Verify PWA Compliance (`verify-pwa-compliance`)**
  - **Action:** Perform PWA quality assurance testing before completing Phase 1.
  - **Implementation:**
    - Run Lighthouse audits on the deployed or local application.
    - Verify offline functionality by disabling network access.
    - Test "Add to Home Screen" functionality on both iOS and Android.
  - **Outcome:** Confidence that the PWA meets quality standards for installability, offline access, and performance.

- [ ] **Task 6: Build Landing Page & Authentication (`build-landing-auth`)**
  - **Action:** Create the public-facing landing page and local-first authentication system.
  - **Landing Page (`/`):**
    - Desktop: Comprehensive overview with app screenshots, QR code for mobile access.
    - Mobile: Streamlined introduction with quick signup/login.
    - Clear "better on mobile" messaging for desktop users.
    - Feature highlights optimized for each device type.
  - **Authentication Pages (`/login`, `/signup`):**
    - Local account creation and management using IndexedDB.
    - Secure password hashing (e.g., bcrypt) and local session management.
    - Responsive forms optimized for both mobile and desktop.
    - **Important:** No cloud-based password reset or account recovery. Align with PRD's device-bound account model.
  - **Outcome:** Complete public-facing experience with a secure, privacy-preserving, local-first authentication system.

- [ ] **Task 7: Implement Route Protection (`implement-route-protection`)**
  - **Action:** Set up authentication-based route protection and user session management.
  - **Implementation:**
    - Create authentication context and hooks
    - Implement route guards for protected pages
    - Add session timeout and auto-logout functionality
    - Create user profile and settings management
    - **Structural Alignments:**
      - Create `middleware.ts` for Next.js route protection
      - Enhance `lib/validations/` with authentication schemas (if not done in Task 2)
      - Set up proper TypeScript types for authentication in `lib/types/`
  - **Outcome:** Secure application structure with proper access control and middleware-based route protection.

- [ ] **Task 7.5: Build Settings Page (`build-settings-page`)**
  - **Action:** Create the `/app/settings` page as the central hub for account and data controls.
  - **Implementation:**
    - **Account Management:** Implement a "Logout" button to end the current session.
    - **Data Management:** House the "Export Data", "Import Data", and "Delete All Data" features here.
    - **Appearance:** Add a theme toggle for switching between light and dark modes.
  - **Outcome:** A centralized and user-friendly page for managing account, data, and app preferences as specified in the PRD.

- [ ] **Task 8: Optimize Desktop Experience (`optimize-desktop-experience`)**
  - **Action:** Enhance the desktop experience while maintaining mobile-first design.
  - **Desktop Enhancements:**
    - Responsive layout with sidebar navigation.
    - Keyboard shortcuts for power users.
    - Implement file upload with drag-and-drop as a fallback for camera capture.
    - Enhanced data visualization with hover details.
    - Multi-window support for data analysis.
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
    - **Structural Alignments - Implement Route Groups:**
      - Create `app/(auth)/` route group for authentication pages
        - Move `app/login/` → `app/(auth)/login/`
        - Move `app/signup/` → `app/(auth)/signup/`
      - Create `app/(protected)/` route group for authenticated pages
        - Move `app/app/page.tsx` → `app/(protected)/app/page.tsx`
        - Move `app/settings/` → `app/(protected)/settings/`
        - Create `app/(protected)/app/insights/page.tsx` for analytics (placeholder)
      - Update imports and navigation to reflect new structure
  - **Outcome:** Clean separation between public and protected areas with intuitive navigation and proper route group organization.

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

- [ ] **Task 10.5: Design & Build Curated Ingredient Database (`build-ingredient-db`)**
  - **Action:** Create the backend database (e.g., Supabase table, Vercel KV) to act as the source of truth for ingredient classifications.
  - **Implementation:**
    - Define schema: `ingredientName`, `foodGroup`, `defaultZone`, `zoneModifiers`.
    - Populate with an initial set of common ingredients (e.g., 200+ items).
    - Create an interface or API for the n8n workflow to query this database.
  - **Outcome:** A consistent, curated reference for core ingredient data that underpins the app's intelligence.

- [ ] **Task 11: Build AI Analysis Workflow (`build-ai-workflow`)**
  - **Action:** Create the visual workflow in n8n that handles the two-stage ingredient processing pipeline.
  - **Workflow Components:**
    - **Stage 1 (Identification):**
      - Webhook trigger for receiving image data or manual ingredient list.
      - Multimodal AI call for image-to-text ingredient identification.
    - **Stage 2 (Enrichment):**
      - Database lookup node to query the **Curated Ingredient Database**.
      - Conditional logic: if ingredient is found, use curated data.
      - If not found, use a second AI call (fallback) to classify `foodGroup` and `zone`.
      - Implement a "learning loop" by logging AI-classified ingredients for future review and addition to the curated database.
    - **Output & Error Handling:**
      - Data transformation nodes for final JSON formatting.
      - Error handling and validation nodes.
  - **Outcome:** A robust AI analysis workflow that combines the consistency of a curated database with the scalability of AI, capable of turning a photo or text into structured, intelligent data.

- [ ] **Task 12: Create Simple API Route (`create-api-route`)**
  - **Action:** Build a lightweight Next.js API route that forwards requests to the n8n workflow.
  - **Security Implementation:**
    - Implement rate limiting using `@upstash/ratelimit`
    - Add input validation and sanitization
    - Secure webhook authentication with tokens
    - Implement proper error handling and timeouts
    - **Structural Alignments:**
      - Create `app/api/` folder structure with proper route organization
      - Add `app/api/analyze/route.ts` for AI analysis endpoint
      - Add `app/api/auth/route.ts` for authentication API (if needed)
      - Enhance `lib/api/` with client utilities and endpoint definitions
      - Add API-specific validation schemas to `lib/validations/`
  - **Outcome:** Secure API endpoint infrastructure that acts as a bridge between client and AI workflow.

- [ ] **Task 13: Integrate Camera with Workflow (`integrate-camera`)**
  - **Action:** Connect the UI to the AI workflow, ensuring a clean separation of concerns.
  - **Implementation:**
    - The _parent component_ that invokes `<CameraCapture>` will be responsible for handling the API call to `/api/analyze`.
    - The `<CameraCapture>` component itself remains agnostic, only returning an image string via a callback.
    - This preserves the reusability of the camera component as per the PRD.
    - Handle workflow response timing (may be slower than direct API calls) with proper loading states and error handling in the parent component.
  - **Outcome:** Photos taken in the app are sent through the AI workflow for processing, while maintaining a clean component architecture.

- [ ] **Task 14: Handle AI Analysis in UI (`update-ui-for-ai`)**
  - **Action:** Implement UI states to handle "Analyzing..." placeholders and display the structured data returned by the AI workflow.
  - **Implementation:**
    - Add loading states for workflow processing.
    - Design and implement UI states for all three food statuses:
      - `analyzing`: Show a loading indicator or placeholder.
      - `pending_review`: Allow the user to view AI results and require confirmation before saving.
      - `processed`: Display the final, confirmed data.
    - Handle workflow timeouts and errors gracefully.
    - Implement retry logic for failed analyses.
  - **Outcome:** A seamless user experience from capture to categorized data entry with proper error handling and a complete status lifecycle.

- [ ] **Task 15: Build Insights Page (`build-insights-page`)**
  - **Action:** Create the "Insights & Analytics" page that performs all calculations and visualizations on the client-side using data from IndexedDB.
  - **Implementation:**
    - Build comprehensive analytics and trend visualization components
    - Implement correlation analysis between different health metrics
    - Create time-based trend charts and pattern recognition
    - **Structural Alignments:**
      - Create `features/analytics/` folder with complete feature structure
      - Add `features/analytics/components/` for trend charts, correlation matrices, health score cards
      - Add `features/analytics/hooks/` for trend analysis and correlation calculations
      - Add `features/analytics/types/` for analytics-specific TypeScript types
      - Implement the actual `app/(protected)/app/insights/page.tsx` with full functionality
  - **Outcome:** Users can see trends and correlations in their health data without it ever leaving their device, supported by a complete analytics feature architecture.

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

- [ ] **Task 19: Final Structural Cleanup (`final-structural-cleanup`)**
  - **Action:** Complete remaining architectural alignments and codebase organization improvements.
  - **Implementation:**
    - **Component Organization:**
      - Consolidate `shared/` and `components/` folders into a single, logical structure
      - Move any remaining misplaced components to their proper feature folders
      - Create proper barrel exports (`index.ts`) for all features
    - **Documentation Alignment:**
      - Add missing `brand-identity.md` with visual design guidelines
      - Add missing `development-workflow.md` with coding standards and processes
      - Update existing documentation to reflect new folder structure
    - **Type System Enhancement:**
      - Consolidate type definitions from `lib/types.ts` into feature-specific type files
      - Ensure all features have proper TypeScript interfaces and exports
    - **Final Validation:**
      - Verify all imports use the new structure
      - Ensure no broken references after structural changes
      - Update any remaining hardcoded paths
  - **Outcome:** Complete architectural alignment with PRD specifications and a fully organized, maintainable codebase.

- [ ] **Task 20: Implement E2EE Sync (`e2ee-sync`)**
  - **Action:** As an opt-in feature, build an end-to-end encrypted synchronization system.
  - **Technology:** Use a service like Supabase to store encrypted data blobs that the server cannot read.
  - **Outcome:** Users can securely sync their data across multiple devices while maintaining privacy.

- [ ] **Task 21: Implement Secure Sharing (`secure-sharing`)**
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
