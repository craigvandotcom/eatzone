- I am a solo engineer working on solo projects, you are my senior AI software engineer assistant
- you have access to the following tools:
  - browser tools
    - use these after making changes to test app functionality
    - ALWAYSmake sure to check/run dev server before trying to navigate to it
  - perplexity (use this to research and answer questions)
- before committing any change, make sure to run pnp build and check for errors

# **Project Reference: eatZone - Food & Symptom Tracker PWA**

**Version:** 1.0.0
**Date:** July 11, 2025
**Author:** v0

## Table of Contents

### 1. Project Overview

#### 1.1. Core Concept

eatZone is a mobile-first Progressive Web App (PWA) designed to be your "Food Tracking Companion." It allows users to perform high-speed, low-friction logging of food and symptoms. The primary goal is to empower users to identify patterns and correlations between their dietary choices and their physical well-being.

#### 1.2. Guiding Philosophy

- **Capture First, Analyze Later:** The user experience is optimized for rapid data entry, particularly through camera-based capture. The system is designed to create placeholder entries that can be analyzed later (e.g., by an AI), removing the burden of detailed manual entry at the moment of consumption.
- **Visual First Insights:** Data is presented through intuitive, high-impact visualizations. Instead of tables of data, the user sees progress bars, color-coded charts, and at-a-glance summaries to quickly assess their day.
- **Frictionless Interaction:** As a PWA, the application provides a native app-like experience without the need for an app store. It's designed for offline access and quick loading, making it a reliable daily companion.

### 2. Core Features & Functionality

The application is organized into two primary tracking categories, accessible via a main tab bar.

| Category     | Icon | Purpose                                                | Key Visualizations                                                                                                                                                                                                                                                                                                                                       |
| ------------ | ---- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Foods**    | 🍽️   | Log foods and their constituent ingredients.           | - **Food Category Pie Chart:** Shows the daily ratio of "Good" (green), "Maybe" (yellow), and "Bad" (red) ingredients. `<br>` - **Vertical Organic "Battery":** Shows the percentage of daily ingredients that were organic. `<br>` - **Dual-Bar System (per food entry):** Visualizes the health and organic composition of each individual food entry. |
| **Symptoms** | ⚡   | Log physical or emotional symptoms and their severity. | - **Daily Count:** A simple, large number showing total symptoms logged for the day.                                                                                                                                                                                                                                                                     |

#### 2.1. Data Entry Methods

- **Quick Capture (Camera):** The primary interaction for Liquids, Foods, and Stools. Tapping the corresponding icon in the bottom navigation opens the camera. A photo is taken, and a placeholder entry is created with a status like "Analyzing...".
  - Ideally, the camera would be able to capture the image and send it to the AI for analysis, and then display the results in the manual edit UI for the user to review and update.
- **Manual Entry:** For each category, a detailed dialog allows for the manual creation or editing of entries. This includes:

- **Foods:** A sophisticated ingredient list manager with options for marking items as organic and specifying the cooking method.
- **Liquids:** Type selection and volume entry.
- **Stools:** A Bristol Stool Scale slider (1-7) and selectors for color and consistency.
- **Symptoms:** A multi-entry system for logging several symptoms at once, each with a severity rating (1-5).
- **Editing:** All entries in the "Recent Entries" list can be tapped to open the corresponding manual entry dialog, pre-filled with the entry's data for editing.

### 3. Technical Architecture

- **Framework:** **Next.js 15** with the App Router.
- **Language:** **TypeScript**.
- **Styling:** **Tailwind CSS** for utility-first styling.
- **UI Components:** **shadcn/ui** provides the foundational, unstyled components (Dialog, Button, Input, Slider, etc.), which are then styled with Tailwind CSS.
- **State Management:** **Reactive Data Layer** - State is managed through **Dexie.js** with **`dexie-react-hooks`** for reactive data binding. The `useLiveQuery` hook automatically updates components when underlying IndexedDB data changes, eliminating manual state synchronization.
- **Data Persistence:** **Local-First Architecture** - All user data is stored locally on the user's device using **IndexedDB** (via **Dexie.js** library) for robust, privacy-focused storage. This approach ensures maximum user privacy and offline functionality.
- **Deployment:** Hosted on **Vercel** for seamless integration with Next.js and serverless functions.
- **PWA Implementation:**

