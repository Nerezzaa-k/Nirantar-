import React from 'react';
import { useAuth } from '../context/AuthContext';
import HospitalNgoDashboard from './HospitalNgoDashboard';
import PatientReadOnlyDashboard from './PatientReadOnlyDashboard';

/**
 * Nirantar v3 — Role-Based Home
 * - If logged in as patient: renders dedicated Read-Only Patient Dashboard
 * - If logged in as Hospital or NGO staff: renders unified Hospital & NGO Operations Dashboard
 */
export default function RoleBasedHome() {
  const { user } = useAuth();

  if (user?.role === 'patient') {
    return <PatientReadOnlyDashboard />;
  }

  return <HospitalNgoDashboard />;
}
