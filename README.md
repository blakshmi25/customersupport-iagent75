# Customer Support Intelligent Agent — AI-Powered Customer Service System

A modern, responsive, full-stack customer support platform featuring intelligent knowledge base grounding, automated ticket creation, real-time ticket tracking, customer satisfaction ratings, and an operations admin dashboard.

---

## 🌟 Key Features

1. **AI Chatbot with Strict Grounding**
   - Grounded strictly in official FAQ knowledge base snippets to prevent hallucination of fake order numbers, unapproved refunds, or unauthorized account modifications.
   - Powered by **Gemini 3.8 Flash** (`gemini-3.8-flash`) when configured, with seamless fallback to semantic FAQ matching if offline or when running in demo mode.
   - One-click **Escalate to Support Ticket** button that transfers conversation context directly to human support engineers.

2. **Categorized & Searchable Knowledge Base**
   - Five core categories: **Orders**, **Payments**, **Refunds**, **Account**, and **Technical Issues**.
   - Real-time search, accordion answers, and interactive helpful/not helpful feedback voting.

3. **Support Ticket Lifecycle & Real-Time Tracking**
   - Automatic unique Ticket ID generation (e.g. `TK-2026-10492`).
   - Secure tracking via Ticket ID + Customer Email verification.
   - Interactive timeline, status badges (**Open**, **In Progress**, **Resolved**), and customer reply thread.

4. **Operations Admin Console**
   - Summary metric KPI cards (Total, Open, In Progress, Resolved, Average CSAT).
   - Ticket management with status & category filters, full conversation history, internal resolution notes, and agent reply capabilities.
   - FAQ article manager with Add, Edit, and Delete operations.
   - Interactive analytics charts and customer review log.

5. **Customer Satisfaction (CSAT) Feedback**
   - 1 to 5 star ratings, experience tags, and optional comments.
   - Real-time sentiment metrics reflected in the Admin dashboard.

6. **Interactive API Documentation**
   - Built-in **Swagger UI** available at `/docs` (and `/api/docs`).
   - Standard OpenAPI 3.0 specification available at `/api/openapi.json`.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons.
- **Backend (Python FastAPI)**: FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn, Python-Jose (JWT), Passlib (Bcrypt).
- **Full-Stack Node Runtime**: Express 4, `better-sqlite3`, `@google/genai` SDK, `jsonwebtoken`, `bcryptjs`, Vite 8.
- **Database**: SQLite 3 (`support.db`) with WAL mode enabled.

---

## 🔑 Default Credentials

- **Admin Email**: `admin@supportagent.io`
- **Admin Password**: `Admin@2026!`
- *(A 1-click demo login button is also provided on the Admin sign-in screen for instant access)*

---

## 🚀 Running the Application Locally

### Option A: Full-Stack Web Application (Node + React + Express + SQLite)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY (optional, fallback FAQ mode active if omitted)
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   - Open [http://localhost:3000](http://localhost:3000) in your browser.
   - Open [http://localhost:3000/docs](http://localhost:3000/docs) for the interactive Swagger UI.

---

### Option B: Standalone Python FastAPI Backend

1. **Navigate to the Backend Directory & Install Dependencies**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Seed Initial Database**:
   ```bash
   python seed.py
   ```

3. **Start the FastAPI Server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   - FastAPI REST API will be running at [http://localhost:8000](http://localhost:8000)
   - Interactive Swagger documentation at [http://localhost:8000/docs](http://localhost:8000/docs)
