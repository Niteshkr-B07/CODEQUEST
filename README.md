# CODEQUEST ⚔️

An advanced, full-stack competitive coding and multi-round hackathon platform built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Node.js/Express**, and **Google Gemini AI**.

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-2.4-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌟 Key Highlights

- **Multi-Round Tournament Lifecycle**: End-to-end competition management across 4 distinct competitive rounds.
- **AI-Powered Code Analysis & Assistance**: Integrated with Google Gemini for intelligent feedback, hints, test-case synthesis, and plagiarism evaluation.
- **Active Anti-Cheat & Proctoring Engine**: Enforces fullscreen mode, tracks tab-switching violations, detects copy-paste attempts, and monitors proctoring snapshots.
- **Automated Sandboxed Code Execution**: Instant test-case verification across multiple programming languages with granular timing and memory tracking.
- **Real-Time Dynamic Leaderboard**: Automated qualification thresholds (Top-N and Cutoff scores), instant score calculation, and tie-breaking algorithms.
- **Comprehensive Admin Command Center**: Granular round scheduling, question/problem authoring, participant approval, live violation feeds, and full audit logging.

---

## 🏆 Competition Rounds

| Round | Format | Description | Evaluation Mode |
| :--- | :--- | :--- | :--- |
| **Round 1: Quiz Battle** | Timed Technical MCQ | Data structures, algorithms, system design, and complexity theory. | Instant scoring with negative marking support and detailed explanations. |
| **Round 2: Coding Battle** | Algorithmic Problem Solving | Array manipulation, dynamic programming, graph traversal, and optimization problems. | Sandboxed multi-language execution against public & hidden test suites. |
| **Round 3: Debugging Battle** | Code Defect Remediation | Identify and fix off-by-one errors, memory leaks, concurrency bugs, and broken logic. | Automated test validation against repaired source code. |
| **Round 4: Final Battle** | Championship Showdown | Advanced algorithmic challenges reserved exclusively for qualified finalists. | Multi-tier test verification, complexity benchmarks, and similarity checks. |

---

## 🛡️ Proctoring & Integrity System

- **Tab & Window Focus Tracking**: Logs tab switches, browser blurs, and backgrounding events with customizable penalty thresholds.
- **Fullscreen Enforcement**: Auto-detects fullscreen exits with configurable tolerance and automatic submission triggers.
- **Clipboard & Interaction Restrictions**: Prevents unauthorized copy-pasting of external solution code into the battle editor.
- **Webcam & Audio Device Monitoring**: Periodic snapshot capture and device availability checks.
- **Plagiarism & Similarity Detection**: AI-assisted code similarity scoring across submissions to flag dishonest entries.

---

## 💻 Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Visual Feedback**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)

### Backend & Storage
- **Runtime**: [Node.js](https://nodejs.org/) & [TSX](https://github.com/privatenumber/tsx)
- **Server Framework**: [Express 4](https://expressjs.com/)
- **Security**: Cryptographic password hashing (PBKDF2 with unique salts)
- **Data Persistence**: Local transactional datastore with automatic initialization and seeding
- **AI Engine**: Google GenAI SDK (`@google/genai`)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (or **bun** / **pnpm**)

### 1. Clone the Repository
```bash
git clone https://github.com/Niteshkr-B07/CODEQUEST.git
cd CODEQUEST
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```

Configure your `.env` variables:
```env
# Google Gemini API key for AI hints, analysis, and proctoring
GEMINI_API_KEY="your-gemini-api-key-here"

# Application host URL
APP_URL="http://localhost:3000"
```

### 4. Run Development Server
```bash
npm run dev
```

The application will be live at:
- **Web Client & API**: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Demo & Testing Credentials

The datastore automatically initializes pre-seeded demo accounts on first run:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@codequest.dev` | `Admin@12345` | Full administrative controls, round management, audit logs |
| **Participant 1** | `rahul@codequest.dev` | `Participant@123` | Active participant with sample submissions |
| **Participant 2** | `priya@codequest.dev` | `Participant@123` | Active participant |
| **Participant 3** | `aman@codequest.dev` | `Participant@123` | Active participant |

*You can also register a new participant account directly via the `/register` page.*

---

## 📁 Project Architecture

```
codequest/
├── data/                       # Local database storage & seed records
│   └── codebattle.json
├── src/
│   ├── components/             # Reusable UI components & layouts
│   ├── context/                # Global React state (Auth, Competition, Proctoring)
│   ├── hooks/                  # Custom React hooks (Timer, Proctoring, Anti-cheat)
│   ├── pages/                  # Main platform views
│   │   ├── admin/              # Administrative control center & management views
│   │   ├── CodingBattlePage    # IDE & code execution arena
│   │   ├── DebuggingBattlePage # Bug-hunting arena
│   │   ├── QuizBattlePage      # Timed MCQ battle view
│   │   ├── LeaderboardPage     # Real-time tournament standings
│   │   └── LandingPage         # Hero showcase & tournament info
│   ├── server/                 # Express backend API
│   │   ├── db/                 # Schema definitions & database operations
│   │   ├── routes/             # REST API endpoints (Auth, Rounds, AI, Admin, etc.)
│   │   └── services/           # Business logic & evaluation services
│   ├── types/                  # Shared TypeScript models & types
│   ├── App.tsx                 # Client routing & providers
│   ├── main.tsx                # Client application root
│   └── index.css               # Design system & Tailwind styling
├── server.ts                   # Express server bootstrap & Vite middleware integration
├── package.json                # Project dependencies & scripts
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite bundler configuration
```

---

## 📜 Available Scripts

- `npm run dev` - Starts the development server with Hot Module Replacement (HMR) and backend API.
- `npm run build` - Builds production-optimized frontend bundle into `dist/`.
- `npm run start` - Runs the production server via TSX.
- `npm run lint` - Runs TypeScript strict type validation (`tsc --noEmit`).
- `npm run preview` - Locally preview the production build.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
