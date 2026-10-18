# Nirantar v3 — Local Setup & Deployment Guide

This guide walks through setting up the complete **Nirantar v3** platform on Windows, macOS, or Linux.

---

## 1. Prerequisites

Make sure the following runtimes are installed on your system:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org))
- **Python**: v3.10 or higher ([Download Python](https://python.org))
- **Git**: v2.30 or higher
- **MongoDB**: Access to a MongoDB instance (MongoDB Atlas cloud cluster or local `mongodb://localhost:27017/nirantar`)

---

## 2. Architecture Overview & Ports

| Service | Runtime / Framework | Directory | Default Port | Health Check |
|---------|---------------------|-----------|--------------|--------------|
| **Main Backend** | Node.js + Express + Mongoose | `/backend` | `5000` | `http://localhost:5000/api/v1/health` |
| **AI Microservice** | Python + FastAPI + Uvicorn | `/ai-service` | `8000` | `http://localhost:8000/health` |
| **Frontend Web App**| React + Vite + Tailwind CSS | `/frontend` | `5173` | `http://localhost:5173` |

---

## 3. Step-by-Step Installation

### Step 3.1: Environment Configuration

Copy the example environment files for each service:

#### Backend (`/backend/.env`)
Create or edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://nitishgupta789744_db_user:gum56qyYMyf25zc3@cluster0.ccmfj79.mongodb.net/nirantar?retryWrites=true&w=majority
JWT_SECRET=nirantar_v3_super_secret_jwt_key_2026_healthcare_secure
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8000
AI_INTERNAL_SECRET=nirantar_internal_ai_secret_key_2026
CORS_ORIGIN=http://localhost:5173
```

#### AI Microservice (`/ai-service/.env`)
Create or edit `ai-service/.env`:
```env
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=development
INTERNAL_SECRET=nirantar_internal_ai_secret_key_2026
OPENAI_API_KEY=your_openai_api_key_optional_here
OPENAI_MODEL=gpt-4o-mini
```
*(Note: If `OPENAI_API_KEY` is not provided, the AI service seamlessly switches to deterministic clinical rule-based reasoning without failing).*

#### Frontend (`/frontend/.env`)
Create or edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

### Step 3.2: Main Backend Setup (Node.js)

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the automated seed script to populate synthetic patients, facilities, villages, and baseline risk scores:
   ```bash
   npm run seed
   ```
   *Expected Output: `✅ Successfully seeded Nirantar v3 database with 35 patients and live clinical metrics!`*
4. Run automated test suite:
   ```bash
   npm test
   ```
   *Expected Output: `PASS tests/nirantar.test.js (10/10 passed)`*
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   Backend will be listening on `http://localhost:5000`.

---

### Step 3.3: AI Microservice Setup (Python FastAPI)

1. Open a new terminal and navigate to `ai-service/`:
   ```bash
   cd ai-service
   ```
2. Create and activate a Python virtual environment:
   - **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run automated unit tests:
   ```bash
   pytest
   ```
   *Expected Output: `6 passed in 1.5s`*
5. Start the FastAPI microservice:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   AI microservice will be listening on `http://localhost:8000`.

---

### Step 3.4: Frontend Setup (React + Vite)

1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Verify production build:
   ```bash
   npm run build
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Frontend will open at `http://localhost:5173`.

---

## 4. Root Orchestration (All-in-One)

From the project root directory `Nirantar/`, you can manage all services simultaneously:

```bash
# Install all root dependencies
npm install

# Run backend and frontend concurrently
npm run dev

# Or run using Docker Compose
docker-compose up --build
```

---

## 5. Pre-Configured Demo Credentials

The login page includes **1-click quick-fill buttons** for instant evaluation across all 4 user roles:

| Role | Name | Email | Password |
|------|------|-------|----------|
| **Healthcare Worker (ASHA)** | Sunita Devi | `asha.sunita@nirantar.org` | `worker123` |
| **Hero Patient** | Ramesh Kumar (PAT-1001) | `ramesh.kumar@patient.nirantar.org` | `patient123` |
| **Family Caregiver** | Suresh Kumar | `caregiver.suresh@nirantar.org` | `caregiver123` |
| **PHC Administrator** | Dr. Anita Verma | `admin@nirantar.org` | `admin123` |

---

## 6. Verifying the End-to-End System

1. Open `http://localhost:5173` in your browser.
2. Click **"ASHA Worker Demo"** and log in as Sunita Devi.
3. Observe **Ramesh Kumar (PAT-1001)** with an elevated risk score of **77/100 (HIGH)**.
4. Click **"Explain Risk"** to inspect the AI clinical breakdown.
5. Log out and click **"Patient Demo"** to log in as Ramesh Kumar.
6. Click **"Weekly Check-In"**, select **"I have symptoms or concerns"**, select **"Cannot travel to clinic"**, and submit.
7. Switch back to **"ASHA Worker Demo"**: see the newly created **"Doorstep Delivery"** rescue task in the intervention queue.
8. Click **"Complete Intervention"** and log a successful delivery outcome.
9. Switch to **"District Admin Demo"**: inspect the updated **"What Works"** effectiveness table showing 89%+ success rate for doorstep deliveries.
