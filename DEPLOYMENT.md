# CareFlow Production Deployment Guide

This guide details the complete process for deploying **CareFlow** to production across **Vercel** (Frontend) and **Render** (Backend), as well as running the multi-container production build via **Docker Compose**.

---

## 1. System Architecture

```mermaid
graph TD
    Client[Browser / Mobile Client] -->|HTTPS + WSS| Vercel[Vercel Frontend (React + Vite + Tailwind)]
    Client -->|HTTPS API + WebSocket| Render[Render Backend (Node.js + Express + Socket.IO)]
    Render -->|Mongoose Pool| Atlas[(MongoDB Atlas Cluster)]
    Render -->|Cache / Rate-Limit| Redis[(Redis / Upstash)]
    Render -->|OAuth 2.0 & AI SDK| Google[Google Cloud (GIS, Calendar, Gemini AI)]
    Render -->|SMTP / TLS| Email[Transactional Email (Resend / SendGrid)]
    Vercel & Render -->|Telemetry| Sentry[Sentry Error Tracking]
```

- **Frontend**: React 18 SPA hosted on Vercel with client-side routing (`/frontend/vercel.json`).
- **Backend**: Node.js + Express 4 + Socket.IO hosted on Render with health checks at `/api/health`.
- **Database**: MongoDB Atlas M0/M10+ with connection pooling (`maxPoolSize: 10`, `minPoolSize: 2`).
- **Caching**: Redis (Upstash / Redis Cloud) for doctor query caching.
- **AI & Integrations**: Google Gemini AI (`@google/genai`), Google Calendar OAuth (`googleapis`), Google Identity Services (`google-auth-library`).

---

## 2. Pre-Deployment External Services Checklist

Before launching, set up the following free/managed cloud accounts:

| Service | Purpose | Dashboard Link | Required Keys / Strings |
| :--- | :--- | :--- | :--- |
| **MongoDB Atlas** | Primary Database | [cloud.mongodb.com](https://cloud.mongodb.com) | `MONGO_URI` connection string |
| **Google Cloud** | Google Sign-In & Calendar Sync | [console.cloud.google.com](https://console.cloud.google.com) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| **Google AI Studio** | Gemini AI Triage Engine | [aistudio.google.com](https://aistudio.google.com/app/apikey) | `GEMINI_API_KEY` |
| **Upstash / Redis** | Doctor Cache & Throttling | [upstash.com](https://upstash.com) | `REDIS_URL` |
| **Sentry** | Crash & Error Reporting | [sentry.io](https://sentry.io) | `SENTRY_DSN` (Backend), `VITE_SENTRY_DSN` (Frontend) |
| **Resend / SendGrid** | Transactional Notifications | [resend.com](https://resend.com) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` |

---

## 3. Google Cloud OAuth & Identity Services Configuration

1. Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and select your project.
2. Under **OAuth consent screen**:
   - User Type: **External**
   - App Name: `CareFlow`
   - Scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `https://www.googleapis.com/auth/calendar.events` (Google Calendar sync)
3. Under **Credentials** &rarr; **Create Credentials** &rarr; **OAuth 2.0 Client IDs** (Application type: **Web application**):
   - **Authorized JavaScript origins**:
     - `https://careflow-healthcare.vercel.app` *(replace with your Vercel domain)*
     - `https://<your-custom-domain>.com`
     - `http://localhost:5173` *(for local development)*
     - `http://localhost` *(for local Docker)*
   - **Authorized redirect URIs**:
     - `https://careflow-api.onrender.com/api/calendar/callback` *(replace with your Render backend domain)*
     - `https://<your-custom-api-domain>.com/api/calendar/callback`
     - `http://localhost:5000/api/calendar/callback` *(for local backend)*
     - `http://localhost/api/calendar/callback` *(for local Docker)*

---

## 4. Backend Deployment on Render

### Option A: Render Blueprint (Infrastructure as Code - Recommended)
1. Push this repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) &rarr; **Blueprints** &rarr; **New Blueprint Instance**.
3. Connect your repository. Render will automatically detect [`render.yaml`](render.yaml) and configure the `careflow-backend` web service.
4. Fill in the missing environment variables in the Render dashboard:
   - `MONGO_URI`
   - `FRONTEND_URL` (e.g. `https://careflow-healthcare.vercel.app`)
   - `CLIENT_URL` (e.g. `https://careflow-healthcare.vercel.app`)
   - `ALLOWED_ORIGINS` (e.g. `https://careflow-healthcare.vercel.app`)
   - `GEMINI_API_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (e.g. `https://careflow-api.onrender.com/api/calendar/callback`)
   - `REDIS_URL` (Optional)
   - `SENTRY_DSN` (Optional)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` (Optional)

### Option B: Manual Web Service Creation
- **Environment**: `Node`
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node src/index.js`
- **Health Check Path**: `/api/health`

---

## 5. Frontend Deployment on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/) &rarr; **Add New Project** &rarr; Import your GitHub repository.
2. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
3. Add **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://careflow-api.onrender.com/api` *(Your Render backend URL + `/api`)*
   - `VITE_SOCKET_URL`: `https://careflow-api.onrender.com` *(Your Render backend URL)*
   - `VITE_GOOGLE_CLIENT_ID`: `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com`
   - `VITE_SENTRY_DSN`: `https://your_frontend_sentry_dsn@sentry.io/project-id` *(Optional)*
4. Click **Deploy**.

---

## 6. Cross-Domain Cookie & CORS Security Configuration

When frontend and backend are hosted on distinct domains (e.g. `vercel.app` and `onrender.com`):

1. **Backend Environment Variables**:
   ```env
   COOKIE_SAME_SITE=none
   COOKIE_SECURE=true
   FRONTEND_URL=https://careflow-healthcare.vercel.app
   ALLOWED_ORIGINS=https://careflow-healthcare.vercel.app
   ```
2. **Browsers**: `SameSite=None; Secure` is mandatory for cross-site `httpOnly` authentication cookies to be delivered on API requests and WebSocket handshakes (`withCredentials: true`).

---

## 7. Local / Self-Hosted Production with Docker Compose

To run the complete production stack (MongoDB + Redis + Backend + Frontend/Nginx) locally or on a single VPS:

1. Create a `.env` in the root directory:
   ```bash
   cp .env.example .env
   # Edit .env with your Google and Gemini API keys
   ```
2. Build and start all containers:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```
3. Access the application:
   - **Frontend**: `http://localhost` (Port 80)
   - **Backend API**: `http://localhost/api` (Proxied via Nginx)
   - **Health Check**: `http://localhost/api/health`
   - **WebSocket**: `ws://localhost/socket.io`

4. To stop services:
   ```bash
   docker compose -f docker-compose.prod.yml down
   ```

---

## 8. Verification & Smoke Test Checklist

- [ ] **Health Check**: `curl -I https://careflow-api.onrender.com/api/health` returns `HTTP 200 OK`.
- [ ] **Auth Cookie Verification**: Log in via email/password or Google GIS. Confirm `token` cookie has `HttpOnly`, `Secure`, and `SameSite=None` attributes in Browser DevTools.
- [ ] **Real-Time Notification Verification**: Open two browser tabs (Patient & Doctor). Book an appointment; verify the doctor receives an instant Socket.IO toast notification without page refresh.
- [ ] **Google Calendar Sync**: Navigate to Doctor Profile &rarr; Connect Google Calendar. Complete OAuth flow and verify events sync.
- [ ] **AI Triage Verification**: Submit a medical query in the AI Triage Assistant. Confirm structured recommendations are generated (or heuristic fallback triggers seamlessly on invalid key).
- [ ] **Redis Connection**: Check backend logs on startup: `Redis client connected successfully` (or non-fatal warning if disabled).