- `public/manifest.json`: Defines the app's name, icons, theme colors, and display mode.
- `public/sw.js`: A basic service worker that caches core application assets for offline access.
- `app/layout.tsx`: Contains the necessary `<meta>` and `<link>` tags to ensure proper PWA behavior, including the viewport settings and Apple-specific tags for a native feel on iOS.

### 3.8. Vercel Preview Authentication System

**Problem Solved**: Branch deployments create Vercel preview URLs (e.g., `puls-git-feature-abc123.vercel.app`) that would normally require creating new accounts for testing. This system provides instant access while maintaining security.

**Auto-Detection**: The application automatically detects three environments:

- **Development** (`localhost:3000`): Auto-login with `dev@test.com` / `password`
- **Preview** (`.vercel.app`, `netlify.app`, etc.): Shows blue demo mode with 3 test accounts
- **Production**: Standard authentication only

**Demo Accounts for Preview Deployments**:

- `demo@puls.app` / `demo123` (Demo User)
- `preview@puls.app` / `preview123` (Preview User)
- `test@puls.app` / `test123` (Test User)

**Security**: All demo accounts are created locally in IndexedDB. No server-side demo accounts or security vulnerabilities in production.

**Usage**:

- Push any branch → Vercel creates preview URL → Visit URL → Auto-login or click demo account buttons
- Manual activation: Add `?preview=true` to any URL
- See detailed documentation: `_docs/vercel-preview-authentication.md`

This eliminates the friction of testing preview deployments while maintaining the local-first, privacy-focused architecture.

#### 3.6. Project Structure

The application follows a **feature-based architecture** organized around the four core tracking categories, with clear separation between shared and domain-specific code:

