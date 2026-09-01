# CareFlow - Full-Stack Healthcare SaaS Platform

CareFlow is a modern, enterprise-grade healthcare appointment booking, electronic clinical consultation, and medication management platform built with React, Node.js, Express, and MongoDB.

> [!IMPORTANT]
> **Demo Data Notice:** Demo doctors are synthetic data for development and demonstration.
> Synthetic profiles utilize non-real registration identifiers (`DEMO-REG-...`) and do not represent genuinely certified professionals. The Admin Portal includes full administrative controls to verify, update, or replace demo profiles with certified practitioners.

---

## 1. Project Overview

CareFlow provides a streamlined digital experience for patients, healthcare providers, and clinical administrators:
- **Patients**: Explore verified specialists by clinical domain, reserve consultation slots with real-time 5-minute holds, obtain AI pre-visit symptom triage, review doctor EHR summaries, and manage multi-frequency medication schedules with automated reminders.
- **Doctors**: Manage daily clinical queues, conduct consultations with structured diagnosis and clinical observations, prescribe electronic medications, and view AI-assisted post-visit summaries.
- **Administrators**: Review doctor verification credentials, oversee platform KPIs and bookings, manage doctor leave with live conflict previews, and administer medical registries.

---

## 2. System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 Client Layer (React + Vite)                │
│  - Tailwind CSS + Radix UI + Framer Motion                  │
│  - Responsive Viewports: 1440px / 1024px / 768px / 390px    │
│  - Axios HTTP-only Secure Cookie Transport                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / HTTPS / Cookie
┌──────────────────────────────▼──────────────────────────────┐
│             API Gateway & Security Layer (Express)          │
│  - Helmet HTTP Headers & Secure CORS                        │
│  - Multi-tier Rate Limiting & Centralized Error Handler     │
│  - JWT Authentication & Role-Based Access Control (RBAC)    │
│  - IDOR Prevention & Zod Request Body Validation            │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  Domain APIs │        │ AI Services  │        │ Integrations │
│  - Auth      │        │ - Pre-Visit  │        │ - Google     │
│  - Doctors   │        │   Triage     │        │   Calendar   │
│  - Appts     │        │ - Post-Visit │        │ - Nodemailer │
│  - Leaves    │        │   Care Plan  │        │ - Node-Cron  │
└──────┬───────┘        └──────┬───────┘        └──────┬───────┘
       │                       │                       │
┌──────▼───────────────────────▼───────────────────────▼──────┐
│                  Database Layer (MongoDB)                    │
│  - Compound Unique Indexes (Double-Booking Prevention)       │
│  - 5-Minute Hold TTL Expiration Engine                       │
│  - Secure Field Projections & Relationship Population        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Technologies

- **Frontend**: React 18, Vite 5, Tailwind CSS v4, Radix UI Primitives, Framer Motion, React Router v6, Lucide React, Axios, React Hook Form, Zod.
- **Backend**: Node.js, Express.js, MongoDB, Mongoose 8, JSON Web Tokens (JWT), Helmet, Express Rate Limit, Cookie-Parser.
- **AI & Integrations**: Google Gemini API (`gemini-1.5-flash`), Google Calendar API (OAuth 2.0), Nodemailer (SMTP), Node-Cron.

---

## 4. Local Setup

### Prerequisites
- Node.js `>= 18.0.0`
- MongoDB Server running locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/careflow.git
cd careflow

# Backend Installation
cd backend
npm install
cp .env.example .env

# Frontend Installation
cd ../frontend
npm install
cp .env.example .env
```

---

## 5. Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | API Server listening port | `5000` |
| `NODE_ENV` | Runtime environment | `development` or `production` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://127.0.0.1:27017/careflow` |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | `your_super_secret_jwt_signing_key` |
| `CLIENT_URL` | Primary frontend web client URL | `http://localhost:5173` |
| `TRUSTED_ORIGINS` | Comma-separated CORS allowed domains | `http://localhost:5173,https://careflow.domain.com` |
| `GEMINI_API_KEY` | Google Gemini AI API key | `AIzaSy...` |
| `EMAIL_HOST` | SMTP server hostname | `smtp.sendgrid.net` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username | `apikey` |
| `EMAIL_PASSWORD` | SMTP password / API token | `SG.your_api_key` |
| `EMAIL_FROM` | Sender address | `CareFlow <notifications@domain.com>` |
| `GOOGLE_CLIENT_ID`| Google OAuth Client ID | `your-id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`| Google OAuth Client Secret | `GOCSPX-your-secret` |
| `GOOGLE_REDIRECT_URI` | Google OAuth Callback URL | `http://localhost:5000/api/calendar/callback` |

### Frontend (`frontend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base endpoint for backend API requests | `http://localhost:5000/api` |
| `VITE_APP_TITLE` | Application title | `CareFlow Healthcare Platform` |

---

## 6. Database Setup & Indexing

CareFlow automatically establishes optimized indexes upon server startup via `connectDB`:
- **Appointment Unique Lock**: `{ doctorId: 1, date: 1, startTime: 1 }` (unique constraint on active/held slots).
- **Medication Reminder Index**: `{ userId: 1, prescriptionId: 1, medicineName: 1, scheduledFor: 1 }` (prevents duplicate reminder notifications).
- **Doctor Leave Unique Constraint**: `{ doctorId: 1, date: 1 }` (prevents overlapping leave entries).
- **User Index**: `{ email: 1 }` (unique constraint on user logins).

---

## 7. API Documentation

### Core Endpoints

