Of course. A comprehensive reference document is a fantastic tool for collaboration and ensuring a clear vision for the project.

Here is a thorough project reference document for the **Health Tracker PWA**. You can use this to brainstorm with your assistant, onboard new team members, or guide future development.

---

### **Project Reference: Health Tracker PWA**

**Version:** 1.0
**Date:** July 4, 2025
**Author:** v0

### 1. Project Overview

#### 1.1. Core Concept

The Health Tracker is a mobile-first Progressive Web App (PWA) designed to be a "Body Compass." It allows users to perform high-speed, low-friction logging of daily inputs (liquids, food) and outputs (stools, symptoms). The primary goal is to empower users to identify patterns and correlations between their lifestyle choices and their physical well-being.

#### 1.2. Guiding Philosophy

- **Capture First, Analyze Later:** The user experience is optimized for rapid data entry, particularly through camera-based capture. The system is designed to create placeholder entries that can be analyzed later (e.g., by an AI), removing the burden of detailed manual entry at the moment of consumption.
- **Visual First Insights:** Data is presented through intuitive, high-impact visualizations. Instead of tables of data, the user sees progress bars, color-coded charts, and at-a-glance summaries to quickly assess their day.
- **Frictionless Interaction:** As a PWA, the application provides a native app-like experience without the need for an app store. It's designed for offline access and quick loading, making it a reliable daily companion.

### 2. Core Features & Functionality

The application is organized into four primary tracking categories, accessible via a main tab bar.

| Category     | Icon | Purpose                                                             | Key Visualizations                                                                                                                                                                                                                                                                                                                           |
| ------------ | ---- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Liquids**  | 💧   | Track hydration, differentiating between water and other beverages. | - **Split Circular Progress:** Shows progress towards a daily water goal vs. total intake of other liquids.                                                                                                                                                                                                                                  |
| **Foods**    | 🍽️   | Log meals and their constituent ingredients.                        | - **Food Category Pie Chart:** Shows the daily ratio of "Good" (green), "Maybe" (yellow), and "Bad" (red) ingredients. `<br>` - **Vertical Organic "Battery":** Shows the percentage of daily ingredients that were organic. `<br>` - **Dual-Bar System (per meal):** Visualizes the health and organic composition of each individual meal. |
| **Stools**   | 💩   | Record bowel movements for digestive health tracking.               | - **Daily Count:** A simple, large number showing total movements for the day.                                                                                                                                                                                                                                                               |
| **Symptoms** | ⚡   | Log physical or emotional symptoms and their severity.              | - **Daily Count:** A simple, large number showing total symptoms logged for the day.                                                                                                                                                                                                                                                         |

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
- **Account Recovery:** Local backup codes and security questions
- **Data Isolation:** Each user account has isolated IndexedDB database

**Security Considerations:**

- **Local Password Hashing:** bcrypt or similar for local password storage
- **Session Timeout:** Configurable auto-logout for security
- **Device Fingerprinting:** Optional device recognition for enhanced security
- **Rate Limiting:** Protection against brute force attacks on login

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

### 4. Data Structures (TypeScript Interfaces)

The following interfaces define the shape of the data stored in the application.

```typescript
// Inferred from app/page.tsx

interface Meal {
  id: string;
  name: string; // e.g., "Chicken Salad & more"
  time: string; // "HH:mm"
  date: string; // "yyyy-MM-dd"
  category: string;
  healthCategory?: "green" | "yellow" | "red" | "analyzing";
  ingredients?: Ingredient[];
  image?: string; // base64 data URL from camera
  notes?: string;
}

interface Ingredient {
  name: string;
  isOrganic: boolean;
  cookingMethod?: string; // "raw", "fried", "steamed", etc.
  healthCategory?: "green" | "yellow" | "red";
}

interface Liquid {
  id: string;
  name: string;
  time: string;
  date: string;
  amount: number; // in ml
  type: string; // "water", "coffee", etc.
  notes?: string;
  image?: string;
}

interface Symptom {
  id: string;
  name: string;
  severity: number; // 1-5
  time: string;
  date: string;
  notes?: string;
}

interface Stool {
  id: string;
  time: string;
  date: string;
  type: number; // Bristol Stool Scale 1-7
  color: string;
  consistency: string;
  notes?: string;
  image?: string;
}
```

### 5. Key Component Breakdown

#### 5.1. Data Layer Architecture

- **`lib/db.ts`**: **Centralized Data Layer** - Contains all Dexie.js database operations (`addMeal`, `getSymptoms`, `updateLiquid`, etc.). Components interact with data through these functions, not directly with Dexie.
- **`lib/hooks/`**: **Custom React Hooks** - Data-specific hooks that encapsulate `useLiveQuery` calls and business logic (e.g., `useTodaysMeals`, `useSymptomTrends`).

#### 5.2. UI Components

- **`app/page.tsx`**: **Main Layout Component** - Orchestrates the overall UI layout and handles routing between different views. Data operations are delegated to the data layer.
- **Dialogs (`components/add-*-dialog.tsx`)**: A suite of four highly specialized forms for manual data entry. They manage their own internal form state and call back to the data layer with complete data objects upon submission.
- **`components/camera-capture.tsx`**: A reusable, self-contained camera module. It handles the complexities of accessing the device camera, displaying the video stream, and capturing a frame. It is agnostic about _what_ is being captured, simply returning a base64 image string to the parent.

#### 5.3. Visualization Components

- `split-circular-progress.tsx`: Renders the two-part circle for the Liquids view.
- `food-category-progress.tsx`: Renders the three-part pie chart for the Foods view.
- `vertical-progress-bar.tsx`: Renders the "battery" for the daily organic total.
- `meal-composition-bar.tsx` & `