```
puls/
├── _docs/                          # Project Documentation
│   ├── PRD.md                     # Product Requirements Document
│   ├── roadmap.md                 # Development Roadmap
│   ├── brand-identity.md          # Brand Guidelines
│   └── development-workflow.md    # Development Process
├── app/                           # Next.js App Router
│   ├── (auth)/                   # Authentication Route Group
│   │   ├── login/page.tsx        # Login Page
│   │   └── signup/page.tsx       # Signup Page
│   ├── (protected)/              # Protected Route Group
│   │   ├── app/
│   │   │   ├── page.tsx          # Main Health Tracker Dashboard
│   │   │   └── insights/page.tsx # Analytics & Trends
│   │   └── settings/page.tsx     # User Settings & Data Management
│   ├── api/                      # API Routes
│   │   ├── analyze/route.ts      # AI Analysis Endpoint
│   │   └── auth/route.ts         # Authentication API
│   ├── globals.css               # Global Styles
│   ├── layout.tsx               # Root Layout
│   └── page.tsx                 # Public Landing Page
├── features/                     # Feature-Based Organization
│   ├── liquids/                 # 💧 Liquid Tracking Feature
│   │   ├── components/
│   │   │   ├── add-liquid-dialog.tsx
│   │   │   ├── liquid-entry-card.tsx
│   │   │   ├── liquid-list.tsx
│   │   │   └── split-circular-progress.tsx
│   │   ├── hooks/
│   │   │   ├── use-liquids.ts
│   │   │   ├── use-water-stats.ts
│   │   │   └── use-liquid-analysis.ts
│   │   ├── types/
│   │   │   └── liquid.types.ts
│   │   ├── utils/
│   │   │   └── liquid.utils.ts
│   │   └── index.ts             # Feature exports
│   ├── foods/                   # 🍽️ Food Tracking Feature
│   │   ├── components/
│   │   │   ├── add-food-dialog.tsx
│   │   │   ├── food-entry-card.tsx
│   │   │   ├── food-list.tsx
│   │   │   ├── food-category-progress.tsx
│   │   │   ├── food-composition-bar.tsx
│   │   │   ├── organic-composition-bar.tsx
│   │   │   └── vertical-progress-bar.tsx
│   │   ├── hooks/
│   │   │   ├── use-foods.ts
│   │   │   ├── use-food-stats.ts
│   │   │   └── use-food-analysis.ts
│   │   ├── types/
│   │   │   ├── food.types.ts
│   │   │   └── ingredient.types.ts
│   │   ├── utils/
│   │   │   └── food.utils.ts
│   │   └── index.ts             # Feature exports
│   ├── stools/                  # 💩 Stool Tracking Feature
│   │   ├── components/
│   │   │   ├── add-stool-dialog.tsx
│   │   │   ├── stool-entry-card.tsx
│   │   │   ├── stool-list.tsx
│   │   │   └── bristol-scale-display.tsx
│   │   ├── hooks/
│   │   │   ├── use-stools.ts
│   │   │   └── use-stool-analysis.ts
│   │   ├── types/
│   │   │   └── stool.types.ts
│   │   ├── utils/
│   │   │   └── stool.utils.ts
│   │   └── index.ts             # Feature exports
│   ├── symptoms/                # ⚡ Symptom Tracking Feature
│   │   ├── components/
│   │   │   ├── add-symptom-dialog.tsx
│   │   │   ├── symptom-entry-card.tsx
│   │   │   ├── symptom-list.tsx
│   │   │   └── symptom-severity-display.tsx
│   │   ├── hooks/
│   │   │   ├── use-symptoms.ts
│   │   │   └── use-symptom-analysis.ts
│   │   ├── types/
│   │   │   └── symptom.types.ts
│   │   ├── utils/
│   │   │   └── symptom.utils.ts
│   │   └── index.ts             # Feature exports
│   ├── analytics/               # 📊 Analytics & Insights Feature
│   │   ├── components/
│   │   │   ├── trend-chart.tsx
│   │   │   ├── correlation-matrix.tsx
│   │   │   └── health-score-card.tsx
│   │   ├── hooks/
│   │   │   ├── use-trends.ts
│   │   │   └── use-correlations.ts
│   │   ├── types/
│   │   │   └── analytics.types.ts
│   │   ├── utils/
│   │   │   └── analytics.utils.ts
│   │   └── index.ts             # Feature exports
│   └── auth/                    # 🔐 Authentication Feature
│       ├── components/
│       │   ├── login-form.tsx
│       │   ├── signup-form.tsx
│       │   └── auth-guard.tsx
│       ├── hooks/
│       │   ├── use-auth.ts
│       │   └── use-session.ts
│       ├── types/
│       │   └── auth.types.ts
│       ├── utils/
│       │   └── auth.utils.ts
│       └── index.ts             # Feature exports
├── components/                   # Shared/Generic Components
│   ├── ui/                      # shadcn/ui Base Components
│   ├── layout/                  # Layout Components
│   │   ├── header.tsx
│   │   ├── navigation.tsx
│   │   └── footer.tsx
│   ├── shared/                  # Shared Business Components
│   │   ├── camera-capture.tsx
│   │   ├── data-export-import.tsx
│   │   └── loading-states.tsx
│   └── theme-provider.tsx
├── lib/                         # Core Application Logic
│   ├── db/                      # Database Layer
│   │   ├── db.ts               # Main Dexie.js setup
│   │   ├── migrations.ts       # Database migrations
│   │   └── seed.ts             # Initial data seeding
│   ├── api/                     # API utilities
│   │   ├── client.ts           # API client setup
│   │   └── endpoints.ts        # API endpoints
│   ├── validations/             # Zod Schemas
│   │   ├── auth.schemas.ts
│   │   ├── liquid.schemas.ts
│   │   ├── meal.schemas.ts
│   │   ├── stool.schemas.ts
│   │   └── symptom.schemas.ts
│   ├── constants.ts             # App constants
│   ├── types.ts                # Global TypeScript types
│   └── utils.ts                # Utility functions
├── middleware.ts               # Next.js Middleware (Route Protection)
├── public/                     # Static Assets
│   ├── manifest.json          # PWA Manifest
│   ├── sw.js                  # Service Worker
│   └── icons/                 # PWA Icons
└── [config files]             # package.json, next.config.js, etc.
```

**Key Architectural Principles:**

- **Feature-Based Organization:** Each tracking category (liquids, foods, stools, symptoms) is a self-contained feature module
- **Domain-Driven Design:** Clear boundaries between business domains with explicit exports
- **Separation of Concerns:** Shared components are separate from feature-specific logic
- **Scalability:** Easy to add new tracking categories as independent features
- **Import Clarity:** Clean imports using feature barrel exports (e.g., `import { AddFoodDialog } from '@/features/foods'`)

#### 3.1. Data Storage Strategy

**Philosophy:** Privacy by Design - Local-First Storage

The application follows a **local-first** data storage approach, prioritizing user privacy and data ownership:

