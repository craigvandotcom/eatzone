# MVP Roadmap: Health Tracker PWA (v0.1)

This document outlines the development roadmap for the MVP (v0.1) of the Health Tracker application - a Progressive Web App (PWA) with a local-first architecture focused on core health tracking functionality.

## MVP Scope (v0.1)

The MVP focuses on delivering a fully functional, offline-capable PWA with robust local data storage and essential health tracking features. This version provides the foundation for user validation and feedback collection.

### Core MVP Features:

- **Local-First Architecture**: Complete offline functionality with IndexedDB storage
- **Health Data Tracking**: Food, liquid, stool, and symptom logging
- **Camera Integration**: Photo capture for food logging
- **Data Visualization**: Core charts and progress indicators
- **Data Ownership**: Export/import functionality for user data control
- **PWA Compliance**: Installable, offline-capable application

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

### Phase 1: Core MVP Implementation

**Goal:** Create a fully functional, offline-capable PWA with a robust, private, on-device database. This phase delivers the complete MVP.

- [x] **Task 1: Migrate to IndexedDB (`indexeddb-migration`)**
  - **Action:** Replace `localStorage` with `IndexedDB` for data storage.
  - **Technology:** Implement `Dexie.js` with `dexie-react-hooks` for reactive state management.
  - **Dependencies:** Install `dexie`, `dexie-react-hooks`, and `zod` for data validation.
  - **Outcome:** A robust, scalable, and high-performance local database with automatic UI updates.

- [x] **Task 2: Refactor Data Logic (`refactor-page-tsx`)**
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

- [x] **Task 3: Implement Export/Import (`data-export-import`)**
  - **Action:** Build the data export/import feature, positioning it as the primary user-managed backup system.
  - **Implementation:**
    - Allow users to export their complete IndexedDB data to a single JSON file.
    - Create a clear UI for importing a previously exported file.
    - Add user education within the UI explaining this is the ONLY way to back up data and migrate between devices.
  - **Outcome:** A robust backup system that empowers users with full data ownership, aligned with the PRD's local-first principles.

- [x] **Task 4: Wire Up UI Components (`wire-up-ui`)**
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

- [x] **Task 4.5: Implement Core Visualizations (`implement-visualizations`)**
  - **Action:** Build the key data visualization components defined in the PRD.
  - **Components to Build:**
    - `split-circular-progress.tsx` for the Liquids view.
    - `food-category-progress.tsx` for the Foods pie chart.
    - `vertical-progress-bar.tsx` for the daily organic "battery".
    - `food-composition-bar.tsx` for visualizing individual food entry health.
  - **Outcome:** The core, high-impact visualizations that form the heart of the user's "Body Compass" dashboard are implemented and ready for data binding.

- [x] **Task 5: Build Landing Page & Authentication (`build-landing-auth`)**
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

- [x] **Task 6: Implement Route Protection (`implement-route-protection`)**
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

- [x] **Task 6.5: Build Settings Page (`build-settings-page`)**
  - **Action:** Create the `/app/settings` page as the central hub for account and data controls.
  - **Implementation:**
    - **Account Management:** Implement a "Logout" button to end the current session.
    - **Data Management:** House the "Export Data", "Import Data", and "Delete All Data" features here.
    - **Appearance:** Add a theme toggle for switching between light and dark modes.
  - **Outcome:** A centralized and user-friendly page for managing account, data, and app preferences as specified in the PRD.

- [x] **Task 7: Restructure App Navigation (`restructure-app-navigation`)**
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

- [x] **Task 8: Optimize Desktop Experience (`optimize-desktop-experience`)**
  - **Action:** Enhance the desktop experience while maintaining mobile-first design.
  - **Implementation:**
    - ✅ Implemented responsive sidebar navigation for desktop using existing sidebar component
    - ✅ Added file upload fallback for camera capture when camera access fails
    - ✅ Responsive layout adjustments (sidebar on desktop, bottom tabs on mobile)
    - ✅ Touch target optimization for mobile (44px minimum)
    - ✅ Maintained mobile-first design principles
  - **Outcome:** Essential desktop functionality that provides a professional experience while maintaining mobile-first design principles. Advanced desktop features deferred to v1.0.

