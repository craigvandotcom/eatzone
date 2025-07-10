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

- [ ] **Task 5: Build Landing Page & Authentication (`build-landing-auth`)**
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

- [ ] **Task 6: Implement Route Protection (`implement-route-protection`)**
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

- [ ] **Task 6.5: Build Settings Page (`build-settings-page`)**
  - **Action:** Create the `/app/settings` page as the central hub for account and data controls.
  - **Implementation:**
    - **Account Management:** Implement a "Logout" button to end the current session.
    - **Data Management:** House the "Export Data", "Import Data", and "Delete All Data" features here.
    - **Appearance:** Add a theme toggle for switching between light and dark modes.
  - **Outcome:** A centralized and user-friendly page for managing account, data, and app preferences as specified in the PRD.

- [ ] **Task 7: Restructure App Navigation (`restructure-app-navigation`)**
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

- [ ] **Task 9: Finalize PWA Functionality (`finalize-pwa`)**
  - **Action:** Ensure the service worker (`sw.js`) correctly caches all necessary assets for a seamless offline experience.
  - **Outcome:** The application is installable and works reliably without an internet connection.

- [ ] **Task 9.5: Deploy to Production (`deploy-to-vercel`)**
  - **Action:** Set up production deployment pipeline with custom domain and continuous integration.
  - **Implementation:**
    - Configure Vercel deployment with GitHub integration
    - Set up custom domain with SSL certificate
    - Configure environment variables for production
    - Set up CI/CD pipeline with automatic deployments on main branch
    - Configure preview deployments for pull requests
    - Set up monitoring and error tracking (e.g., Sentry integration)
    - Optimize build process for production (static exports, image optimization)
  - **Outcome:** Production-ready deployment with professional domain, automated CI/CD, and proper monitoring infrastructure.

- [ ] **Task 10: Verify PWA Compliance (`verify-pwa-compliance`)**
  - **Action:** Perform PWA quality assurance testing on the deployed production application.
  - **Implementation:**
    - Run Lighthouse audits on the deployed application
    - Verify offline functionality by disabling network access
    - Test "Add to Home Screen" functionality on both iOS and Android
    - Test PWA installation and uninstallation flows
    - Verify service worker caching and update mechanisms
    - Test cross-device synchronization (if implemented)
  - **Outcome:** Confidence that the PWA meets quality standards for installability, offline access, and performance on the production domain.

---

## MVP Success Criteria

To consider v0.1 complete, the following criteria must be met:

### **Functional Requirements**
- [ ] Users can create local accounts and login securely
- [ ] Users can track food, liquid, stool, and symptom data
- [ ] Users can capture photos for food logging
- [ ] Users can view their data through core visualizations
- [ ] Users can export/import their complete data set
- [ ] App works completely offline after initial load
- [ ] App is installable as a PWA on mobile and desktop

### **Technical Requirements**
- [ ] IndexedDB properly stores and retrieves all data types
- [ ] Reactive state management works across all components
- [ ] Authentication and route protection function correctly
- [ ] PWA manifest and service worker meet standards
- [ ] Production deployment is stable and accessible
- [ ] Code follows established architectural patterns

### **User Experience Requirements**
- [ ] Mobile-first design with responsive desktop layout
- [ ] Intuitive navigation and clear information hierarchy
- [ ] Fast loading and smooth interactions
- [ ] Clear feedback for all user actions
- [ ] Graceful handling of errors and edge cases

---

## Post-MVP Considerations

After v0.1 is complete and validated with users, development will continue with v1.0 roadmap, which will include:

- AI-powered food analysis and categorization
- Advanced analytics and insights
- Native mobile app packaging with Capacitor
- Enhanced data visualization and trend analysis
- Optional cloud sync and sharing features

This MVP provides a solid foundation for user validation, feedback collection, and iterative improvement based on real-world usage patterns.