- **Primary Storage:** **IndexedDB** via **Dexie.js** library
  - Stores all user health data locally on the device
  - Supports complex data structures and relationships
  - Enables robust offline functionality
  - Provides transactional, asynchronous operations
  - **Reactive State Management:** `dexie-react-hooks` provides `useLiveQuery` for automatic UI updates
  - **Clean Data Layer:** Centralized database operations in `lib/db.ts` separate from UI components

- **Privacy Benefits:**
  - Zero sensitive health data stored on servers
  - User maintains complete control over their data
  - Eliminates data breach risks for personal health information
  - Reduces regulatory compliance burden

- **Data Export/Import:** Built-in functionality for users to:
  - Export their complete data set as JSON
  - Import previously exported data
  - Migrate between devices manually
  - Create personal backups

#### 3.2. AI Analysis Flow (Privacy-Preserving)

The AI analysis follows an **ephemeral processing** model that maintains privacy while optimizing for rapid iteration:

**Architecture Strategy: Hybrid Workflow Approach**

The system uses a **visual workflow orchestrator** (n8n) combined with an **AI API aggregator** (OpenRouter) to maximize iteration speed and flexibility:

1. **Capture:** User takes photo on frontend
2. **Webhook Trigger:** Frontend sends image to Next.js API route (`/api/analyze`)
3. **Workflow Orchestration:** API route forwards request to n8n webhook URL
4. **AI Processing:** n8n workflow handles the complex AI logic:
   - Calls OpenRouter API with configurable model selection
   - Processes AI response and formats to match data interfaces
   - Handles error cases and validation
   - Returns structured JSON to webhook response
5. **No Persistence:** **Critical** - All processing remains ephemeral
6. **Local Storage:** Frontend receives structured data and saves to IndexedDB

**Key Privacy Principles:**

- Server functions are stateless and ephemeral
- No user data logged or persisted on servers
- All processing happens in memory and is immediately discarded
- User data only exists on their device and in transit during analysis

**Architecture Benefits:**

- **Rapid Iteration:** AI logic can be modified in n8n without code deployments
- **Model Flexibility:** Easy switching between AI providers via OpenRouter
- **Decoupled Design:** Main application is independent of AI implementation details
- **Visual Development:** Complex AI workflows can be built and tested visually

**Security & Performance Considerations:**

- **API Security:** AI API keys stored as server-side environment variables only
- **Rate Limiting:** IP-based rate limiting on `/api/analyze` endpoint to prevent abuse
- **Data Validation:** **Zod** schema validation for all AI responses before client processing
- **Error Handling:** Graceful fallbacks when AI analysis fails or returns malformed data
- **Workflow Security:** n8n webhook endpoints secured with authentication tokens

#### 3.2.1. Ingredient Processing Pipeline

The core intelligence of the app lies in its ability to not just identify ingredients, but to enrich them with nutritional context (food group and zone). This is achieved through a two-stage pipeline that runs on the backend (e.g., within an n8n workflow) after a user submits a food entry.

**Stage 1: Ingredient Identification (The "What")**

This stage determines the list of ingredients from the user's input.

- **Manual Input:** If the user types ingredients manually, this stage is complete. The system receives a direct list of strings (e.g., `["Chicken Breast", "Organic Tomatoes"]`).
- **Camera Input:** When a photo is provided, a multimodal vision model (e.g., GPT-4o) is used with a prompt like: `"List the primary ingredients in this food. Return as a JSON array of strings."` The goal is to produce the same list of strings as the manual input.

**Stage 2: Ingredient Enrichment (The "So What")**

This stage takes each ingredient string and assigns it a `foodGroup` and a `zone` using a hybrid system that ensures both consistency and scalability.

1.  **Curated Ingredient Database (The Source of Truth):**
    - The system first queries a curated backend database (e.g., a Supabase table or Vercel KV store). This database is our hand-maintained source of truth.
    - **Schema:** Each entry contains `ingredientName`, `foodGroup`, `defaultZone`, and `zoneModifiers` (e.g., rules for when `isOrganic` or `cookingMethod` changes the zone).
    - **Happy Path:** If a match is found (e.g., "Tomato"), the system uses the high-quality, consistent data from our database. This is fast and aligns perfectly with our app's nutritional philosophy.

2.  **AI Fallback (For Scalability):**
    - If an ingredient is not found in our curated database (e.g., "Gochujang"), the system proceeds to an AI fallback.
    - A second, more specific AI call is made with a detailed prompt instructing the AI to classify the ingredient into a `foodGroup` and `zone` based on our predefined philosophy (e.g., "Green foods are whole and unprocessed...").

