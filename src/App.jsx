import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';

// Eager loaded public Auth page
import Login from './pages/Login';

// Note: the public marketing site is now served as static HTML/CSS/JS
// (see auto/static) directly by the server at "/" — see server/server.js
// and vite.config.js. This SPA only handles /login and the protected
// /dashboard* management portal.

// Management Portal Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Servicing = lazy(() => import('./pages/Servicing'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Loyalty = lazy(() => import('./pages/Loyalty'));
const Finance = lazy(() => import('./pages/Finance'));
const Staff = lazy(() => import('./pages/Staff'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Notifications = lazy(() => import('./pages/Notifications'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const DayBook = lazy(() => import('./pages/DayBook'));
const Settings = lazy(() => import('./pages/Settings'));
const UserManual = lazy(() => import('./pages/UserManual'));

export default function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Auth Route — "/" and other marketing routes are served
                  as static HTML by the server; this SPA starts at /login */}
              <Route path="/login" element={<Login />} />

              {/* Protected Management System Portal Layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'receptionist', 'technician']}>
                      <Customers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers/:id"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'receptionist', 'technician']}>
                      <CustomerProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'technician', 'accountant']}>
                      <Inventory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'receptionist', 'technician']}>
                      <Appointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/servicing"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'receptionist', 'technician', 'accountant']}>
                      <Servicing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invoices"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'receptionist', 'accountant']}>
                      <Invoices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/loyalty"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'receptionist', 'accountant']}>
                      <Loyalty />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/finance"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                      <Finance />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Staff />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'receptionist', 'accountant', 'technician']}>
                      <Tasks />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'receptionist', 'technician', 'accountant']}>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/audit-logs"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AuditLogs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/daybook"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'accountant', 'receptionist']}>
                      <DayBook />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'accountant', 'receptionist', 'technician']}>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user-manual"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'accountant', 'receptionist', 'technician']}>
                      <UserManual />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}
