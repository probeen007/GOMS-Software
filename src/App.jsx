import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';

// Eager loaded public Auth page
import Login from './pages/Login';

// Website Pages (Public React Frontend)
const WebsiteLayout = lazy(() => import('./website/WebsiteLayout'));
const Home = lazy(() => import('./website/pages/Home'));
const AboutUs = lazy(() => import('./website/pages/AboutUs'));
const Services = lazy(() => import('./website/pages/Services'));
const ServiceDetail = lazy(() => import('./website/pages/ServiceDetail'));
const Gallery = lazy(() => import('./website/pages/Gallery'));
const BookAppointment = lazy(() => import('./website/pages/BookAppointment'));
const FAQPage = lazy(() => import('./website/pages/FAQPage'));
const Contact = lazy(() => import('./website/pages/Contact'));

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
              {/* Public Website Routes */}
              <Route element={<WebsiteLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:slug" element={<ServiceDetail />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/book" element={<BookAppointment />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/contact" element={<Contact />} />
              </Route>

              {/* Public Auth Route */}
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}