3.  **The Learning Loop (For Continuous Improvement):**
    - Whenever the AI fallback is used, the ingredient and the AI's classification are logged.
    - This log can be periodically reviewed. If "Gochujang" appears frequently, it can be officially analyzed and added to the Curated Ingredient Database, making the system progressively smarter and less reliant on the AI for that item.

This hybrid approach provides the consistency of a curated list for common foods while using AI's power to handle the near-infinite variety of other ingredients, ensuring the app can scale without sacrificing the quality of its core insights.

#### 3.3. User Authentication & Access Control

**Authentication Philosophy:** Privacy-First with Local Account Management

Given the privacy-first, local-storage architecture, user authentication serves primarily as a device-level access control mechanism rather than traditional server-side user management:

**Authentication Strategy:**

- **Local Account Creation:** User accounts are created and stored locally on the device
- **Device-Based Sessions:** Authentication sessions are maintained locally using secure browser storage
- **Optional Server Sync:** Authentication tokens can be used for optional multi-device sync (future feature)
- **Privacy Protection:** No personal health data is transmitted during authentication

**Application Structure:**

Public Routes (No Authentication Required):
├── / (Landing Page)
├── /login (Sign In)
├── /signup (Create Account)
├── /about (App Information)
└── /privacy (Privacy Policy)

Protected Routes (Authentication Required):
├── /app (Main Health Tracker Interface)
├── /app/insights (Analytics & Trends)
└── /app/settings (User Preferences & Data Management)

For the MVP, the `/app/settings` page will serve as the central hub for account and data controls, consolidating functionality that might otherwise be on separate pages. This page will include:

- **Account Management:**
  - **Logout:** A button to end the current session.
- **Data Management:**
  - **Export Data:** A button to download all user data as a single JSON file.
  - **Import Data:** An interface to upload a previously exported JSON file.
  - **Delete All Data:** A clearly marked, high-friction option to permanently erase all locally stored health data.
- **Appearance:**
  - **Theme:** A toggle to switch between light and dark modes.

**Implementation Details:**

- **Local Authentication:** User credentials hashed and stored in IndexedDB
- **Session Management:** JWT tokens stored in secure browser storage
- **Biometric Integration:** Future support for WebAuthn/Touch ID/Face ID
- **Data Isolation:** Each user account has isolated IndexedDB database

**Security Considerations:**

- **Local Password Hashing:** bcrypt or similar for local password storage
- **Session Timeout:** Configurable auto-logout for security
- **Device Fingerprinting:** Optional device recognition for enhanced security
- **Rate Limiting:** Protection against brute force attacks on login

**Data Recovery & Backup:**

- **Primary Backup Method:** Export/Import Data functionality is the main recovery mechanism
- **Device-Bound Accounts:** User accounts are tied to the device; no cloud-based account recovery
- **Data Loss Prevention:** Clear user education about the importance of regular data exports
- **No Password Recovery:** If a user forgets their password, they must reset the app and lose all data unless they have a manual backup

#### 3.4. Desktop vs Mobile Experience Strategy

**Core Philosophy:** Mobile-First with Responsive Desktop Support

The Health Tracker is designed primarily for mobile use, but provides a thoughtful desktop experience that maintains functionality while encouraging mobile adoption:

**Desktop Experience Strategy:**

- **Responsive Design:** Mobile-optimized interface that scales appropriately to desktop
- **Feature Parity:** All core functionality available on desktop with adapted UI
- **Mobile Encouragement:** Clear messaging about optimal mobile experience
- **Complementary Features:** Desktop-specific enhancements where appropriate

**Device-Specific Implementations:**

**Landing Page (`/`):**

- **Mobile:** Streamlined app introduction with quick signup/login
- **Desktop:** Comprehensive overview with:
  - App demonstration and screenshots
  - Feature highlights and benefits
  - QR code for easy mobile access
  - Download/install instructions
  - "Better on mobile" messaging

**Authentication (`/login`, `/signup`):**

- **Mobile:** Full-screen forms optimized for touch
- **Desktop:** Centered forms with explanatory content
- **Both:** Consistent branding and security messaging

**Main Application (`/app`):**

- **Mobile:** Tab-based navigation with thumb-friendly interactions
- **Desktop:** Sidebar navigation with larger content area
- **Camera Features:**
  - Mobile: Direct camera access for photo capture
  - Desktop: File upload with drag-and-drop support
