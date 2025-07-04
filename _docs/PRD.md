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

| Category | Icon | Purpose | Key Visualizations
|-----|-----|-----|-----
| **Liquids** | 💧 | Track hydration, differentiating between water and other beverages. | - **Split Circular Progress:** Shows progress towards a daily water goal vs. total intake of other liquids.
| **Foods** | 🍽️ | Log meals and their constituent ingredients. | - **Food Category Pie Chart:** Shows the daily ratio of "Good" (green), "Maybe" (yellow), and "Bad" (red) ingredients. `<br>` - **Vertical Organic "Battery":** Shows the percentage of daily ingredients that were organic. `<br>` - **Dual-Bar System (per meal):** Visualizes the health and organic composition of each individual meal.
| **Stools** | 💩 | Record bowel movements for digestive health tracking. | - **Daily Count:** A simple, large number showing total movements for the day.
| **Symptoms** | ⚡ | Log physical or emotional symptoms and their severity. | - **Daily Count:** A simple, large number showing total symptoms logged for the day.


#### 2.1. Data Entry Methods

- **Quick Capture (Camera):** The primary interaction for Liquids, Foods, and Stools. Tapping the corresponding icon in the bottom navigation opens the camera. A photo is taken, and a placeholder entry is created with a status like "Analyzing...".
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

The AI analysis follows an **ephemeral processing** model that maintains privacy:

1. **Capture:** User takes photo on frontend
2. **Ephemeral Processing:** Frontend sends image to Vercel serverless function
3. **AI Analysis:** Function calls external AI API (GPT-4o, Claude Vision, etc.)
4. **Structured Response:** AI returns JSON matching our data interfaces
5. **No Persistence:** **Critical** - Server function processes data without storing it
6. **Local Storage:** Frontend receives structured data and saves to IndexedDB

**Key Privacy Principles:**
- Server functions are stateless and ephemeral
- No user data logged or persisted on servers
- All processing happens in memory and is immediately discarded
- User data only exists on their device and in transit during analysis

**Security & Performance Considerations:**
- **API Security:** AI API keys stored as server-side environment variables only
- **Rate Limiting:** IP-based rate limiting on `/api/analyze` endpoint to prevent abuse
- **Data Validation:** **Zod** schema validation for all AI responses before client processing
- **Error Handling:** Graceful fallbacks when AI analysis fails or returns malformed data

#### 3.3. Future Architecture Considerations

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
  id:string;
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
- **`components/camera-capture.tsx`**: A reusable, self-contained camera module. It handles the complexities of accessing the device camera, displaying the video stream, and capturing a frame. It is agnostic about *what* is being captured, simply returning a base64 image string to the parent.

#### 5.3. Visualization Components
- `split-circular-progress.tsx`: Renders the two-part circle for the Liquids view.
- `food-category-progress.tsx`: Renders the three-part pie chart for the Foods view.
- `vertical-progress-bar.tsx`: Renders the "battery" for the daily organic total.
- `meal-composition-bar.tsx` & `organic-composition-bar.tsx`: The two small horizontal bars used in each food entry to provide at-a-glance composition details.

### 6. Future Development & Brainstorming Areas

This section outlines potential paths for evolving the application.

#### 6.1. Tier 1: Core Functionality Enhancements

- **Real AI Integration:**

- **Objective:** Replace the `setTimeout` simulation with a real AI backend.
- **Implementation:** Privacy-preserving serverless functions
- **Steps:**

1. Create a Next.js API Route (e.g., `app/api/analyze/route.ts`).
2. The client will `POST` the base64 image data to this route.
3. The API route will call a multimodal AI model (e.g., GPT-4o, Claude Vision).
4. The prompt will instruct the AI to return a structured JSON object matching our interfaces (e.g., `{ ingredients: [{ name: "lettuce", ... }], ... }`).
5. **Critical:** The function processes data ephemerally without persistence.
6. The client will update the placeholder entry with the AI's response and save to IndexedDB.

- **Enhanced Local Storage:**

- **Objective:** Migrate from `localStorage` to IndexedDB for robust local data management.
- **Technology:** **Dexie.js** library with **`dexie-react-hooks`** for reactive state management.
- **Benefits:** Support for complex queries, better performance, larger storage capacity, automatic UI updates.
- **Steps:**

1. Install and configure Dexie.js and dexie-react-hooks
2. Create `lib/db.ts` with centralized database operations
3. Define database schema matching TypeScript interfaces
4. Replace all `localStorage` calls with Dexie operations
5. Implement `useLiveQuery` hooks for reactive data binding
6. Create custom hooks for common data operations
7. Implement data export/import functionality
8. Add data migration utilities for existing localStorage users

- **Data Export/Import System:**

- **Objective:** Enable users to backup and migrate their data.
- **Features:**

- Export complete dataset as JSON file
- Import previously exported data
- Data validation and conflict resolution
- Backup scheduling and reminders

#### 6.2. Tier 2: Feature Expansion

- **Dedicated Insights/Analytics Page:**

- **Objective:** Provide users with actionable insights from their local data.
- **Features:**

- **Local Correlation Engine:** Client-side analysis of patterns (e.g., "Headache logged 4 times this week, 3 within 2 hours of coffee consumption")
- **Trend Charts:** Local visualization of symptom severity, water intake, food ratios over time
- **Privacy-Preserving Scorecards:** Weekly "Body Compass" scores calculated locally

- **Notifications & Reminders:**

- **Objective:** Increase user engagement through PWA notifications.
- **Features:**

- Browser-based push notifications for logging reminders
- Offline-capable reminder system
- Customizable notification preferences

- **Settings & Personalization:**

- **Objective:** Allow users to customize the app experience.
- **Features:**

- Personal goals and targets (stored locally)
- Known allergies and sensitivities database
- Custom dashboard layouts and preferences
- Data retention and cleanup settings

#### 6.3. Tier 3: Advanced Features (Requires Careful Privacy Consideration)

- **Optional Multi-Device Sync:**

- **Objective:** Enable data synchronization across user devices.
- **Approach:** End-to-End Encryption with user-controlled keys
- **Technology:** Supabase or similar with E2EE implementation
- **User Choice:** Opt-in feature with clear privacy implications

- **Healthcare Provider Integration:**

- **Objective:** Allow users to share data with healthcare providers.
- **Approach:** Temporary, encrypted data sharing with explicit consent
- **Features:**

- Generate shareable reports from local data
- Time-limited access tokens
- Granular permission controls

#### 6.4. Technical Infrastructure Evolution

- **Progressive Enhancement:**

- **Current:** PWA with local storage
- **Next:** Enhanced PWA with Capacitor for native features
- **Future:** Hybrid approach with optional cloud sync

- **AI Model Options:**

- **Current:** External API calls (OpenAI, Anthropic)
- **Future:** On-device AI models for complete privacy
- **Consideration:** WebAssembly-based inference for sensitive analysis

---