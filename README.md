<div align="center">
  <h1>🧠 AI Interview Copilot</h1>
  <p><strong>Production-ready AI-powered mock interview platform for software engineers</strong></p>

  ![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
  ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?logo=fastapi)
  ![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
  ![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)
  ![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=github-actions)
</div>

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🤖 **AI Question Generation** | LLM-powered role-specific questions (DSA, System Design, OS, DBMS, CN) |
| 📊 **Real-time Evaluation** | Semantic scoring with strengths/weaknesses breakdown |
| 🎯 **Multi-Role Support** | SWE, Frontend, Backend, Data Analyst, ML, DevOps, System Design |
| 📈 **Analytics Dashboard** | Score trends, topic radar charts, interview history |
| 🔐 **JWT Authentication** | Secure login with access + refresh tokens |
| 🐳 **Docker Ready** | One-command deployment |
| ⚡ **CI/CD Pipeline** | GitHub Actions with automated testing & deployment |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React + Tailwind)              │
│  Landing | Auth | Dashboard | Interview | Feedback | Analytics │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / REST
┌────────────────────────▼────────────────────────────────┐
│                 NGINX (Reverse Proxy + SSL)               │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              FastAPI Backend (Python 3.11)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │   Auth   │ │Interview │ │Questions │ │Analytics │   │
│  │  Router  │ │  Router  │ │  Router  │ │  Router  │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       │            │             │             │          │
│  ┌────▼─────────────▼─────────────▼─────────────▼─────┐ │
│  │              Service Layer                           │ │
│  │  AuthService | InterviewService | EvaluationService │ │
│  └────────────────────┬────────────────────────────────┘ │
│                       │                                   │
│  ┌────────────────────▼──────────┐  ┌───────────────┐   │
│  │     SQLAlchemy ORM            │  │  AI Service   │   │
│  │  Repository Pattern           │  │  (Anthropic / │   │
│  └────────────────────┬──────────┘  │   OpenAI)     │   │
│                       │             └───────────────┘   │
└───────────────────────┼─────────────────────────────────┘
                        │
        ┌───────────────┼──────────────┐
        ▼               ▼              ▼
  ┌──────────┐   ┌──────────┐   ┌──────────┐
  │PostgreSQL│   │  Redis   │   │  Claude  │
  │   (DB)   │   │ (Cache)  │   │   API    │
  └──────────┘   └──────────┘   └──────────┘
```

---

## 📁 Project Structure

```
interview-copilot/
├── 📂 backend/
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Settings (env vars)
│   ├── database.py          # DB connection + session
│   ├── 📂 models/           # SQLAlchemy ORM models
│   │   └── __init__.py      # User, Interview, Question, Answer, Feedback
│   ├── 📂 routers/          # API route handlers
│   │   ├── auth.py          # Register, Login, JWT refresh
│   │   ├── interviews.py    # Create, list, complete interviews
│   │   ├── questions.py     # Question endpoints
│   │   ├── answers.py       # Answer submission + evaluation
│   │   └── analytics.py     # Dashboard stats + trends
│   ├── 📂 services/         # Business logic layer
│   │   ├── auth_service.py  # Auth business logic
│   │   ├── ai_service.py    # LLM integrations
│   │   ├── interview_service.py
│   │   └── evaluation_service.py
│   ├── 📂 schemas/          # Pydantic request/response models
│   └── 📂 utils/            # JWT, password hashing, logging
├── 📂 frontend/
│   └── src/                 # React + Tailwind application
├── 📂 .github/workflows/    # CI/CD pipeline
├── docker-compose.yml
└── README.md
```

---

## ⚡ Quick Start

### Option 1 — Docker (Recommended)
```bash
git clone https://github.com/yourusername/interview-copilot.git
cd interview-copilot
cp .env.example .env
# Edit .env with your API keys
docker compose up -d
# App runs at http://localhost:3000
```

### Option 2 — Local Development
```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Fill in values
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm start
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SECRET_KEY` | ✅ | JWT signing key (min 32 chars) |
| `ANTHROPIC_API_KEY` | ✅ | Claude API key |
| `OPENAI_API_KEY` | ⬜ | OpenAI key (alternative) |

---

## 📡 API Endpoints

```
POST   /api/auth/register       Create account
POST   /api/auth/login          Get JWT tokens
POST   /api/auth/refresh        Refresh access token
GET    /api/auth/me             Current user profile

POST   /api/interviews/         Create + generate questions
GET    /api/interviews/         List user interviews
GET    /api/interviews/:id      Interview details
POST   /api/interviews/:id/start       Start interview
POST   /api/interviews/:id/questions/:qid/answer  Submit answer
POST   /api/interviews/:id/complete    Complete + get report

GET    /api/analytics/dashboard  Dashboard stats
GET    /api/analytics/trends     Score over time
GET    /api/analytics/topics     Topic breakdown
```

---

## 🧠 AI Evaluation Scoring

```
Total Score = (Technical × 0.50) + (Communication × 0.30) + (Confidence × 0.20)

Technical Score   → Accuracy, depth of knowledge, completeness
Communication     → Clarity, structure, articulation
Confidence Score  → Definitiveness, lack of excessive hedging
```

---

## 🚀 Deployment

### Render / Railway
1. Connect GitHub repo
2. Set env variables in dashboard
3. Deploy backend (Python) + frontend (Node)
4. Add PostgreSQL addon

### AWS (EC2 + RDS)
```bash
# On EC2 instance
sudo apt install docker.io docker-compose-plugin -y
git clone https://github.com/yourusername/interview-copilot.git
cd interview-copilot && cp .env.example .env
# Set DATABASE_URL to RDS endpoint
docker compose up -d
```

---

## 📊 Database Schema

```sql
users           → id, email, username, hashed_password, stats
interviews      → id, user_id, role, difficulty, topics, scores, status
questions       → id, interview_id, topic, question_text, key_points
answers         → id, question_id, answer_text, scores, feedback
feedback_reports→ id, interview_id, summary, strengths, improvements
refresh_tokens  → id, user_id, token, expires_at, is_revoked
```

---

## 🏆 Resume Description

> **AI Interview Copilot** — Full-stack AI-powered mock interview platform built with **FastAPI**, **React**, and **PostgreSQL**, integrating **Claude/GPT APIs** for dynamic question generation and semantic answer evaluation. Features JWT authentication, real-time scoring across technical/communication/confidence dimensions, analytics dashboard with performance trends, and topic-wise radar analysis. Deployed via **Docker** + **GitHub Actions CI/CD**. Stack: Python · FastAPI · React · PostgreSQL · Redis · JWT · LLM APIs · Docker · GitHub Actions.

---

## 🔮 Future Roadmap

- [ ] Voice-based interview mode (Whisper API)
- [ ] Resume parsing + tailored questions
- [ ] Video interview with facial analysis
- [ ] Mock coding environment (Judge0 integration)
- [ ] Peer interview matching
- [ ] Company-specific question banks (Google, Amazon, Meta)
- [ ] Stripe subscription (Pro plan)
- [ ] Mobile app (React Native)

## 🚀 Live Demo
Coming soon...

## 🛠️ Tech Stack
- Frontend: React.js
- Backend: FastAPI (Python)
- Database: SQLite
- AI: Groq (LLaMA 3.3 70B)
- Auth: JWT

## ⚡ Features
- AI-powered interview questions
- Real-time answer evaluation
- Score breakdown (Technical/Communication/Confidence)
- Analytics dashboard
- 8 job roles supported
