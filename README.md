# Smart Student Learning & Placement Management System (SSLMS)

A full-stack MERN web application for managing student learning, course tracking, and placement activities in a training institute.

## Features

- **User Authentication** — Register/Login with role-based access (Admin, Trainer, Student)
- **Course Management** — Create, enroll, view courses with progress tracking
- **Student Dashboard** — Track learning progress across enrolled courses
- **Assignment System** — Trainers create assignments; students submit; trainers evaluate
- **Job Portal** — Admin posts jobs; students apply; admin manages applications

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React.js (Hooks, Router, Context API) |
| Backend  | Node.js, Express.js (REST APIs)     |
| Database | MongoDB                             |

## Project Structure

```
riz2/
├── backend/
│   ├── config/         # Database connection
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth, role authorization
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   ├── server.js       # Entry point
│   └── seed.js         # Seed admin user
├── frontend/
│   └── src/
│       ├── components/ # Reusable UI components
│       ├── context/    # Auth Context API
│       ├── pages/      # Route pages
│       └── services/   # API client
└── README.md
```

## Prerequisites

- Node.js (v18+)
- MongoDB — local install **or** free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cloud database

## MongoDB Setup (store all app data)

All users, courses, enrollments, assignments, submissions, and jobs are stored in **MongoDB** via Mongoose models in `backend/models/`.

### Option A: MongoDB Atlas (recommended — works on Windows without local install)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a **free cluster** (M0).
3. **Database Access** → Add user (username + password). Remember the password.
4. **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`) for development.
5. **Database** → Connect → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `password` with your user password and add the database name `sslms` before the `?`:
   ```
   mongodb+srv://username:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/sslms?retryWrites=true&w=majority
   ```
7. Paste into `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/sslms?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB

