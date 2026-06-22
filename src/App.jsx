import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerProfile from './pages/CustomerProfile';
import Inventory from './pages/Inventory';
import Appointments from './pages/Appointments';
import Quotations from './pages/Quotations';
import QuoteApproval from './pages/QuoteApproval';
import JobCards from './pages/JobCards';
import Invoices from './pages/Invoices';
import Loyalty from './pages/Loyalty';
import Finance from './pages/Finance';
import Staff from './pages/Staff';
import Tasks from './pages/Tasks';
import Notifications from './pages/Notifications';
import AuditLogs from './pages/AuditLogs';

// Elegant placeholder for unbuilt modules
function ModulePlaceholder({ name, step }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-900/40 rounded-3xl border border-slate-800/80">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center border border-slate-700/50 mb-6">
        <svg className="w-8 h-8 text-primary-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white">{name}</h2>
      <p className="text-sm text-slate-400 mt-2 max-w-md">
        This module is scheduled to be built in <span className="text-primary-400 font-semibold">{step}</span> of the implementation roadmap.
      </p>
      <div className="mt-6 px-4 py-2 rounded-full text-xxs font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700/60">
        Feature Locked
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/quote-approval/:token" element={<QuoteApproval />} />

          {/* Secure Portal Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard (Home) */}
            <Route index element={<Dashboard />} />

            {/* Module 2: Customers & Vehicles */}
            <Route
              path="customers"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist', 'technician']}>
                  <Customers />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist', 'technician']}>
                  <CustomerProfile />
                </ProtectedRoute>
              }
            />

            {/* Module 3: Inventory / Parts */}
            <Route
              path="inventory"
              element={
                <ProtectedRoute allowedRoles={['admin', 'technician', 'accountant']}>
                  <Inventory />
                </ProtectedRoute>
              }
            />

            {/* Module 4: Appointments & Check-In */}
            <Route
              path="appointments"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist', 'technician']}>
                  <Appointments />
                </ProtectedRoute>
              }
            />

            {/* Module 5: Quotations */}
            <Route
              path="quotations"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist', 'accountant', 'technician']}>
                  <Quotations />
                </ProtectedRoute>
              }
            />

            {/* Module 6: Job Cards */}
            <Route
              path="job-cards"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist', 'technician', 'accountant']}>
                  <JobCards />
                </ProtectedRoute>
              }
            />

            {/* Module 7: Invoices & Payments */}
            <Route
              path="invoices"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist', 'accountant']}>
                  <Invoices />
                </ProtectedRoute>
              }
            />

            {/* Module 8: Loyalty Points */}
            <Route
              path="loyalty"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist', 'accountant']}>
                  <Loyalty />
                </ProtectedRoute>
              }
            />

            {/* Module 9: Finance (Expenditures & Cash Flow) */}
            <Route
              path="finance"
              element={
                <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                  <Finance />
                </ProtectedRoute>
              }
            />

            {/* Module 10: Staff & Role Management */}
            <Route
              path="staff"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Staff />
                </ProtectedRoute>
              }
            />

            {/* To-Do List Flow */}
            <Route
              path="tasks"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist', 'accountant', 'technician']}>
                  <Tasks />
                </ProtectedRoute>
              }
            />

            {/* Module 11: In-App Notifications */}
            <Route
              path="notifications"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist', 'technician', 'accountant']}>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            {/* Module 12: Audit Log */}
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
