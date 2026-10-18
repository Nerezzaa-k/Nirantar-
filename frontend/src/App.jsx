//HERE WE USED MVC architecture fot the structuring of the project

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';

// Public pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// App pages
import RoleBasedHome from './pages/RoleBasedHome';
import PatientDirectory from './pages/PatientDirectory';
import PatientDetail from './pages/PatientDetail';
import CheckInPage from './pages/CheckInPage';
import RecoveryTrackerPage from './pages/RecoveryTrackerPage';
import CommunicationsPage from './pages/CommunicationsPage';
import ProgramsPage from './pages/ProgramsPage';
import InterventionsPage from './pages/InterventionsPage';
import InventoryPage from './pages/InventoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import PatientReadOnlyDashboard from './pages/PatientReadOnlyDashboard';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import HotspotsPage from './pages/HotspotsPage';
import DropoutReasonsPage from './pages/DropoutReasonsPage';
import EffectivenessPage from './pages/EffectivenessPage';
import ConditionsConfigPage from './pages/ConditionsConfigPage';
import AuditLogsPage from './pages/AuditLogsPage';

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-surface-dark text-slate-400 text-xs">
        Loading Nirantar session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Landing & Auth Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ForgotPassword />} />

      {/* Authenticated Application Routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/home" replace />} />
        <Route path="home" element={<RoleBasedHome />} />
        <Route path="recovery-tracker" element={<RecoveryTrackerPage />} />
        <Route path="communications" element={<CommunicationsPage />} />
        <Route path="programs" element={<ProgramsPage />} />
        <Route path="patients" element={<PatientDirectory />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="check-in" element={<CheckInPage />} />
        <Route path="interventions" element={<InterventionsPage />} />
        <Route path="treatment" element={<InventoryPage />} />
        <Route path="hotspots" element={<HotspotsPage />} />
        <Route path="patient-portal" element={<PatientReadOnlyDashboard />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Administration Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="recovery-tracker" element={<RecoveryTrackerPage />} />
        <Route path="communications" element={<CommunicationsPage />} />
        <Route path="programs" element={<ProgramsPage />} />
        <Route path="patients" element={<PatientDirectory />} />
        <Route path="hotspots" element={<HotspotsPage />} />
        <Route path="dropout-reasons" element={<DropoutReasonsPage />} />
        <Route path="effectiveness" element={<EffectivenessPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="conditions" element={<ConditionsConfigPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}