- **Visual Feedback:** Adapted touch targets and hover states

**Progressive Enhancement Approach:**

**Base Experience (Works Everywhere):**

- Manual data entry forms
- Basic visualizations
- Data export/import
- Settings and preferences

**Enhanced Mobile Features:**

- Camera capture for quick logging
- Push notifications for reminders
- Offline functionality
- Touch-optimized gestures

**Desktop-Specific Enhancements:**

- Keyboard shortcuts for power users
- Drag-and-drop file uploads
- Enhanced data visualization with hover details
- Multi-window support for data analysis

**Implementation Guidelines:**

- **CSS Media Queries:** Responsive breakpoints for different screen sizes
- **Feature Detection:** JavaScript-based capability detection
- **Graceful Degradation:** Fallbacks for missing mobile features
- **Performance Optimization:** Lazy loading for desktop-specific features

**User Experience Considerations:**

- **Clear Expectations:** Prominent messaging about mobile-first design
- **Feature Availability:** Visual indicators for mobile-only features
- **Cross-Device Continuity:** Consistent data and experience across devices
- **Progressive Disclosure:** Advanced features revealed based on device capabilities

#### 3.5. Future Architecture Considerations

**Multi-Device Sync (Future):**
If multi-device functionality becomes necessary, implement **End-to-End Encryption (E2EE)**:

- Data encrypted on device before transmission
- Server stores encrypted blobs it cannot read
- Only user devices with proper keys can decrypt data
- Maintains privacy-first approach even with cloud storage

**Native App Migration:**
Current PWA can be enhanced with **Capacitor** if native device integration is needed:

- Maintains existing Next.js codebase
- Adds native API access (HealthKit, Google Fit)
- Preserves local-first data storage approach
- Avoids full React Native rewrite

**Important:** Capacitor packages the PWA as a static web app. The native app will make network requests to the deployed Vercel API endpoints (e.g., `https://your-app.vercel.app/api/analyze`) for AI functionality. This maintains the client-server separation while enabling native distribution.

#### 3.7. Logging, Error Handling & Monitoring Standards

**Philosophy:** Privacy-First Logging with Vercel Integration

The application follows a **structured logging approach** that maintains user privacy while providing essential debugging and monitoring capabilities:

**Logging Architecture:**

- **Production Monitoring:** Vercel's built-in monitoring and Web Vitals tracking
- **Privacy-First Approach:** No user health data is ever logged or transmitted
- **Local Development:** Enhanced console logging with full debugging information
- **Error Boundaries:** React error boundaries for graceful failure handling

**3.7.1. Logging Levels & Categories**

- **ERROR:** Critical failures requiring immediate attention (database corruption, authentication failures)
- **WARN:** Recoverable issues that may impact functionality (failed API calls, validation errors)
- **INFO:** Important application events and state changes (user login, data export/import)
- **DEBUG:** Detailed diagnostic information (development only - API responses, state changes)

**3.7.2. Privacy-First Logging Rules**

**CRITICAL - Never Log:**

- User health data (food entries, symptoms, liquids, stools)
- Personal information (names, emails in production logs)
- IndexedDB content or user-generated content
- Authentication tokens or session data

**Safe to Log:**

- Operation IDs and timestamps
- System events (login attempts, export requests)
- Technical errors with sanitized messages
- Performance metrics and Web Vitals
- Feature usage analytics (button clicks, page views)

**3.7.3. Error Handling Patterns**

**Global Error Handling:**

- `app/global-error.tsx` - Catches unhandled React exceptions
- `middleware.ts` - Handles authentication and routing errors
- Console logging for development debugging

**User-Facing Error Handling:**

- **Form Validation:** Real-time validation with Zod schemas + user-friendly error messages
- **API Errors:** Consistent JSON error responses with proper HTTP status codes
- **User Feedback:** Toast notifications (Sonner) for non-blocking alerts, inline alerts for form errors
- **Graceful Degradation:** Fallback UI states when features are unavailable

**Error Response Format:**

```typescript
// Standard API error response
{
  "error": {
    "message": "User-friendly error message",
    "code": "VALIDATION_ERROR", // Optional error code
    "statusCode": 400
  }
}
```

**3.7.4. Development vs Production Logging**

**Development Environment:**

