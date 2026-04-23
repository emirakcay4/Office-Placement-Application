import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireRole }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1E38', color: '#fff' }}>
        <span style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && user.staff_profile?.system_role !== requireRole && user.staff_profile?.system_role !== 'system_admin') {
    // Basic role protection (e.g., only system_admin or specific role)
    // If we wanted to be strict, we'd check exactly, but usually system_admin can do anything
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
