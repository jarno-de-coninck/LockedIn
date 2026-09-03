# **Portfolio Current State of AI — Team 11**

| **Student 1** | Jarno de Coninck |
|---------------|------------------|
| **Student 2** | [Team Member]    |

## Project Name: **LockedIn**
> *"Stay locked in all the time with LockedIn 🔒🔥"*  
> Precision Nutrition Architecture • Gym Performance Logger • On-Device AI Intelligence

---

## Summaries (individual)

*For every guest lecture make a summary (individually) and combine them later. Use this structure to make the summary.*

### Lecture 1
1. **Summary**: [Your summary here]
2. **Key insights**: [Key takeaways]
3. **Questions**: [Open questions]

### Lecture 2
1. **Summary**: [Your summary here]
2. **Key insights**: [Key takeaways]
3. **Questions**: [Open questions]

---

## You, Human, Technology and AI (individual)

*In 250–300 words, describe (individually) your position on the relationship between humans, technology, and AI. Support your argument with reasoning from the guest lectures, supplemented by sources you found yourself (use APA notation to reference these sources).*

[Individual text here]

---

## Design Principles for working with AI (as a group)

Based on our intensive hackathon build and real-device testing, we established these 10 design principles for working with AI:

1. **Test on Real Glass, Not Just the Browser.**  
   *AI generates web views that look fine on a desktop viewport. But real fingers on physical mobile screens reveal edge cases like keyboard overlap, tiny tap targets, and camera punch-hole collisions immediately.*

2. **Always Understand Before You Merge.**  
   *If you cannot explain what the generated code does line by line, you don't own it. Read every diff, verify state flow, and refuse black-box code.*

3. **Treat AI as a Pair Programmer, Not an Oracle.**  
   *The human directs the vision, user experience priorities, and constraints; the AI executes the syntax, scaffolding, and boilerplate.*

4. **Zero Spreadsheet UX on Mobile.**  
   *AI tends to reach for text inputs and tables. In real physical environments (like between gym sets), replace text inputs with 1-tap increment steppers, presets, and sliders.*

5. **Hardware Constraints Over Artificial Logic.**  
   *Respect physical device realities: safe-area insets, notch geometry, offline connectivity, and battery consumption must guide the architecture from day one.*

6. **Prioritize On-Device Intelligence & Privacy.**  
   *Sensitive personal health data (body biometrics, nutrition intake, training logs) should run locally whenever possible. Use local edge models (Llama 3.2 3B) rather than streaming private data to remote cloud servers.*

7. **Iterative Verification Over Monolithic Prompts.**  
   *Break complex features into small, testable increments. Build the data layer first, verify live, then layer the UI, and finally add edge-case handling.*

8. **Fail Softly with Deterministic Fallbacks.**  
   *Never let an AI failure crash the app. If the local neural model is offline or slow, gracefully fall back to cloud LPU inference, and if offline, fall back to heuristic algorithms.*

9. **Human Taste Sets the Standard.**  
   *AI produces generic, robotic placeholder text and clichés. Human curation is essential to give the app personality, humor, and authentic brand voice.*

10. **Automate the Build Pipeline Early.**  
    *Do not wait until the last hour to test native packaging. Keep native build scripts (`./build-apk.sh`, Gradle sync) running and passing continuously.*

---

## Tech Stack & Workflow (as a group)

### Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite | Fast HMR (hot module replacement), lightweight bundle, sub-second reload over Wi-Fi. |
| **Styling** | Tailwind CSS 3 | Utility-first styling with responsive breakpoint controls and custom dark theme. |
| **Icons** | Lucide React | Lightweight SVG icon system with consistent stroke weights. |
| **Mobile Runtime** | Capacitor 7 (Android) | Direct native bridge allowing web code to compile into installable Android APKs. |
| **Local Neural AI** | Llama 3.2 3B via llama.cpp | On-device GPU inference (running on local NVIDIA RTX 4060 GPU) with zero token costs and complete offline privacy. |
| **Cloud AI Fallback** | Groq Cloud LPU (Llama 3.3 70B) | High-speed cloud fallback for when the user is outside the local network. |
| **Data Persistence** | Offline LocalStorage | Immediate local state sync with zero cloud database dependency. |

### AI Workflow & Tooling

Our development workflow was structured into a **Dual-Loop Agentic Pipeline**:

1. **Specification Loop (Human Direction)**: We formulated high-level athlete requirements, UX pain points (e.g., "typing weight on a tiny keyboard between sets is annoying"), and visual themes.
2. **Agentic Synthesis Loop (Autonomous AI Coding)**: The AI coding agent analyzed the codebase, planned component architecture, wrote clean React and CSS code, and updated Gradle build configurations.
3. **Live Hardware Verification Loop (Human-in-the-Loop)**: The application was connected over local Wi-Fi to a physical Samsung Galaxy smartphone. As code saved, Vite hot-reloaded the UI on the phone in real time. We physically tested tap targets, keyboard dismissals, and camera notch padding.
4. **Native Compilation Loop**: One-command Gradle build pipeline (`./build-apk.sh`) compiled the project into a release-ready Android APK (`LockedIn.apk`) with custom launcher icons and a dark cold-boot screen.

---

## Prompting (as a group)

The 5 most pivotal prompts used during the development of LockedIn:

### 1. The Active Gym Logger Architecture Prompt
> *"On the start workout screen it's still ugly with white bars. Having to type the weight per exercise is annoying on a phone with sweaty hands. Redo that entire page: research UX and UI from apps like Strong and Hevy, add 1-tap ±2.5kg steppers, rest timers, and carry-forward previous weights."*

### 2. The Physical Device Safe-Area Clearance Prompt
> *"On the active workout screen, there is an awkward gap under the logo and the top is colliding with the camera notch on Samsung Galaxy. Make the HUD sticky and use CSS env(safe-area-inset-top) so it sits cleanly below the status bar."*

### 3. The On-Device Neural Assistant Prompt
> *"Coach Lock should run locally on our laptop's RTX 4060 GPU using Llama 3.2 3B via llama-server on port 8080, with Groq cloud as a high-speed fallback. Make sure the user never gets an offline error and that the prompt context includes the athlete's sport, target calories, and logged meals."*

### 4. The Daily Quests Gamification Prompt
> *"I want it to be more pretty and satisfying when you finish everything you had to do today. Create a Daily Quests system for workout, calories, and meals with an emerald and gold completion HUD when 100% Locked In."*

### 5. The Brand Identity & Presentation Poster Prompt
> *"Design a cohesive brand logo with a black background, glowing orange flame, and interlocking padlock. Also generate a print-ready company presentation poster in PDF, PNG, and HTML detailing our tech stack, the AI agent workflow, and human verification."*

---

## Feedback from experts (as a group)

*To be completed during Demo Day at the JRCZ:*

1. **AI Usage**: [Score & Summary of expert feedback]
2. **Tech Stack & Coding Standards**: [Score & Summary of expert feedback]
3. **Business Value**: [Score & Summary of expert feedback]
4. **User Experience**: [Score & Summary of expert feedback]