- Verbose console logging with full stack traces
- Detailed API request/response logging
- Database operation logging
- Performance timing information

**Production Environment:**

- Sanitized error messages only
- No sensitive data in logs
- Vercel Function logs for API routes
- Web Vitals and Core Web Vitals tracking
- Automatic error reporting via Vercel monitoring

**3.7.5. Monitoring & Observability**

**Vercel Built-in Monitoring:**

- Function performance and error rates
- Core Web Vitals (LCP, FID, CLS)
- Real User Monitoring (RUM)
- Deployment and build monitoring

**Client-Side Monitoring:**

- Performance API for page load times
- Navigator.onLine for offline detection
- localStorage size monitoring
- Camera/device capability detection

**Key Metrics to Track:**

- Page load performance
- API response times
- IndexedDB operation performance
- PWA installation rates
- Feature adoption (camera usage, manual entry usage)

**3.7.6. Implementation Guidelines**

**Logging Utility Functions:**

```typescript
// lib/logger.ts
export const logger = {
  error: (message: string, context?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'production') {
      // Send to Vercel monitoring (sanitized)
      console.error(message, sanitizeContext(context));
    } else {
      // Full logging in development
      console.error(message, context);
    }
  },

  info: (message: string, context?: Record<string, any>) => {
    console.info(message, context);
  },
};
```

**Error Boundary Implementation:**

- Global error boundary in `app/global-error.tsx`
- Feature-specific error boundaries for complex components
- Graceful fallback UI components

**API Error Handling:**

- Centralized API client in `lib/api/client.ts`
- Consistent error response parsing
- Automatic retry logic for transient failures
- Rate limiting respect and backoff strategies

### 4. Design System & UI Standards

A consistent and thoughtful design system is critical for creating a professional, intuitive, and scalable application. The following standards should guide all UI/UX development.

#### 4.1. Color Palette

Colors are based on HSL values defined in `app/globals.css` and `tailwind.config.ts`. The palette should be used consistently to create a clear visual hierarchy.

- **Primary UI:**
  - `background`: `hsl(var(--background))`
  - `foreground`: `hsl(var(--foreground))`
  - `card`: `hsl(var(--card))`
  - `primary`: `hsl(var(--primary))` (for primary actions)
  - `secondary`: `hsl(var(--secondary))` (for secondary elements)
  - `accent`: `hsl(var(--accent))` (for highlights and active states)
- **Health "Zone" Colors:** These are critical for at-a-glance insights.
  - **Green (Good):** `hsl(142.1 76.2% 36.3%)` - Represents healthy, whole foods.
  - **Yellow (Maybe):** `hsl(47.9 95.8% 53.1%)` - Represents processed foods or items to be consumed in moderation.
  - **Red (Bad):** `hsl(0 84.2% 60.2%)` - Represents unhealthy items or potential triggers.
- **Category-Specific Colors:**
  - **Liquids:** Blue/Cyan gradient (`from-blue-400 to-cyan-500`)
  - **Foods:** Green/Emerald gradient (`from-green-400 to-emerald-500`)
  - **Stools:** Amber/Yellow gradient (`from-amber-400 to-yellow-500`)
  - **Symptoms:** Red/Pink gradient (`from-red-400 to-pink-500`)

#### 4.2. Typography

- **Font:** The primary font is system-ui (`-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif`) for a native feel.
- **Hierarchy:**
  - **Page Titles:** `text-xl` (20px), `font-semibold`
  - **Section Headers:** `text-lg` (18px), `font-semibold`
  - **Body/Paragraphs:** `text-base` (16px), `font-normal`
  - **Labels/Metadata:** `text-sm` (14px), `font-medium`
  - **Small/Helper Text:** `text-xs` (12px), `text-gray-500`

#### 4.3. Spacing & Sizing

- **Spacing Unit:** Follow a 4px grid system. Use Tailwind's spacing scale (e.g., `p-2` for 8px, `p-4` for 16px).
- **Layout:** Main content areas should have a horizontal padding of `px-4`.
- **Touch Targets:** All interactive elements (buttons, list items) must have a minimum height of `44px` to meet accessibility standards on mobile.
- **Radius:** Use consistent border-radius values. `rounded-lg` (0.5rem) for cards and containers, `rounded-full` for circular elements.

#### 4.4. Component Standards

