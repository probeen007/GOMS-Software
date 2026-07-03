import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { connectDB } from './db.js';
import { seedDatabase } from './seed.js';

import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import inventoryRoutes from './routes/inventory.js';
import appointmentRoutes from './routes/appointments.js';
import quotationRoutes from './routes/quotations.js';
import jobCardRoutes from './routes/jobCards.js';
import invoiceRoutes from './routes/invoices.js';
import loyaltyRoutes from './routes/loyalty.js';
import financeRoutes from './routes/finance.js';
import staffRoutes from './routes/staff.js';
import notificationRoutes from './routes/notifications.js';
import auditLogRoutes from './routes/auditLogs.js';
import tasksRoutes from './routes/tasks.js';
import { initCronJobs, checkLowStock } from './jobs/stockCheck.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limiting middleware for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 5000, // Relax rate limits in development
  standardHeaders: true, // Return rate limit info in standard headers
  legacyHeaders: false, // Disable legacy headers
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP in dev to avoid blocking dev server scripts if needed
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use('/api', apiLimiter);

// Serve file uploads locally
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/job-cards', jobCardRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/analytics', financeRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/tasks', tasksRoutes);

// Test endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Garage Management System API is healthy' });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: err.message || 'An unexpected error occurred on the server',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Production Setup — Serve static frontend assets
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
} else {
  // In development, return a helpful notice for root access
  app.get('/', (req, res) => {
    res.send('Garage Management System API is running. Start the Vite dev server for the frontend.');
  });
}

// Start Server if not imported (e.g. on Vercel)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || !!process.env.NOW_REGION;

export const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();
    
    // 2. Seed Default Database Records (Admin)
    await seedDatabase();

    // 3. Start cron jobs and initial check
    initCronJobs();
    await checkLowStock();

    // 4. Listen
    if (!isVercel) {
      app.listen(PORT, () => {
        console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      });
    } else {
      console.log('Running in serverless/Vercel environment. DB connected, skipping app.listen.');
    }
  } catch (error) {
    console.error('Server startup failed:', error.message);
    if (!isVercel) process.exit(1);
  }
};

if (!isVercel) {
  startServer();
}

export default app;

