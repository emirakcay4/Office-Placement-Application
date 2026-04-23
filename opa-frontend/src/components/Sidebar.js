import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard',     path: '/dashboard', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.9"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.9"/>
    </svg>
  )},
  { label: 'Offices',       path: '/offices', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 14V5l6-3 6 3v9" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <rect x="6" y="9" width="4" height="5" rx="0.5" fill="currentColor" fillOpacity="0.4"/>
      <path d="M2 14h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )},
  { label: 'Equipment',     path: '/equipment', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5 14h6M8 12v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )},
  { label: 'Office History', path: '/history', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { label: 'Office Map',    path: '/map', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 3l4.5 1.5L10 3l5 1.5v9L10 12 5.5 13.5 1 12V3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M5.5 4.5v9M10 3v9" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  )},
  { label: 'Admin Panel',   path: '/admin', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )},
  { label: 'Profile',       path: '/profile', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )},
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useDarkMode();
  const { user } = useAuth();

  const isSysAdmin = user?.staff_profile?.system_role === 'system_admin';
  const visibleNavItems = navItems.filter(item => 
    item.path === '/admin' ? isSysAdmin : true
  );

  const bg           = darkMode ? '#0A1F38' : '#FFFFFF';
  const border       = darkMode ? 'rgba(255,255,255,0.06)' : '#E2EAF4';
  const activeText   = '#3B82F6';
  const activeBg     = darkMode ? 'rgba(59,130,246,0.12)' : '#EFF6FF';
  const inactiveText = darkMode ? '#6B8FAE' : '#7A93AD';

  return (
    <aside style={{
      width: '220px', minHeight: 'calc(100vh - 60px)',
      backgroundColor: bg,
      borderRight: `1px solid ${border}`,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '20px 12px 24px', flexShrink: 0,
    }}>
      <div>
        <div style={{ padding: '0 8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', fontFamily: 'Sora, sans-serif', fontWeight: '600', color: inactiveText, letterSpacing: '1px', textTransform: 'uppercase' }}>Navigation</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button key={item.path} onClick={() => navigate(item.path)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px', border: 'none',
                backgroundColor: isActive ? activeBg : 'transparent',
                color: isActive ? activeText : inactiveText,
                fontSize: '13px', fontFamily: 'Sora, sans-serif',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.15s ease',
                borderLeft: isActive ? `3px solid ${activeText}` : '3px solid transparent',
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255,255,255,0.04)' : '#F8FAFD'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <div style={{ padding: '0 12px' }}>
        <div style={{ height: '1px', backgroundColor: border, marginBottom: '12px' }} />
        <div style={{ fontSize: '11px', color: inactiveText, fontFamily: 'Sora, sans-serif', fontWeight: '500' }}>v1.0.0 — Sprint 2</div>
      </div>
    </aside>
  );
}