# LockedIn — Codebase

This folder contains the complete source code for **LockedIn**, an Athletic Operating System combining precision nutrition, a gym workout logger, and on-device neural AI coaching.

## Project Structure

- `code/LockedIn/` — Root of the mobile web application and native Android project.
  - `src/` — React 18 application with Tailwind CSS 3 and Lucide icons.
    - `components/` — UI components:
      - `TrackerTab.jsx` — Today dashboard with calorie budget, macro balance, quick food logger, and 100% LockedIn Daily Quests.
      - `WorkoutTab.jsx` — Active gym logger with 1-tap ±2.5kg weight and ±1 rep steppers, automatic rest countdown, manual duration controls, and past workout logger.
      - `DietTab.jsx` — Meal planner with inline recipes and AI craving/recipe architect.
      - `AiStudioTab.jsx` — Coach Lock neural assistant with multi-sport coaching and custom diet/workout generator.
      - `BrandLogo.jsx` — Solid black badge with glowing flame and interlocking orange padlock.
      - `SplashScreen.jsx` — Animated dark startup screen with funny and motivational LockedIn quotes.
      - `Header.jsx` & `BottomNav.jsx` — Mobile navigation with safe-area notch clearances.
    - `services/groq.js` — Dual AI inference client: local Llama 3.2 3B GPU (`127.0.0.1:8080`) with Groq Cloud LPU fallback.
  - `android/` — Capacitor 7 native Android wrapper configured with custom launcher icons and dark launch theme.
  - `public/` — PWA icons, manifest, and web assets.
  - `build-apk.sh` — One-command script to build the production Android APK.
  - `start-local-ai.sh` — Helper script to launch local `llama-server` on GPU.

## Running the Application

### 1. Web Development Server (with Live Reload)
```bash
cd code/LockedIn
npm install
npm run dev -- --host
```

### 2. Building Native Android APK
```bash
cd code/LockedIn
./build-apk.sh
```
The compiled APK will be output to `android/app/build/outputs/apk/debug/app-debug.apk`.

### 3. Running Local Neural AI (Optional)
```bash
cd code/LockedIn
./start-local-ai.sh
```
If the local server is offline, the app automatically falls back to Groq Cloud API or deterministic heuristics.
