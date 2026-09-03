# LockedIn — Team 11 (Current State of AI)

> *"Stay locked in all the time with LockedIn 🔒🔥"*  
> **Precision Nutrition Architecture • Gym Performance Logger • On-Device AI Intelligence**

---

## 🏆 Project Overview

**LockedIn** is a high-performance Athletic Operating System developed during the **Current State of AI Hackathon (Team 11)**. It addresses the common frustrations of modern fitness apps: excessive typing between gym sets, intrusive cloud subscription fees, and privacy leaks of sensitive health biometrics.

### 🌟 Key Capabilities
- **🥑 Precision Nutrition Engine**: Calorie budgeting based on athlete metrics, dynamic macro breakdown (Protein/Carb/Fat), 1-tap food logging, and AI craving/recipe architect.
- **🏋️ Active Gym Tracker (Strong / Hevy Grade)**: 1-tap `±2.5kg` weight & `±1 rep` steppers (eliminating keyboard fatigue during sweaty workouts), automatic rest timer, set carry-forward, and manual duration adjustments.
- **🤖 Coach Lock Neural AI**: Context-aware athletic coaching running locally on **Llama 3.2 3B (GPU accelerated)** with Groq Cloud LPU fallback. Zero cloud token bills and 100% on-device health privacy.
- **🏆 100% LockedIn Daily Quests**: Gamified daily completion engine tracking workouts, calorie targets, and nutrition logging.
- **📱 Native Android APK**: Packaged via Capacitor 7 with custom dark launch theme and branded launcher icons.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite, Tailwind CSS 3, Lucide Icons
- **Mobile Bridge**: Capacitor 7 (Android SDK 35)
- **Local AI Engine**: Llama 3.2 3B running via `llama-server` on local NVIDIA RTX 4060 GPU
- **Cloud AI Fallback**: Groq Cloud LPU API (Llama 3.3 70B)
- **Data Persistence**: Offline-First LocalStorage Sync

---

## 📊 Presentation & Deliverables

- 📄 **Presentation Poster (PDF)**: [`docs/presentation/LockedIn_Poster.pdf`](docs/presentation/LockedIn_Poster.pdf)
- 🖼️ **Presentation Poster (PNG)**: [`docs/presentation/LockedIn_Poster.png`](docs/presentation/LockedIn_Poster.png)
- 🌐 **Presentation Poster (HTML)**: [`docs/presentation/LockedIn_Poster.html`](docs/presentation/LockedIn_Poster.html)
- 📝 **Course Portfolio**: [`docs/portfolio_template.md`](docs/portfolio_template.md)
- 💻 **Application Code**: [`code/LockedIn/`](code/LockedIn/)

---

## 🚀 Quickstart

### Run Web Development Server
```bash
cd code/LockedIn
npm install
npm run dev -- --host
```

### Build Native Android APK
```bash
cd code/LockedIn
./build-apk.sh
```

---

## Course Materials & Documentation

- [`docs/playbook.md`](docs/playbook.md) — Course goals, weekly schedule, hackathon rules, demo day, and grading details
- [`docs/grading_rubric.md`](docs/grading_rubric.md) — Assessment criteria and exam grading rubric
- [`docs/portfolio_template.md`](docs/portfolio_template.md) — Submitted portfolio template with AI design principles, prompts, and tech stack
