# DriveSync - Auto-Service & Garage Management System

DriveSync is a comprehensive, production-grade **Garage Management System** (MERN Stack MVP) designed to digitize auto-repair operations, from appointment booking and check-in to quotation builds, automated job cards, invoicing, payments, customer loyalty tracking, and dashboard analytics.

---

## 🛠️ Tech Stack & Key Choices

- **Frontend**: React 18, React Router v6, Axios, Tailwind CSS v3, Lucide React (Icons)
- **Backend**: Node.js, Express.js (ES Modules syntax)
- **Database**: MongoDB with Mongoose ODM
- **Local Dev Fallback**: `mongodb-memory-server` (spins up a self-contained MongoDB instance in-memory if no local DB connection is running)
- **Auth**: JWT (JSON Web Tokens) + `bcryptjs` (password hashing)
- **PDF Generation**: Puppeteer
- **Scheduling**: `node-cron`
- **File Uploads**: Multer (disk storage in `/uploads`)

---

## 📂 Project Architecture (Monorepo)

Unlike standard isolated client/server configurations, this project runs as a unified monorepo sharing a single `package.json` for effortless configuration and dependency management:

```
├── server/                 # Express backend code
│   ├── models/             # Mongoose schemas
│   ├── middleware/         # Custom Express middlewares (Auth/Roles)
│   ├── routes/             # API routes (/api/auth, etc.)
│   ├── db.js               # Database connection manager (with Memory Server fallback)
│   ├── seed.js             # Initial database seeder script
│   └── server.js           # Server entry point
├── src/                    # React frontend code (Vite config at root)
│   ├── components/         # Reusable React components (Sidebar, Topbar, Layout, ProtectedRoute)
│   ├── context/            # Global state context (AuthContext)
│   ├── pages/              # Primary route pages (Login, Dashboard, placeholders)
│   ├── App.jsx             # Main Router component
│   ├── index.css           # Global CSS and Tailwind directives
│   └── main.jsx            # React root mount
├── uploads/                # Local directory for uploaded check-in condition photos
├── index.html              # Frontend entry point
├── vite.config.js          # Vite config (proxies /api to port 5000)
├── tailwind.config.js      # Tailwind configurations
├── postcss.config.js       # PostCSS configurations
└── package.json            # Shared package manager
```

---

## 🚀 Quick Start Guide

### 1. Setup Environment
Copy the env template into `.env` at the root folder:
```bash
cp .env.example .env
```
*(By default, `MONGODB_URI` is set to `memory`. This will download and run an in-memory database automatically, meaning **no database configuration is required** to run locally!)*

### 2. Install Dependencies
Run a single command in the project root:
```bash
npm install
```

### 3. Run the Application in Development Mode
To start both the Express backend (port 5000) and the Vite frontend (port 3000) concurrently:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 4. Admin Credentials
The database seeder automatically runs on startup. You can log in using these default credentials:
- **Email**: `admin@drivesync.com`
- **Password**: `admin123`

---

## 🏗️ Production Deployment

To bundle the React frontend and start the server as a single serving application:
1. Build the frontend:
   ```bash
   npm run build
   ```
2. Set the environment variables in `.env` or your hosting provider:
   ```env
   NODE_ENV=production
   PORT=80
   MONGODB_URI=mongodb+srv://... (your real cloud MongoDB connection)
   JWT_SECRET=your_production_secret
   ```
3. Start the Node server:
   ```bash
   npm start
   ```
   The backend server will statically serve the React files from `/dist` and handle `/api` requests.