- **Buttons:**
  - **Primary:** Solid background, for main CTAs.
  - **Secondary/Outline:** Transparent background with a border, for less prominent actions.
  - **Ghost:** No background or border, for tertiary actions or icon buttons.
- **Inputs:** Use `Input` from `components/ui/input` with a corresponding `Label`.
- **Responsive Data Entry Modals:** All data entry forms use responsive containers:
  - **Desktop:** `Dialog` component for traditional modal experience
  - **Mobile:** `Drawer` component (bottom sheet) for native mobile feel and keyboard compatibility
  - **Implementation:** Use `useIsMobile` hook to conditionally render appropriate container
  - **Form Logic:** Extracted into separate form components (e.g., `FoodEntryForm`, `SymptomEntryForm`) for reusability

#### 4.5. Animation & Transitions

- **Standard Duration:** `150ms` for all standard transitions (color, background, opacity).
- **Easing:** Use `cubic-bezier(0.4, 0, 0.2, 1)` (Tailwind's `ease-in-out`) for a smooth, natural feel.
- **Complex Animations:** For more significant animations (e.g., dialogs opening), a duration of `200-300ms` may be used.

### 5. Data Structures (TypeScript Interfaces)

The following interfaces define the shape of the data stored in the application.

```typescript
interface Food {
  id: string;
  name: string; // e.g., "Lunch" or a user-defined name
  timestamp: string; // ISO 8601 string (e.g., "2025-07-04T22:15:00.000Z")
  ingredients: Ingredient[]; // A food entry is defined by its ingredients.
  image?: string;
  notes?: string;
  status: 'pending_review' | 'analyzing' | 'processed';
}

interface Ingredient {
  name: string;
  isOrganic: boolean;
  cookingMethod?:
    | 'raw'
    | 'fried'
    | 'steamed'
    | 'baked'
    | 'grilled'
    | 'roasted'
    | 'other';
  foodGroup:
    | 'vegetable'
    | 'fruit'
    | 'protein'
    | 'grain'
    | 'dairy'
    | 'fat'
    | 'other';
  zone: 'green' | 'yellow' | 'red';
}

interface Liquid {
  id: string;
  name: string; // e.g. "Morning Coffee"
  timestamp: string; // ISO 8601 string (e.g., "2025-07-04T22:15:00.000Z")
  amount: number; // in ml
  type: 'water' | 'coffee' | 'tea' | 'juice' | 'soda' | 'dairy' | 'other';
  notes?: string;
  image?: string;
}

interface Symptom {
  id: string;
  name: string;
  severity: number; // 1-5
  timestamp: string; // ISO 8601 string (e.g., "2025-07-04T22:15:00.000Z")
  notes?: string;
}

interface Stool {
  id: string;
  timestamp: string; // ISO 8601 string (e.g., "2025-07-04T22:15:00.000Z")
  bristolScale: number; // 1-7
  color: 'brown' | 'green' | 'yellow' | 'black' | 'white' | 'red' | 'other';
  hasBlood: boolean;
  notes?: string;
  image?: string;
}
```

### 6. Key Component Breakdown

#### 6.1. Data Layer Architecture

- **`lib/db.ts`**: **Centralized Data Layer** - Contains all Dexie.js database operations (`addFood`, `getSymptoms`, `updateLiquid`, etc.). Components interact with data through these functions, not directly with Dexie.
- **`lib/hooks/`**: **Custom React Hooks** - Data-specific hooks that encapsulate `useLiveQuery` calls and business logic (e.g., `useTodaysFoods`, `useSymptomTrends`).

#### 6.2. UI Components

- **`app/page.tsx`**: **Main Layout Component** - Orchestrates the overall UI layout and handles routing between different views. Data operations are delegated to the data layer.
- **Dialogs (`components/add-*-dialog.tsx`)**: A suite of four highly specialized forms for manual data entry. They manage their own internal form state and call back to the data layer with complete data objects upon submission.
- **`components/camera-capture.tsx`**: A reusable, self-contained camera module. It handles the complexities of accessing the device camera, displaying the video stream, and capturing a frame. It is agnostic about _what_ is being captured, simply returning a base64 image string to the parent.

#### 6.3. Visualization Components

- `split-circular-progress.tsx`: Renders the two-part circle for the Liquids view.
- `food-category-progress.tsx`: Renders the three-part pie chart for the Foods view.
- `vertical-progress-bar.tsx`: Renders the "battery" for the daily organic total.
- `food-composition-bar.tsx` & `