- [x] **Task 9: Finalize PWA Functionality (`finalize-pwa`)**
  - **Action:** Ensure the service worker (`sw.js`) correctly caches all necessary assets for a seamless offline experience.
  - **Outcome:** The application is installable and works reliably without an internet connection.

- [x] **Task 9.5: Deploy to Production (`deploy-to-vercel`)**
  - **Action:** Set up production deployment pipeline with custom domain and continuous integration.
  - **Implementation:**
    - Configure Vercel deployment with GitHub integration
    - Set up custom domain with SSL certificate
    - Configure environment variables for production
    - Set up CI/CD pipeline with automatic deployments on main branch
    - Configure preview deployments for pull requests
    - Set up monitoring and error tracking (using Vercel's built-in monitoring)
    - Optimize build process for production (static exports, image optimization)
  - **Outcome:** Production-ready deployment with professional domain, automated CI/CD, and proper monitoring infrastructure using Vercel's native monitoring features.

- [x] **Task 10: Verify PWA Compliance (`verify-pwa-compliance`)**
  - **Action:** Perform PWA quality assurance testing on the deployed production application.
  - **Implementation:**
    - ✅ Run Lighthouse audits on the deployed application
    - Verify offline functionality by disabling network access
    - Test "Add to Home Screen" functionality on both iOS and Android
    - Test PWA installation and uninstallation flows
    - Verify service worker caching and update mechanisms
    - Test cross-device synchronization (if implemented)
  - **Outcome:** Confidence that the PWA meets quality standards for installability, offline access, and performance on the production domain.

- [x] **Task 10.5: Document Logging & Error Handling Standards (`document-logging-standards`)**
  - **Action:** Establish comprehensive logging and error handling standards for the application.
  - **Implementation:**
    - ✅ Added Section 3.7 to PRD with comprehensive logging standards
    - ✅ Defined privacy-first logging rules (never log user health data)
    - ✅ Established error handling patterns and response formats
    - ✅ Documented Vercel monitoring integration approach
    - ✅ Created implementation guidelines for development team
  - **Outcome:** Complete logging and error handling standards documented, ensuring consistent approach across the application while maintaining privacy-first principles.

---

### Phase 2: AI Integration & Intelligence

- [x] debug pwa scrolling
- [x] setup bug bot 

**Goal:** Implement a two-step, privacy-preserving AI analysis flow to provide intelligent food logging, with a human-in-the-loop validation step to ensure accuracy.

- [x] **Task 11: Set Up OpenRouter AI Infrastructure (`setup-openrouter`)**
  - **Action:** Establish a unified, cost-effective AI gateway using **OpenRouter** to access multiple large language models (LLMs) through a single API key.
  - **Implementation:**
    - Create an OpenRouter account and purchase initial credits (free-tier is acceptable for development).
    - Store the `OPENROUTER_API_KEY` in `.env.local` (and `.env.example`) and expose it to Vercel for production builds.
    - Add a thin `lib/ai/openrouter.ts` helper that wraps the OpenRouter-compatible `OpenAI` client and sets `baseURL = "https://openrouter.ai/api/v1"`.
    - Document routing shortcuts (`:floor` for cheapest, `:nitro` for fastest) and the free-model policy in `README`.
    - Implement a simple health-check endpoint (`/api/ai-status`) that pings OpenRouter and returns model availability so we can surface downtime gracefully in the UI.
  - **Outcome:** A single, flexible entry point for all AI calls, allowing us to experiment with GPT-4o, Claude 3.5 Sonnet, Gemini Flash, etc., without changing code paths.

- [x] **Task 12: Implement Vision-Based Ingredient Identification (`implement-vision-identification`)**
  - **Action:** Build the first stage of the AI pipeline. The user captures a photo, and a vision model identifies potential ingredients.
  - **Implementation:**
    - Create a secure API route (`/api/analyze-image`) that accepts an image.
    - This route calls a multimodal vision model (e.g., GPT-4o) with a prompt to extract a list of ingredient names from the image.
    - The API route will return a simple JSON array of ingredient strings.
    - Implement loading and error states on the client-side for this process.
  - **Outcome:** A functional "scan-to-text" feature where a food photo is converted into a preliminary list of ingredients.

- [x] **Task 13: Integrate Vision Analysis with Food Dialog (`integrate-vision-with-dialog`)**
  - **Action:** Connect the camera capture flow to the ingredient identification API and populate the `AddFoodDialog` for user review.
  - **Implementation:**
    - After the user captures a photo, call the `/api/analyze-image` endpoint.
    - Take the returned list of ingredient strings and use it to pre-populate the ingredient list within the `AddFoodDialog`.
    - The UI must clearly indicate that these are AI suggestions, and the user has full control to add, edit, or remove ingredients before submission. This fulfills the "human-in-the-loop" requirement.
  - **Outcome:** A seamless user flow from photo capture to an editable list of AI-suggested ingredients, ready for user validation.

- [x] **Task 14: Implement AI-Powered Ingredient Zoning (`implement-ai-zoning`)**
  - **Action:** Build the second stage of the AI pipeline. Once the user confirms the ingredient list, send it to another AI for classification based on the Body Compass zoning rules.
  - **Implementation:**
    - Create a second secure API route (`/api/zone-ingredients`) that accepts a JSON array of ingredient strings.
    - This route calls a powerful language model with a detailed system prompt containing the "Instructions for Food & Ingredient Zoning".
    - The AI will return a structured JSON object for each ingredient, including its assigned `zone` and `foodGroup`.
    - Implement robust Zod validation on the API response to ensure data integrity before saving to the database.
  - **Outcome:** An intelligent zoning engine that can classify any list of ingredients according to the project's specific nutritional philosophy.

- [x] make sure that rate limiting is also configured for image analysis calls
- [x] add time edit to entry edit page
- [x] change capture photo screen to look like dribble FULL screen concept
- [x] add upload photo option alongside capture
- [x] in manual entry page: show image of food too

- [x] **Task 15: Finalize AI Data Flow and UI (`finalize-ai-flow`)**
  - **Action:** Connect the full AI pipeline to the database and update the UI to handle the final, enriched data.
  - **Implementation:**
    - When the user submits the `AddFoodDialog`, the confirmed ingredient list is sent to the `/api/zone-ingredients` endpoint.
    - A loading state will be shown while the ingredients are being zoned.
    - Upon receiving the zoned ingredients, the complete `Food` object is assembled on the client and saved to IndexedDB using the existing data layer functions.
    - Ensure all statuses (`analyzing`, `processed`) are correctly managed in the UI and the database.
  - **Outcome:** A complete, end-to-end AI-powered food logging experience, from photo capture to storing fully analyzed and zoned ingredient data.

- [ ] Task 15.5: Review complete symptoms logging flow
  - [ ] manual capture
  - [ ] recent entries
  - [ ] etc

- [ ] **Task 16: Build MVP Insights Page (`build-mvp-insights-page`)**
  - **Action:** Create the initial "Insights & Analytics" page that performs all calculations on the client-side, focusing on a simple heuristic-based correlation approach.
  - **Implementation:**
    - Implement the core analysis using a **heuristic/rule-based approach** (e.g., time-windowed co-occurrence counting).
    - Allow users to select either a **food/ingredient** or a **symptom type**.
    - Display a list of **correlated items** based on the selection.
    - Provide a simple UI for users to select a **time window of association** (e.g., "within 6 hours").
    - **Structural Alignments:**
      - Create `features/analytics/` folder with a basic structure for components and hooks.
      - Implement `app/(protected)/app/insights/page.tsx` with this initial functionality.
  - **Outcome:** A functional MVP insights page that provides users with direct, actionable heuristic correlations from their local data, delivering on the core "Body Compass" promise.

---

### Phase 3: Native Integration with Capacitor

**Goal:** Package the PWA as a native app for iOS and Android to expand its reach and capabilities.

- [ ] **Task 17: Integrate Capacitor (`integrate-capacitor`)**
  - **Action:** Add Capacitor to the Next.js project.
  - **Important Note:** Capacitor packages the PWA as a static web app. The native app will make network requests to the deployed Vercel API endpoints and n8n workflows for AI functionality.
  - **Implementation:**
    - Configure Next.js for static export (`next build && next export`)
    - Install and configure Capacitor
    - Update API calls to use absolute URLs in production
    - Ensure n8n webhook URLs are accessible from native apps
  - **Outcome:** The project is configured to build native app packages with proper client-server separation.

- [ ] **Task 18: Configure Native Projects (`configure-native-projects`)**
  - **Action:** Set up the iOS (Xcode) and Android (Android Studio) projects, including icons, splash screens, and permissions.
  - **Outcome:** Native project shells are ready for compilation.

- [ ] **Task 19: Build and Test on Devices (`test-native`)**
  - **Action:** Compile the app and test it thoroughly on iOS and Android emulators and physical devices.
  - **Outcome:** A stable, distributable native application.

---

### Phase 4: Advanced Features & Ecosystem

**Goal:** Implement "Tier 3" features that require careful privacy considerations, such as optional cloud sync.

- [ ] **Task 20: Final Structural Cleanup (`final-structural-cleanup`)**
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

- [ ] **Task 21: Implement E2EE Sync (`e2ee-sync`)**
  - **Action:** As an opt-in feature, build an end-to-end encrypted synchronization system.
  - **Technology:** Use a service like Supabase to store encrypted data blobs that the server cannot read.
  - **Outcome:** Users can securely sync their data across multiple devices while maintaining privacy.

- [ ] **Task 22: Implement Secure Sharing (`secure-sharing`)**
  - **Action:** Create a feature allowing users to securely share a snapshot of their data with a healthcare provider.
  - **Outcome:** Users can grant temporary, controlled access to their health information.

---


----

#### **2. Implement the Simplified API Route**
**File:** `app/api/zone-ingredients/route.ts`

**Action:** This API route will be straightforward. It receives a list of ingredients, sends them all to the AI with the rubric, and returns the result.

**Engineer's Checklist:**
1.  **Receive Request:** Get the `ingredients` array from the request body.
2.  **Validate Input:** Use a Zod schema to ensure the request body is an object with an `ingredients` key that is an array of strings.
3.  **Construct Prompt:** Create the full prompt string to send to the AI, combining the static rubric from `prompts.ingredientZoning` with the dynamic list of ingredients from the user.
4.  **Call AI:** Make a single API call to OpenRouter with the complete prompt. Ensure the `response_format` is set to `json_object`.
5.  **Validate AI Response:** When the response comes back, parse the JSON and validate its structure using another Zod schema. This is critical to prevent malformed data from crashing the app.
6.  **Return Response:** If validation passes, return the zoned ingredients to the client. If anything fails, return a structured error.

#### **3. Implement Security: Rate Limiting**
**File:** `app/api/zone-ingredients/route.ts`

**Action:** Before any logic runs, implement IP-based rate limiting to prevent abuse of this potentially expensive endpoint.

**Engineer's Checklist:**
1.  **Integrate Upstash:** Use the `@upstash/ratelimit` package.
2.  **Set Limit:** Configure a reasonable limit (e.g., 20 requests per minute) for the MVP.
3.  **Return Error:** If the rate limit is exceeded, immediately return a `429 Too Many Requests` error.

#### **4. Finalize Client-Side Integration**
**File:** `features/foods/components/food-entry-form.tsx`

**Action:** The existing client-side logic is already well-suited for this simplified flow.

**Engineer's Checklist:**
1.  **Verify API Call:** In the `handleSubmit` function, ensure the `fetch` call to `/api/zone-ingredients` correctly sends the `ingredients` array in the request body.
2.  **Handle States:** Maintain the existing loading and error states. When the user submits, the UI should show a "Zoning ingredients..." message.
3.  **Process Data:** The existing logic that maps the API response back to the ingredients list before saving to the database is correct and should be kept.

This plan delivers a functional, secure, and testable AI zoning feature for the MVP, giving you maximum exposure to the AI's performance so you can refine the rubric and prompts effectively.