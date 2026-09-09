# Smart Campus AI 🎓

An AI-Powered Intelligent College Management Ecosystem. Designed with a premium, responsive SaaS UI/UX (inspired by Linear, Vercel, and Stripe) that centralizes academics, placements, events, and advanced AI-powered student assistance.

---

## 🚀 Key Features

- **Intelligent Assistant Hub**: Multi-tab AI panel powered by Gemini API:
  - **Academic Chat**: ChatGPT-style study buddy.
  - **Study Planner**: Auto-generate personalized timetables.
  - **Notes Summarizer**: Extract key concepts and Q&A from PDFs.
  - **Interactive Quizzer**: Custom MCQ generator with scoring.
  - **Placement Helper**: Skill-gap analysis, interview prep, and career advice.
- **Academics & Timetables**: Dynamic subject schedules, interactive marks logging, and results analytics.
- **Attendance Monitoring**: Rich visual charts showing attendance percentage indicators with automatic low-attendance warnings.
- **Placement Cell**: Career portal mapping active corporate postings, company profiles, and application statuses.
- **Events & Coordination**: QR-check-ins and interactive event registration.
- **Role-Based Portals**: Personalized dashboards for **Students**, **Faculty** (grading, attendance taking), and **Admins** (system analytics, user/department CRUDs).

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Asynchronous python)
- **Database ORM**: SQLAlchemy 2.0 with a dynamic connection check:
  - **MySQL (Production-ready)**: Supported when configured.
  - **SQLite (Local dynamic fallback)**: Auto-initiates locally via `aiosqlite` if no MySQL server is running.
- **Auth**: Direct Bcrypt hashing with JWT tokens.
- **AI Integrations**: Google Generative AI SDK (Gemini API).

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Data Visualizations**: Recharts

---

## 📂 Project Structure

```
smart-campus-ai/
├── backend/
│   ├── app/
│   │   ├── models/        # Database models (User, Academics, Placements, etc.)
│   │   ├── routes/        # Router files (/auth, /ai, /placements, /students, etc.)
│   │   ├── services/      # Gemini AI and Authentication logic
│   │   ├── middleware/    # Auth and Role validations
│   │   └── main.py        # FastAPI Entrypoint
│   ├── create_tables.py   # Database creation script
│   ├── seed_data.py       # Seeding script with dummy credentials
│   └── requirements.txt   # Python packages
│
└── frontend/
    ├── src/
    │   ├── api/           # Axios instance configuration
    │   ├── components/    # Common layouts, charts, and routing components
    │   │   ├── ui/        # Premium UI library (Button, Modal, Card, tabs, etc.)
    │   │   └── charts/    # Analytics components using Recharts
    │   ├── context/       # Authentication and Theme states
    │   ├── pages/         # Page templates (Login, AIAssistant, Placements, etc.)
    │   ├── types/         # TypeScript interfaces
    │   └── main.tsx       # React Client Root
    ├── tailwind.config.js # Extended Premium Design Tokens
    └── vite.config.ts     # Vite Config with path alias mapping (@/*)
```

---

## ⚡ Setup & Run

### 1. Database Setup
1. In the `backend/` folder, create a `.env` file containing your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```
2. Create and seed the database tables:
   ```bash
   cd backend
   .\venv\Scripts\python.exe create_tables.py
   .\venv\Scripts\python.exe seed_data.py
   ```
   *Note: If you have no local MySQL instance running on port 3306, it will automatically create a local `smartcampus.db` SQLite file.*

### 2. Run the Backend
```bash
uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

### 3. Run the Frontend
1. Navigate to the `frontend/` folder.
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## 🔑 Demo Credentials

Use the following seeded accounts to sign in:

| Role | Email | Password |
|---|---|---|
| **Student** | `student1@campus.com` | `password123` |
| **Faculty** | `faculty1@campus.com` | `password123` |
| **Admin** | `admin@campus.com` | `password123` |