1. Install [MongoDB Community Server](https://www.mongodb.com/try/download/community).
2. Start the MongoDB service.
3. In `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/sslms
   ```

### Test the connection

```bash
cd backend
npm install
npm run test:db
```

You should see `SUCCESS: Connected to MongoDB` and database name `sslms`.

### Seed demo data

```bash
node seed.js
```

Creates admin, trainer, student accounts plus sample courses, assignments, and jobs.

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI (see MongoDB Setup above)
npm install
npm run test:db     # Verify MongoDB connection
npm run seed        # Load demo data into MongoDB
npm run dev         # Starts on http://localhost:5000
```

When the server starts you should see:
```
MongoDB Connected: ...
Database: sslms
Server running on port 5000
```

**Demo Accounts (created by seed script):**

| Role    | Email               | Password    |
|---------|---------------------|-------------|
| Student | `student@sslms.com`   | `student123` |
| Trainer | `trainer@sslms.com`   | `trainer123` |
| Admin   | `admin@sslms.com`   | `admin123`   |

> Use the **Student** account to enroll in courses, submit assignments, and apply for jobs.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev         # Starts on http://localhost:3000
```

## User Roles

| Role    | Capabilities                                              |
|---------|-----------------------------------------------------------|
| Admin   | Manage users, post jobs, view system stats                |
| Trainer | Create/edit courses, upload content, view enrolled students, create/edit assignments, evaluate submissions with feedback |
| Student | Enroll/drop courses, access gated content, track progress, submit assignments, view grades & feedback, apply for jobs |

### Student workflow
1. Browse courses → **Enroll** → unlock course content
2. Study materials on course detail page → update progress (auto-updates when assignments are graded)
3. **Assignments** → submit work → view score and trainer feedback
4. **Jobs** → apply → track application status on dashboard

### Trainer workflow
1. **Courses** → create/edit courses, add content, publish/unpublish
2. **Course detail** → view enrolled students and their progress
3. **Assignments** → create/edit assignments for your courses
4. Review student submissions → grade with score and feedback (updates student course progress automatically)

## API Endpoints

| Method | Endpoint                              | Access          |
|--------|---------------------------------------|-----------------|
| POST   | `/api/auth/register`                  | Public          |
| POST   | `/api/auth/login`                     | Public          |
| GET    | `/api/auth/me`                        | Authenticated   |
| GET    | `/api/users`                          | Admin           |
| GET    | `/api/courses`                        | Authenticated   |
| POST   | `/api/courses`                        | Admin, Trainer  |
| POST   | `/api/courses/:id/enroll`             | Student         |
| GET    | `/api/assignments`                    | Authenticated   |
| POST   | `/api/assignments`                    | Trainer         |
| POST   | `/api/assignments/:id/submit`         | Student         |
| GET    | `/api/jobs`                           | Authenticated   |
| POST   | `/api/jobs`                           | Admin           |
| POST   | `/api/jobs/:id/apply`                 | Student         |
| GET    | `/api/jobs/dashboard/stats`           | Authenticated   |

## Install & Run Locally (Windows / Mac / Linux)

### Step 1 — Install prerequisites

| Tool | Download | Check |
|------|----------|-------|
| **Node.js 18+** | [nodejs.org](https://nodejs.org) | `node -v` and `npm -v` |
| **MongoDB Atlas** (cloud DB) | [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) | Free M0 cluster |
| **Git** (optional) | [git-scm.com](https://git-scm.com) | `git -v` |

### Step 2 — Get the project

```bash
# If you have the zip, extract it. Then open terminal in the project folder:
cd riz2
```

### Step 3 — MongoDB Atlas (database)

1. Create account → **Build a Database** → choose **FREE** (M0).
2. **Database Access** → **Add New Database User** → set username & password.
3. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`).
4. **Database** → **Connect** → **Drivers** → copy connection string.
5. Change it to use database name `sslms`:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/sslms?retryWrites=true&w=majority
   ```

### Step 4 — Backend setup

**Windows PowerShell:**
```powershell
cd backend
copy .env.example .env
notepad .env
```

**Mac/Linux:**
```bash
cd backend
cp .env.example .env
nano .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/sslms?retryWrites=true&w=majority
JWT_SECRET=your_random_secret_key_here
JWT_EXPIRE=30d
```

Install and run:
```bash
npm install
npm run test:db      # Must show SUCCESS
npm run seed         # Loads demo users & sample data
npm run dev          # API at http://localhost:5000
```

Keep this terminal open.

### Step 5 — Frontend setup (new terminal)

```bash
cd frontend
npm install
npm run dev          # App at http://localhost:3000
```

### Step 6 — Open the app

Browser: **http://localhost:3000**

| Role | Email | Password |
|------|-------|----------|
| Student | student@sslms.com | student123 |
| Trainer | trainer@sslms.com | trainer123 |
| Admin | admin@sslms.com | admin123 |

---

## Deploy to Cloud (free tier)

### Option A — Single deploy on Render (easiest)

Backend serves API + React build from one URL.

1. Push project to **GitHub**.
2. Go to [render.com](https://render.com) → **New** → **Web Service** → connect repo.
3. Settings:

| Field | Value |
|-------|-------|
| Root Directory | `riz2` (or leave blank if repo root is project) |
| Build Command | `npm run install:all && npm run build` |
| Start Command | `npm start` |
| Environment | `Node` |

4. **Environment Variables:**

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | your Atlas connection string |
| `JWT_SECRET` | a long random string |
| `JWT_EXPIRE` | `30d` |

5. Click **Deploy**. After build finishes, open your Render URL (e.g. `https://sslms.onrender.com`).
6. In Render **Shell**, run once: `npm run seed`

### Option B — Split deploy (Render + Vercel)

**Backend on Render:**
- Root: `backend`
- Build: `npm install`
- Start: `npm start`
- Env: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`

**Frontend on Vercel:**
- Root: `frontend`
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_URL` = `https://YOUR-BACKEND.onrender.com/api`

Redeploy frontend after setting `VITE_API_URL`.

### Option C — Run on your PC (local network demo)

Same as local install. Others on your Wi‑Fi can use your PC IP:
- Find IP: `ipconfig` (Windows) → e.g. `192.168.1.5`
- Frontend: `http://192.168.1.5:3000`
- Ensure firewall allows ports 3000 and 5000

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `'vite' is not recognized` | Run `npm install` inside `frontend` first |
| `MongoDB connection failed` | Check `MONGODB_URI` in `.env`, Atlas IP whitelist, password (no special chars unencoded) |
| `EADDRINUSE port 5000` | Another app uses port 5000 — stop it or change `PORT` in `.env` |
| Login works but no courses | Run `npm run seed` in backend |
| Blank page after deploy | Run `npm run build` in frontend; check `NODE_ENV=production` on Render |

---

## License

This project is built as a capstone project for educational purposes.
