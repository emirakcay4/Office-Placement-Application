import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DarkModeProvider } from './context/DarkModeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Offices from './pages/Offices';
import Equipment from './pages/Equipment';
import OfficeHistory from './pages/OfficeHistory';
import OfficeMap from './pages/OfficeMap';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';

export default function App() {
  return (
    <DarkModeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/offices" element={<ProtectedRoute><Offices /></ProtectedRoute>} />
            <Route path="/equipment" element={<ProtectedRoute><Equipment /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><OfficeHistory /></ProtectedRoute>} />
            {/* If office history expects an ID, we might need a dynamic route later, e.g. /history/:id */}
            <Route path="/history/:id" element={<ProtectedRoute><OfficeHistory /></ProtectedRoute>} />
            
            <Route path="/map" element={<ProtectedRoute><OfficeMap /></ProtectedRoute>} />
            
            <Route path="/admin" element={
              <ProtectedRoute requireRole="system_admin">
                <AdminPanel />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </DarkModeProvider>
  );
}