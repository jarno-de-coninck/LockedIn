# 🔒 LockedIn — Athletic Fitness & Nutrition Super-App

**LockedIn** is a modern, mobile-first athletic fitness & nutrition web app built with React (Vite), Tailwind CSS, and local GPU-accelerated AI via `llama.cpp` on NVIDIA RTX 4060 (with Groq Cloud support).

---

## 🚀 Key Features

### 1. 👤 Athlete Profile & Biometrics
- **Profile Modal**: Configure **Gender**, **Height (cm)**, **Weight (kg)**, and **Calorie Goal**.
- **Live BMI Engine**: Auto-calculates your BMI with category badges (*Healthy / Athletic / Normal*).
- **AI Engine Diagnostics**: Select between Local `llama.cpp` (GPU accelerated), Groq Cloud, or offline fallback with interactive connection testing.

### 2. 📖 Recipes & Culinary Nutrition
- **Step-by-Step Recipes**: Every meal in your AI diet plan comes with exact **ingredients**, **quantities**, **prep time**, and **cooking instructions**.
- **Interactive Checklist**: Check off ingredients as you prepare your meals.
- **Macro Breakdown**: Exact grams for Protein, Carbs, Fats, and Calories.

### 3. 🏋️‍♂️ Clear Training Programs & Workout Tracker
- **Active Program Header**: Displays your current program (e.g. *🎾 4-Day Tennis Agility & Power Split* or *🏋️‍♂️ 4-Day Upper / Lower Split*).
- **7-Day Plan Roadmap**: Clear day-by-day schedule with planned drills, sets, reps, and one-tap **"Start Workout"** buttons.
- **Hevy-Style Set Logger**: Live sets table (`SET`, `LOAD`, `REPS`, `DONE ✓`) with automatic **60s rest countdown timer**.
- **Searchable Exercise Database**: 50+ preloaded exercises across Weightlifting, Tennis, Running, MMA + Custom Exercise Creator.

### 4. 📊 Today (Daily Mission Cockpit)
- **Today's Mission Plan**: Clear status of **What to Eat** (Breakfast, Lunch, Dinner, Snack) and **What to Train Today**.
- **Net Energy Balance**: $\text{Food Consumed} - \text{Exercise Burned} = \text{Net Remaining}$.

### 5. ✨ AI Studio (Combined AI Center)
- **🥗 Diet Plan Architect**: Generates 4-meal daily roadmaps with full recipes.
- **🏋️‍♂️ Training Architect**: Single-session and 7-day periodized schedules for Tennis, Weightlifting, Running, MMA, and Cycling.
- **🤖 Coach Lock**: Conversational athletic director and sports nutritionist.

---

## 💻 Local AI Setup (llama.cpp on RTX 4060 GPU)

1. **Start Local AI Server**:
   ```bash
   npm run local-ai
   ```
2. **Start Web App**:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173`.
