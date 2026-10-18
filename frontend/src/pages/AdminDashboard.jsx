import React from 'react';
import HospitalNgoDashboard from './HospitalNgoDashboard';

/**
 * AdminDashboard now renders the unified Hospital & NGO Operations Dashboard
 * so that both /app/home and /dashboard provide the exact single unified command center.
 */
export default function AdminDashboard() {
  return <HospitalNgoDashboard />;
}