#### Authentication (`/api/auth`)
- `POST /register`: Patient registration with sanitized response.
- `POST /login`: Authenticates credentials, sets HTTP-only `token` cookie.
- `POST /logout`: Clears session cookie.
- `GET /me`: Returns authenticated user context.

#### Appointments & Availability (`/api/appointments`, `/api/doctors`)
- `GET /api/doctors/:id/availability?date=YYYY-MM-DD`: Calculates working hours, active bookings, scheduled leaves, and 5-min slot hold states.
- `POST /api/appointments/hold`: Places a 5-minute atomic lock on a doctor's slot.
- `POST /api/appointments`: Confirms reservation, generates AI pre-visit triage summary, and dispatches confirmation emails.
- `PATCH /api/appointments/:id/reschedule`: Atomic slot transfer to new date/time.
- `PATCH /api/appointments/:id/cancel`: Releases slot and cleans up calendar event.

#### Doctor Consultation Workspace (`/api/doctor`)
- `GET /api/doctor/appointments/:id`: Doctor clinical examination details.
- `POST /api/doctor/appointments/:id/consultation`: Submits diagnosis, notes, prescription items, and generates 5-part AI post-visit care plan.

#### AI Services (`/api/ai`)
- `POST /api/ai/pre-visit-summary`: Analyzes symptoms, returns urgency level, chief complaint, and doctor inquiries.
- `POST /api/ai/post-visit-summary`: Plain-language medical summary of doctor notes and medication schedule.

#### Google Calendar (`/api/calendar`)
- `GET /api/calendar/connect`: Generates secure CSRF-signed OAuth consent URL.
- `GET /api/calendar/callback`: Exchanges authorization code and saves user calendar credentials.

#### Admin Management (`/api/admin`)
- `GET /api/admin/stats`: KPI overview (doctor count, patient count, revenue, booking stats).
- `GET /api/admin/doctors/:id/leave-preview?date=YYYY-MM-DD`: Live preview of affected appointments prior to leave placement.
- `POST /api/admin/doctors/:id/leaves`: Places leave, cancels affected bookings with alerts.

---

## 8. Authentication & Security

- **HTTP-Only Secure Cookies**: JWT tokens are transmitted via `SameSite=Lax` and `Secure` (production) cookies.
- **IDOR Protection**: Strictly verified against `req.user._id` for patient resources and `doctor._id` for physician clinical notes.
- **Rate Limiting**: Multi-tier protection on auth endpoints (`5 req/15m`) and API endpoints (`100 req/15m`).
- **Credential Sanitization**: Passwords, hashes, and OAuth secrets are omitted from all JSON responses via Mongoose `{ select: false }`.

---

## 9. AI Configuration

CareFlow uses Google Gemini (`gemini-1.5-flash`) for real-time medical summarization:
- If `GEMINI_API_KEY` is not present, or if external API timeouts occur, CareFlow activates an internal **Medical Heuristic Fallback Engine**, ensuring zero downtime or user interruption.
- AI pre-visit outputs include mandatory disclaimers: *"AI-generated informational summary. This does not constitute a medical diagnosis."*

---

## 10. Email Configuration

Nodemailer handles transactional communications:
- `sendBookingConfirmation`: Patient & doctor confirmation.
- `sendAppointmentReminder`: 24-hour reminder with care preparation tips.
- `sendDoctorLeaveNotification`: Instant notification for patients affected by clinician availability changes.
- **Resilient Retry Worker**: Background job automatically retries failed notification records up to 3 times.

---

## 11. Google Calendar Configuration

1. In Google Cloud Console, enable **Google Calendar API**.
2. Create OAuth 2.0 Credentials:
   - Authorized Javascript Origins: `https://yourdomain.com`
   - Authorized Redirect URI: `https://api.yourdomain.com/api/calendar/callback`
3. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to backend `.env`.

---

## 12. Seed Data System

Populate synthetic demo doctors, patients, appointments, and prescriptions:

```bash
cd backend
npm run seed
```

### Demo Login Accounts (`DemoPassword123!`)
- **Admin**: `admin@demo.com`
- **Doctor (General Medicine)**: `doctor@demo.com` (Dr. Rahul Mehta)
- **Doctor (Cardiology)**: `doctor.aisha@demo.com` (Dr. Aisha Verma)
- **Doctor (Dermatology)**: `doctor.neha@demo.com` (Dr. Neha Sharma)
- **Doctor (Pediatrics)**: `doctor.arjun@demo.com` (Dr. Arjun Kapoor)
- **Doctor (Orthopedics - Pending)**: `doctor.priya@demo.com` (Dr. Priya Nair)
- **Patient**: `patient.a@demo.com` (Alice Johnson)

---

## 13. Testing Suite

Run the full platform test suite:

```bash
cd backend
node src/utils/testMasterSuite.js
```
*Executes all 29 validation checks covering Auth, Doctors, Appointments, AI, Emails, Calendar, and IDOR Security.*

---

## 14. Production Deployment

### Option A: Docker Deployment (Recommended)

#### 1. Build and Run via Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### Option B: Cloud Hosting (Vercel / Render / AWS ECS)

#### Backend Deployment (e.g., Render / Railway / Elastic Beanstalk)
1. Set Environment Variables from `backend/.env.example` in hosting provider dashboard.
2. Set Build Command: `npm install`
3. Set Start Command: `node src/index.js`
4. Set Node version: `>= 18.0.0`

#### Frontend Deployment (e.g., Vercel / Netlify / Cloudflare Pages)
1. Set Build Command: `npm run build`
2. Set Output Directory: `dist`
3. Set Environment Variable: `VITE_API_BASE_URL=https://api.yourdomain.com/api`

---

## 📄 License

MIT License. Designed and engineered for modern healthcare SaaS environments.
