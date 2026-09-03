# Real-Device Hardware Verification Logs — Samsung Galaxy

During the hackathon, we connected the application directly to a physical **Samsung Galaxy** smartphone over local Wi-Fi via Capacitor 7 live-reload. Rather than relying solely on desktop browser simulations, we tested every feature directly on the phone.

Below is the changelog of issues identified and resolved through real-device human verification:

---

### 1. Camera Punch-Hole & Status Bar Collision
- **Identified on Device**: The top brand bar collided with the Samsung camera cutout.
- **Root Cause**: Desktop viewports do not have physical notches or status bar overlays.
- **Fix Applied**: Added dynamic CSS safe-area insets:
  ```css
  padding-top: max(14px, env(safe-area-inset-top, 14px));
  ```
- **Result**: Fluid clearance below the camera punch-hole on all Android devices.

---

### 2. Gym Keyboard Typing Friction
- **Identified on Device**: Between lifting sets with sweaty hands, tapping on small number inputs popped up the virtual keyboard, obscuring the screen and causing input frustration.
- **Root Cause**: Traditional form-based UI assumes desktop keyboard or seated phone typing.
- **Fix Applied**: Replaced text input fields with 1-tap `±2.5kg` weight steppers and `±1 rep` steppers. Added automatic carry-forward from previous sets and rest timer countdown.
- **Result**: Zero typing needed during active workouts. 1 tap logs a set.

---

### 3. Workout Duration Adjustment & Past Session Recovery
- **Identified on Device**: If an athlete forgot to hit "Start Workout" at the gym or worked out without a phone, the timer started from zero when opening the app.
- **Root Cause**: Rigid session lifecycle without retrospective adjustment.
- **Fix Applied**: Added 1-tap manual duration chips (`[30m] [45m] [60m] [75m] [90m]`), `±5m` fine-tuning steppers, and a dedicated **"+ Log Past Workout"** flow.
- **Result**: Athletes can accurately log workouts anytime without timing pressure.

---

### 4. Cold-Boot White Screen Flash
- **Identified on Device**: When launching the app cold from the Android home screen, a harsh white splash screen flashed for ~300ms before our dark theme loaded.
- **Root Cause**: Native Android launch theme in `styles.xml` defaulted to white `@drawable/splash`.
- **Fix Applied**: Updated `styles.xml` launch theme to `#020617` (Dark Slate), configured `capacitor.config.json` SplashScreen plugin, and styled `index.html` root background.
- **Result**: 100% dark, smooth boot transition into the animated LockedIn quote screen.

---

### 5. Daily Quests Text Truncation
- **Identified on Device**: Long workout split titles pushed the quest completion status badge off the right edge of the phone screen.
- **Root Cause**: Flexbox children without explicit `min-w-0` overflow constraints.
- **Fix Applied**: Added `min-w-0 flex-1 pr-2` and `shrink-0` to the action badge.
- **Result**: Clean truncation on narrow mobile screens with no layout breakage.
